"use strict";

var util = require("substance-util");
//var _ = require("underscore");

// Substance.Application.Controller
// ==========================================================================
//
// Application Controller abstraction suggesting strict MVC

var Controller = function() {
  // the state is represented by a unique name
  this.state = null;

  // Each controller can have a single (active) child controller
  this.childController = null;
};

Controller.Prototype = function() {

  // A built-in transition function for switching to an initial state
  // --------
  //

  this.intitialize = function(/*state, cb*/) {};

  // A built-in transition function which is the opposite to `initialize`
  // ----
  this.dispose = function() {
    if (this.childController) this.childController.dispose();
    this.childController = null;
    this.state = null;
  };

  this.switchState = function(newState, cb) {
    var self = this;

    var _transition = function() {
      self.transition(newState, function(error, skipped) {
        if (error) return cb(error);
        if (!skipped) {
          self.state = newState;
          self.afterTransition();
        }
        cb(null);
      });
    };

    // If no transitions are given we still can use dispose/initialize
    // to reach the new state
    if (!this.state) {
      this.initialize(newState, function(error) {
        if (error) return cb(error);
        self.state = new Controller.State("initialized");
        _transition();
      });
    } else {
      _transition();
    }
  };

  this.afterTransition = function() {};

};

Controller.State = function(name, data) {
  this.name = name;
  this.data = data;
};


// Setup prototype chain
Controller.Prototype.prototype = util.Events;
Controller.prototype = new Controller.Prototype();

module.exports = Controller;
