"use strict";

var View = require("./view");
var util = require("substance-util");
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

  this.start = function(options) {
    var $ = window.$;

    options = options || {};
    // First setup the top level view
    if (options.el) {
      this.el = options.el;
      this.$el = $(this.el);
    } else {
      // Defaults to body element
      this.$el = $('body');
      this.el = this.$el[0];
    }

    if (this.initialize) this.initialize();
    this.render();

    // Now the normal app lifecycle can begin
    // Because app state changes require the main view to be present
    // Triggers an initial app state change according to url hash fragment
    if (this.router) this.router.start();
  };

  // Switches the application state
  // --------
  // appState: a list of state objects

  var DEFAULT_SWITCH_OPTIONS = {
    updateRoute: true,
    replace: false
  };

  this.switchState = function(appState, options, cb) {
    var self = this;
    options = _.extend(DEFAULT_SWITCH_OPTIONS, options || {});

    // keep the old state for afterTransition-handler
    var oldAppState = this.getState();

    this.controller.__switchState__(appState, options, function(error) {
      if (error) {
        if (cb) {
          cb(error);
        } else {
          console.error(error.message);
          util.printStackTrace(error);
        }
        return;
      }
      if (options["updateRoute"]) {
        self.updateRoute(options);
      }

      if (self.afterTransition) {
        try {
          self.afterTransition(appState, oldAppState);
        } catch (err) {
          if (cb) {
            cb(err);
          } else {
            console.error(err.message);
            util.printStackTrace(err);
          }
          return;
        }
      }

      if (cb) cb(null);
    });
  };

  this.stateFromFragment = function(fragment) {
    function _createState(stateNames) {
      var state = [];
      for (var i = 0; i < stateNames.length; i++) {
        state.push({id: stateNames[i]});
      }
      return state;
    }

    var state;
    var params = fragment.split(";");

    var i, pair;
    var values = [];
    for (i=0; i<params.length; i++) {
      pair = params[i].split("=");
      var key = pair[0];
      var val = pair[1];
      if (!key || val === undefined) {
        continue;
      }
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
    if (!this.controller.state) return null;

    var appState = [];
    var controller = this.controller;
    while(controller) {
      appState.push(controller.state);
      controller = controller.childController;
    }
    return appState;
  };

  this.updateRoute = function(options) {
    if (!this.router) return;

    options = options || {};

    var appState = this.getState();
    var stateIds = [];
    var stateParams = [];
    for (var i = 0; i < appState.length; i++) {
      var s = appState[i];
      if (!s) continue;
      stateIds.push(s.id);
      for (var key in s) {
        var val = s[key];
        if (key === "id" || key === "__id__" || key === "options") {
          continue;
        }
        // Note: currently only String variables are allowed as state variables
        if (!_.isString(val)) {
          console.error("Only String state variables are allowed");
          continue;
        }
        stateParams.push(i+"."+key+"="+val);
      }
    }
    var stateString = "state="+stateIds.join(".") + ";" + stateParams.join(";");
    this.router.navigate(stateString, {trigger: false, replace: options.replace});
  };

  // Called by a sub controller when a sub-state has been changed
  this.stateChanged = function(controller, oldState, options) {
    if (options["updateRoute"]) {
      this.updateRoute(options);
    }
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
