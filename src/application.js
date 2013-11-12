"use strict";

var View = require("./view");
var Router = require("./router");
var util = require("substance-util");
var _ = require("underscore");

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

    util.async.each({
      items: data,
      iterator: function(item, _cb) {
        if (!controller) {
          console.error("No controller available for state", path.join("."));
        }
        // record the state path for debugging
        path.push(item.state);

        console.log("Application.switchState(): switching contoller", path.join("."), "using", item);
        controller.switchState(item.state, item.data, function(err) {
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
            controller.initialize(null, null, function(err) {
              if (err) return cb(err);
              controller = controller.childController;
              _autoInitialize();
            });
          } else {
            cb(null);
          }
        };
        _autoInitialize();
      }
    }, cb);
  };
};

Application.Prototype.prototype = View.prototype;
Application.prototype = new Application.Prototype();

module.exports = Application;
