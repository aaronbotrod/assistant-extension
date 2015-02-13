'use strict';
window.angular.module('AssistExtension',['LocalStorageModule', 'btford.socket-io'])
  .run(function ($rootScope, localStorageService, messenger) {
    $rootScope.header = 'How may I assist you?';

    $rootScope.configurationsUnbind = localStorageService.bind($rootScope, 'configurations', []);
    $rootScope.currentConfigurationUnbind = localStorageService.bind($rootScope, 'currentConfiguration', '');
    $rootScope.analyticsUnbind = localStorageService.bind($rootScope, 'analytics', {windows:{}, tabs:{}});

    $rootScope.saveConfiguration = function(config) {
      $rootScope.configurations.push(window.angular.copy(config));
      $rootScope.configuration.name = '';
      $rootScope.configuration.domain = '';
    };


    messenger.subscribe('init', function() {
      messenger.publish('update', {
        currentConfiguration: $rootScope.currentConfiguration,
        configurations: $rootScope.configurations
      });
    });

    messenger.subscribe('update', function(updatedProperties) {
      window._.merge($rootScope, updatedProperties, function(a, b) {
        return window._.isArray(a) ? b : undefined;
      });
      $rootScope.$apply();
    });

    // chrome.runtime.onMessage.addListener(function(message, sender, responseCb) {
    //   if(sender.url === window.location.href) {return;}
    //   if(message.currentConfiguration) {
    //     $rootScope.currentConfiguration = message.currentConfiguration;
    //   } else if (message.query) {
    //     var response = $rootScope[message.query];
    //     responseCb(response);
    //   } else if(message.configurations) {
    //     console.log(message);
    //     $rootScope.configurations = message.configurations;
    //     chrome.runtime.sendMessage({configurations: $rootScope.configurations});
    //   }
    //   $rootScope.$apply();
    // });
    $rootScope.$watch('currentConfiguration', function() {
      chrome.browserAction.setBadgeText({text: $rootScope.currentConfiguration});
    });
    

    function getUrlConfigurations(url, configs, currConfig) {
      var urlConfigurations =  window._.filter(configs, function(config){
        if(currConfig !== config.name) {return false;}
        var configUri = window.URI(config.domain);
        var currUri = window.URI(url);
        return configUri.domain() === currUri.domain();
      });
      return urlConfigurations;
    }
    function getTab(url, cb) {
      chrome.windows.getLastFocused({populate:true}, function(win){
        var tab = window._.find(win.tabs, function(tab){return tab.url === url && tab.active;});
        cb(tab);
      });
    }
    // chrome.tabs.onActivated.addListener(function() {
    //   recordSelected();
    // });
    // chrome.windows.onFocusChanged.addListener(function(){
    //   recordSelected();
    // });
    chrome.history.onVisited.addListener(function(histInfo){
      var urlConfigurations = getUrlConfigurations(histInfo.url, $rootScope.configurations, $rootScope.currentConfiguration);
      if(urlConfigurations.length){
        //TODO:From configurations determine which action to take
        getTab(histInfo.url, function(tab){
          if(tab) {
            // console.log({success: 'Tab with url['+histInfo.url+'] was found', tab: tab, hitsInfo: histInfo});
            var destinationUrl;
            console.log(urlConfigurations[0]);
            if(urlConfigurations[0].type === 'reroute') {
              destinationUrl = urlConfigurations[0].destination;
            } else {
              destinationUrl = chrome.extension.getURL('options.html')+'#/bookmarks/'+urlConfigurations[0].destination;
            }

            chrome.tabs.update(tab.id, {url:destinationUrl});
          } else {
            // console.log({error: 'No tab with url['+histInfo.url+'] cannot be found', tab: tab, hitsInfo: histInfo});
          }
        });
          
      }
    });
    $rootScope.activity = [];
    $rootScope.pollingInterval = 10000;

    // function analyticsUpdate() {
    //   chrome.windows.getAll({populate:true}, function(windows){
    //     console.log(windows);
    //     windows.forEach(function(win){
    //       win.tabs.forEach(function(tab) {
    //         if(!$rootScope.analytics.tabs[tab.url]) {
    //           $rootScope.analytics.tabs[tab.url] = tab;
    //           $rootScope.analytics.tabs[tab.url].time = $rootScope.pollingInterval;
    //         } else {
    //           $rootScope.analytics.tabs[tab.url].time += $rootScope.pollingInterval;
    //         }
    //       });
    //     });
    //   });
    //   $timeout(analyticsUpdate, $rootScope.pollingInterval);
    // }
    // $timeout(analyticsUpdate, $rootScope.pollingInterval);

  });

