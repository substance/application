"use strict";

var util = require("substance-util");
var _ = require("underscore");

// Substance.Application.Controller
// ==========================================================================
//
// Application Controller abstraction suggesting strict MVC

var Controller = function() {

  // an object that has a method 'stateChanged()'
  this.changeListener = null;

  // the state is represented by a unique name
  this.state = null;

  // Each controller can have a single (active) child controller
  this.__childController__ = null;
};

Controller.Prototype = function() {

  // A built-in transition function for switching to an initial state
  // --------
  //

  this.intitialize = function(/*state, cb*/) {};

  // A built-in transition function which is the opposite to `initialize`
  // ----
  this.dispose = function() {
    if (this.__childController__) this.__childController__.dispose();
    this.__childController__ = null;
    this.state = null;
  };

  this.transition = function(newState, cb) {
    cb(null);
  };

  this.switchState = function(state, cb) {
    var self = this;
    cb = cb || function(err) {
      if (err) throw new Error(err);
    };
    this.__switchState__(state, function(error) {
      if (error) return cb(error);
      if (self.changeListener) self.changeListener.stateChanged();
      cb(null);
    });
  };

  this.__switchState__ = function(state, cb) {
    console.log("Controller.switchState", state);
    var self = this;

    cb = cb || function(err) {
      if (err) throw new Error(err);
    };

    if (!_.isArray(state)) {
      state = [state];
    }

    var _state = state.shift();

    var _afterTransition = function() {
      var oldState = self.state;
      self.state = _state;
      self.afterTransition(oldState);
      cb(null);
    };

    var _transition = function() {
      console.log("Transition to", _state);
      self.transition(_state, function(error) {
        if (error) return cb(error);

        // The transition has been done in this level, i.e., child controllers
        // might have been created.
        // If a child controller exists we recurse into the next level.
        // After that the controller gets triggered about the finished transition.

        if (self.childController) {
          if (state.length > 0) {
            self.childController.__switchState__(state, function(error) {
              if (error) return cb(error);
              _afterTransition();
            });
          }
          else if (self.childController.AUTO_INIT) {
            self.childController.initialize(null, function(error){
              if (error) return cb(error);
              _afterTransition();
            });
          }
          else {
            return cb("Unsufficient state data provided! Child controller needs a transition!");
          }
        }
        else {
          _afterTransition();
        }
      });
    };

    // If no transitions are given we still can use dispose/initialize
    // to reach the new state
    if (!this.state) {
      console.log("Initializing...", _state);
      this.initialize(_state, function(error) {
        if (error) return cb(error);
        self.state = {id: "initialized"};
        _transition();
      });
    } else {
      _transition();
    }
  };

  this.afterTransition = function() {};

  this.setChildController = function(childController) {
    if (this.__childController__ && this.__childController__.state) {
      console.error("The child controller has not been disposed. Call 'disposeChildController()' first. However, let me do this for you once more...");
      this.__childController__.dispose();
    }
    if (!childController) {
      return;
    }
    if (!this.changeListener) {
      // We need to establish a consistent connection between (Sub-)Controllers and the Application
      // instance to be able to notify the app about changes in the sub state
      // For now, I decided to propagate the application when sub-controllers are attached
      // to parent controllers.
      // This makes sense w.r.t the current mechanism of state transitions which
      // works from top to down. I.e., a parent controller is either the top-level controller
      // or itself a child of an already attached controller.
      // A global/singleton Application instance would be possible, however I reject introducing
      // such an evil thing. It breaks modularity and makes testing harder.
      // Alternatively one could require this to be given when constructing Controllers,
      // however, this would require to change all constructors.
      console.error("This controller does not have a changeListener attached, so the child controller will not trigger corresponding application state changes.");
    } else {
      childController.changeListener = this.changeListener;
    }
    this.__childController__ = childController;
  };

  this.disposeChildController = function() {
    if (this.__childController__) {
      this.__childController__.dispose();
      this.__childController__ = null;
    }
  };

  this.setChangeListener = function(changeListener) {
    this.changeListener = changeListener;
  };

};

Controller.Prototype.prototype = util.Events;
Controller.prototype = new Controller.Prototype();

Controller.State = function(id) {
  if (_.isString(id)) {
    this.__id__ = id;
  } else {
    var obj = arguments[0];
    this.__id__ = obj["id"];
    _.each(obj, function(val, key) {
      if (key === "id") return;
      this[key] = val;
    }, this);
  }
};

Object.defineProperty(Controller.State.prototype, "id", {
  set: function() {
    throw new Error("Property 'id' is immutable");
  },
  get: function() {
    return this.__id__;
  }
});

Object.defineProperty(Controller.prototype, "childController", {
  set: function(childController) {
    this.setChildController(childController);
  },
  get: function() {
    return this.__childController__;
  }
});

module.exports = Controller;
