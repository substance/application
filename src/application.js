"use strict";

var util = require("substance-util");
var _ = require("underscore");
var Element = require("./element");
var $$ = Element.create;

// Substance.Application
// ==========================================================================
//
// Application abstraction suggesting strict MVC

// TODOS:
// 
// Assign state from url fragment, and serialize

var Application = function(options) {
  this.config = options.config;

  // Keeps track of all (mounted?) components
  this.components = {};
};


Application.Prototype = function() {

  // Remove all child components

  this.clearComponent = function(comp) {
    _.each(comp.childComponents, function(comp, key) {
      this.clearComponent(comp);
      // Remove from comp registry
      // console.log('unregistering', comp.id);
      delete this.components[comp.id];
    }, this);

    // ditch child component references
    comp.childComponents = [];
  };


  // Component state has changed
  // Re-render component (=subtree)
  this.updateComponent = function(comp) {
    var el = comp.render();

    // Remove all child views of subcomponent
    this.clearComponent(comp);

    // How can we 
    var domEl = this.renderElement(el, comp);

    // Replace element
    comp.el.parentNode.replaceChild(domEl, comp.el);
    // Reassign comp.el
    comp.mount(this, domEl);
  };

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
    var compId = comp.id;
    if (!compId) throw new Error("Component does not have an id, and can not be mounted");
    this.components[compId] = comp;
    // Assign app instance to the component
    // comp.app = this;
    comp.mount(this, domEl);
  };

  // determineComponentId
  // ----------
  // 
  // Every constructed component gets a unique id based on where it is located in the DOM
  // 0 - root component
  // 0.1 - first mounted children of root
  // 0.1.0 - first mounted children of 0.1
  // 0.2 - second mounted child of root
  // and so on.

  this.determineMountPath = function(owner) {
    if (!owner) return ["0"];

    var mountPath = JSON.parse(JSON.stringify(owner._mountPath));
    mountPath.push(owner.childComponents.length+"");
    return mountPath;
  };


  // Create component
  // ----------
  //
  // 1) Takes a component class and properties as an input
  // 2) Creates a component instance 
  // 3) Sets component state if available in app state

  this.createComponent = function(componentClass, props, owner) {
    var comp = new componentClass(props);

    // debugger;
    comp._mountPath = this.determineMountPath(owner);

    // console.log('creating component', props.ref, "mounted at", comp._mountPath);

    if (owner) {
      owner.childComponents.push(comp);
    }
    
    // Set ownership
    comp._owner = owner;

    // TODO: set state based on appstate (routes)
    if (comp.getInitialState) {
      // comp.state = comp.getInitialState();
    }
    return comp;
  };

  // Render component
  // ----------
  //
  // Render component to a DOM element
  // Mount component into DOM

  this.renderComponent = function(comp, owner) {
    var element = comp.render();
    var domEl = this.renderElement(element, owner);
    
    this.mountComponent(comp, domEl);

    // TODO: set state based on appstate (routes)
    if (comp.getInitialState) {
      // Set initial state, which is an async operation, component gets re-rendered
      // after everything is there

      // Hack, ensure we make initial state transition after component has been injected
      // into the DOM
      _.delay(function() {
        comp.setState(comp.getInitialState(), {updateRoute: false, replace: false});
      }, 1);
    }

    return domEl;
  };

  // Render Element specification
  // ----------
  //
  // Checks wether the element is a DOMElement spec or
  // Substance Component and 

  this.renderElement = function(el, owner) {
    var domEl;
    var comp;

    if (!(el instanceof Element)) {
      throw new Error("el param needs to be of type Element");
    }

    if (_.isString(el.type)) {
      domEl = this.renderDOMElement(el.type, el.props);
    } else {
      comp = this.createComponent(el.type, el.props, owner);

      owner = comp;
      // Owner is passed, since we have recursive construciton of subcomponents, which should have
      // the just created component as an owner
      domEl = this.renderComponent(comp, owner);
    }

    // Process children
    // -------------
    //     

    // Create child elements
    for (var i = 0; i < el.children.length; i++) {
      var child = el.children[i];
      var childDomEl = this.renderElement(child, owner);
      domEl.appendChild(childDomEl);
    };

    return domEl;
  };

  // Start Application
  // ----------
  //

  this.start = function(options) {
    // wrap root component in an element to fulfill rendering API
    // var rootElement = $$(this.rootComponent, {ref: "root"});
    var domEl = this.renderElement(this.rootElement);
        
    this.el.innerHTML = "";
    this.el.appendChild(domEl);
  };

};

Application.prototype = new Application.Prototype();

module.exports = Application;
