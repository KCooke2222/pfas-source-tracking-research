// Sidebar component for navigation
// Props:
// - currentPage: string indicating the current active page
// - setCurrentPage: function to change the active page

export default function Sidebar({ currentPage, setCurrentPage }) {
  return (
    // Sidebar container
    <div className="w-64 bg-gray-800 text-white h-screen p-4">
      {/* App title */}
      <h1 className="text-xl font-bold mb-6">PFAS Tool</h1>

      {/* Navigation links */}
      <ul>
        {/* Inference tab */}
        <li
          className={`cursor-pointer p-2 rounded mt-2 ${currentPage === 'inference' ? 'bg-gray-700' : ''}`}
          onClick={() => setCurrentPage('inference')}
        >
          Inference
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
