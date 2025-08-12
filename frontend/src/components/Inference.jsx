export default function InferenceHeatmap({ result }) {
  if (!result || result.length === 0) return null;

  // Extract column keys (all except ClassActual)
  const probKeys = Object.keys(result[0]).filter(k => k !== "ClassActual");
  // For coloring
  const colorForVal = val => {
    // Scale: 0 -> white, 1 -> blue
    const blue = Math.round(255 * (1 - val));
    return `rgb(${blue},${blue},255)`;
  };

  return (
    <div style={{ overflowX: "auto", margin: "1.5rem 0" }}>
      <table
        style={{
          borderCollapse: "separate",
          borderSpacing: "0.25rem",
          fontSize: "1rem",
          minWidth: "100%",
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                position: "sticky",
                left: 0,
                background: "#f8fafc",
                zIndex: 2,
                fontWeight: 700,
                padding: "0.5rem 1rem",
                border: "1px solid #e5e7eb",
                textAlign: "left",
              }}
            >
              Sample
            </th>
            {probKeys.map(k => (
              <th
                key={k}
                style={{
                  background: "#f8fafc",
                  fontWeight: 700,
                  padding: "0.5rem 1rem",
                  border: "1px solid #e5e7eb",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}
              >
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.map((row, i) => (
            <tr key={i}>
              <td
                className="font-mono"
                style={{
                  padding: "0.5rem 1rem",
                  background: "#f1f5f9",
                  border: "1px solid #e5e7eb",
                  position: "sticky",
                  left: 0,
                  zIndex: 1,
                  fontWeight: 500,
                }}
              >
                {row.ClassActual}
              </td>
              {probKeys.map(k => (
                <td
                  key={k}
                  style={{
                    background: colorForVal(Number(row[k])),
                    color: Number(row[k]) > 0.6 ? "#fff" : "#111",
                    textAlign: "center",
                    border: "1px solid #e5e7eb",
                    minWidth: "3.5rem",
                    padding: "0.5rem 1rem",
                    fontWeight: 500,
                  }}
                >
                  {Number(row[k]).toFixed(2)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
