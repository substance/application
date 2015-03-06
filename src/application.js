"use strict";

var util = require("substance-util");
var _ = require("underscore");
var $$ = require("./element").create;

// Substance.Application
// ==========================================================================
//
// Application abstraction suggesting strict MVC


// TODOS: 
// Ownership
//   - we don't maintain ownership of child components
//   - we need to track this so we can make a cleanup on rerender
//   - e.g. one components state changes so different components will be created
//   - we first need to unregister (dispose) existing sub-components
//   - we need to restructure the rendering method, so we have a reference to the parent component
//     when we iterate over the child components
//   - `renderElement` should have a parameter `parent` that is the owning component

var Application = function(options) {
  this.config = options.config;

  // Keeps track of all (mounted?) components
  this.components = {};
};


Application.Prototype = function() {

  this.renderDOMElement = function(tagName, attrs) {
    var el = window.document.createElement(tagName);

    if (attrs.html) {
      el.innerHTML = attrs.html;
      delete attrs.html;
    }
    if (attrs.text) {
      el.textContent = attrs.text;
      delete attrs.text;
    }

    if (attrs.className) {
      el.setAttribute("class", attrs.className);
      delete attrs.className;
    }

    // Set attributes based on element spec
    for(var attrName in attrs) {
      var val = attrs[attrName];
      el.setAttribute(attrName, val);
    }
    return el;
  }

  // Mount component
  // ----------
  //
  // Terminology of 'mount'. This only means the component has now a DOM representatation,
  // which can be accessed using Component.getDOMNode()

  this.mountComponent = function(comp, domEl) {
    var ref = comp.ref;
    if (!ref) throw new Error("Component does not have a ref, and can not be mounted");
    this.components[ref] = comp;
    // Assign app instance to the component
    comp.app = this;
    comp.el = domEl;
    if (comp.componentDidMount) {
      comp.componentDidMount();
    }
  };

  // Component state has changed
  // Re-render component (=subtree)
  this.updateComponent = function(comp) {
    var el = comp.render();

    // How can we 
    var domEl = this.renderElement(el);

    // Replace element
    comp.el.parentNode.replaceChild(domEl, comp.el);

    // Event handlers need to be attached again
    // This is a bit nasty, actually a component shouldn't be mounted multiple times
    // in the life cycle
    // We need a declarative approach for dom events and use event delegation
    // on the app level
    if (comp.componentDidMount) {
      comp.componentDidMount();
    }
  };


  // Render component
  // ----------
  //
  // 1) Takes a component class and properties as an input
  // 2) Creates a component instance 
  // 3) Sets component state if available in app state
  // 4) Render component to a DOM element
  // 5) Register component in this.components

  this.renderComponent = function(componentClass, props) {
    var comp = new componentClass(props);
    
    if (comp.getInitialState) {
      comp.state = comp.getInitialState();
    }
    // TODO: set state based on appstate (routes)

    var element = comp.render();
    var domEl = this.renderElement(element);
    
    this.mountComponent(comp, domEl);
    
    return domEl;
  };

  // Render Element specification
  // ----------
  //
  // Checks wether the element is a DOMElement spec or
  // Substance Component and 

  this.renderElement = function(el) {
    var domEl;

    if (_.isString(el.type)) {
      domEl = this.renderDOMElement(el.type, el.props);
    } else {
      domEl = this.renderComponent(el.type, el.props);
    }

    // Render children
    for (var i = 0; i < el.children.length; i++) {
      var child = el.children[i];
      var childDomEl = this.renderElement(child);
      domEl.appendChild(childDomEl);
    };

    return domEl;
  };

  // Start Application
  // ----------
  //

  this.start = function(options) {
    console.log('starting app..');

    // wrap root component in an element to fulfill rendering API
    var rootElement = $$(this.rootComponent, {ref: "root"});
    
    var domEl = this.renderElement(rootElement);
    
    console.log("EL", this.el);
    console.log('dom raedy', domEl);
    this.el.innerHTML = "";
    this.el.appendChild(domEl);
  };

};

Application.prototype = new Application.Prototype();

module.exports = Application;
