// Background script to handle ML processing
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "CHECK_TEXT") {
    processText(request.text)
      .then((result) => {
        sendResponse(result);
      })
      .catch((error) => {
        console.error("Error processing text:", error);
        sendResponse({ isSpam: false, confidence: 0, error: error.message });
      });

    // Return true to indicate we'll send a response asynchronously
    return true;
  }
});

// Process text using ML model
async function processText(text) {
  try {
    // Load your ML model (implementation depends on your model format)
    // This is a placeholder - you'll need to adapt it to your specific model
    const model = await loadModel();
    const preprocessedText = preprocessText(text);
    const prediction = await model.predict(preprocessedText);

    return {
      isSpam: prediction.isSpam,
      confidence: prediction.confidence,
      text: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
    };
  } catch (error) {
    console.error("Error in processText:", error);
    throw error;
  }
}

// Load your ML model
async function loadModel() {
  // This will vary based on your model format (TensorFlow.js, ONNX, etc.)
  // Placeholder implementation
  return {
    predict: async (text) => {
      // Replace with your actual model prediction logic
      // This is a mock implementation
      const spamKeywords = [
        "win",
        "free",
        "prize",
        "lottery",
        "offer",
        "limited",
        "cash",
        "money",
      ];
      const matches = spamKeywords.filter((keyword) =>
        text.toLowerCase().includes(keyword)
      ).length;

      const spamScore = Math.min(0.2 + matches * 0.15, 0.95);

      return {
        isSpam: spamScore > 0.5,
        confidence: spamScore,
      };
    },
  };
}

// Preprocess text for ML model
function preprocessText(text) {
  // Implement text preprocessing as required by your model
  return text.toLowerCase().trim();
}
