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

  // A table to register transition functions
  // --------
  // Note: this is part of the Prototype
  //       However, when you derive a Controller make sure to create a copy
  //
  //       this.transitions = _.extend({}, __super__.transitions);

  this.transitions = {};

  // A built-in transition function for switching to an initial state
  // --------
  //

  this.intitialize = function(state, args) {
    throw new Error("Called abstract method 'initialize(",state, args, ") on ", this);
  };

  // A built-in transition function which is the opposite to `initialize`
  // ----
  this.dispose = function() {
    if (this.childController) this.childController.dispose();
    this.childController = null;
    this.state = null;
  };

  this.switchState = function(newState, args, cb) {

    // If no transitions are given we still can use dispose/initialize
    // to reach the new state
    if (!this.state) {
      this.initialize(newState, args, cb);
    } else {
      var state = this.state.name;
      if (!this.transitions[state]) {
        this.dispose();
        this.initialize(newState, args, cb);
      } else {
        this.transitions[state].call(this, newState, args, cb);
      }
    }
  };

  // should be used by subclasses only
  this.setState = function(name, data) {
    this.state = new Controller.State(name, data);
  };
};

Controller.State = function(name, data) {
  this.name = name;
  this.data = data;
};


// Setup prototype chain
Controller.Prototype.prototype = util.Events;
Controller.prototype = new Controller.Prototype();

module.exports = Controller;
