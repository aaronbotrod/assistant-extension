'use strict';

chrome.runtime.onInstalled.addListener(function (details) {
  console.log('previousVersion', details.previousVersion);
});

chrome.browserAction.setBadgeText({text: '\'Allo'});

console.log('\'Allo \'Allo! Event Page for Browser Action');
console.log(chrome.tabs.query({}, function(tabs){
  console.log(tabs);
  chrome.tabs.onUpdated.addListener(function(tabId, changedInfo){
      console.log(tabId, changedInfo);
  });
}));