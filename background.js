// Background script to handle messages
// background.js → Acts as a bridge, sends data to ML model.

// background.js (MV3 service worker)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GET_STATS") {
    chrome.storage.local.get(["messagesScanned", "spamDetected"], (result) => {
      sendResponse({
        scanned: result.messagesScanned || 0,
        spam: result.spamDetected || 0,
      });
    });
    return true; // asynchronous response
  }

  if (request.type === "INCREMENT_STATS") {
    const scannedInc = Number(request.scanned) || 0;
    const spamInc = Number(request.spam) || 0;

    chrome.storage.local.get(["messagesScanned", "spamDetected"], (result) => {
      const newScanned = (result.messagesScanned || 0) + scannedInc;
      const newSpam = (result.spamDetected || 0) + spamInc;

      chrome.storage.local.set({
        messagesScanned: newScanned,
        spamDetected: newSpam,
      });

      sendResponse({ messagesScanned: newScanned, spamDetected: newSpam });
    });
    return true;
  }
});

// initialize storage on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ messagesScanned: 0, spamDetected: 0 });
});

//!
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.type === "GET_STATS") {
//     chrome.storage.local.get(
//       ["messagesScanned", "spamDetected"],
//       function (result) {
//         sendResponse({
//           scanned: result.messagesScanned || 0,
//           spam: result.spamDetected || 0,
//         });
//       }
//     );
//     return true; // Will respond asynchronously
//   }
// });

// // Initialize storage
// chrome.runtime.onInstalled.addListener(() => {
//   chrome.storage.local.set({
//     messagesScanned: 0,
//     spamDetected: 0,
//   });
// });
