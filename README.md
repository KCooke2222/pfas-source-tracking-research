# PFAS Source Tracking Research

This project offers a full-stack tool for visualizing PFAS data via Non-metric Multidimensional Scaling (NMDS).
The backend is a Flask API that executes an R script, while the frontend is a React + Vite interface for uploading CSV files or exploring demo datasets.

## Quick Start

For the fastest setup, use Docker:

```bash
docker build -t pfas --build-arg VITE_REACT_APP_API_BASE=http://localhost:8080 .
docker run -p 8080:8080 pfas
```

Then visit http://localhost:8080

## Prerequisites

**For Local Development:**

- **Python 3.11+**
- **Node.js 18+**
- **R** with `Rscript` in PATH
- **Git**

**Required R packages** (automatically installed in Docker):

- vegan, ggplot2, jsonlite, tibble, MASS, dplyr, tidyr, readr, purrr, patchwork, cowplot

## Project Structure

- **backend/** – Flask service that calls an R script for NMDS.
- **frontend/** – React application built with Vite.
- **Dockerfile** – Builds the frontend, installs backend dependencies, and serves the app with Gunicorn on port 8080.

## Development Setup

### Backend Setup

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd pfas-source-tracking-research
   ```

2. **Set up Python environment:**

   ```bash
   cd backend
   python -m venv venv

   # Windows:
   venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate

   pip install -r requirements.txt
   ```

3. **Install R packages:**

   ```r
   # Run in R console:
   install.packages(c('vegan','ggplot2','jsonlite','tibble','MASS','dplyr','tidyr','readr','purrr','patchwork','cowplot'))
   ```

4. **Generate base NMDS data (optional):**

   ```bash
   python generate_base_nmds.py
   ```

5. **Start the backend server:**
   ```bash
   python app.py            # Development server on http://localhost:5000
   # or
   gunicorn --bind 0.0.0.0:8080 app:app  # Production server
   ```

### API Endpoints

- `GET /demo/options` – list bundled demo CSVs
- `POST /demo/run` – run NMDS on a chosen demo file
- `POST /upload` – run NMDS on an uploaded CSV
- `POST /download` – return new point coordinates as CSV
- `GET /template` – download CSV template file
- `GET /base-nmds` – get base NMDS data for landing page display

### Frontend Setup

1. **Navigate to frontend directory:**

   ```bash
   cd frontend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   # or for exact dependency versions:
   npm ci
   ```

3. **Configure environment:**

   ```bash
   # Create .env file (already exists with default values)
   echo "VITE_REACT_APP_API_BASE=http://localhost:5000" > .env
   ```

4. **Start development server:**

   ```bash
   npm run dev     # Starts on http://localhost:5173
   ```

5. **Other available commands:**
   ```bash
   npm run build   # Production build
   npm run lint    # Run ESLint
   npm run preview # Preview production build
   ```

## Environment Variables

- `VITE_REACT_APP_API_BASE` – URL of the backend API (used by the frontend). Defaults to `http://localhost:5000` in development.  
  Set this in `frontend/.env` or via `--build-arg` when building Docker images.

## Demo Data

Sample CSV files live under `backend/prediction/data/test`.  
Use the **"Use demo data"** option in the frontend to try the tool without uploading your own file.

## Frontend Features

The React frontend includes:

- **Landing Page** – Home page with tool overview, usage instructions, and PFAS source types
- **Header Navigation** – Clean navigation between Home and Analysis Tool
- **Upload Interface** – Upload CSV files for NMDS analysis
- **Demo Data Mode** – Choose from pre-loaded sample datasets
- **Data Preview** – View uploaded CSV data before processing
- **NMDS Visualization** – Interactive plot showing sample positions and confidence ellipses
- **Template Download** – Get properly formatted CSV template
- **Results Export** – Download NMDS coordinates as CSV
- **SERDP Acknowledgment** – Funding support information

## Data Requirements

The tool expects CSV files with PFAS concentration data. Use the template download feature to get the proper format, or reference the sample files in `backend/prediction/data/test/`.

## Architecture Overview

### Backend Structure

```
backend/
├── app.py                    # Main Flask application
├── generate_base_nmds.py     # Script to generate base NMDS data
├── requirements.txt          # Python dependencies
└── prediction/
    ├── 1633_NMDS.R          # R script for NMDS analysis
    ├── data/
    │   ├── base_nmds.json   # Pre-computed base NMDS data
    │   ├── template.csv     # CSV template for uploads
    │   ├── test/            # Demo CSV files
    │   └── train/           # Training data for NMDS model
    └── output/              # Generated plots and model files
```

### Frontend Structure

```
frontend/
├── src/
│   ├── assets/              # Static assets
│   ├── components/          # Reusable React components
│   │   ├── DataPreview.jsx  # CSV data preview table
│   │   ├── FileUpload.jsx   # File upload interface
│   │   ├── Header.jsx       # Navigation header
│   │   └── Inference.jsx    # NMDS plot visualization
│   ├── pages/               # Page-level components
│   │   ├── Home.jsx         # Landing page with tool overview
│   │   └── Inference.jsx    # Main analysis page
│   ├── App.jsx              # Root application component
│   └── index.css            # Global styles and theme colors
├── package.json             # Node.js dependencies
└── vite.config.js           # Vite configuration
```

### Data Flow

1. **Upload/Demo Selection** → User uploads CSV or selects demo data
2. **Backend Processing** → Flask receives file, calls R script for NMDS analysis
3. **R Analysis** → R script processes data against training model, returns JSON
4. **Frontend Display** → React components render NMDS plot and results
5. **Export** → Users can download NMDS coordinates as CSV

### Key Technologies

- **Backend:** Flask (Python), R for statistical analysis
- **Frontend:** React 19, Vite, TailwindCSS, Plotly.js for visualization
- **Deployment:** Docker with multi-stage build

## Continuing Development

To continue working on this project:

- **Request repository access** - Contact the current maintainer to be added as a collaborator
- **Create your own version** - Copy the codebase to create an independent version you can modify
- **Follow the development setup** above to get started locally
