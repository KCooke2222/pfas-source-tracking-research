#!/usr/bin/env python3
"""
Generate static base NMDS data for the landing page.
This script processes the training data to create a static file with scores_df and ellipses.
"""

import json
import pandas as pd
from pathlib import Path
from app import _run_rscript, _ellipse_params, TRAIN_CSV, OUT_DIR

def generate_base_nmds_data():
    """Generate base NMDS data using training data against itself."""
    
    print("Generating base NMDS data...")
    
    # Use training data as both training and "new" data to get base scores_df
    payload = _run_rscript(TRAIN_CSV, TRAIN_CSV, OUT_DIR, save_plots=False)
    
    # Extract scores_df (this contains all the training data points)
    scores_df = pd.DataFrame(payload["scores"])
    print(f"Generated scores_df with {len(scores_df)} points")
    
    # Generate ellipses
    ellipses = _ellipse_params(scores_df)
    print(f"Generated ellipses for {len(ellipses)} groups")
    
    # Create base data structure (without new_points since this is the base)
    base_data = {
        "stress": payload.get("stress"),
        "scores": payload.get("scores", []),
        "ellipses": ellipses,
        "new_points": []  # Empty for base plot
    }
    
    # Save to static file
    static_file = Path("prediction/data/base_nmds.json")
    static_file.parent.mkdir(exist_ok=True)
    
    with open(static_file, 'w') as f:
        json.dump(base_data, f, indent=2)
    
    print(f"Base NMDS data saved to: {static_file}")
    print(f"Contains {len(base_data['scores'])} data points")
    print(f"Groups: {list(ellipses.keys())}")
    
    return base_data

if __name__ == "__main__":
    generate_base_nmds_data()