from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pandas as pd
import io

app = Flask(__name__)
CORS(app)

# Allowed extensions
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() == 'csv'


def predict_water_sources(df):
    # Directly pass DataFrame
    # Edit as needed if fingerprintingWorkflowChallenge returns a DataFrame or dict
    result_df = fingerprintingWorkflowChallenge(df)
    # If the result is a DataFrame, convert to records:
    if hasattr(result_df, "to_dict"):
        return result_df.to_dict(orient='records')
    # If already a list/dict, return as is
    return result_df

# Upload CSV, preview (first 5 rows), run model, download results
@app.route('/upload', methods=['POST'])
def upload_and_predict():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    if not allowed_file(file.filename):
        return jsonify({'error': 'Only CSV files allowed'}), 400

    try:
        df = pd.read_csv(file)
    except Exception as e:
        return jsonify({'error': f'Invalid CSV: {str(e)}'}), 400

    # Optional: send a preview
    preview = df.head(5).to_dict(orient='records')
    columns = list(df.columns)

    try:
        results = predict_water_sources(df)
    except Exception as e:
        return jsonify({'error': f'Prediction error: {str(e)}'}), 400

    return jsonify({
        'preview': preview,
        'columns': columns,
        'result': results
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