'use strict';

window.angular.module('AssistExtension',['LocalStorageModule']);
window.angular.module('AssistExtension')
  .controller('BackgroundCtr', function ($scope, localStorageService) {
    $scope.header = 'How may I assist you?';
    $scope.config = {
      name: 'work',
      domain:'http://facebook.com'
    };
    
    $scope.configurationsUnbind = localStorageService.bind($scope, 'configurations', []);
    $scope.currentConfigurationUnbind = localStorageService.bind($scope, 'currentConfiguration', '');
    $scope.saveConfiguration = function(config) {
      $scope.configurations.push(window.angular.copy(config));
      console.log($scope.configurations);
      $scope.configuration.name = '';
      $scope.configuration.domain = '';
    };
    
    chrome.tabs.onUpdated.addListener(function(tabId, changedInfo){
      if(changedInfo.url) {
        var configurationsWithCurrSetting = window._.filter($scope.configurations, {name: $scope.currentConfiguration});
        var uri = new window.URI(changedInfo.url);
        window._.forEach(configurationsWithCurrSetting, function(configuration) {
          var configUri = window.URI(configuration.domain);
          console.log(uri.domain(), configUri.domain());
          if(uri.domain() === configUri.domain()) {
            chrome.tabs.update(tabId, {url:'http://www.youtube.com'});
          }
        });
      }
    });

  });

chrome.browserAction.onClicked.addListener(function() {
  console.log('Clicked icon');
  chrome.tabs.create({url:chrome.extension.getURL('background.html')});
});

chrome.tabs.onActivated.addListener(function(activeInfo) {
  console.log(activeInfo);
  chrome.tabs.get(activeInfo.tabId, function(tab) {
    console.log(tab);
  });
});