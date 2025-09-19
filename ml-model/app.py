from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from pydantic import BaseModel
import joblib

# Load the saved pipeline (TF-IDF + model)
model = joblib.load("./sms_spam_classifier.pkl")

# Initialize FastAPI
app = FastAPI(title="SMS Spam Classifier API")

# Allow Chrome Extension + Gmail to call API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for dev, allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # allow all HTTP methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],  # allow all headers
)
# Define request body
class SMSRequest(BaseModel):
    message: str

@app.get("/")
def home():
    return {"message": "Welcome to the SMS Spam Classifier API 🚀"}

# @app.post("/predict")
# def predict(req: SMSRequest):
#     # Predict using the pipeline
#     prediction = model.predict([req.message])[0]
#     label = "spam" if prediction == 1 else "ham"
#     return {"input": req.message, "prediction": label}

@app.post("/predict")
def predict(req: SMSRequest):
    # Get probabilities
    probs = model.predict_proba([req.message])[0]
    spam_prob = float(probs[1])  # Probability of spam
    ham_prob = float(probs[0])

    prediction = "spam" if spam_prob > 0.5 else "ham"

    return {
        "input": req.message,
        "prediction": prediction,
        "confidence": round(max(spam_prob, ham_prob) * 100, 2),
        "probabilities": {"ham": ham_prob, "spam": spam_prob},
        "ui": {
            "color": "red" if prediction == "spam" else "green",
            "icon": "⚠️" if prediction == "spam" else "✅",
            "tag": "Suspicious" if prediction == "spam" else "Safe"
        }
    }
