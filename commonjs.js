(function() {

  var esprima = require('esprima');
  var estraverse = require('estraverse');
  var escodegen = require('escodegen');

  // In the near future we might get rid of the dependency to commonjs-everywhere.
  // For now we keep the parts we need as a copy in this repository.
  var traverseDependencies = require('./lib/cjsify/traverse-dependencies');

  var REQUIRE = function(global) {
    var require = function(file, parentModule) {
      if({}.hasOwnProperty.call(require.cache, file)) {
        return require.cache[file];
      }
      var resolved = require.resolve(file);
      if(!resolved) {
        throw new Error('Failed to resolve module ' + file);
      }
      var module$ = {
        id: file,
        require: require,
        filename: file,
        exports: {},
        loaded: false,
        parent: parentModule,
        children: []
      };
      if(parentModule) {
        parentModule.children.push(module$);
      }
      var dirname = file.slice(0, file.lastIndexOf('/') + 1);
      require.cache[file] = module$.exports;
      resolved.call(global, module$.exports, module$, module$.exports, dirname, file);
      module$.loaded = true;
      require.cache[file] = module$.exports;

      return module$.exports;
    };
    require.modules = {};
    require.cache = {};
    require.resolve = function(file){
      return {}.hasOwnProperty.call(require.modules, file) ? require.modules[file] : void 0;
    };
    require.define = function(file, fn){
      require.modules[file] = fn;
    };
    global.require = require;
  };

  var MODULE = function(id, body) {
    return ["require.define('", id,"', function(global, module, exports, __dirname, __filename){", body, "});"].join("");
  };

  var CommonJSServer = function(root, options) {
    options = options || {};
    this.root = root;
    this.options = options;
    this.cache = {};
    this.sources = {};
    this.map = {};
  };

  CommonJSServer.__prototype__ = function() {
    var REQ_STMT = /^require\s*\([^(]*?\)/;

    function _prepareSource(source, nodes) {

      var lines = source.split(/\r?\n/);
      for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];

        var loc = node.callee.loc;
        var lineNumber = loc.start.line - 1;

        var oldLine = lines[lineNumber];
        var head = oldLine.substring(0, loc.start.column);
        var tail = oldLine.substring(loc.start.column);

        // unfortunately the node loc does not include the arguments part
        // therefor we need to regex ourselve to get the extent of the statement
        var match = REQ_STMT.exec(tail);
        if (match === null) {
          throw new Error("Only canocical require statements allowed: require('<id or path>').");
        }
        tail = tail.substring(match[0].length);

        var newline = [
          head,
          escodegen.generate(node),
          tail
        ].join("");

        console.log("line:", oldLine, " -> ", newline);
        lines[lineNumber] = newline;
      }

      return lines.join("\n");
    }

    function _minify(source) {
      var esmangle = require('esmangle');
      var ast = esprima.parse(source);
      esmangle.mangle(esmangle.optimize(ast), {
        destructive: true
      });
      return escodegen.generate(ast, {
        format: escodegen.FORMAT_MINIFY,
        renumber: true,
        hexadecimal: true,
        escapeless: true,
        compact: true,
        semicolons: false,
        parentheses: false
      });
    }

    function _updateEntry(self, path, entry) {

      var nodes = [];
      estraverse.traverse(entry.ast, {
        enter: function(node) {
          if (node.type === 'CallExpression' && node.callee.name === 'require') {
            nodes.push(node);
          }
          return true;
        }
      });

      var body;
      var id = entry.canonicalName;
      if (nodes.length === 0) {
        body = entry.fileContents;
      } else {
        body = _prepareSource(entry.fileContents, nodes);
      }

      var code = MODULE(id, body);
      if (self.options.minify) {
        code = _minify(code);
      }

      console.log("Updating: ", path, id);
      self.sources[path] = code;
      self.map[id] = path;
    }

    this.update = function(entryPoint) {

      var entries = traverseDependencies(entryPoint, this.root, {
        cache: this.cache
      });

      for (var path in entries) {
        var entry = entries[path];
        _updateEntry(this, path, entry);
      }

    };

    this.list = function() {
      var result = Object.keys(this.map);
      result.unshift("/require.js");
      return result;
    };

    this.getScript = function(resource) {
      if (resource === "/require.js") {
        return "("+REQUIRE.toString()+").call(this,this);";
      } else {
        if (this.map[resource] === undefined) {
          throw new Error("Unknown resource: " + resource);
        }
        var path = this.map[resource];
        this.update(path);
        return this.sources[path];
      }
    };
  };
  CommonJSServer.prototype = new CommonJSServer.__prototype__();

  module.exports = CommonJSServer;

}).call(this);
