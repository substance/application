"use strict";

var util = require("substance-util");

// Substance.View
// ==========================================================================
//
// Application View abstraction, inspired by Backbone.js

var View = function(options) {
  var that = this;

  // Either use the provided element or make up a new element
  this.$el = $('<div/>');
  this.el = this.$el[0];

  this.dispatchDOMEvents();
};


View.Prototype = function() {


  // Shorthand for selecting elements within the view
  // ----------
  //

  this.$ = function(selector) {
    return this.$el.find(selector);
  };

  // Dispatching DOM events (like clicks)
  // ----------
  //

  this.dispatchDOMEvents = function() {

    var that = this;

    // showReport(foo) => ["showReport(foo)", "showReport", "foo"]
    // showReport(12) => ["showReport(12)", "showReport", "12"]
    function extractFunctionCall(str) {
      var match = /(\w+)\((.*)\)/.exec(str);
      if (!match) throw new Error("Invalid click handler '"+str+"'");

      return {
        "method": match[1],
        "args": match[2].split(',')
      };
    }

    this.$el.delegate('a[sbs-click]', 'click', function(e) {
      
      // Matches things like this
      // showReport(foo) => ["showReport(foo)", "showReport", "foo"]
      // showReport(12) => ["showReport(12)", "showReport", "12"]
      var fnCall = extractFunctionCall($(e.currentTarget).attr('sbs-click'));
        
      
      // Call it
      that[fnCall.method].apply(that, fnCall.args);

      return false;
    });
  };
};


View.Prototype.prototype = util.Events;
View.prototype = new View.Prototype();

module.exports = View;
