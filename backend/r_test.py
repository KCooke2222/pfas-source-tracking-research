from pathlib import Path
from rpy2 import robjects as ro
from rpy2.robjects import pandas2ri
from rpy2.robjects.conversion import localconverter
import matplotlib.pyplot as plt

# --- load R + run pipeline (as you already do) ---
R_SCRIPT = Path("backend/prediction/1633_NMDS.R").resolve()
ro.r['source'](str(R_SCRIPT).replace('\\','/'))
run_pipeline = ro.globalenv['run_nmds_pipeline']

res = run_pipeline(
    csv_file=str(Path("backend/prediction/data/train/240130-Paper1-present 1633 targets.csv").resolve()).replace('\\','/'),
    new_data_path=str(Path("backend/prediction/data/test/new_samples.csv").resolve()).replace('\\','/'),
    output_dir=str(Path("backend/prediction/output").resolve()).replace('\\','/'),
    k_final=2, seed=42, get_stress=False, save_outputs=False
)

# Directly poke into res
print("\n--- Top level names ---")
print(list(res.names))

print("\n--- Objects names ---")
print(list(res.rx2("objects").names))

print("\n--- Pairplots names ---")
print(list(res.rx2("objects").rx2("pairplots").names))

print("\n--- Overlay names ---")
print(list(res.rx2("objects").rx2("overlay").names))

# Convert directly without fancy indexing
with localconverter(pandas2ri.converter):
    scores_df = pandas2ri.rpy2py(res.rx2("objects").rx2("pairplots").rx2("scores_df"))
    new_df    = pandas2ri.rpy2py(res.rx2("objects").rx2("overlay").rx2("new_coords"))

print("\n--- Scores DF ---")
print(scores_df.head())

print("\n--- New DF ---")
print(new_df.head())