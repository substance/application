"use strict";

var _ = require("underscore");
var Element = require("./element");
var DefaultRouter = require("./default_router");

// Substance.Application
// ==========================================================================
//
// Application abstraction following a React-like component structure

var Application = function(options) {
  this.config = options.config;
  this.componentRegistry = options.components;

  this.router = new DefaultRouter(this);

  // Keeps track of all (mounted?) components
  this.components = {};

  // App route based on exposed component states
  this.route = {};
};

Application.Prototype = function() {

  // Remove all child components

  this.clearComponent = function(comp) {
    _.each(comp.childComponents, function(comp) {
      this.clearComponent(comp);
        
      // Remove from comp registry
      if (!comp.persistent) {
        // Remove all event handlers that stick on comp.el
        $(comp.el).off();
        // Gives component the chance to unregister events etc.
        if (comp.componentWillUnmount) {
          comp.componentWillUnmount();
        }
        delete this.components[comp.id];  
      }
    }, this);

    // ditch child component references
    comp.childComponents = [];
  };

  this.getComponentStateFromRoute = function(comp) {
    return this.route[comp.id];
  };

  this.updateComponentRoute = function(comp) {
    if (comp.stateToRoute) {
      this.route[comp.id] = comp.stateToRoute();
      // TODO: check if valid route has been returned
      // needs to be a hash with only string keys and values
      // console.log('new route', JSON.stringify(this.route));
      this.updateRoute();
    }
  };

  this.setRoute = function(route) {
    this.route = route;
    console.log('Application.setRoute', route);
  };

  this.updateRoute = function(options) {
    var routeString = JSON.stringify(this.route);
    // console.log(stateString);

    this.router.navigate(routeString, {trigger: false, replace: true});
  };

  this.routeFromFragment = function(fragment) {
    try {
      return JSON.parse(fragment);
    } catch(e) {
      return {};
    }
  };

  this.onStateChanged = function(comp, prevState) {
    // console.log('comp', comp.id, 'changed state', prevState, 'to', comp.state);
    this.updateComponentRoute(comp);
  };

  // Component state has changed
  // Re-render component (=subtree)
  this.updateComponent = function(comp) {

    var el = comp.render();

    // Remove all non-persistent child views of subcomponent
    this.clearComponent(comp);


    // Re-render
    var domEl = this.renderElement(el, comp);

    // Replace element
    if (comp.el) {
      comp.el.parentNode.replaceChild(domEl, comp.el);
    }

    // Update the DOM element of a component

    // Unbind existing event handlers on el
    $(comp.el).off();

    comp.el = domEl;

    this.bindEvents(comp);

    comp.el.setAttribute("data-comp-id", comp.getId());

    // TODO: bind events based on declarative spec

    if (comp.componentDidUpdate) {
      comp.componentDidUpdate();
    }
    if (comp.componentDidRender) {
      comp.componentDidRender();
    }
  };

  // After a component has been rendered (it's el has changed) we attach event handlers
  this.bindEvents = function(comp) {
    if (comp.events) {
      _.each(comp.events, function(method, def) {
        var frags = def.split(" ");
        var eventName = frags.shift();
        var selector = frags.join(" ");

        // TODO: unregister old events first
        $(comp.el).on(eventName, selector, _.bind(comp[method], comp));
      });
    }
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
  };

  // Mount component
  // ----------
  //
  // Terminology of 'mount'. This only means the component has now a DOM representatation,
  // which can be accessed using Component.getDOMNode()

  this.mountComponent = function(comp, domEl) {
    if (!comp.id) throw new Error("Component does not have an id, and can not be mounted");
    // if (this.components[comp.id]) throw new Error('Component with id "'+comp.id+'" is already registered');
    this.components[comp.id] = comp;
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

  this.createComponent = function(ComponentClass, props, owner) {
    var comp;

    if (props && this.components[props.id] && ComponentClass.persistent) {
      // Reuse existing component
      comp = this.components[props.id];
      // comp.props = props;
      comp.setProps(props);

      // console.log('reusing existing component', comp.id);

      // console.log('create component of', owner.id);
    } else {

      comp = new ComponentClass();
      if (ComponentClass.persistent) {
        comp.persistent = true;
      }
      // Set props
      comp.setProps(props);

      // Set initial state (on construction)
      var routeState = this.getComponentStateFromRoute(comp);
      comp.state = routeState || comp.getInitialState();

      // map to browser url if component handles route mapping
      this.updateComponentRoute(comp);

      comp.app = this;
      comp._mountPath = this.determineMountPath(owner);

      // console.log('creating component', props.ref, "mounted at", comp._mountPath);

      if (owner) {
        owner.childComponents.push(comp);
      }

      // Set ownership
      comp._owner = owner;
    }

    return comp;
  };

  this.lookupComponentClass = function(name) {
    if (!this.componentRegistry[name]) {
      throw new Error('No component registered for name ' + name);
    }
    return this.componentRegistry[name];
  };

  // Render component
  // ----------
  //
  // Render component to a DOM element
  // Mount component into DOM

  this.renderComponent = function(comp, owner) {
    var element;

    // If component data is not dirty, we just reuse the existing domNode
    if (!comp._dirty) {
      // console.log('not dirty, skip render', comp.id);
      return comp.el;
    }

    // Clear refs before re-render
    comp.refs = {};

    element = comp.render();

    var domEl = this.renderElement(element, owner);
    comp._dirty = false; // we are no longer dirty after the render
    this.mountComponent(comp, domEl);
    return domEl;
  };

  // Register a reference to a DOM element on component
  this.registerRef = function(owner, ref, el) {
    owner.refs[ref] = el;
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
      if (el.props.ref) {
        this.registerRef(owner, el.props.ref, domEl);
      }
    } else {
      comp = this.createComponent(el.type, el.props, owner);
      if (owner && el.props.ref) {
        this.registerRef(owner, el.props.ref, comp);
      }
      owner = comp;
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
    }

    return domEl;
  };

  // Start Application
  // ----------
  //

  this.start = function() {
    // Start listening to routes

    if (this.router) this.router.start();
    
    // wrap root component in an element to fulfill rendering API
    // var rootElement = $$(this.rootComponent, {ref: "root"});
    var domEl = this.renderElement(this.rootElement);

    this.el.innerHTML = "";
    this.el.appendChild(domEl);
  };
};

// Sample appProps:
// {
//   container: document.body,
//   router: true
// }

Application.render = function(CompClass, props, appProps) {
  // returns a running app instance
};

Application.prototype = new Application.Prototype();

module.exports = Application;
