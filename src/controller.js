(function(root) { "use strict";

var Substance = root.Substance;
var _ = root._;
var util = Substance.util;


// Substance.Application.Controller
// ==========================================================================
//
// Application Controller abstraction suggesting strict MVC

var Controller = function(options) {

  // Either use the provided element or make up a new element
  this.$el = $('<div/>');
  this.el = this.$el[0];

  this._handlers = [];
};

// Setup prototype chain
Controller.prototype = util.Events;



// Handle a particular event
// ----------
//

Controller.prototype.handle = function(target, eventName, handler) {
  // Register binding for later disposal
  console.log('handling', eventName);
  target.on(eventName, handler, this);
  this._handlers.push([target, eventName, handler]);
};


// Unbind event handlers
// ----------
//

Controller.prototype.disposeHandlers = function() {
  _.each(this._handlers, function(h) {
    var target = h[0];
    var eventName= h[1];
    var handler = h[2];
    console.log('unbinding ', eventName);
    target.unbind(eventName, handler);
  });
};


Substance.Application.Controller = Controller;

})(this);
