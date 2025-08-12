export default function DataPreview({ preview, selected }) {
  if (!preview) return null;

  return (
    <>
      <h3 className="font-semibold mb-2">Preview: {selected}</h3>
      <div className="overflow-auto max-h-96">
        <table className="w-full text-sm border">
          <thead>
            <tr>
              {preview.columns.map((col) => (
                <th key={col} className="border px-2 py-1 text-left">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.preview.map((row, i) => (
              <tr key={i}>
                {preview.columns.map((col) => (
                  <td key={col} className="border px-2 py-1">
                    {row[col]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
