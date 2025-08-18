// Sidebar component for navigation
// Props:
// - currentPage: string indicating the current active page
// - setCurrentPage: function to change the active page

export default function Sidebar({ currentPage, setCurrentPage }) {
  return (
    // Sidebar container
    <div className="bg-gray-800 text-white p-4 w-full sm:w-64 sm:h-dvh sm:sticky sm:top-0 flex-shrink-0">
      {/* App title */}
      <h1 className="text-xl font-bold mb-4 sm:mb-6 text-center sm:text-left">
        PFAS Tool
      </h1>

      {/* Navigation links */}
      <ul className="flex justify-center sm:flex-col sm:justify-start gap-2">
        {/* Inference tab */}
        <li
          className={`cursor-pointer p-2 rounded ${
            currentPage === "inference" ? "bg-gray-700" : ""
          }`}
          onClick={() => setCurrentPage("inference")}
        >
          Inference
        </li>

        {/* About tab */}
        <li
          className={`cursor-pointer p-2 rounded ${
            currentPage === "about" ? "bg-gray-700" : ""
          }`}
          onClick={() => setCurrentPage("about")}
        >
          About
        </li>

        {/* Data Management tab (disabled for now) */}
        {/*
        <li
          className={`cursor-pointer p-2 rounded ${currentPage === 'data' ? 'bg-gray-700' : ''}`}
          onClick={() => setCurrentPage('data')}
        >
          Data Management
        </li>
        */}
      </ul>
    </div>
  );
}
