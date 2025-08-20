// src/components/Inference.jsx
import React, { useMemo } from "react";
import Plot from "react-plotly.js";

// Fixed, color-blind–safe colors for your groups
const COLOR_MAP = {
  BL: "#009E73", // green
  GW: "#E69F00", // orange
  LL: "#0072B2", // blue
  PG: "#CC79A7", // magenta
  PP: "#F0E442", // yellow
  WWTP: "#D55E00", // vermilion
};

// Berkeley-style symbol shapes for different sources
const SHAPE_MAP = {
  BL: "circle",
  GW: "triangle-up", 
  LL: "square",
  PG: "diamond",
  PP: "triangle-down",
  WWTP: "star"
};

// Full descriptive names for sources
const FULL_NAMES = {
  BL: "BL — Biosolids leachate",
  GW: "GW — AFFF-impacted groundwater", 
  LL: "LL — Landfill leachate",
  PG: "PG — Power-generation effluent",
  PP: "PP — Pulp & paper mill effluent", 
  WWTP: "WWTP — Municipal wastewater treatment plant effluent"
};

function groupColor(group) {
  return COLOR_MAP[group] || "#666666";
}

function groupShape(group) {
  return SHAPE_MAP[group] || "circle";
}

function groupFullName(group) {
  return FULL_NAMES[group] || group;
}

function ellipsePolygon({ cx, cy, width, height, angle }, n = 128) {
  const pts = [];
  const a = (angle * Math.PI) / 180;
  const c = Math.cos(a),
    s = Math.sin(a);
  const rx = width / 2,
    ry = height / 2;
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * 2 * Math.PI;
    const x0 = rx * Math.cos(t),
      y0 = ry * Math.sin(t);
    const x = cx + x0 * c - y0 * s,
      y = cy + x0 * s + y0 * c;
    pts.push([x, y]);
  }
  return pts;
}

// Custom Legend Component
function CustomLegend({ groups, showNewPoints = false }) {
  return (
    <div className="bg-white rounded-lg p-4">
      <h3 className="text-sm font-semibold mb-3 text-gray-700">Source Types</h3>
      <div className="space-y-2">
        {groups.map((group) => (
          <div key={group} className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 16 16">
                <LegendSymbol 
                  shape={groupShape(group)} 
                  color={groupColor(group)} 
                  size={8}
                  cx={8} 
                  cy={8} 
                />
              </svg>
            </div>
            <span className="text-sm text-gray-800 leading-tight">
              {groupFullName(group)}
            </span>
          </div>
        ))}
        {showNewPoints && (
          <div className="flex items-center gap-3 pt-2 border-t border-gray-200">
            <div className="flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 16 16">
                <circle 
                  cx="8" 
                  cy="8" 
                  r="6" 
                  fill="white" 
                  stroke="black" 
                  strokeWidth="1.5"
                />
              </svg>
            </div>
            <span className="text-sm text-gray-800">New samples</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper component to render legend symbols
function LegendSymbol({ shape, color, size, cx, cy }) {
  const props = { fill: color, stroke: "none" };
  
  switch (shape) {
    case "circle":
      return <circle cx={cx} cy={cy} r={size} {...props} />;
    case "square":
      return <rect x={cx-size} y={cy-size} width={size*2} height={size*2} {...props} />;
    case "triangle-up":
      return <polygon points={`${cx},${cy-size} ${cx-size},${cy+size} ${cx+size},${cy+size}`} {...props} />;
    case "triangle-down":
      return <polygon points={`${cx},${cy+size} ${cx-size},${cy-size} ${cx+size},${cy-size}`} {...props} />;
    case "diamond":
      return <polygon points={`${cx},${cy-size} ${cx+size},${cy} ${cx},${cy+size} ${cx-size},${cy}`} {...props} />;
    case "star":
      const outerRadius = size;
      const innerRadius = size * 0.4;
      const points = [];
      for (let i = 0; i < 10; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i * Math.PI) / 5 - Math.PI / 2;
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        points.push(`${x},${y}`);
      }
      return <polygon points={points.join(' ')} {...props} />;
    default:
      return <circle cx={cx} cy={cy} r={size} {...props} />;
  }
}

export default function Inference({ data, height }) {
  const { scores = [], new_points = [], ellipses = {}, stress } = data || {};

  // Clean numeric
  const scoresClean = useMemo(
    () =>
      scores
        .map((r) => ({ ...r, NMDS1: +r.NMDS1, NMDS2: +r.NMDS2 }))
        .filter((r) => Number.isFinite(r.NMDS1) && Number.isFinite(r.NMDS2)),
    [scores]
  );
  const newClean = useMemo(
    () =>
      new_points
        .map((r) => ({ ...r, NMDS1: +r.NMDS1, NMDS2: +r.NMDS2 }))
        .filter((r) => Number.isFinite(r.NMDS1) && Number.isFinite(r.NMDS2)),
    [new_points]
  );

  // Get unique groups for custom legend
  const uniqueGroups = useMemo(() => {
    const groups = [...new Set(scoresClean.map(r => r.Group))];
    return groups.sort();
  }, [scoresClean]);

  const traces = useMemo(() => {
    const t = [];

    // Ellipses (filled, no stroke)
    Object.entries(ellipses).forEach(([g, e]) => {
      const poly = ellipsePolygon(e, 180);
      const col = groupColor(g);
      t.push({
        x: poly.map((p) => p[0]),
        y: poly.map((p) => p[1]),
        mode: "lines",
        line: { width: 0 },
        fill: "toself",
        fillcolor: col + "33", // ~20% opacity
        name: `${groupFullName(g)} (95% ellipse)`,
        hoverinfo: "skip",
        showlegend: false,
        type: "scatter",
      });
    });

    // Group points
    const byGroup = {};
    for (const r of scoresClean) (byGroup[r.Group] ||= []).push(r);
    Object.keys(byGroup)
      .sort()
      .forEach((g) => {
        const arr = byGroup[g];
        t.push({
          x: arr.map((r) => r.NMDS1),
          y: arr.map((r) => r.NMDS2),
          mode: "markers",
          marker: { 
            size: 10, 
            color: groupColor(g),
            symbol: groupShape(g),
            line: { width: 0 }
          },
          name: groupFullName(g),
          type: "scatter",
        });
      });

    // New points
    if (newClean.length) {
      t.push({
        x: newClean.map((p) => p.NMDS1),
        y: newClean.map((p) => p.NMDS2),
        mode: "markers+text",
        marker: {
          size: 12,
          color: "white",
          line: { color: "black", width: 1.5 },
        },
        text: newClean.map((p) => p.Sample),
        textposition: "top center",
        name: "New samples",
        type: "scatter",
      });
    }

    return t;
  }, [scoresClean, newClean, ellipses]);

  const layout = useMemo(
    () => ({
      title:
        stress != null
          ? `NMDS axes 1 vs 2 (stress=${Number(stress).toFixed(3)})`
          : "NMDS axes 1 vs 2",
      margin: { l: 60, r: 20, t: 60, b: 60 },
      paper_bgcolor: "white",
      plot_bgcolor: "white",
      xaxis: {
        title: {
          text: "NMDS 1",
          font: { size: 16, color: "black", family: "Arial, sans-serif" },
          standoff: 20
        },
        zeroline: true,
        showgrid: true,
        gridcolor: "rgba(0,0,0,0.1)",
        tickfont: { size: 12, color: "black" },
        // Keep equal scales (square axes) but let Plotly autorange initially
        scaleanchor: "y",
        scaleratio: 1,
        autorange: true,
      },
      yaxis: {
        title: {
          text: "NMDS 2",
          font: { size: 16, color: "black", family: "Arial, sans-serif" },
          standoff: 20
        },
        zeroline: true,
        showgrid: true,
        gridcolor: "rgba(0,0,0,0.1)",
        tickfont: { size: 12, color: "black" },
        autorange: true,
      },
      showlegend: false,
      hovermode: "closest",
    }),
    [stress]
  );

  const plotHeight = height || (typeof window !== 'undefined' && window.innerWidth < 768 ? 400 : 500);

  return (
    <div className="w-full">
      <div className="flex flex-col gap-4">
        {/* Plot container */}
        <div className="w-full rounded-lg overflow-hidden" style={{ height: plotHeight }}>
          <Plot
            data={traces}
            layout={layout}
            useResizeHandler
            style={{ width: "100%", height: "100%" }}
            config={{ displaylogo: false, responsive: true }}
          />
        </div>
        
        {/* Custom Legend */}
        <div className="w-full">
          <CustomLegend 
            groups={uniqueGroups} 
            showNewPoints={newClean.length > 0}
          />
        </div>
      </div>
    </div>
  );
}
