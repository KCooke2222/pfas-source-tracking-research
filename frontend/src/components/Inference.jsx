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

function groupColor(group) {
  return COLOR_MAP[group] || "#666666";
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

export default function Inference({ data, height = 640 }) {
  const {
    scores = [],
    new_points = [],
    ellipses = {},
    viewport,
    stress,
  } = data || {};

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

  // Padded ranges that include all points
  const ranges = useMemo(() => {
    const xs = [...scoresClean, ...newClean].map((r) => r.NMDS1);
    const ys = [...scoresClean, ...newClean].map((r) => r.NMDS2);
    if (xs.length && ys.length) {
      let xmin = Math.min(...xs),
        xmax = Math.max(...xs);
      let ymin = Math.min(...ys),
        ymax = Math.max(...ys);
      const span = Math.max(xmax - xmin, ymax - ymin) || 1;
      const pad = span * 0.1;
      const xmid = (xmin + xmax) / 2,
        ymid = (ymin + ymax) / 2;
      return {
        xmin: xmid - span / 2 - pad,
        xmax: xmid + span / 2 + pad,
        ymin: ymid - span / 2 - pad,
        ymax: ymid + span / 2 + pad,
      };
    }
    if (
      viewport &&
      [viewport.xmin, viewport.xmax, viewport.ymin, viewport.ymax].every(
        Number.isFinite
      )
    ) {
      return viewport;
    }
    return { xmin: -1, xmax: 1, ymin: -1, ymax: 1 };
  }, [scoresClean, newClean, viewport]);

  const traces = useMemo(() => {
    const t = [];

    // Ellipses (keep your alpha via 8-digit hex)
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
        name: `${g} (95% ellipse)`,
        hoverinfo: "skip",
        showlegend: false,
        type: "scatter",
      });
    });

    // Group points (colors only)
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
          marker: { size: 8, color: groupColor(g) },
          name: g,
          type: "scatter",
        });
      });

    // New points (unchanged except palette is separate)
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
      margin: { l: 40, r: 10, t: 40, b: 40 },
      paper_bgcolor: "white",
      plot_bgcolor: "white",
      xaxis: {
        title: "NMDS1",
        zeroline: true,
        showgrid: true,
        gridcolor: "rgba(0,0,0,0.1)",
        scaleanchor: "y",
        scaleratio: 1,
        range: [ranges.xmin, ranges.xmax],
      },
      yaxis: {
        title: "NMDS2",
        zeroline: true,
        showgrid: true,
        gridcolor: "rgba(0,0,0,0.1)",
        range: [ranges.ymin, ranges.ymax],
      },
      legend: { orientation: "h", x: 0, y: -0.15 },
      hovermode: "closest",
    }),
    [ranges, stress]
  );

  return (
    <div className="w-full">
      <Plot
        data={traces}
        layout={layout}
        useResizeHandler
        style={{ width: "100%", height }}
        config={{ displaylogo: false, responsive: true }}
      />
    </div>
  );
}
