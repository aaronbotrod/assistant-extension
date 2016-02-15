'use strict';

var app = window.angular.module('AssistExtension',['ngRoute']);
app.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'templates/options.html',
        controller: 'OptionsCtr'
      })
      .when('/analytics',{
        templateUrl:'templates/analytics.html',
        controller: 'AnalyticsCtr'
      })
      .when('/bookmarks/:bookmarkName', {
        templateUrl: 'templates/bookmarks.html',
        controller: 'BookmarksCtr'
      });
  }]);
app.controller('BookmarksCtr', function ($rootScope, $scope, $routeParams) {
    $rootScope.title = $routeParams.bookmarkName;
    chrome.bookmarks.getTree(function(b){console.log(b);});
    chrome.bookmarks.search({title:$routeParams.bookmarkName}, function(bookmarkTree){
      var folderId = bookmarkTree[0].id;
      chrome.bookmarks.getSubTree(folderId, function(folder) {
        $scope.bookmarks = folder[0].children;
        $scope.$apply();
      });
    });
  });

app.controller('AnalyticsCtr', function ($scope, $routeParams, messenger) {
  messenger.subscribe('analytics.update', function(analytics) {
    $scope.analytics = analytics;
    $scope.$apply();
  });
  messenger.publish('analytics.request', {});
});
app.controller('OptionsCtr', function ($rootScope, $scope, $location, messenger) {
    $rootScope.title = 'Options';
    $scope.header = 'How may I assist you?';
    $scope.config = {
      name: '',
      domain:'',
      destination: '',
      type: 'reroute'
    };

    messenger.subscribe('update', function(updatedProperties) {
      window._.merge($scope, updatedProperties, function(a, b) {
        return window._.isArray(a) ? b : undefined;
      });
      console.log(updatedProperties);
      $scope.$apply();
    });

    messenger.publish('init');

    $scope.types = ['reroute', 'bookmarks', 'application'];
    $scope.configurations = [];
    $scope.saveConfigurations = function(config) {
      $scope.configurations.push(config);
      messenger.publish('update', {configurations: $scope.configurations});
    };

    $scope.getDestinationText = function() {
      if($scope.config.type === 'reroute') {
        return 'Destination domain ex. http://www.youtube.com';
      } else {
        return 'Bookmark Folder Name ex. "Bookmarks Bar"';
      }
    };

    $scope.removeConfiguration = function($index) {
      $scope.configurations.splice($index, 1);
      messenger.publish('update', {configurations: $scope.configurations});
    };

    $scope.killProcess = function(process) {
      var res = window.confirm('Are you sure you want to kill process '+process.cmd);
      if(res === true) {
        messenger.publish('process:kill', process);
      }
    };
  });
