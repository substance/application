(function(root) { "use strict";

var Substance = root.Substance;
var _ = root._;
var util = Substance.util;


// Substance.Application.Controller
// ==========================================================================
//
// Application Controller abstraction suggesting strict MVC

var Controller = function(options) {

};

Controller.Prototype = function() {

  // Finalize state transition
  // -----------------
  //
  // Editor View listens on state-changed events:
  //
  // E.g. this.listenTo(this, 'state-changed:comments', this.toggleComments);

  this.updateState = function(state) {
    var oldState = this.state;
    this.state = state;
    this.trigger('state-changed', this.state, oldState);
  };
};


// Setup prototype chain
Controller.Prototype.prototype = util.Events;
Controller.prototype = new Controller.Prototype();

Substance.Application.Controller = Controller;

})(this);
