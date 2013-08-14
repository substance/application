"use strict";

var util = require("substance-util");

// Substance.Application.ElementRenderer
// ==========================================================================
//
// This is just a simple helper that allows us to create DOM elements
// in a data-driven way

var ElementRenderer = function(elementSpec) {
  this.elementSpec = elementSpec;

  // Pull out preserved properties
  // --------

  this.tagName = elementSpec.tag;  
  this.children = elementSpec.children || [];
  this.text = elementSpec.text || "";
  delete elementSpec.children;
  delete elementSpec.text;

  return this.render();
};


ElementRenderer.Prototype = function() {

  // After construction find elements based on a DOM Selector
  // --------

  this.find = function(selector) {
    return this.el.querySelectorAll(selector);
  };

  // Do the actual rendering
  // --------

  this.render = function() {
    var el = document.createElement(this.tagName);
    el.textContent = this.text;

    // Set attributes based on element spec
    for(var attrName in this.elementSpec) {
      var val = this.elementSpec[attrName];
      el.setAttribute(attrName, val);
    }

    // Append childs
    for (var i=0; i<this.children.length; i++) {
      var child = this.children[i];
      el.appendChild(child);
    }

    // Remember element
    // Probably we should ditch this
    this.el = el;
    return el;
  };

};


// Setup prototype chain
ElementRenderer.Prototype.prototype = util.Events;
ElementRenderer.prototype = new ElementRenderer.Prototype();

module.exports = ElementRenderer;