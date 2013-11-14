"use strict";

var View = require("./view");
//var util = require("substance-util");
var Controller = require("./controller");
var _ = require("underscore");

// Substance.Application
// ==========================================================================
//
// Application abstraction suggesting strict MVC

var Application = function(config) {
  View.call(this);
  this.config = config;

  this.__controller__ = null;
};

Application.Prototype = function() {

  this.setRouter = function(router) {
    this.router = router;
  };

  // Start Application
  // ----------
  //

  this.start = function() {
    // First setup the top level view
    this.$el = $('body');
    this.el = this.$el[0];
    this.render();

    // Now the normal app lifecycle can begin
    // Because app state changes require the main view to be present
    // Triggers an initial app state change according to url hash fragment
    if (this.router) this.router.start();
  };

  // Switches the application state
  // --------
  // appState: a list of state objects

  this.switchState = function(appState, cb) {
    cb = cb || function(error) {
      if (error) throw new Error(error);
    };
    this.controller.__switchState__(appState, cb);
  };

  this.extractStateFromURL = function(locationSearch) {
    var query = locationSearch.substring(1);

    function _createState(stateNames) {
      var state = [];
      for (var i = 0; i < stateNames.length; i++) {
        state.push({id: stateNames[i]});
      }
      return state;
    }

    var state;
    var params = query.split(";");

    var i, pair;
    var values = [];
    for (i=0; i<params.length; i++) {
      pair = params[i].split("=");
      var key = pair[0];
      var val = pair[1];
      if (key === "state") {
        var stateNames = val.split(".");
        state = _createState(stateNames);
      } else {
        pair = key.split(".");
        values.push({state: pair[0], key: pair[1], value: val});
      }
    }

    for (i=0; i<values.length; i++) {
      var item = values[i];
      var data = state[item.state];
      data[item.key] = item.value;
    }

    return state;
  };

  this.getState = function() {
    var appState = [];
    var controller = this.controller;
    while(controller) {
      appState.push(controller.state);
      controller = controller.childController;
    }
    return appState;
  };

  this.updateURL = function() {
    console.log("Application.updateURL()...");
    var appState = this.getState();
    var stateIds = [];
    var queryParams = [];
    for (var i = 0; i < appState.length; i++) {
      var s = appState[i];
      if (!s) continue;
      stateIds.push(s.id);
      for (var key in s) {
        var val = s[key];
        if (key === "id" || key === "__id__") {
          continue
        }
        // Note: currently only String variables are allowed as state variables
        if (!_.isString(val)) {
          console.error("Only String state variables are allowed");
          continue;
        }
        queryParams.push(i+"."+key+"="+val);
      }
    }

    queryParams.unshift("state="+stateIds.join("."));
    var queryString = "?" + queryParams.join(";");

    window.history.pushState(appState, "", "/"+queryString);
  };

  // Called by a sub controller when a sub-state has been changed
  this.stateChanged = function() {
    this.updateURL();
  };
};

Application.Prototype.prototype = View.prototype;
Application.prototype = new Application.Prototype();

Object.defineProperty(Application.prototype, "controller", {
  set: function(controller) {
    controller.setChangeListener(this);
    this.__controller__ = controller;
  },
  get: function() {
    return this.__controller__;
  }
});

module.exports = Application;
