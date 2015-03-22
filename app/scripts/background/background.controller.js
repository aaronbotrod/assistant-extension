'use strict';
window.angular.module('AssistExtension',['LocalStorageModule', 'btford.socket-io'])
  .run(function ($rootScope, localStorageService, messenger, webAnalytics, socketService) {
    $rootScope.analytics = webAnalytics;
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
      socketService.socket.emit('process:get', '/Applications/');
      messenger.publish('update', {
        currentConfiguration: $rootScope.currentConfiguration,
        configurations: $rootScope.configurations,
        processes: $rootScope.processes
      });
    });

    messenger.subscribe('update', function(updatedProperties) {
      window._.merge($rootScope, updatedProperties, function(a, b) {
        return window._.isArray(a) ? b : undefined;
      });
      console.log(updatedProperties);
      $rootScope.$apply();
    });

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
    
    function getProcessesToKill(processes, configs, currConfig) {
      var apps = [];
      processes.forEach(function(process){
        configs.forEach(function(config) {
          if(config.name === currConfig && config.type === 'application') {
            if(process.cmd.indexOf(config.application) !== -1 ) {
              apps.push(process);
            }
          }
        });
      });
      return apps;
    }
    function getTab(url, cb) {
      chrome.windows.getLastFocused({populate:true}, function(win){
        var tab = window._.find(win.tabs, function(tab){return tab.url === url && tab.active;});
        cb(tab);
      });
    }

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

    socketService.socket.on('process:list',function(processes) {
      var processesToKill = getProcessesToKill(processes, $rootScope.configurations, $rootScope.currentConfiguration);
      if(processesToKill.length){
        processesToKill.forEach(function(process) {
          messenger.publish('process:kill', process);
        });
        
      }
      messenger.publish('update', {processes: processes});
    });

    messenger.subscribe('process:kill', function(process) {
      console.log(process);
      socketService.socket.emit('process:kill', {pid: process.pid});
    });
  });

