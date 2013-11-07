"use strict";

var util = require("substance-util");
var _ = require("underscore");

// Substance.Application.Controller
// ==========================================================================
//
// Application Controller abstraction suggesting strict MVC

var Controller = function(options) {
  // the state is represented by a unique name
  this.state = null;

  // place to register child controllers
  this.children = {}

};

Controller.Prototype = function() {

  this.add = function(name, childController) {
    this.children[name] = childController;
    return childController;
  };

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
    throw new Error("This method is abstract");
  };

  // A built-in transition function which is the opposite to `initialize`
  // ----
  this.dispose = function() {
    var children = this.children;
    _.each(children, function(child) {
      child.dispose();
    });
    this.children = {};
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

  // Inrementally updates the controller state
  // -----------------
  //

  // this.modifyState = function(state) {
  //   var prevContext = this.state.context;
  //   _.extend(this.state, state);

  //   if (state.context && state.context !== prevContext) {
  //     this.trigger('context-changed', state.context);
  //   }

  //   this.trigger('state-changed', this.state.context);
  // };
};


// Setup prototype chain
Controller.Prototype.prototype = util.Events;
Controller.prototype = new Controller.Prototype();

module.exports = Controller;
