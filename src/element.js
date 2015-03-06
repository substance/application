// Substance.Application.Element
// -----------------

var _ = require("underscore");

var Element = function(type, props) {
  // type is either a string (dom element)
  // or a constructor function (component)
  this.type = type;
  this.props = props;
  this.children = [];
};

Element.Prototype = function() {

  this.appendChild = function(element) {
    this.children.push(element);
  };
};


Element.prototype = new Element.Prototype();


// Factory method for creating elements
// -------------

Element.create = function() {
  
  function isComponent(type) {
    return _.isFunction(type);
  }

  // Implementation
  // -------------
  
  var el;
  var offset;

  // 1. Component
  if (isComponent(arguments[0])) {
    var ComponentClass = arguments[0];
    var props = arguments[1];
    el = new Element(ComponentClass, props);
  }

  // 2. DOM element
  else if (_.isString(arguments[0])) {
    var tagName = arguments[0];
    var attrs = arguments[1];
    el = new Element(tagName, attrs);
  }

  for (var i = 2; i < arguments.length; i++) {
    var childEl = arguments[i];
    // if (_.isString(childEl)) {
    //   childEl = window.document.createTextNode(childEl);
    // }
    el.appendChild(childEl);
  }

  return el;
};


module.exports = Element;
