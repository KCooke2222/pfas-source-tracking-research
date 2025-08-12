import subprocess, json, re
import pandas as pd
import matplotlib.pyplot as plt
from pathlib import Path
import json, re
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from matplotlib.patches import Ellipse
from scipy.stats import chi2

R_FILE = Path("backend/prediction/1633_NMDS.R").resolve()
CSV    = Path("backend/prediction/data/train/240130-Paper1-present 1633 targets.csv").resolve()
NEW    = Path("backend/prediction/data/test/new_samples.csv").resolve()
OUT    = Path("backend/prediction/output").resolve()

cp = subprocess.run(
    ["Rscript", str(R_FILE), str(CSV), str(NEW), str(OUT), "nosave", "0"],
    text=True, capture_output=True
)

if cp.returncode != 0:
    raise RuntimeError(cp.stderr or "R error")

# extract the last JSON object from stdout
m = re.search(r"\{.*\}\s*$", cp.stdout, flags=re.S)
if not m:
    raise ValueError(f"No JSON found in R output:\n{cp.stdout}\n{cp.stderr}")
payload = json.loads(m.group(0))

# ---- helpers ----
# 95% ellipse from mean/cov (bivariate normal)
DARK2 = plt.get_cmap("Dark2")

def confidence_ellipse(xy, ax, facecolor, alpha=0.25, zorder=1):
    xy = np.asarray(xy)
    if xy.shape[0] < 3: return
    mu  = xy.mean(axis=0)
    cov = np.cov(xy, rowvar=False)
    vals, vecs = np.linalg.eigh(cov)
    order = vals.argsort()[::-1]
    vals, vecs = vals[order], vecs[:, order]
    r2 = chi2.ppf(0.95, df=2)
    w, h = 2*np.sqrt(vals*r2)
    ang = np.degrees(np.arctan2(*vecs[:,0][::-1]))
    ax.add_patch(Ellipse(mu, w, h, angle=ang, facecolor=facecolor, edgecolor='none',
                         alpha=alpha, zorder=zorder))

def plot_nmds(scores_df, new_points, stress):
    # --- compute ranges incl. new points ---
    x = np.r_[scores_df["NMDS1"].values, new_points["NMDS1"].values]
    y = np.r_[scores_df["NMDS2"].values, new_points["NMDS2"].values]

    xmid, ymid = x.mean(), y.mean()
    xspan = x.max() - x.min()
    yspan = y.max() - y.min()
    span  = max(xspan, yspan) * 1.10  # 10% padding, force same span
    hx = hy = span / 2

    fig, ax = plt.subplots(figsize=(8,8), constrained_layout=True)
    ax.set_box_aspect(1)  # square panel independent of figure size
    ax.set_xlim(xmid - hx, xmid + hx)
    ax.set_ylim(ymid - hy, ymid + hy)

    # groups (Dark2 like ggplot)
    groups = sorted(scores_df["Group"].astype(str).unique())
    for i, g in enumerate(groups):
        sub = scores_df[scores_df["Group"].astype(str) == g]
        color = DARK2(i % 8)
        confidence_ellipse(sub[["NMDS1","NMDS2"]].values, ax, facecolor=color, alpha=0.25)
        ax.scatter(sub["NMDS1"], sub["NMDS2"], s=36, c=[color], alpha=0.95, label=g, zorder=2)

    # new points
    ax.scatter(new_points["NMDS1"], new_points["NMDS2"],
               s=110, facecolors='white', edgecolors='black', linewidths=1.3, zorder=3)
    for _, r in new_points.iterrows():
        ax.text(r["NMDS1"], r["NMDS2"], r["Sample"], fontsize=10, va='bottom', ha='center', zorder=4)

    # styling close to ggplot
    ax.axhline(0, ls=':', lw=0.6, color='0.6')
    ax.axvline(0, ls=':', lw=0.6, color='0.6')
    ax.grid(True, alpha=0.25)
    ax.set_xlabel("NMDS1"); ax.set_ylabel("NMDS2")
    ax.set_title(f"NMDS axes 1 vs 2 (stress={stress:.3f})")
    ax.legend(title="Group", loc='center left', bbox_to_anchor=(1, 0.5), frameon=False)
    return fig, ax

# ---- use it with your payload ----
# payload = json.loads(<your R stdout JSON>)
scores_df  = pd.DataFrame(payload["scores"])
new_points = pd.DataFrame(payload["new_points"])
fig, ax = plot_nmds(scores_df, new_points, stress=payload["stress"])
fig.savefig("nmds_overlay_like_ggplot.png", dpi=300)
plt.show()
