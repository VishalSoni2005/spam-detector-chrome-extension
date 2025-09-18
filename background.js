// Background script to handle messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GET_STATS") {
    chrome.storage.local.get(
      ["messagesScanned", "spamDetected"],
      function (result) {
        sendResponse({
          scanned: result.messagesScanned || 0,
          spam: result.spamDetected || 0,
        });
      }
    );
    return true; // Will respond asynchronously
  }
});

// Initialize storage
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    messagesScanned: 0,
    spamDetected: 0,
  });
});
