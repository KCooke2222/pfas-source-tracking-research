export default function DataPreview({ preview, selected }) {
  if (!preview) return null;

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800">Data Preview{selected && `: ${selected}`}</h3>
      </div>
      
      <div className="overflow-auto max-h-96">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {preview.columns.map((col, index) => (
                <th 
                  key={col} 
                  className={`px-4 py-3 text-left font-medium text-gray-700 text-xs uppercase tracking-wide ${
                    index !== preview.columns.length - 1 ? 'border-r border-gray-200' : ''
                  }`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {preview.preview.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                {preview.columns.map((col, colIndex) => (
                  <td 
                    key={col} 
                    className={`px-4 py-3 text-gray-900 ${
                      colIndex !== preview.columns.length - 1 ? 'border-r border-gray-200' : ''
                    }`}
                    title={String(row[col])}
                  >
                    <div className="max-w-xs truncate">
                      {row[col]}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
