"use strict";

// Import
// ========

var Test = require('substance-test');
var assert = Test.assert;
var registerTest = Test.registerTest;

var ElementRenderer = require("../src/renderers/element_renderer");

// Test
// ========

var ElementRendererTest = function () {

  this.setup = function() {
    // this.importer = new Importer();
  };

  this.actions = [

    "Render a div with id and class attributes", function() {
      var el = new ElementRenderer({
        tag: "div",
        id: "john",
        class: "foo"
      });

      assert.isEqual('foo', el.className);
      assert.isEqual('john', el.id);
    },

    "Test nested composition of DOM elements", function() {
      var list = new ElementRenderer({
        tag: "ul",
        id: "my_list",
        children: [
          new ElementRenderer({"tag": "li", "class": "item-1", "text": "A"}),
          new ElementRenderer({"tag": "li", "text": "B"})
        ]
      });
    },

    "Test deeply nested composition of DOM elements", function() {
      var nestedList = new ElementRenderer({
        tag: "ul",
        id: "my_list",
        children: [
          new ElementRenderer({"tag": "li", "text": "A"}),
          new ElementRenderer({
            "tag": "li",
            "text": "B",
            "children": [
              new ElementRenderer({"tag": "li", "class": "item-1", "text": "B1"}),
              new ElementRenderer({"tag": "li", "text": "B2"})
            ]
          })
        ]
      });

      console.log('LE LIST', nestedList);

    },

    // "Test shortcut version", function() {
    //   // Shortcut version
    //   $$('#john.foo');
    // },


    // "Render a nested composition of DOM Elements", function() {
    //   var images = $$('#images', {
    //     children: [
    //       $$('img#img_1.cat-1', {"src": "http://foo.com/bar.jpg"}),
    //       $$('img#img_2.cat-1', {"src": "http://bar.at/foo.png"}),
    //       // alternatively
    //       document.createElement('div')
    //     ]
    //   });
    // },

    // "Render a deeply nested composition of things", function() {
    //   // 3. Deeper nested
    //   // ------

    //   var list = $$('ul#my_list', {
    //     children: [
    //       $$('li', {"text": "A"}),
    //       $$('li', {
    //         "text": "B",
    //         "children": [
    //           $$('li', {"text": "B1"}),
    //           $$('li', {"text": "B2"})
    //         ]
    //       })
    //     ]
    //   });

    //   // =>
    //   // <ul id="my_list">
    //   //   <li>A</li>
    //   //   <li>B
    //   //     <ul>
    //   //       <li>B1</li>
    //   //       <li>B2</li>
    //   //     </ul>
    //   //   </li>
    //   //   <li>B</li>
    //   // </ul>
    // },

    // "Manipulation of an existing renderer instance", function() {
    //   // Find stuff
    //   var list = list.find('#my_list'); // returns you a DOM native NodeList

    //   // Manipulate stuff using regular DOM API
    //   cat1.appendChild($$('li', {"text": "C"}));
    // }


  ];
};

registerTest(['Application', 'Element Renderer'], new ElementRendererTest());
