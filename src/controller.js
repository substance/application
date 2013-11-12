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

  this.switchState = function(newState, args) {

    // If no transitions are given we still can use dispose/initialize
    // to reach the new state
    if (!this.transitions[this.state]) {
      this.dispose();
      this.initialize(newState, args);
    } else {
      this.transitions[this.state].call(this, newState, args);
    }
  };

  // This should be used by subclasses only
  this.setState = function(name, data) {
    this.state = new Controller.State(name, data);
    // TODO: trigger an event about the state change
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
