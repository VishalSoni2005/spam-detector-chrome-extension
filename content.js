// content.js → Extracts text/email/message from the webpage.
// Dev: change this to your deployed URL (https://...) before publishing

const API_URL = "http://localhost:8000/predict";

let lastText = "";
let debounceTimer = null;
const DEBOUNCE_MS = 700;
const REQUEST_TIMEOUT_MS = 5000;

async function checkSpam(text) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const resp = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!resp.ok) {
      console.warn("Spam API responded with status:", resp.status);
      return;
    }

    const data = await resp.json();

    // Try a couple of common Gmail selectors (fallbacks)
    const container =
      document.querySelector(".ii.gt") || document.querySelector("div.a3s");
    if (container) {
      // use outline instead of border to avoid layout shift
      container.style.outline = `3px solid ${data.ui.color}`;
      container.title = `Prediction: ${data.prediction} (${data.confidence}%)`;
    }

    // Update stats in background/service worker
    try {
      chrome.runtime.sendMessage({
        type: "INCREMENT_STATS",
        scanned: 1,
        spam: data.prediction === "spam" ? 1 : 0,
      });
    } catch (e) {
      console.warn("Unable to send stats message:", e);
    }
  } catch (err) {
    if (err.name === "AbortError") {
      console.warn("Prediction request timed out");
    } else {
      console.error("Prediction error:", err);
    }
  }
}

// Observe Gmail DOM changes with debounce to avoid spammy requests
const observer = new MutationObserver(() => {
  if (debounceTimer) clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    const emailBody = document.querySelector(".ii.gt") || document.querySelector("div.a3s");
    if (!emailBody) return;

    const text = emailBody.innerText?.trim() || "";
    if (text.length < 20) return; // skip tiny content
    if (text === lastText) return; // avoid duplicates
    lastText = text;

    checkSpam(text);
  }, DEBOUNCE_MS);
});

observer.observe(document.body, { childList: true, subtree: true });

