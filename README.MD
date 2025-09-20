# Gmail Spam Detector Chrome Extension

A Chrome extension that detects spam emails in Gmail using a machine learning model and provides real-time visual feedback in the Gmail interface.

---

## Project Overview

This project is a Gmail spam detection tool built as a Chrome extension. It captures email content, sends it to a FastAPI backend powered by a trained Logistic Regression model, and visually indicates whether an email is spam or safe. Users can also manually check selected text using the extension popup.

---

## Features

- Real-time spam detection in Gmail inbox.
- Visual indicators: red border for spam, green border for safe emails.
- Popup interface for manual text checking.
- Tracks statistics such as scanned email count and spam count.
- Machine learning powered: uses TF-IDF vectorization and Logistic Regression model (`sms_spam_classifier.pkl`).

---

## How It Works

1. **User opens Gmail**  
   - `content.js` injects scripts into Gmail's DOM.

2. **Email text is captured**  
   - Extracts the body content using Gmail selectors (`.ii.gt`).

3. **Send to ML backend**  
   - Text is sent via `fetch()` to the FastAPI backend (`http://localhost:8000/predict`).

4. **Backend processing (FastAPI + ML)**  
   - Loads the trained model (`sms_spam_classifier.pkl`).  
   - Vectorizes text using TF-IDF.  
   - Logistic Regression predicts spam or ham.  
   - Returns JSON response with prediction, probability, and UI hints (icon, color, tag).

5. **Update Gmail UI**  
   - `content.js` adds border colors: red for spam, green for safe emails.

6. **Popup interface (`popup.js`)**  
   - Users can select text, send it to the backend, and view results with confidence score and icon.

7. **Background script (`background.js`)**  
   - Manages extension state, such as scanned emails and spam count.

8. **Manifest (`manifest.json`)**  
   - Defines the Chrome extension structure, permissions, and script connections.

---

