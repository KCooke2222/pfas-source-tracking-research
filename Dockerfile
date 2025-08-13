# ---- Build frontend ----
FROM node:18 AS frontend-build
WORKDIR /app/frontend

# Set API base for production build
ARG VITE_REACT_APP_API_BASE
ENV VITE_REACT_APP_API_BASE=$VITE_REACT_APP_API_BASE

# Install and build React app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- Build backend ----
FROM python:3.11-slim

# ---- R + packages (binary when possible, CRAN fallback) ----
ENV DEBIAN_FRONTEND=noninteractive

# System libs for compiling CRAN pkgs when apt doesn't have them
RUN apt-get update && apt-get install -y --no-install-recommends \
    r-base r-base-core r-base-dev \
    build-essential gfortran \
    libcurl4-openssl-dev libssl-dev libxml2-dev \
 && rm -rf /var/lib/apt/lists/*

# Try apt binaries for common CRAN packages (fast, if available)
RUN apt-get update && apt-get install -y --no-install-recommends \
    r-cran-vegan r-cran-ggplot2 r-cran-jsonlite r-cran-tibble r-cran-mass r-cran-dplyr \
    r-cran-tidyr r-cran-readr r-cran-purrr r-cran-patchwork r-cran-cowplot \
 || true \
 && rm -rf /var/lib/apt/lists/*

# Install anything still missing from CRAN
RUN R -e "need <- c('vegan','ggplot2','jsonlite','tibble','MASS','dplyr', \
                    'tidyr','readr','purrr','patchwork','cowplot'); \
          inst <- rownames(installed.packages()); \
          miss <- setdiff(need, inst); \
          if (length(miss)) install.packages(miss, repos='https://cloud.r-project.org')"

# Install backend dependencies
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./

# NEW: Ensure R script output directory exists (matches your Flask paths)
RUN mkdir -p /app/prediction/output

# Copy built frontend files into static directory
COPY --from=frontend-build /app/frontend/dist ./static

# Run the Flask API
ENV FLASK_APP=app.py
ENV FLASK_RUN_PORT=8080
EXPOSE 8080
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "app:app"]
