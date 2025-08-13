# PFAS Source Tracking Research

This project offers a full-stack tool for visualizing PFAS data via Non-metric Multidimensional Scaling (NMDS).
The backend is a Flask API that executes an R script, while the frontend is a React + Vite interface for uploading CSV files or exploring demo datasets.

## Project Structure

- **backend/** – Flask service that calls an R script for NMDS.
- **frontend/** – React application built with Vite.
- **Dockerfile** – Builds the frontend, installs backend dependencies, and serves the app with Gunicorn on port 8080.

## Backend Setup

1. Install **Python 3.11** and ensure **R** with `Rscript` is on your `PATH`.
2. `cd backend`
3. Create and activate a virtual environment.
4. `pip install -r requirements.txt`
5. Verify the training CSV at `prediction/data/train/240130-Paper1-present 1633 targets.csv` and that `prediction/output` is writable.
6. Run the server:
   ```bash
   python app.py            # dev server on http://localhost:5000
   # or
   gunicorn --bind 0.0.0.0:8080 app:app
   ```

### API Endpoints

- `GET /demo/options` – list bundled demo CSVs
- `POST /demo/run` – run NMDS on a chosen demo file
- `POST /upload` – run NMDS on an uploaded CSV
- `POST /download` – return new point coordinates as CSV

## Frontend Setup

1. Install **Node.js 18+**.
2. `cd frontend`
3. `npm install` (or `npm ci`)
4. Create a `.env` file with the API base:
   ```env
   VITE_REACT_APP_API_BASE=http://localhost:5000
   ```
5. Start the dev server, pointing to the backend:
   ```bash
   npm run dev
   ```
6. Build for production with `npm run build`.

## Environment Variables

- `VITE_REACT_APP_API_BASE` – URL of the backend API (used by the frontend). Defaults to `http://localhost:5000` in development.  
  Set this in `frontend/.env` or via `--build-arg` when building Docker images.

## Docker

A single container can build and serve the full stack:

```bash
docker build -t pfas --build-arg VITE_REACT_APP_API_BASE=http://localhost:8080 .
docker run -p 8080:8080 pfas
```

The container compiles the React app, installs Python requirements, and serves both frontend and API on port 8080.

## Demo Data

Sample CSV files live under `backend/prediction/data/test`.  
Use the **"Use demo data"** option in the frontend to try the tool without uploading your own file.
