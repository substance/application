"use strict";


var Application = {};

if (typeof window !== 'undefined') {
  Application = require("./src/application");
  Application.Component = require("./src/component");
  Application.Element = require("./src/element");
  Application.Router = require("./src/router");
  Application.DefaultRouter = require("./src/default_router");
  Application.$$ = Application.Element.create;
}

module.exports = Application;
