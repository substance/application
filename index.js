"use strict";

var Application = require("./src/application");
Application.View = require("./src/view");
Application.Controller = require("./src/controller");
Application.ElementRenderer = require("./src/renderers/element_renderer");
Application.$$ = Application.ElementRenderer.$$;

module.exports = Application;
