import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Inference from './pages/Inference';

function App() {
  const [currentPage, setCurrentPage] = useState('inference');

  return (
    <div className="flex min-h-screen">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="flex-1 p-6 bg-gray-100">
        {currentPage === 'inference' && <Inference />}
      </main>
    </div>
  );
}

export default App;