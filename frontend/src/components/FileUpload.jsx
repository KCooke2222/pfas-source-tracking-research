import { useRef, useState } from "react";

export default function FileUpload({ onUpload, onReset }) {
  const fileInput = useRef();
  const [fileName, setFileName] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    if (onReset) onReset();
    onUpload(file);
  };

  const handleButtonClick = () => {
    fileInput.current?.click();
  };

  return (
    <div className="mb-6">
      <input
        type="file"
        accept=".csv"
        ref={fileInput}
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={handleButtonClick}
        className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
      >
        Choose CSV File
      </button>
      {fileName && (
        <span className="ml-4 text-gray-700 align-middle">{fileName}</span>
      )}
    </div>
  );
}
