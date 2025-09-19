document.addEventListener("DOMContentLoaded", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      function: getSelectedText,
    },
    async (injectionResults) => {
      let text = injectionResults[0].result;
      if (!text || text.trim().length === 0) {
        document.getElementById("result").innerText =
          "❌ No text selected in Gmail.";
        return;
      }

      try {
        const response = await fetch("http://localhost:8000/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text }),
        });

        const data = await response.json();

        const resultDiv = document.getElementById("result");
        resultDiv.className =
          "card " + (data.prediction === "spam" ? "spam" : "safe");
        resultDiv.innerHTML = `
        <h3>${data.ui.icon} ${data.prediction.toUpperCase()}</h3>
        <p>${data.ui.tag}</p>
        <p class="confidence">Confidence: ${data.confidence}%</p>
      `;
      } catch (err) {
        document.getElementById("result").innerText =
          "⚠️ Error connecting to API.";
        console.error("Fetch error:", err);
      }
    }
  );
});

function getSelectedText() {
  return window.getSelection().toString();
}

// document.addEventListener("DOMContentLoaded", function () {
//   const statusElement = document.getElementById("status");
//   const scannedCountElement = document.getElementById("scannedCount");
//   const spamCountElement = document.getElementById("spamCount");
//   const scanButton = document.getElementById("scanButton");
//   const optionsButton = document.getElementById("optionsButton");

//   // Get stats from storage
//   chrome.runtime.sendMessage({ type: "GET_STATS" }, function (response) {
//     if (response) {
//       scannedCountElement.textContent = response.scanned;
//       spamCountElement.textContent = response.spam;
//     }
//   });

//   // Check if we're on a supported page
//   chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
//     const url = tabs[0].url;
//     if (
//       url &&
//       (url.includes("mail.google.com") || url.includes("web.whatsapp.com"))
//     ) {
//       statusElement.textContent = "Active on this page";
//       statusElement.className = "status active";
//       scanButton.disabled = false;
//     } else {
//       statusElement.textContent = "Not available on this page";
//       statusElement.className = "status inactive";
//       scanButton.disabled = true;
//     }
//   });

//   // Scan button handler
//   scanButton.addEventListener("click", function () {
//     chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
//       chrome.tabs.sendMessage(tabs[0].id, { type: "SCAN_NOW" });
//     });
//     window.close(); // Close the popup
//   });

//   // Options button handler
//   optionsButton.addEventListener("click", function () {
//     chrome.runtime.openOptionsPage();
//   });
// });
