# app.py
import os
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MODEL_PATH = os.getenv("MODEL_PATH", "./sms_spam_classifier.pkl")
MODEL_PATH = './sms_spam_classifier.pkl'
try:
    model = joblib.load(MODEL_PATH)
    logger.info("Loaded model from %s", MODEL_PATH)
except Exception as e:
    logger.exception("Failed to load model:")
    model = None

app = FastAPI(title="SMS Spam Classifier API")

# DEV: using allow_origins=["*"] is fine for development.
# PRODUCTION: restrict to your domain(s) and extension origin (e.g. "chrome-extension://<EXT_ID>")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SMSRequest(BaseModel):
    message: str


@app.get("/")
async def home():
    return {"message": "Welcome to the SMS Spam Classifier API 🚀"}

@app.post("/predict")
async def predict(req: SMSRequest):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not available")

    text = req.message.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Empty message")

    try:
        # If model supports predict_proba, prefer that for a confidence score
        if hasattr(model, "predict_proba"):
            probs = model.predict_proba([text])[0]
            ham_prob = float(probs[0])
            spam_prob = float(probs[1])
            prediction = "spam" if spam_prob > ham_prob else "ham"
            confidence = max(ham_prob, spam_prob)
        else:
            # fallback: use predict and give 100% confidence (not ideal, but safe)
            pred = model.predict([text])[0]
            # if your original training used numeric labels (1/0), map accordingly
            prediction = "spam" if pred == 1 or str(pred).lower() == "spam" else "ham"
            confidence = 1.0
            # make up probabilities sensibly
            ham_prob = 1.0 - confidence if prediction == "spam" else confidence
            spam_prob = confidence if prediction == "spam" else 1.0 - confidence

        return {
            "input": text,
            "prediction": prediction,
            "confidence": round(confidence * 100, 2),
            "probabilities": {"ham": ham_prob, "spam": spam_prob},
            "ui": {
                "color": "red" if prediction == "spam" else "green",
                "icon": "⚠️" if prediction == "spam" else "✅",
                "tag": "Suspicious" if prediction == "spam" else "Safe",
            },
        }
    except Exception as e:
        logger.exception("Prediction failed")
        raise HTTPException(status_code=500, detail="Prediction error")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
