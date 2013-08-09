"use strict";

var View = require("./view");
var util = require("substance-util");

// Substance.Application
// ==========================================================================
//
// Application abstraction suggesting strict MVC

var Application = function(config) {
  View.call(this);

  this.config = config;



};

Application.Prototype = function() {

  // Start Application
  // ----------
  //

  this.start = function() {

    this.$el = $('body');
    this.el = this.$el[0];

  };

};

// Setup prototype chain

Application.Prototype.prototype = View.prototype;
Application.prototype = new Application.Prototype();

module.exports = Application;
