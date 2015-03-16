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

  // 3. Handle children (either passed as argument list or array)
  var children;
  if (_.isArray(arguments[2])) {
    children = arguments[2];
  } else {
    children = _.rest(arguments, 2);
  }

  for (var i = 0; i < children.length; i++) {
    var childEl = children[i];
    if (!(childEl instanceof Element)) {
      throw new Error("child element is not of type Element");
    }
    el.appendChild(childEl);
  }


  return el;
};


module.exports = Element;
