"use strict";


var Application = {};

if (typeof window !== 'undefined') {
	Application = require("./src/application");
	Application.Component = require("./src/component");
  Application.Element = require("./src/element");
  Application.$$ = Application.Element.create;
}

module.exports = Application;
