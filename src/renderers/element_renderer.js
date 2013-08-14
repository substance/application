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

ElementRenderer.Prototype = function() {

  this.render = function() {

  };

};


// Setup prototype chain
ElementRenderer.Prototype.prototype = util.Events;
ElementRenderer.prototype = new ElementRenderer.Prototype();

module.exports = ElementRenderer;