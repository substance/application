(function(root) { "use strict";

var Substance = root.Substance;
var _ = root._;
var util = Substance.util;


// Substance.Application
// ==========================================================================
//
// Application abstraction suggesting strict MVC

var Application = function(options) {
  // Either use the provided element or make up a new element
  this.$el = $('<div/>');
  this.el = this.$el[0];
};


Application.Prototype = function() {

  // Start Application
  // ----------
  //

  this.start = function() {
    console.log('Substance is listening at ...');
  };

};

// Setup prototype chain


Application.Prototype.prototype = util.Events;
Application.prototype = new Application.Prototype();

Substance.Application = Application;

})(this);
