"use strict";

var View = require("./view");
var util = require("substance-util");
var Controller = require("./controller");

// Substance.Application
// ==========================================================================
//
// Application abstraction suggesting strict MVC

var Application = function(config) {
  View.call(this);
  this.config = config;
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
  // data: a list of {state: String, data: Object}

  this.switchState = function(data, cb) {

    cb = cb || function(err) {
      if (err) console.error(err);
    };

    // TODO: currently Application does not have a controller.
    var controller = this.controller;
    var path = [];

    // Note: currently `Controller.switchState` calls `Controller.afterTransition`
    // if a transition has been done.
    // It might be desirable that we want to trigger these `afterTransition` not instantly
    // after a transition has been done on one level, but after the whole application state transition
    // has been done.
    util.async.each({
      items: data,
      iterator: function(item, _cb) {
        if (!controller) {
          console.error("No controller available for state", path.join("."));
        }
        // record the state path for debugging
        path.push(item.id);

        console.log("Application.switchState(): switching contoller", path.join("."), "using", item);
        controller.switchState(new Controller.State(item), function(err) {
          if (err) return _cb(err);
          controller = controller.childController;
          _cb(null);
        });
      },
      finally: function(err) {
        if (err) return cb(err);

        // TODO: this needs a bit of a better idea
        // there might be uninitialized child controllers, which do not have an explicit state
        function _autoInitialize() {
          if (controller && controller.AUTO_INIT) {
            controller.initialize(null, function(err) {
              if (err) return cb(err);
              controller = controller.childController;
              _autoInitialize();
            });
          } else {
            cb(null);
          }
        }
        _autoInitialize();
      }
    }, cb);
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

};

Application.Prototype.prototype = View.prototype;
Application.prototype = new Application.Prototype();

module.exports = Application;
