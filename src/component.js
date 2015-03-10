"use strict";

var util = require("substance-util");
var _ = require("underscore");

// Substance.Application.Component
// ==========================================================================
//
// Application Component abstraction, inspired by React.js

var Component = function(props) {
  // Either use the provided element or make up a new element
  this.props = props;
  this.ref = props.ref || util.uuid();

  // Remember childcomponents (managed by this instance)
  this.childComponents = [];
};

Component.Prototype = function() {
	
	this.getId = function() {
		return this._mountPath.join(".");
	};

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
  };

  // Calls render and assigns to .el
  this._render = function() {

  };

};

Component.Prototype.prototype = util.Events;
Component.prototype = new Component.Prototype();

module.exports = Component;
