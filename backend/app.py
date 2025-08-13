from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pandas as pd
import io
import os, re, json, tempfile, subprocess
from pathlib import Path
from flask import Blueprint, request, jsonify
import pandas as pd
import numpy as np
from scipy.stats import chi2
import shutil


app = Flask(__name__)
CORS(app)

# Allowed extensions
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() == 'csv'

# --- CONFIG ---
R_FILE    = Path("prediction/1633_NMDS.R").resolve()
TRAIN_CSV = Path("prediction/data/train/240130-Paper1-present 1633 targets.csv").resolve()
OUT_DIR   = Path("prediction/output").resolve()

# --- helpers ---
def _run_rscript(train_csv, new_csv, out_dir, save_plots=False):
    rscript = shutil.which("Rscript")
    if not rscript:
        raise RuntimeError("Rscript not found on PATH. Install R or add R\\bin to PATH.")

    for p in (R_FILE, train_csv, new_csv):
        if not Path(p).exists():
            raise RuntimeError(f"Missing path: {p}")

    args = [
        rscript, "--vanilla", str(R_FILE),
        str(train_csv), str(new_csv), str(out_dir),
        "save" if save_plots else "nosave",
        "0",
    ]
    cp = subprocess.run(args, text=True, capture_output=True)

    # Always include both stdout/stderr in error response
    if cp.returncode != 0:
        raise RuntimeError(
            "Rscript failed\n"
            f"CMD: {' '.join(args)}\n"
            f"STDOUT:\n{cp.stdout[:4000]}\n"
            f"STDERR:\n{cp.stderr[:4000]}"
        )

    m = re.search(r"\{.*\}\s*$", cp.stdout, flags=re.S)
    if not m:
        raise ValueError(
            "No JSON found in R output. Did the script print logs after JSON?\n"
            f"STDOUT (tail):\n{cp.stdout[-2000:]}\n"
            f"STDERR (tail):\n{cp.stderr[-2000:]}"
        )
    return json.loads(m.group(0))


def _ellipse_params(scores_df: pd.DataFrame):
    # returns {group: {cx, cy, width, height, angle}}
    ell = {}
    df = scores_df.copy()
    df["Group"] = df["Group"].astype(str)
    for g, sub in df.groupby("Group"):
        xy = sub[["NMDS1", "NMDS2"]].to_numpy()
        if xy.shape[0] < 3:
            continue
        mu = xy.mean(axis=0)
        cov = np.cov(xy, rowvar=False)
        vals, vecs = np.linalg.eigh(cov)
        order = vals.argsort()[::-1]
        vals, vecs = vals[order], vecs[:, order]
        r2 = chi2.ppf(0.95, df=2)
        w, h = 2 * np.sqrt(vals * r2)  # width/height for 95% ellipse
        ang = float(np.degrees(np.arctan2(*vecs[:, 0][::-1])))
        ell[g] = {
            "cx": float(mu[0]),
            "cy": float(mu[1]),
            "width": float(w),
            "height": float(h),
            "angle": ang,
        }
    return ell


def _viewport(scores_df: pd.DataFrame, new_points_df: pd.DataFrame):
    x = np.r_[scores_df["NMDS1"].to_numpy(), new_points_df["NMDS1"].to_numpy()]
    y = np.r_[scores_df["NMDS2"].to_numpy(), new_points_df["NMDS2"].to_numpy()]
    xmid, ymid = x.mean(), y.mean()
    xspan, yspan = x.max() - x.min(), y.max() - y.min()
    span = float(max(xspan, yspan) * 1.10)  # 10% padding, square aspect
    hx = hy = span / 2.0
    return {
        "xmin": float(xmid - hx),
        "xmax": float(xmid + hx),
        "ymin": float(ymid - hy),
        "ymax": float(ymid + hy),
    }


@app.route('/upload', methods=['POST'])
def upload_nmds():
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "No file uploaded"}), 400
    if not file.filename.lower().endswith(".csv"):
        return jsonify({"error": "Only CSV files allowed"}), 400

    try:
        with tempfile.TemporaryDirectory() as td:
            new_csv = Path(td) / "new_samples.csv"
            file.save(str(new_csv))

            # Preview + columns for your Preview tab
            df = pd.read_csv(new_csv)
            preview = df.head(5).to_dict(orient='records')
            columns = list(df.columns)

            # Run R
            payload = _run_rscript(TRAIN_CSV, new_csv, OUT_DIR, save_plots=False)
    except Exception as e:
        return jsonify({"error": f"R execution failed: {e}"}), 500

    try:
        scores_df = pd.DataFrame(payload["scores"])      # Sample, Group, NMDS1, NMDS2
        new_df    = pd.DataFrame(payload["new_points"])  # Sample, NMDS1, NMDS2
        ell       = _ellipse_params(scores_df)
        view      = _viewport(scores_df, new_df)
    except Exception as e:
        return jsonify({"error": f"Post-processing failed: {e}"}), 500

    # Return what your page expects
    return jsonify({
        "preview": preview,
        "columns": columns,
        "nmds": {
            "stress": payload.get("stress"),
            "scores": payload.get("scores", []),
            "new_points": payload.get("new_points", []),
            "ellipses": ell,
            "viewport": view,
        }
    })
# Results download as CSV
@app.route('/download', methods=['POST'])
def download_results():
    data = request.get_json()
    results = data.get('results')
    if not results:
        return jsonify({'error': 'No results to download'}), 400

    df = pd.DataFrame(results)
    buf = io.StringIO()
    df.to_csv(buf, index=False)
    buf.seek(0)
    return send_file(
        io.BytesIO(buf.getvalue().encode()),
        mimetype='text/csv',
        as_attachment=True,
        download_name='results.csv'
    )

# Serve static files
@app.route('/')
def index():
    return send_file('static/index.html')

@app.route('/<path:path>')
def static_proxy(path):
    return send_file(f'static/{path}')

if __name__ == '__main__':
    app.run(debug=True)