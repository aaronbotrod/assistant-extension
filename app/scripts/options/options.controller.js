'use strict';

window.angular.module('assistExtension',[]);
window.angular.module('assistExtension')
  .controller('OptionsCtr', function ($scope) {
    $scope.header = 'How may I assist you?';
    $scope.configuration = {
      name: 'work',
      domain:'http://facebook.com'
    };
    $scope.configurations = [];
    $scope.saveConfiguration = function(config) {
      $scope.configurations.push(window.angular.copy(config));
      console.log($scope.configurations);
      $scope.configuration.name = '';
      $scope.configuration.domain = '';
      console.log($scope.configurations);
    };
  });
