import io
import os
import re
import json
import shutil
import tempfile
import subprocess
from pathlib import Path

import numpy as np
import pandas as pd
from scipy.stats import chi2

from flask import Flask, request, jsonify, send_file, Blueprint
from flask_cors import CORS


app = Flask(__name__)
CORS(app)

# Allowed extensions
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() == 'csv'

# --- CONFIG ---
R_FILE    = Path("prediction/1633_NMDS.R").resolve()
OUT_DIR   = Path("prediction/output").resolve()
DATA_BASE = Path("prediction/data").resolve()

# Available analysis modes
AVAILABLE_MODES = ["1633_pfas", "diagnostic_chemicals"]
DEFAULT_MODE = "1633_pfas"

# --- helpers ---
def _get_mode_paths(mode):
    """Get file paths for a given mode using consistent folder structure."""
    if mode not in AVAILABLE_MODES:
        raise ValueError(f"Invalid mode: {mode}. Available: {AVAILABLE_MODES}")
    
    mode_dir = DATA_BASE / mode
    train_dir = mode_dir / "train"
    
    # Find the first CSV file in train directory
    train_csvs = list(train_dir.glob("*.csv"))
    if not train_csvs:
        raise FileNotFoundError(f"No training CSV found in {train_dir}")
    
    return {
        "train_csv": train_csvs[0],
        "demo_dir": mode_dir / "test",
        "base_nmds": mode_dir / "base_nmds.json",
        "template": mode_dir / "template.csv"
    }

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

# --- core ---
def _process_csv(new_csv_path: Path, mode=DEFAULT_MODE):
    paths = _get_mode_paths(mode)
    
    df = pd.read_csv(new_csv_path)
    preview = df.head(5).to_dict(orient='records')
    columns = list(df.columns)

    payload = _run_rscript(paths["train_csv"], new_csv_path, OUT_DIR, save_plots=False)

    scores_df = pd.DataFrame(payload["scores"])      # Sample, Group, NMDS1, NMDS2
    new_df    = pd.DataFrame(payload["new_points"])  # Sample, NMDS1, NMDS2
    ell       = _ellipse_params(scores_df)

    return {
        "preview": preview,
        "columns": columns,
        "nmds": {
            "stress": payload.get("stress"),
            "scores": payload.get("scores", []),
            "new_points": payload.get("new_points", []),
            "ellipses": ell,
        }
    }

@app.route('/demo/options', methods=['GET'])
def demo_options():
    mode = request.args.get('mode', DEFAULT_MODE)
    try:
        paths = _get_mode_paths(mode)
        demo_dir = paths["demo_dir"]
        if not demo_dir.exists():
            return jsonify({"options": []})
        files = sorted([p.name for p in demo_dir.glob("*.csv") if p.is_file()])
        return jsonify({"options": files})
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@app.route('/demo/run', methods=['POST'])
def demo_run():
    data = request.get_json() or {}
    name = data.get("name", "")
    mode = data.get("mode", DEFAULT_MODE)
    
    try:
        paths = _get_mode_paths(mode)
        demo_dir = paths["demo_dir"]
        # allow only files we advertised
        allowed = {p.name for p in demo_dir.glob("*.csv")}
        if name not in allowed:
            return jsonify({"error": "Invalid demo file"}), 400

        result = _process_csv(demo_dir / name, mode)
        return jsonify(result)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Demo processing failed: {e}"}), 500

# tighten /upload to reuse the core
@app.route('/upload', methods=['POST'])
def upload_nmds():
    file = request.files.get("file")
    mode = request.form.get("mode", DEFAULT_MODE)
    
    if not file:
        return jsonify({"error": "No file uploaded"}), 400
    if not file.filename.lower().endswith(".csv"):
        return jsonify({"error": "Only CSV files allowed"}), 400

    try:
        with tempfile.TemporaryDirectory() as td:
            new_csv = Path(td) / "new_samples.csv"
            file.save(str(new_csv))
            result = _process_csv(new_csv, mode)
            return jsonify(result)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"R execution failed: {e}"}), 500

# Results download as CSV
@app.route('/download', methods=['POST'])
def download_results():
    data = request.get_json()
    nmds_data = data.get('nmds')
    mode = data.get('mode', 'analysis')
    
    if not nmds_data:
        return jsonify({'error': 'No NMDS data to download'}), 400

    new_points = nmds_data.get('new_points', [])
    base_points = nmds_data.get('scores', [])
    stress = nmds_data.get('stress')
    
    if not new_points:
        return jsonify({'error': 'No new data points to download'}), 400

    # Create clean CSV data
    csv_rows = []
    
    # Header with metadata (plain text, no #)
    mode_name = "1633 PFAS Compounds" if mode == "1633_pfas" else "Diagnostic Target & Suspect Chemicals"
    stress_str = f"{stress:.4f}" if stress is not None else "N/A"
    csv_rows.extend([
        "PFAS NMDS Analysis Results",
        f"Analysis Mode: {mode_name}",
        f"Generated: {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}",
        f"Stress: {stress_str}",
        f"New samples: {len(new_points)}",
        "",  # Empty line
        "Sample,NMDS1,NMDS2"
    ])
    
    # New sample data
    for point in new_points:
        sample = str(point.get('Sample', 'Unknown')).replace('"', '""')  # Escape quotes
        nmds1 = f"{float(point.get('NMDS1', 0)):.4f}"
        nmds2 = f"{float(point.get('NMDS2', 0)):.4f}"
        csv_rows.append(f'"{sample}",{nmds1},{nmds2}')
    
    # All training data points for reference
    csv_rows.extend(["", "All training data points for reference:"])
    
    for point in base_points:
        if point.get('Group'):  # Only include points with group labels
            sample = str(point.get('Sample', point.get('Group', 'Unknown'))).replace('"', '""')
            nmds1 = f"{float(point.get('NMDS1', 0)):.4f}"
            nmds2 = f"{float(point.get('NMDS2', 0)):.4f}"
            csv_rows.append(f'"{sample}",{nmds1},{nmds2}')
    
    # Create CSV content
    csv_content = "\n".join(csv_rows)
    
    # Generate filename
    timestamp = pd.Timestamp.now().strftime('%Y-%m-%d')
    filename = f"{mode}_nmds_results_{timestamp}.csv"
    
    return send_file(
        io.BytesIO(csv_content.encode('utf-8')),
        mimetype='text/csv',
        as_attachment=True,
        download_name=filename
    )


@app.route("/template", methods=["GET"])
def download_template():
    mode = request.args.get('mode', DEFAULT_MODE)
    try:
        paths = _get_mode_paths(mode)
        template_path = paths["template"]
        if not template_path.exists():
            return jsonify({"error": f"Template not found for mode: {mode}"}), 404
        return send_file(template_path, as_attachment=True)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@app.route('/base-nmds', methods=['GET'])
def get_base_nmds():
    """Serve static base NMDS data for landing page display."""
    mode = request.args.get('mode', DEFAULT_MODE)
    
    try:
        paths = _get_mode_paths(mode)
        base_data_path = paths["base_nmds"]
        
        if not base_data_path.exists():
            return jsonify({"error": f"Base NMDS data not found for mode: {mode}. Run generate_base_nmds.py first."}), 404
        
        with open(base_data_path, 'r') as f:
            base_data = json.load(f)
        
        # Return in the same format as the regular processing
        return jsonify({
            "preview": [],  # No preview data for base plot
            "columns": [],  # No columns for base plot
            "nmds": base_data
        })
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Failed to load base NMDS data: {e}"}), 500

# --- flask stuff ---

# Serve static files
@app.route('/')
def index():
    return send_file('static/index.html')

@app.route('/<path:path>')
def static_proxy(path):
    return send_file(f'static/{path}')

if __name__ == '__main__':
    app.run(debug=True)