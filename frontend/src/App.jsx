import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Inference from "./pages/Inference";
import About from "./pages/About";

function App() {
  const [currentPage, setCurrentPage] = useState("inference");

  return (
    <div className="flex flex-col sm:flex-row min-h-dvh">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="flex-1 min-w-0 p-4 sm:p-6 bg-gray-100 overflow-x-auto">
        {currentPage === "inference" && <Inference />}
        {currentPage === "about" && <About />}
      </main>
    </div>
  );
}

export default App;
