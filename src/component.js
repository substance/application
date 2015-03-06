"use strict";

var util = require("substance-util");

// Substance.Application.Component
// ==========================================================================
//
// Application Component abstraction, inspired by React.js

var Component = function(props) {
  // Either use the provided element or make up a new element
  this.props = props;
  this.ref = props.ref || util.uuid();
};

Component.Prototype = function() {
	
	this.getDOMNode = function() {
		return this.el;
	};

	this.setState = function(state) {
		this.state = _.extend(this.state, state);

		// Triggers a re-render (but this is done on app level)
		this.app.updateComponent(this);
	};

  // Dispatching DOM events (like clicks)
  // ----------
  //

  this.render = function() {
    throw new Error("render method must be defined!");
  }

};

Component.Prototype.prototype = util.Events;
Component.prototype = new Component.Prototype();

module.exports = Component;
