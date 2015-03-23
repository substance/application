Application
===========

Current issues:

## Add hooks like componentWillMount, componentWillUnmount, componentDidUnmount

- this is needed for cleaning up things when component gets disposed

## Implement ref concept, so local elements can be referenced in event handlers etc (this.refs.searchEl)

- problem: should we use a generic wrapper for native dom elements and components? react wraps dom elements for instance into a ComposositeComponent class. you can get the dom element by calling .getDOMNode()

## remove componentregistry: we should not have any intelligence on app level

-  we should have a simple starting mechanism like the one in react
   Application.render(MyComp, {prop1: "foo"}, document.body, optionalRouter)
- that way it get much simpler to put a component into action


## find reusable component without explicit id

See Virtual DOM terminology of React:

https://gist.github.com/sebmarkbage/fcb1b6ab493b0c77d589#react-virtual-dom-terminology

If you keep calling React.render with the same type of ReactElement and the same container DOM Element it always returns the same instance. This instance is stateful.

var componentA = React.render(<MyComponent />, document.body);
var componentB = React.render(<MyComponent />, document.body);
componentA === componentB; // true


