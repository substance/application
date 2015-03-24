"use strict";

var util = require("substance-util");
var _ = require("underscore");
var $$ = require("./element").create;

// Substance.Application.Component
// ==========================================================================
//
// Application Component abstraction, inspired by React.js

var Component = function() {
  this.props = undefined;

  // Default is the empty state
  this.state = {};

  // Holds references to local elements / components
  this.refs = {};

  // Remember childcomponents (managed by this instance)
  this.childComponents = [];
};

Component.Prototype = function() {

  this.getId = function() {
    return this._mountPath.join(".");
  };

  this.setProps = function(props) {
    // Either use the provided element or make up a new element
    // this.props = props || {};
    this.id = props.id || util.uuid();

    // Check if there's a dirty checker
    if (this.props && this.shouldComponentUpdate) {
      this._dirty = this.shouldComponentUpdate(props, this.state);
    } else {
      this._dirty = true;
    }
    
    this.props = props;
  };

  this.getDOMNode = function() {
    return this.el;
  };

  // Default initial state is the empty state
  this.getInitialState = function() {
    return {};
  };

  // Rendering
  // ------------

  // Mount component to DOM element
  // This is done each time after the initial render
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

    this.app.bindEvents(this);

    if (this.componentDidMount) {
      this.componentDidMount();
    }
    if (this.componentDidRender) {
      this.componentDidRender();
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

  // Only relevant for state transitions
  this.afterTransition = function(prevState) {
    // TODO we need to make sure this is called when prevState is still there
    // move this check somewhere before this.state is assigned with nextState;

    // if (this.shouldComponentUpdate) {
    //   this._dirty = this.shouldComponentUpdate(this.props, this.state);
    //   // console.log('dirty', this.id, this._dirty);
    // } else {
    //   this._dirty = true;
    // }
    this._dirty = true;

    if (this._dirty) {
      if (this.componentWillUpdate) {
        this.componentWillUpdate(this.props, this.state);
      }
      // Triggers a re-render (but this is done on app level)
      this.app.updateComponent(this);      
    }
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

    // update route etc. is no longer needed
    options = options || {updateRoute: true, replace: false};

    cb = cb || function(err) {
      if (err) {
        console.error("Error during setState", state, options);
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
        var prevState = self.state;
        self.state = state;

        // clear the options as they should only be valid during transition
        delete self.state.options;

        self.afterTransition(prevState);

        // Notify app about state change change
        self.app.onStateChanged(self, prevState);
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
  //  $$('div', {className: "locations"},
  //    $$(Locations, {locations: ["loc1", "loc2"]})
  //  )
  // };

  this.render = function() {
    throw new Error("render method must be defined!");
  };

  // Explicit rerender requested by the app
  this.rerender = function () {
    console.log('TODO: Component.rerender is legacy API! Use Component.setState to trigger a rerender');
    this._dirty = true;
    this.app.updateComponent(this);
  };

};

Component.Prototype.prototype = util.Events;
Component.prototype = new Component.Prototype();

module.exports = Component;
