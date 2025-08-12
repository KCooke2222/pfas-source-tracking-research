# ---- Build frontend ----
FROM node:18 AS frontend-build
WORKDIR /app/frontend

# Set API base for production build
ARG VITE_REACT_APP_API_BASE
ENV VITE_REACT_APP_API_BASE=$VITE_REACT_APP_API_BASE

# Install and build React app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# ---- Build backend ----
FROM python:3.11-slim

# Install backend dependencies
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ .

# Copy built frontend files into static directory
COPY --from=frontend-build /app/frontend/dist ./static

# Run the Flask API
ENV FLASK_APP=app.py
ENV FLASK_RUN_PORT=8080
EXPOSE 8080
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "app:app"]
