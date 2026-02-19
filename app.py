import os  # Halkan waa lagu saxay (i-du waa yar tahay)
import re
import joblib
import traceback
import numpy as np
import requests
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from bs4 import BeautifulSoup
from scipy.sparse import hstack

import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer

# ================= FLASK INIT =================
app = Flask(__name__)
CORS(app)

# --- NLTK DATA ---
try:
    nltk.download('punkt')
    nltk.download('stopwords')
    nltk.download('wordnet')
    nltk.download('omw-1.4')
except Exception as e:
    print(f"NLTK Error: {e}")

stop_words = set(stopwords.words("english"))
somali_stopwords = ["waa", "iyo", "in", "uu", "ay", "ayuu", "ka"]
stop_words.update(somali_stopwords)
lemmatizer = WordNetLemmatizer()

# ================= HELPERS (SAME AS TRAINING) =================
def preprocess_text(text):
    text = str(text).lower()
    text = re.sub(r"[^a-zA-Z ]", " ", text)
    tokens = word_tokenize(text)
    tokens = [lemmatizer.lemmatize(w) for w in tokens if w not in stop_words]
    return " ".join(tokens)

def is_extreme_claim(text):
    extreme_words = ["100 sano", "hal charge 6 bilood", "miracle", "cure"]
    return int(any(word in text for word in extreme_words))

def is_vague_source(text):
    vague_words = ["khubaro ayaa sheegay", "daraasad cusub ayaa sheegtay"]
    return int(any(word in text for word in vague_words))

# ================= LOAD MODELS =================
try:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    MODEL_PATH = os.path.join(BASE_DIR, "saved_model", "svm_high_confidence.pkl")
    VECTORIZER_PATH = os.path.join(BASE_DIR, "saved_model", "fake_real_TF_IDF_vectorizer.pkl")
    ENCODER_PATH = os.path.join(BASE_DIR, "saved_model", "fake_real_label_encoder.pkl")

    model = joblib.load(MODEL_PATH)
    tfidf = joblib.load(VECTORIZER_PATH)
    label_encoder = joblib.load(ENCODER_PATH)
    print("✅ Models loaded successfully!")
except Exception as e:
    print(f"❌ Error loading models: {e}")

# ================= ROUTES =================
@app.route("/")
def home():
    return jsonify({"status": "Online", "message": "API is running successfully!"})

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json(silent=True)
        if not data or "text" not in data:
            return jsonify({"error": "No text provided"}), 400
            
        content = data.get("text", "")
        clean_text = preprocess_text(content)
        X_tfidf = tfidf.transform([clean_text])
        
        ext = is_extreme_claim(clean_text)
        vag = is_vague_source(clean_text)
        
        extra_features = np.array([[ext, vag]])
        X_final = hstack([X_tfidf, extra_features])
        
        prediction = model.predict(X_final)[0]
        label = "REAL NEWS" if prediction == 1 else "FAKE NEWS"
        
        if hasattr(model, "decision_function"):
            score = model.decision_function(X_final)[0]
            confidence = round((1 / (1 + np.exp(-abs(score)))) * 100, 2)
        else:
            confidence = 100.0

        return jsonify({
            "prediction": label,
            "confidence": f"{confidence}%"
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# ================= RUN SERVER =================
if __name__ == "__main__":
    # Render wuxuu u baahan yahay Port 10000
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
