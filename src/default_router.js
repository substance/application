"use strict";

var _ = require("underscore");
var Router = require("./router");

var DefaultRouter = function(app) {
  Router.call(this);

  this.app = app;
  _.each(DefaultRouter.routes, function(route) {
    if (!this[route.command]) {
      console.error("Unknown route handler: ", route.command);
    } else {
      this.route(route.route, route.name, _.bind(this[route.command], this));
    }
  }, this);

  this.route(/^state=.*$/, "state", _.bind(this.openState, this));
};

DefaultRouter.Prototype = function() {

  this.start = function() {
    Router.history.start();
  };

  var DEFAULT_OPTIONS = {
    updateRoute: false,
    replace: false
  };

  this.openState = function() {
    var fragment = Router.history.getFragment();
    var state = this.app.stateFromFragment(fragment);
    console.log('state change triggerd by router', JSON.stringify(state));
    this.app.switchState(state, DEFAULT_OPTIONS);
  };

  this.navigate = function(route, options) {
    Router.history.navigate(route, options);
  };
};

DefaultRouter.Prototype.prototype = Router.prototype;
DefaultRouter.prototype = new DefaultRouter.Prototype();

module.exports = DefaultRouter;
