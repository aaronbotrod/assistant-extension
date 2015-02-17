'use strict';

window.angular.module('AssistExtension')
  .service('webAnalytics', function($timeout, messenger) {
    //TODO: Make a configuration service
    var configuration = {
      pollingInterval: 10000
    };
    configuration.newSessionInterval = configuration.pollingInterval * 5;
    var analytics = {windows:{}, tabs:{}};

    function analyticsUpdate() {
      chrome.windows.getAll({populate:true}, function(windows){
        windows.forEach(function(win){
          win.tabs.forEach(function(tab) {
            checkin(win, tab);
          });
        });
        console.log(analytics);
      });
      $timeout(analyticsUpdate, configuration.pollingInterval);
    }
    messenger.subscribe('analytics.request', function() {
      messenger.publish('analytics.update', analytics);
    });
    function checkin(win, tab) {
      var entry = analytics.tabs[tab.url];
      //Find out if its the first time on the website
      if(!entry) {
        analytics.tabs[tab.url] = {
          tabData: tab,
          sessions:  [{
              timeOpen: 0,
              timeActive: 0,
              firstCheckin: Date.now(),
              lastCheckin: Date.now(),
              pollingInterval: configuration.pollingInterval
            }]
          };
        return;
      }

      //Find if its the same session
      var session = null;
      var latestSession = entry.sessions[entry.sessions.length-1];
      if(Date.now() - latestSession.lastCheckin < configuration.newSessionInterval && latestSession.pollingInterval === configuration.pollingInterval){
        session = latestSession;
      }
      //Updated session
      if(session) {
        var timeElapsed = Date.now() - session.lastCheckin;
        session.timeOpen += timeElapsed;
        if(win.focused && tab.active) {
          session.timeActive+=timeElapsed;
        }
        session.lastCheckin = Date.now();
        return;
      } else {
        //New session;
        session = {
          timeOpen: 0,
          timeActive: 0,
          firstCheckin: Date.now(),
          lastCheckin: Date.now(),
          pollingInterval: configuration.pollingInterval
        };
        entry.sessions.push(session);
        return;
      }
    }
    $timeout(analyticsUpdate, configuration.pollingInterval);
    return {};
  });