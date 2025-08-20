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
        className="w-full sm:w-auto px-4 py-2 bg-primary-800 text-white font-semibold hover:bg-primary-900 transition-colors"
      >
        Choose CSV File
      </button>
      {fileName && (
        <span className="block mt-2 text-primary-700 sm:inline sm:ml-4 sm:mt-0 align-middle">
          {fileName}
        </span>
      )}
    </div>
  );
}
