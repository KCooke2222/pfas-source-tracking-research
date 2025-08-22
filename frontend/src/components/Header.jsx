export default function Header({ currentPage, setCurrentPage }) {
  return (
    <header className="bg-primary-800 border-b border-primary-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button 
              onClick={() => setCurrentPage("home")}
              className="text-xl font-bold text-white hover:text-primary-200 transition-colors cursor-pointer"
            >
              PFAS Source Tracking
            </button>
          </div>
          
          <nav className="flex space-x-8">
            <button
              onClick={() => setCurrentPage("1633_pfas")}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                currentPage === "1633_pfas"
                  ? "bg-primary-700 text-white"
                  : "text-primary-300 hover:text-white hover:bg-primary-700"
              }`}
            >
              1633 PFAS
            </button>
            <button
              onClick={() => setCurrentPage("diagnostic_chemicals")}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                currentPage === "diagnostic_chemicals"
                  ? "bg-primary-700 text-white"
                  : "text-primary-300 hover:text-white hover:bg-primary-700"
              }`}
            >
              Diagnostic Chemicals
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}