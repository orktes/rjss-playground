var React = require('react');
var ReactCanvas = require('react-canvas');
var AceEditor = require('react-ace');
var RJSS = require('rjss');
var _ = require('lodash');
var reactTools = require('react-tools');

var rjssValue = require('text!./examples/simple/simple.rjss');
var jsxValue = require('text!./examples/simple/simple.canvas');

var jsxTemplateStart = require('text!./template_start.txt') + '\n';
var jsxTemplateEnd = require('text!./template_end.txt');

var rjss = new RJSS();

var Main = React.createClass({
  componentWillMount: function() {
    window.addEventListener('resize', _.throttle(this.onResize, 500));
    this.recompileExample = _.debounce(this._recompileExample, 1000);
  },
  componentDidMount: function() {
    var rjssEditor = this.getRJSSEditor();
    rjssEditor.setValue(rjssValue);
    rjssEditor.getSession().setOption("useWorker", false);

    var jsxEditor = this.getJSXEditor();
    jsxEditor.setValue(jsxValue);
    jsxEditor.getSession().setOption("useWorker", false);
  },
  getRJSSEditor:  function () {
    return this.refs.rjss_editor.editor;
  },
  getJSXEditor: function () {
    return this.refs.jsx_editor.editor;
  },
  onResize: function () {
    this.setState({
      width: window.innerWidth / 3,
      height: window.innerHeight
    });

    this.recompileExample();
  },
  getInitialState: function() {
    return {
      rjssValue: rjssValue,
      jsxValue: jsxValue,
      width: window.innerWidth / 3,
      height: window.innerHeight
    };
  },
  _recompileExample: function () {
    var compiledRJSS, compiledJSX, rjssModule, Canvas


    try {
      compiledRJSS = rjss.parseContent(this._lastRJSSValue).getCode();
      this.getRJSSEditor().getSession().setAnnotations([]);
    } catch(e) {
      var message = e.message;
      //Parse error on line
      var annotations = [];
      annotations.push({
        row: e.lineNumber || 0,
        text: message,
        type: "error"
      });
      this.getRJSSEditor().getSession().setAnnotations(annotations);
      return;
    }

    try {
      compiledJSX = reactTools.transform(jsxTemplateStart + this._lastJSXValue + jsxTemplateEnd);
      this.getJSXEditor().getSession().setAnnotations([]);
    } catch(e) {
      var annotations = [];
      annotations.push({
        row: e.lineNumber - jsxTemplateStart.split('\n').length,
        column: e.column,
        text: e.message,
        type: "error"
      });
      this.getJSXEditor().getSession().setAnnotations(annotations);
      return;
    }


    try {
      var modules = {};
      modules['react-canvas'] = ReactCanvas;
      rjssModule = this.evalModule(compiledRJSS, modules);
      Canvas = this.evalModule(compiledJSX, {
        styles: rjssModule,
        react: React,
        reactCanvas: ReactCanvas
      });

      React.unmountComponentAtNode(this.refs.canvas.getDOMNode());

      React.render(
        <Canvas
          top={0}
          left={this.state.width * 2}
          width={this.state.width}
          height={this.state.height} />,
        this.refs.canvas.getDOMNode());
    } catch(e) {
      console.log(e);
    }
  },
  onRJSSChange: function (newValue) {
    if (this._lastRJSSValue === newValue) {
      return;
    }
    this._lastRJSSValue = newValue;

    this.recompileExample();
  },
  onJSXChange: function (newValue) {
    if (this._lastJSXValue === newValue) {
      return;
    }
    this._lastJSXValue = newValue;

    this.recompileExample();
  },
  evalModule: function (code, requires) {
    var fn = new Function('module', 'exports', 'require', code);

    var module = {exports: {}};

    fn(module, module.exports, function (file) {
      var reqModule = requires[file];

      if (!reqModule) {
        throw new Error("Cant find " + file);
      }

      return reqModule;
    });

    return module.exports;
  },
  render: function() {
    var Canvas = this.state.canvas
    return (
      <div className="row" className="sink">
        <div className="col-md-4 no-float view">
          <AceEditor
            ref="rjss_editor"
            width={""+this.state.width}
            height={""+this.state.height}
            mode="css"
            theme="solarized_dark"
            onChange={this.onRJSSChange}
            name="rjss_editor" />
        </div>
        <div className="col-md-4 no-float view">
          <AceEditor
            ref="jsx_editor"
            width={""+this.state.width}
            height={""+this.state.height}
            mode="text"
            theme="solarized_dark"
            onChange={this.onJSXChange}
            name="jsx_editor" />
        </div>
        <div ref="canvas" className="col-md-4 no-float view">
        </div>
      </div>
    );
  }
});

React.render(<Main />, document.body);
