// Content script to detect and process messages
(function () {
  "use strict";

  let model = null;
  let isModelLoaded = false;

  // Initialize extension
  function init() {
    console.log("Spam Detector extension loaded");

    // Load the ML model
    loadModel();

    // Observe DOM changes to detect new messages
    const observer = new MutationObserver(handleMutations);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Initial scan
    setTimeout(scanMessages, 3000);
  }

  // Load TensorFlow.js model
  async function loadModel() {
    try {
      // Load TensorFlow.js library
      await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.18.0");

      // Load your model
      model = await tf.loadLayersModel(
        chrome.runtime.getURL("tfjs_model/model.json")
      );
      isModelLoaded = true;
      console.log("ML model loaded successfully");
    } catch (error) {
      console.error("Error loading model:", error);
    }
  }

  // Load external script
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Handle DOM mutations
  function handleMutations(mutations) {
    if (!isModelLoaded) return;

    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length > 0) {
        scanMessages();
      }
    });
  }

  // Scan for messages
  function scanMessages() {
    if (!isModelLoaded) return;

    // Check if we're on Gmail
    if (window.location.hostname === "mail.google.com") {
      scanGmail();
    }

    // Check if we're on WhatsApp Web
    if (window.location.hostname === "web.whatsapp.com") {
      scanWhatsApp();
    }
  }

  // Scan Gmail messages
  function scanGmail() {
    const emailElements = document.querySelectorAll('[role="listitem"]');

    emailElements.forEach((element) => {
      const subjectElement = element.querySelector(
        "[data-legacy-thread-id] span"
      );
      const snippetElement = element.querySelector(".y2");

      if (subjectElement && snippetElement && !element.dataset.spamChecked) {
        const subject = subjectElement.textContent;
        const snippet = snippetElement.textContent;
        const text = subject + " " + snippet;

        // Process the text
        processText(text)
          .then((result) => {
            if (result.isSpam) {
              highlightSpam(element, result.confidence);
              updateStats(1, result.isSpam ? 1 : 0);
            }
          })
          .catch((error) => {
            console.error("Error processing text:", error);
          });

        element.dataset.spamChecked = "true";
      }
    });
  }

  // Scan WhatsApp messages
  function scanWhatsApp() {
    const messageElements = document.querySelectorAll(
      '[data-testid="conversation-panel-messages"] .message-in, [data-testid="conversation-panel-messages"] .message-out'
    );

    messageElements.forEach((element) => {
      const textElement = element.querySelector(".selectable-text");

      if (textElement && !element.dataset.spamChecked) {
        const text = textElement.textContent;

        // Process the text
        processText(text)
          .then((result) => {
            if (result.isSpam) {
              highlightSpam(element, result.confidence);
              updateStats(1, result.isSpam ? 1 : 0);
            }
          })
          .catch((error) => {
            console.error("Error processing text:", error);
          });

        element.dataset.spamChecked = "true";
      }
    });
  }

  // Process text using ML model
  async function processText(text) {
    try {
      // Preprocess the text (you'll need to implement the same preprocessing you used in training)
      const preprocessedText = preprocessText(text);

      // Convert to tensor and make prediction
      const inputTensor = tf.tensor2d([preprocessedText]);
      const prediction = model.predict(inputTensor);
      const confidence = prediction.dataSync()[0];

      return {
        isSpam: confidence > 0.5,
        confidence: confidence,
        text: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
      };
    } catch (error) {
      console.error("Error in processText:", error);
      throw error;
    }
  }

  // Preprocess text for ML model (implement the same preprocessing you used in training)
  function preprocessText(text) {
    // This is a placeholder - you need to implement the same preprocessing
    // you used when training your model

    // Example preprocessing steps:
    // 1. Convert to lowercase
    // 2. Remove special characters
    // 3. Tokenize
    // 4. Vectorize (using the same vectorizer you used in training)

    // For now, return a simple numeric representation
    return [text.length / 100, text.split(" ").length / 10];
  }

  // Highlight spam elements
  function highlightSpam(element, confidence) {
    element.style.borderLeft = "3px solid #ff0000";
    element.style.backgroundColor = "#fff0f0";

    // Add a warning badge
    const badge = document.createElement("div");
    badge.innerHTML = `⚠️ Possible spam (${Math.round(confidence * 100)}%)`;
    badge.style.color = "#ff0000";
    badge.style.fontSize = "10px";
    badge.style.padding = "2px 5px";
    badge.style.marginTop = "5px";
    badge.style.border = "1px solid #ff0000";
    badge.style.borderRadius = "3px";
    badge.style.display = "inline-block";

    element.appendChild(badge);
  }

  // Update statistics in storage
  function updateStats(scanned = 0, spam = 0) {
    chrome.storage.local.get(
      ["messagesScanned", "spamDetected"],
      function (result) {
        const currentScanned = (result.messagesScanned || 0) + scanned;
        const currentSpam = (result.spamDetected || 0) + spam;

        chrome.storage.local.set({
          messagesScanned: currentScanned,
          spamDetected: currentSpam,
        });
      }
    );
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "SCAN_NOW") {
    scanMessages();
    sendResponse({ status: "scanning" });
  }
  return true;
});
