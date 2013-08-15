"use strict";

var util = require("substance-util");
var SRegExp = require("substance-regexp");

// Substance.Application.ElementRenderer
// ==========================================================================
//
// This is just a simple helper that allows us to create DOM elements
// in a data-driven way

var ElementRenderer = function(attributes) {
  this.attributes = attributes;

  // Pull off preserved properties from attributes
  // --------

  this.tagName = attributes.tag;  
  this.children = attributes.children || [];
  this.text = attributes.text || "";
  
  delete attributes.children;
  delete attributes.text;
  delete attributes.tag;

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
    for(var attrName in this.attributes) {
      var val = this.attributes[attrName];
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



// Provides a shortcut syntax interface to ElementRenderer
// --------

var $$ = function(descriptor, options) {
  var options = options  || {};

  // Extract tagName, defaults to 'div'
  var tagName = /^([a-zA-Z0-9]*)/.exec(descriptor);
  options.tag = tagName && tagName[1] ? tagName[1] : 'div';

  // Any occurence of #some_chars
  var id = /#([a-zA-Z0-9_]*)/.exec(descriptor);
  if (id && id[1]) options.id = id[1];

  // Any occurence of .some-chars
  var matchClasses = new SRegExp(/\.([a-zA-Z0-9_-]*)/g);
  options.class = matchClasses.match(descriptor).map(function(m) {
    return m.match[1];
  }).join(' ');
  
  return new ElementRenderer(options);
};



ElementRenderer.$$ = $$;

// Setup prototype chain
ElementRenderer.Prototype.prototype = util.Events;
ElementRenderer.prototype = new ElementRenderer.Prototype();

module.exports = ElementRenderer;