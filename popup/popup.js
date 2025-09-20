// popup.js
const API_URL = "http://localhost:8000/predict";
const REQUEST_TIMEOUT_MS = 5000;

document.addEventListener("DOMContentLoaded", async () => {
  const resultDiv = document.getElementById("result");
  resultDiv.innerText = "Loading...";

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab) {
      showError("No active tab found.");
      return;
    }

    // Get selected text from page context
    const injectionResults = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: getSelectedText,
    });

    const text = injectionResults?.[0]?.result || "";
    if (!text || text.trim().length === 0) {
      showError("❌ No text selected in Gmail.");
      return;
    }

    resultDiv.innerText = "Checking...";

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
      showError("API returned status " + resp.status);
      return;
    }

    const data = await resp.json();

    resultDiv.className =
      "card " + (data.prediction === "spam" ? "spam" : "safe");
    resultDiv.innerHTML = `
      <h3>${data.ui.icon} ${data.prediction.toUpperCase()}</h3>
      <p>${data.ui.tag}</p>
      <p class="confidence">Confidence: ${data.confidence}%</p>
      <pre class="probs">ham: ${formatProb(
        data.probabilities.ham
      )} | spam: ${formatProb(data.probabilities.spam)}</pre>
    `;

    // Update stats
    chrome.runtime.sendMessage({
      type: "INCREMENT_STATS",
      scanned: 1,
      spam: data.prediction === "spam" ? 1 : 0,
    });
  } catch (err) {
    if (err.name === "AbortError") showError("⚠️ Request timed out.");
    else {
      showError("⚠️ Error connecting to API.");
      console.error(err);
    }
  }
});

function getSelectedText() {
  return window.getSelection().toString();
}

function showError(msg) {
  const el = document.getElementById("result");
  el.className = "";
  el.innerText = msg;
}

function formatProb(p) {
  return (Number(p) * 100).toFixed(2) + "%";
}

//! second
// document.addEventListener("DOMContentLoaded", async () => {
//   const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

//   chrome.scripting.executeScript(
//     {
//       target: { tabId: tab.id },
//       function: getSelectedText,
//     },
//     async (injectionResults) => {
//       let text = injectionResults[0].result;
//       if (!text || text.trim().length === 0) {
//         document.getElementById("result").innerText =
//           "❌ No text selected in Gmail.";
//         return;
//       }

//       try {
//         const response = await fetch("http://localhost:8000/predict", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ message: text }),
//         });

//         const data = await response.json();

//         const resultDiv = document.getElementById("result");
//         resultDiv.className =
//           "card " + (data.prediction === "spam" ? "spam" : "safe");
//         resultDiv.innerHTML = `
//         <h3>${data.ui.icon} ${data.prediction.toUpperCase()}</h3>
//         <p>${data.ui.tag}</p>
//         <p class="confidence">Confidence: ${data.confidence}%</p>
//       `;
//       } catch (err) {
//         document.getElementById("result").innerText =
//           "⚠️ Error connecting to API.";
//         console.error("Fetch error:", err);
//       }
//     }
//   );
// });

// function getSelectedText() {
//   return window.getSelection().toString();
// }

// //! first
// // document.addEventListener("DOMContentLoaded", function () {
// //   const statusElement = document.getElementById("status");
// //   const scannedCountElement = document.getElementById("scannedCount");
// //   const spamCountElement = document.getElementById("spamCount");
// //   const scanButton = document.getElementById("scanButton");
// //   const optionsButton = document.getElementById("optionsButton");

// //   // Get stats from storage
// //   chrome.runtime.sendMessage({ type: "GET_STATS" }, function (response) {
// //     if (response) {
// //       scannedCountElement.textContent = response.scanned;
// //       spamCountElement.textContent = response.spam;
// //     }
// //   });

// //   // Check if we're on a supported page
// //   chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
// //     const url = tabs[0].url;
// //     if (
// //       url &&
// //       (url.includes("mail.google.com") || url.includes("web.whatsapp.com"))
// //     ) {
// //       statusElement.textContent = "Active on this page";
// //       statusElement.className = "status active";
// //       scanButton.disabled = false;
// //     } else {
// //       statusElement.textContent = "Not available on this page";
// //       statusElement.className = "status inactive";
// //       scanButton.disabled = true;
// //     }
// //   });

// //   // Scan button handler
// //   scanButton.addEventListener("click", function () {
// //     chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
// //       chrome.tabs.sendMessage(tabs[0].id, { type: "SCAN_NOW" });
// //     });
// //     window.close(); // Close the popup
// //   });

// //   // Options button handler
// //   optionsButton.addEventListener("click", function () {
// //     chrome.runtime.openOptionsPage();
// //   });
// // });
