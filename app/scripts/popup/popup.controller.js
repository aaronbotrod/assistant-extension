'use strict';

window.angular.module('AssistExtension',[])
  .config(function($compileProvider){
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|chrome-extension):/);
  })
  .controller('PopupCtr',function($scope, $sce, messenger) {
    //Configurations
    $scope.header = 'How may I assist you?';
    $scope.config = {
      name: 'work',
      domain:'http://facebook.com'
    };
    $scope.options = chrome.extension.getURL('options.html');

    //Load Background Configurations

    messenger.subscribe('update', function(updatedProperties) {
      window._.merge($scope, updatedProperties, function(a, b) {
        return window._.isArray(a) ? b : undefined;
      });
      $scope.configNames = []
      $scope.configurations.forEach(function(config){
          $scope.configNames.push(config.name);
      });
      _.uniq($scope.configNames);
      $scope.$apply();
    });

    messenger.publish('init');

    $scope.$watch('newCurrentConfiguration', function(newVal) {
      chrome.runtime.sendMessage({currentConfiguration: newVal});
    });

    $scope.$watch('currentConfiguration', function() {
      $scope.activeConfigurations = window._.filter($scope.configurations, {name:$scope.currentConfiguration});
      console.log($scope.configurations, $scope.activeConfigurations);
    });

    //UI Functions
    $scope.getOptionsURL = function() {
      return $sce.trustAsUrl($scope.options);
    };

    $scope.updateConfiguration = function(newCurrentConfiguration) {
      console.log(newCurrentConfiguration);
      messenger.publish('update', {currentConfiguration: newCurrentConfiguration});
    }

    $scope.submitNewConfiguration = function($event) {
      if($event.keyCode === 13) {
        messenger.publish('update', {currentConfiguration: $scope.newCurrentConfiguration});
      }
    };


  });
