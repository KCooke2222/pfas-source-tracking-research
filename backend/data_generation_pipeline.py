#!/usr/bin/env python3
"""
Data Generation Pipeline for PFAS Source Tracking

This script provides a complete pipeline to generate all necessary data files for both analysis modes:
1. Source average files for demos
2. Template CSV files 
3. Base NMDS data for landing page

Usage:
    python data_generation_pipeline.py --mode 1633_pfas
    python data_generation_pipeline.py --mode diagnostic_chemicals
    python data_generation_pipeline.py --all  # Generate for both modes
"""

import json
import pandas as pd
import numpy as np
from pathlib import Path
from app import _run_rscript, _ellipse_params
import argparse
import sys

# Configuration  
DATA_BASE = Path("prediction/data")

def discover_modes():
    """Auto-discover available modes by scanning data directory."""
    modes = []
    if DATA_BASE.exists():
        for folder in DATA_BASE.iterdir():
            if folder.is_dir() and (folder / "train").exists():
                modes.append(folder.name)
    return sorted(modes)

def get_mode_paths(mode):
    """Get file paths for a given mode."""
    available_modes = discover_modes()
    if mode not in available_modes:
        raise ValueError(f"Invalid mode: {mode}. Available: {available_modes}")
    
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

def generate_source_averages(mode):
    """
    Generate source average file for demo purposes.
    Takes the training data and creates average values per source type.
    """
    print(f"Generating source averages for {mode}...")
    
    paths = get_mode_paths(mode)
    train_csv = paths["train_csv"]
    demo_dir = paths["demo_dir"]
    
    # Ensure demo directory exists
    demo_dir.mkdir(exist_ok=True)
    
    # Read training data
    df = pd.read_csv(train_csv)
    
    # Get numeric columns (exclude Sample and Grouping)
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    if 'Sample' in numeric_cols:
        numeric_cols.remove('Sample')
    if 'Grouping' in numeric_cols:
        numeric_cols.remove('Grouping')
    
    # Calculate averages by group
    source_averages = df.groupby('Grouping')[numeric_cols].mean().reset_index()
    
    # Create sample names based on group
    source_averages['Sample'] = source_averages['Grouping'] + '_avg'
    
    # Reorder columns to match expected format
    cols = ['Sample', 'Grouping'] + numeric_cols
    source_averages = source_averages[cols]
    
    # Save to demo directory
    output_file = demo_dir / "source avg example.csv"
    source_averages.to_csv(output_file, index=False)
    
    print(f"[OK] Source averages saved to: {output_file}")
    print(f"  Contains {len(source_averages)} source types: {', '.join(source_averages['Grouping'].tolist())}")
    
    return output_file

def generate_template(mode):
    """
    Generate template CSV file with proper column structure and example data.
    """
    print(f"Generating template for {mode}...")
    
    paths = get_mode_paths(mode)
    train_csv = paths["train_csv"]
    template_path = paths["template"]
    
    # Read training data to get column structure
    df = pd.read_csv(train_csv)
    
    # Get numeric columns (chemical features)
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    if 'Sample' in numeric_cols:
        numeric_cols.remove('Sample')
    if 'Grouping' in numeric_cols:
        numeric_cols.remove('Grouping')
    
    # Create template with just column headers (no example data)
    cols = ['Sample', 'Grouping'] + numeric_cols
    template_df = pd.DataFrame(columns=cols)
    
    # Save template
    template_df.to_csv(template_path, index=False)
    
    print(f"[OK] Template saved to: {template_path}")
    print(f"  Contains {len(numeric_cols)} chemical features")
    
    return template_path

def generate_base_nmds(mode):
    """
    Generate base NMDS data using training data against itself.
    """
    print(f"Generating base NMDS data for {mode}...")
    
    paths = get_mode_paths(mode)
    train_csv = paths["train_csv"]
    base_nmds_path = paths["base_nmds"]
    out_dir = Path("prediction/output")
    
    # Use training data as both training and "new" data to get base scores_df
    payload = _run_rscript(train_csv, train_csv, out_dir, save_plots=False)
    
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
    with open(base_nmds_path, 'w') as f:
        json.dump(base_data, f, indent=2)
    
    print(f"[OK] Base NMDS data saved to: {base_nmds_path}")
    print(f"  Contains {len(base_data['scores'])} data points")
    print(f"  Groups: {list(ellipses.keys())}")
    print(f"  Stress: {base_data['stress']:.4f}")
    
    return base_nmds_path

def run_full_pipeline(mode):
    """
    Run the complete data generation pipeline for a mode.
    """
    print(f"\n{'='*50}")
    print(f"Running full data generation pipeline for: {mode}")
    print(f"{'='*50}")
    
    try:
        # Step 1: Generate source averages for demo
        generate_source_averages(mode)
        
        # Step 2: Generate template file
        generate_template(mode)
        
        # Step 3: Generate base NMDS data
        generate_base_nmds(mode)
        
        print(f"\n[SUCCESS] Pipeline completed successfully for {mode}!")
        
    except Exception as e:
        print(f"\n[ERROR] Pipeline failed for {mode}: {e}")
        return False
    
    return True

def simple_cli():
    """Super simple interactive CLI."""
    available_modes = discover_modes()
    
    if not available_modes:
        print("No analysis modes found! Make sure you have folders with training data in prediction/data/")
        input("Press Enter to exit...")
        return
    
    print("="*50)
    print("PFAS Data Generation Pipeline")
    print("="*50)
    print(f"Found {len(available_modes)} analysis mode(s): {', '.join(available_modes)}")
    print()
    
    # Simple choice
    print("What do you want to do?")
    print("1. Generate data for ALL modes")
    for i, mode in enumerate(available_modes, 2):
        print(f"{i}. Generate data for {mode} only")
    
    while True:
        try:
            choice = input("\nEnter your choice (1-{}): ".format(len(available_modes) + 1))
            choice = int(choice)
            if 1 <= choice <= len(available_modes) + 1:
                break
            else:
                print("Invalid choice! Try again.")
        except ValueError:
            print("Please enter a number!")
    
    # Process choice
    if choice == 1:
        # Do all modes
        modes_to_process = available_modes
        print(f"\nProcessing ALL modes: {', '.join(modes_to_process)}")
    else:
        # Do specific mode
        selected_mode = available_modes[choice - 2]
        modes_to_process = [selected_mode]
        print(f"\nProcessing: {selected_mode}")
    
    print("\n" + "="*50)
    
    # Run pipeline for selected modes
    success_count = 0
    for mode in modes_to_process:
        if run_full_pipeline(mode):
            success_count += 1
    
    print(f"\n{'='*50}")
    print(f"DONE! {success_count}/{len(modes_to_process)} modes completed successfully")
    print(f"{'='*50}")
    input("\nPress Enter to exit...")

def main():
    """Command line interface (still available)."""
    available_modes = discover_modes()
    
    parser = argparse.ArgumentParser(description='Generate data files for PFAS source tracking modes')
    parser.add_argument('--mode', choices=available_modes, help='Generate data for specific mode')
    parser.add_argument('--all', action='store_true', help='Generate data for all modes')
    parser.add_argument('--step', choices=['averages', 'template', 'nmds'], 
                       help='Run only specific step')
    
    args = parser.parse_args()
    
    if not args.mode and not args.all:
        parser.print_help()
        sys.exit(1)
    
    # Determine which modes to process
    modes_to_process = available_modes if args.all else [args.mode]
    
    # Process each mode
    success_count = 0
    for mode in modes_to_process:
        try:
            # Check if training data exists
            paths = get_mode_paths(mode)
            if not paths["train_csv"].exists():
                print(f"[WARNING] Skipping {mode}: No training data found at {paths['train_csv']}")
                continue
            
            if args.step:
                # Run specific step only
                if args.step == 'averages':
                    generate_source_averages(mode)
                elif args.step == 'template':
                    generate_template(mode)
                elif args.step == 'nmds':
                    generate_base_nmds(mode)
            else:
                # Run full pipeline
                if run_full_pipeline(mode):
                    success_count += 1
                    
        except Exception as e:
            print(f"[ERROR] Error processing {mode}: {e}")
    
    print(f"\n{'='*50}")
    print(f"Pipeline Summary: {success_count}/{len(modes_to_process)} modes completed successfully")
    print(f"{'='*50}")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) == 1:  # No command line arguments - use simple CLI
        simple_cli()
    else:
        # Use command line arguments if provided
        main()