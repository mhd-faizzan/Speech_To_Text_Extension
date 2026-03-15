// VoiceFlow - background service worker
// When the toolbar icon is clicked, open app.html in a full tab.
// If a VoiceFlow tab is already open, just focus it instead of opening a duplicate.

chrome.action.onClicked.addListener(function () {
  var appUrl = chrome.runtime.getURL('app.html');

  chrome.tabs.query({}, function (tabs) {
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].url && tabs[i].url.indexOf('app.html') !== -1) {
        chrome.tabs.update(tabs[i].id, { active: true });
        chrome.windows.update(tabs[i].windowId, { focused: true });
        return;
      }
    }
    chrome.tabs.create({ url: appUrl });
  });
});
