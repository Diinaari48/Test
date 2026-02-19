import pandas as pd
import nltk
import re
import os
import joblib
import numpy as np
import matplotlib.pyplot as plt
from scipy.sparse import hstack

from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.svm import LinearSVC
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
from sklearn.preprocessing import LabelEncoder

# ======================================
# NLTK SETUP
# ======================================
nltk.download("punkt")
nltk.download("stopwords")
nltk.download("wordnet")
nltk.download('omw-1.4')

stop_words = set(stopwords.words("english"))
somali_stopwords = ["waa", "iyo", "in", "uu", "ay", "ayuu", "ka"]
stop_words.update(somali_stopwords)
lemmatizer = WordNetLemmatizer()

# ======================================
# TEXT PREPROCESSING
# ======================================
def preprocess_text(text):
    if not isinstance(text, str):
        return ""
    text = text.lower()
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

# ======================================
# LOAD DATASET
# ======================================
print("📂 Loading datasets...")
# Hubi in folder-ka Dataset uu jiro bannaanka
fake_path = "Dataset/Fake_news.csv"
real_path = "Dataset/Real_news.csv"

if not os.path.exists(fake_path) or not os.path.exists(real_path):
    print("❌ Dataset lama helin! Hubi folder-ka Dataset.")
    exit(1)

fake_df = pd.read_csv(fake_path)
real_df = pd.read_csv(real_path)

# ======================================
# PREPARE DATA
# ======================================
texts = pd.concat([fake_df["Text"], real_df["Text"]]).astype(str)
labels = [0] * len(fake_df) + [1] * len(real_df)

print("🧹 Preprocessing text...")
processed_texts = [preprocess_text(t) for t in texts]

# Features dheeri ah
extreme_flags = np.array([is_extreme_claim(t) for t in processed_texts]).reshape(-1, 1)
vague_flags = np.array([is_vague_source(t) for t in processed_texts]).reshape(-1, 1)

le = LabelEncoder()
y = le.fit_transform(labels)

# ======================================
# TF-IDF & HSTACK
# ======================================
tfidf = TfidfVectorizer(max_features=5000)
X_tfidf = tfidf.fit_transform(processed_texts)

# Isku dar qoraalka iyo features-ka kale
X_final = hstack([X_tfidf, extreme_flags, vague_flags])

# Split
X_train, X_test, y_train, y_test = train_test_split(X_final, y, test_size=0.2, random_state=42)

# ======================================
# TRAINING MODELS
# ======================================
models = {
    "Naive_Bayes": MultinomialNB(),
    "SVM": LinearSVC(max_iter=2000),
    "Logistic_Regression": LogisticRegression(max_iter=1000)
}

results = {}
os.makedirs("saved_model", exist_ok=True)

print("\n===== TRAINING RESULTS =====")
for name, model in models.items():
    model.fit(X_train, y_train)
    preds = model.predict(X_test)
    acc = accuracy_score(y_test, preds)
    results[name] = acc
    print(f"🔹 {name} Accuracy: {acc:.4f}")
    
    # Save each model
    joblib.dump(model, f"saved_model/{name.lower()}_model.pkl")

# ======================================
# SAVE BEST MODEL (SPECIFICALLY FOR APP.PY)
# ======================================
# SVM badanaa waa kan ugu fiican qoraalka
best_model = models["SVM"] 
joblib.dump(best_model, "saved_model/svm_high_confidence.pkl")
joblib.dump(tfidf, "saved_model/fake_real_TF_IDF_vectorizer.pkl")
joblib.dump(le, "saved_model/fake_real_label_encoder.pkl")

print("\n✅ DHAMAAN HAWLII WAA LA DHAMEEYSTIRAY")
print("🚀 Model-lada waxay ku jiraan folder-ka: saved_model/")
