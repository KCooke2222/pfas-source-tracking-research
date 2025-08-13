import { useEffect, useState } from "react";
import axios from "axios";
import FileUpload from "../components/FileUpload";
import DataPreview from "../components/DataPreview";
import Inference from "../components/Inference";

const apiBase = import.meta.env.VITE_REACT_APP_API_BASE;

export default function SimpleDataTool() {
  const [preview, setPreview] = useState(null);
  const [columns, setColumns] = useState(null);
  const [nmds, setNmds] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("preview");

  // NEW: demo state
  const [mode, setMode] = useState("upload"); // "upload" | "demo"
  const [demoOptions, setDemoOptions] = useState([]);
  const [demoName, setDemoName] = useState("");

  useEffect(() => {
    if (mode !== "demo") return;
    axios
      .get(`${apiBase}/demo/options`)
      .then((res) => {
        const opts = res.data?.options || [];
        setDemoOptions(opts);
        setDemoName(opts[0] || "");
      })
      .catch((e) => setError(e.response?.data?.error || e.message));
  }, [mode]);

  const resetState = () => {
    setPreview(null);
    setColumns(null);
    setNmds(null);
    setError(null);
    setTab("preview");
  };

  const handleUpload = async (file) => {
    resetState();
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axios.post(`${apiBase}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPreview(res.data.preview);
      setColumns(res.data.columns);
      setNmds(res.data.nmds);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Unknown error");
    }
  };

  // NEW: run selected demo
  const handleRunDemo = async () => {
    resetState();
    if (!demoName) {
      setError("Choose a demo CSV.");
      return;
    }
    try {
      const res = await axios.post(`${apiBase}/demo/run`, { name: demoName });
      setPreview(res.data.preview);
      setColumns(res.data.columns);
      setNmds(res.data.nmds);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Unknown error");
    }
  };

  const handleDownload = async () => {
    if (!nmds) return;
    try {
      const rows = nmds.new_points?.length ? nmds.new_points : [];
      const csv = [
        "Sample,NMDS1,NMDS2",
        ...rows.map((r) => `${r.Sample},${r.NMDS1},${r.NMDS2}`),
      ].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "nmds_new_points.csv";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        "Download failed: " + (err.response?.data?.error || err.message)
      );
    }
  };

  const tabsEnabled = !!preview && !!nmds;

  return (
    <div className="p-6 w-full max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">PFAS NMDS Tool</h1>

      {/* Mode toggle */}
      <div className="flex items-center gap-6 mb-3">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="mode"
            value="upload"
            checked={mode === "upload"}
            onChange={() => setMode("upload")}
          />
          <span>Upload CSV</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="mode"
            value="demo"
            checked={mode === "demo"}
            onChange={() => setMode("demo")}
          />
          <span>Use demo data</span>
        </label>
      </div>

      {/* Upload or Demo selector */}
      {mode === "upload" ? (
        <FileUpload onUpload={handleUpload} onReset={resetState} />
      ) : (
        <div className="flex gap-2 items-center mb-4">
          <select
            className="border rounded px-2 py-1"
            value={demoName}
            onChange={(e) => setDemoName(e.target.value)}
          >
            {demoOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <button
            onClick={handleRunDemo}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Load Demo
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-100 text-red-800 px-4 py-2 my-2 rounded">
          {error}
        </div>
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
            NMDS Result
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

      {tab === "inference" && nmds && (
        <div>
          <h2 className="text-lg font-semibold mb-2">NMDS Result</h2>
          <div className="overflow-x-auto w-full">
            <Inference data={nmds} />
          </div>
          <button
            onClick={handleDownload}
            className="mt-4 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Download New Points CSV
          </button>
        </div>
      )}

      {!preview && !nmds && (
        <div className="text-gray-500 mt-8">
          Upload a CSV file or choose demo data to begin.
        </div>
      )}
    </div>
  );
}
