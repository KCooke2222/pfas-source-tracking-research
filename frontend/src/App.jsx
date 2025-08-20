import { useState } from "react";
import Header from "./components/Header";
import Home from "./pages/Home";
import Inference from "./pages/Inference";

function App() {
  const [currentPage, setCurrentPage] = useState("home");

  return (
    <div className="min-h-screen bg-primary-50">
      <Header currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main>
        {currentPage === "home" && <Home setCurrentPage={setCurrentPage} />}
        {currentPage === "inference" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Inference />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
