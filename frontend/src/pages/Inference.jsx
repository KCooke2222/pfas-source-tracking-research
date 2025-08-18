import { useEffect, useState } from "react";
import axios from "axios";
import FileUpload from "../components/FileUpload";
import DataPreview from "../components/DataPreview";
import Inference from "../components/Inference";

const apiBase = import.meta.env.VITE_REACT_APP_API_BASE;

function Spinner({ label = "Processing…" }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-700">
      <svg
        className="h-4 w-4 animate-spin"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
        />
        <path
          className="opacity-75"
          d="M4 12a8 8 0 018-8"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
      <span>{label}</span>
    </div>
  );
}

export default function SimpleDataTool() {
  const [preview, setPreview] = useState(null);
  const [columns, setColumns] = useState(null);
  const [nmds, setNmds] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("inference");

  // NEW: demo & loading state
  const [mode, setMode] = useState("upload"); // "upload" | "demo"
  const [demoOptions, setDemoOptions] = useState([]);
  const [demoName, setDemoName] = useState("");
  const [loading, setLoading] = useState(false);

  // Load base NMDS data on initial page load
  useEffect(() => {
    if (!nmds && !loading) {
      setLoading(true);
      axios
        .get(`${apiBase}/base-nmds`)
        .then((res) => {
          setNmds(res.data.nmds);
        })
        .catch((e) => {
          console.warn("Could not load base NMDS data:", e.message);
          // Don't set error state for base data failure - just continue without it
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, []);

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

  const resetToBase = async () => {
    setPreview(null);
    setColumns(null);
    setError(null);
    setTab("inference");
    
    // Reload base NMDS data without setting loading state
    try {
      const res = await axios.get(`${apiBase}/base-nmds`);
      setNmds(res.data.nmds);
    } catch (e) {
      console.warn("Could not reload base NMDS data:", e.message);
      setNmds(null);
    }
  };

  const resetState = () => {
    setPreview(null);
    setColumns(null);
    setNmds(null);
    setError(null);
    setTab("inference");
  };

  const handleUpload = async (file) => {
    resetState();
    if (!file) return;
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handleRunDemo = async () => {
    resetState();
    if (!demoName) {
      setError("Choose a demo CSV.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${apiBase}/demo/run`, { name: demoName });
      setPreview(res.data.preview);
      setColumns(res.data.columns);
      setNmds(res.data.nmds);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Unknown error");
    } finally {
      setLoading(false);
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

  const handleDownloadTemplate = () => {
    const link = document.createElement("a");
    link.href = `${apiBase}/template`; // create an endpoint serving the file
    link.download = "template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tabsEnabled = !!preview && !!nmds;

  return (
    <div className="p-6 w-full max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">PFAS NMDS Tool</h1>
        {loading && <Spinner />}
      </div>

      {/* Mode toggle */}
      <div className="flex items-center gap-6 mb-3">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="mode"
            value="upload"
            checked={mode === "upload"}
            onChange={() => setMode("upload")}
            disabled={loading}
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
            disabled={loading}
          />
          <span>Use demo data</span>
        </label>
      </div>

      {/* Upload or Demo selector */}
      <div className="min-h-[80px] mb-4">
        {mode === "upload" ? (
          <div className={loading ? "opacity-50 pointer-events-none" : ""}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <FileUpload onUpload={handleUpload} onReset={resetToBase} />
              <button
                onClick={handleDownloadTemplate}
                className="px-3 py-2 rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-800"
                disabled={loading}
              >
                Download Template CSV
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2 items-center">
            <select
              className="border rounded px-2 py-1"
              value={demoName}
              onChange={(e) => setDemoName(e.target.value)}
              disabled={loading || demoOptions.length === 0}
            >
              {demoOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <button
              onClick={handleRunDemo}
              className={`px-4 py-2 rounded text-white ${
                loading
                  ? "bg-blue-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
              disabled={loading || !demoName}
            >
              {loading ? "Loading…" : "Load Demo"}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-100 text-red-800 px-4 py-2 my-2 rounded">
          {error}
        </div>
      )}

      {tabsEnabled && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab("preview")}
            disabled={loading}
            className={`px-4 py-1 rounded border transition-colors ${
              tab === "preview"
                ? "bg-blue-100 border-blue-400 font-semibold"
                : "bg-gray-100 border-gray-200"
            } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Preview Data
          </button>
          <button
            onClick={() => setTab("inference")}
            disabled={loading}
            className={`px-4 py-1 rounded border transition-colors ${
              tab === "inference"
                ? "bg-blue-100 border-blue-400 font-semibold"
                : "bg-gray-100 border-gray-200"
            } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
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
            disabled={loading}
          >
            Download New Points CSV
          </button>
        </div>
      )}

      {!preview && !nmds && !loading && (
        <div className="text-gray-500 mt-8">
          Upload a CSV file or choose demo data to begin.
        </div>
      )}
    </div>
  );
}
