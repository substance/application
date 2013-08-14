"use strict";

var util = require("substance-util");

// Substance.Application.ElementRenderer
// ==========================================================================
//
// This is just a simple helper that allows us to create DOM elements
// in a data-driven way

var ElementRenderer = function(elementSpec) {
  this.elementSpec = elementSpec;
  this.render();
};

Renderer.Prototype = function() {

  this.render = function() {

  };

};


// Setup prototype chain
Renderer.Prototype.prototype = util.Events;
Renderer.prototype = new Renderer.Prototype();

module.exports = ElementRenderer;