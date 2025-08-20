export default function Header({ currentPage, setCurrentPage }) {
  return (
    <header className="bg-primary-800 border-b border-primary-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-white">PFAS Source Tracking</h1>
          </div>
          
          <nav className="flex space-x-8">
            <button
              onClick={() => setCurrentPage("home")}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                currentPage === "home"
                  ? "bg-primary-700 text-white"
                  : "text-primary-300 hover:text-white hover:bg-primary-700"
              }`}
            >
              Home
            </button>
            
            <button
              onClick={() => setCurrentPage("inference")}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                currentPage === "inference"
                  ? "bg-primary-700 text-white"
                  : "text-primary-300 hover:text-white hover:bg-primary-700"
              }`}
            >
              Analysis Tool
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}