from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import pandas as pd

app = Flask(__name__)
CORS(app)

# Load model
model = joblib.load("best_model_catboost.pkl")

FEATURES = [
    "Sex", "Age", "Hemoglobin", "Total WBC count",
    "Neutrophils", "Lymphocytes", "Total Circulating Eosinophils",
    "HTC/PCV", "MCH", "MCHC", "RDW-CV", "Platelet Count"
]

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        input_df = pd.DataFrame([{
            "Sex":                          data.get("sex"),
            "Age":                          float(data.get("age")),
            "Hemoglobin":                   float(data.get("hemoglobin")),
            "Total WBC count":              float(data.get("wbc")),
            "Neutrophils":                  float(data.get("neutrophils")),
            "Lymphocytes":                  float(data.get("lymphocytes")),
            "Total Circulating Eosinophils":float(data.get("eosinophils")),
            "HTC/PCV":                      float(data.get("htc")),
            "MCH":                          float(data.get("mch")),
            "MCHC":                         float(data.get("mchc")),
            "RDW-CV":                       float(data.get("rdwcv")),
            "Platelet Count":               float(data.get("platelet")),
        }])

        pred       = model.predict(input_df)[0]
        proba      = model.predict_proba(input_df)[0]
        confidence = round(float(max(proba)) * 100, 2)
        label      = "Positive" if pred == 1 else "Negative"

        return jsonify({
            "result":     label,
            "confidence": confidence,
            "proba_neg":  round(float(proba[0]) * 100, 2),
            "proba_pos":  round(float(proba[1]) * 100, 2),
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
