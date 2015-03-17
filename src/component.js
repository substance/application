"use strict";

var util = require("substance-util");
var _ = require("underscore");
var $$ = require("./element").create;

// Substance.Application.Component
// ==========================================================================
//
// Application Component abstraction, inspired by React.js

var Component = function(props) {
  // Either use the provided element or make up a new element
  this.props = props || {};
  this.id = this.props.ref || util.uuid();

  // Should exist in addition to id, so components or dom elements can be referenced more easily
  // e.g. in event handlers you can use `this.refs.inputForm`.
  this.ref = this.props.ref || util.uuid();

  // Default is uninitialized state
  this.state = {
    "id": "uninitialized"
  };

  // Remember childcomponents (managed by this instance)
  this.childComponents = [];
};

Component.Prototype = function() {

  this.isInitialized = function() {
    return this.state.id !== "uninitialized";
  };

	this.getId = function() {
		return this._mountPath.join(".");
	};

	this.getDOMNode = function() {
		return this.el;
	};

  // Component gets initialized
  // important for async case
  // to transition from uninitialized state to initial state
  this.initialize = function(cb) {
    if (this.getInitialState) {
      // Set initial state, which is an async operation, component gets re-rendered
      // after everything is there

      // Hack, ensure we make initial state transition after component has been injected
      // into the DOM
      // _.delay(function() {
      this.setState(this.getInitialState(), {updateRoute: false, replace: false}, cb);
      // }, 500);
    } else {
      this.setState({id: "initialized"}, {updateRoute: false, replace: false}, cb);
    }
  };

	// Rendering
	// ------------

	// Mount component to DOM element
	// This is done each time after render by Application instance
	this.mount = function(app, domEl) {
		this.app = app;
		this.el = domEl;
		
		this.el.setAttribute("data-comp-id", this.getId());
    // Event handlers need to be attached again, which should be done by user in 
    // this.componentDidMount
    // This is a bit nasty, actually a component shouldn't be mounted multiple times
    // in the life cycle
    // Maybe we need a declarative approach for dom events and use event delegation
    // on the app level
    if (this.componentDidMount) {
      this.componentDidMount();
    }
	};

	// State transition
  // ----
  // 
  // A typical transition implementation consists of 3 blocks:
  //
  // 1. Reflexive transitions (idem-potent checks):
  //    You have to check if a transition is actually necessary.
  //    If not call `cb(null, {skip: true})`
  //
  // 2. Disposal
  //    Clean up anything left from the old state
  //
  // 3. New state
  //    Create anything necessary for the new state
  //
  // Note: to provide additional run-time information you can access
  //       the options with `newState.options`
  //       However, when the state is loaded e.g. from the URL
  //       this information is not available.

  this.transition = function(oldState, newState, cb) {
    cb(null);
  };


	this.afterTransition = function() {
		// Triggers a re-render (but this is done on app level)
		this.app.updateComponent(this);
	};


  // User sets a new component state
  // ----------
  //

	this.setState = function(state, options, cb) {
    if (!cb && _.isFunction(options)) cb = options;
    var self = this;

    if (arguments.length === 1 && _.isFunction(options)) {
      cb = options;
      options = {};
    }

    options = options || {updateRoute: true, replace: false};

    cb = cb || function(err) {
      if (err) {
        console.error("Error during switch state", state, options);
        util.printStackTrace(err);
        throw new Error(err);
      }
    };

    var oldState = this.state;
    this.__setState__(state, options, function(err) {
      if (err) return cb(err);
      // if (self.changeListener) self.changeListener.stateChanged(this, oldState, options);
      cb(null);
    });
  };


	this.__setState__ = function(state, options, cb) {
    var self = this;

    cb = cb || function(err) {
      if (err) throw new Error(err);
    };

    // Note: adding the options here to allow to provide custom dynamic data.
    //       However, you should use that rarely, as dynamic state information
    //       is not serialized. E.g., when loading the state from URL this information
    //       will not be available.
    state.options = options || {};

    var _skipped;
    var oldState = self.state;

    var _afterTransition = function() {
      if (!_skipped) {
        // var oldState = self.state;
        self.state = state;
        self.afterTransition(oldState, state);
        // clear the options as they should only be valid during transition
        self.state.options = {};
      }
      cb(null);
    };

    var _transition = function() {
      try {
        self.transition(oldState, state, function(err, options) {
          if (err) return cb(err);

          if (options) {
            _skipped = options.skip;
          }
          _afterTransition();
        });
      } catch (err) {
        cb(err);
      }
    };

    _transition();
  };

  // Render
  // ----------
  //
  // Returns an abstract Element tree, which can contain subcomponents
  // It's constructed using the element constructor $$
  // 
  // For example:
  // 
  // this.render = function() {
  // 	$$('div', {className: "locations"},
  // 		$$(Locations, {locations: ["loc1", "loc2"]})
  // 	)
  // };

  this.renderUninitialized = function() {
    return $$('div', {className: 'loading'});
  };

  this.render = function() {
    throw new Error("render method must be defined!");
  };

};

Component.Prototype.prototype = util.Events;
Component.prototype = new Component.Prototype();

module.exports = Component;
