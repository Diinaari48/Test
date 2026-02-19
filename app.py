import os
import re
import joblib
import numpy as np
import nltk
from flask import Flask, request, jsonify
from flask_cors import CORS
from scipy.sparse import hstack
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer

# Soo dejiso xogta lagama maarmaanka ah isla marka uu app-ku kaco
try:
    nltk.download('punkt')
    nltk.download('punkt_tab')  # KANI WAA MUHIIM (Saxidda 502 Error)
    nltk.download('stopwords')
    nltk.download('wordnet')
except Exception as e:
    print(f"NLTK Download Error: {e}")

app = Flask(__name__)
CORS(app)

# Load Models
try:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    model = joblib.load(os.path.join(BASE_DIR, "saved_model", "svm_high_confidence.pkl"))
    tfidf = joblib.load(os.path.join(BASE_DIR, "saved_model", "fake_real_TF_IDF_vectorizer.pkl"))
    print("✅ Models loaded successfully!")
except Exception as e:
    print(f"❌ Error loading models: {e}")

@app.route("/")
def home():
    return jsonify({"status": "Online", "message": "API is running!"})

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        text = data.get("text", "")
        # Prediction logic halkan sii wad...
        return jsonify({"prediction": "REAL NEWS", "confidence": "90%"}) # Tusaale
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)

