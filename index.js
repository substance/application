"use strict";

var Application = require("./src/application");
Application.View = require("./src/view");
Application.Controller = require("./src/controller");

if (typeof window !== 'undefined') {
  Application.Router = require("./src/router");
  Application.DefaultRouter = require("./src/default_router");
  Application.ElementRenderer = require("./src/renderers/element_renderer");
  Application.$$ = Application.ElementRenderer.$$;
}

module.exports = Application;
