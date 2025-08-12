import { useState } from "react";
import axios from "axios";
import FileUpload from "../components/FileUpload";
import DataPreview from "../components/DataPreview";
import InferenceChart from "../components/Inference"; // Or InferenceHeatmap, etc

const apiBase = import.meta.env.VITE_REACT_APP_API_BASE;

export default function SimpleDataTool() {
  const [preview, setPreview] = useState(null);
  const [columns, setColumns] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("preview");

  const handleUpload = async (file) => {
    setError(null);
    setPreview(null);
    setColumns(null);
    setResult(null);
    setTab("preview");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axios.post(`${apiBase}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPreview(res.data.preview);
      setColumns(res.data.columns);
      setResult(res.data.result);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Unknown error");
    }
  };

  const handleDownload = async () => {
    if (!result) return;
    try {
      const response = await axios.post(
        `${apiBase}/download`,
        { results: result },
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "results.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError("Download failed: " + (err.response?.data?.error || err.message));
    }
  };

  const handleReset = () => {
    setPreview(null);
    setColumns(null);
    setResult(null);
    setError(null);
    setTab("preview");
  };

  const tabsEnabled = !!preview && !!result;

  return (
    <div className="p-6 w-full max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Water Source Prediction Tool</h1>
      <FileUpload onUpload={handleUpload} onReset={handleReset} />

      {error && (
        <div className="bg-red-100 text-red-800 px-4 py-2 my-2 rounded">{error}</div>
      )}

      {tabsEnabled && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab("preview")}
            className={`px-4 py-1 rounded border transition-colors ${
              tab === "preview"
                ? "bg-blue-100 border-blue-400 font-semibold"
                : "bg-gray-100 border-gray-200"
            }`}
          >
            Preview Data
          </button>
          <button
            onClick={() => setTab("inference")}
            className={`px-4 py-1 rounded border transition-colors ${
              tab === "inference"
                ? "bg-blue-100 border-blue-400 font-semibold"
                : "bg-gray-100 border-gray-200"
            }`}
          >
            Inference Result
          </button>
        </div>
      )}

      {tab === "preview" && preview && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">CSV Preview</h2>
          <div className="overflow-x-auto w-full">
            <DataPreview preview={{ columns, preview }} />
          </div>
        </div>
      )}

      {tab === "inference" && result && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Inference Result</h2>
          <div className="overflow-x-auto w-full">
            <InferenceChart result={result} />
          </div>
          <button
            onClick={handleDownload}
            className="mt-4 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Download Results as CSV
          </button>
        </div>
      )}

      {!preview && !result && (
        <div className="text-gray-500 mt-8">Upload a CSV file to begin.</div>
      )}
    </div>
  );
}
