(function(root) { "use strict";

var Substance = root.Substance;
var _ = root._;
var util = Substance.util;


// Substance.Application
// ==========================================================================
//
// Application Controller abstraction suggesting strict MVC

var Application = function(options) {

  // Either use the provided element or make up a new element
  this.$el = $('<div/>');
  this.el = this.$el[0];

  this._handlers = [];
};

// Setup prototype chain
Application.prototype = util.Events;



// Handle a particular event
// ----------
//

Application.prototype.start = function() {
  console.log('Substance is listening at ...');
};




Substance.Application = Application;

})(this);
