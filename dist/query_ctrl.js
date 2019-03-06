'use strict';

System.register(['app/plugins/sdk', './css/query-editor.css!'], function (_export, _context) {
  "use strict";

  var QueryCtrl, _createClass, GenericDatasourceQueryCtrl;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }

  return {
    setters: [function (_appPluginsSdk) {
      QueryCtrl = _appPluginsSdk.QueryCtrl;
    }, function (_cssQueryEditorCss) {}],
    execute: function () {
      _createClass = function () {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }

        return function (Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();

      _export('GenericDatasourceQueryCtrl', GenericDatasourceQueryCtrl = function (_QueryCtrl) {
        _inherits(GenericDatasourceQueryCtrl, _QueryCtrl);

        function GenericDatasourceQueryCtrl($scope, $injector) {
          _classCallCheck(this, GenericDatasourceQueryCtrl);

          var _this = _possibleConstructorReturn(this, (GenericDatasourceQueryCtrl.__proto__ || Object.getPrototypeOf(GenericDatasourceQueryCtrl)).call(this, $scope, $injector));

          _this.scope = $scope;
          _this.target.type = _this.target.type || 'timeserie';
          _this.target.target = _this.target.ycol;
          _this.target.describe = _this.target.describe;
          _this.target.xcol = _this.target.xcol || 'timestamp';
          _this.target.project = _this.target.project || 'acs_ecs_dashboard';
          _this.target.metric = _this.target.metric;
          _this.target.period = _this.target.period;
          _this.target.group = _this.target.group;
          _this.target.dimensions = _this.target.dimensions || [];
          _this.dimensions;

          _this.target.ycol = _this.target.ycol || [];
          _this.statistics;

          return _this;
        }

        _createClass(GenericDatasourceQueryCtrl, [{
          key: 'getOptions',
          value: function getOptions(query) {
            this.checkIsNull();
            return this.datasource.metricFindQuery(query || '');
          }
        }, {
          key: 'getProjects',
          value: function getProjects() {
            this.checkIsNull();
            return this.datasource.getProject();
          }
        }, {
          key: 'getMetrics',
          value: function getMetrics() {
            this.checkIsNull();
            if (this.target.project) {
              return this.datasource.getMetrics(this.target.project);
            }
          }
        }, {
          key: 'getPeriod',
          value: function getPeriod() {
            this.checkIsNull();
            if (this.target.project && this.target.metric) {
              return this.datasource.getPeriod(this.target.project, this.target.metric);
            }
          }
        }, {
          key: 'getStatistics',
          value: function getStatistics() {
            this.checkIsNull();
            if (this.target.project && this.target.metric) {
              return this.datasource.getStatistics(this.target.project, this.target.metric, this.target.ycol);
            }
          }
        }, {
          key: 'ycolPush',
          value: function ycolPush(ycol) {
            this.checkIsNull();
            if (!ycol || _.includes(this.target.ycol, ycol)) {
              return;
            }
            this.target.ycol.push(ycol);
            this.statistics = "";
            this.panelCtrl.refresh();
          }
        }, {
          key: 'ycolSplice',
          value: function ycolSplice(ycol) {
            this.checkIsNull();
            if (!ycol || !_.includes(this.target.ycol, ycol)) {
              return;
            }
            var i = this.target.ycol.indexOf(ycol);
            this.target.ycol.splice(i, 1);
            this.statistics = "";
            this.panelCtrl.refresh();
          }
        }, {
          key: 'getGroups',
          value: function getGroups() {
            this.checkIsNull();
            return this.datasource.getGroups();
          }
        }, {
          key: 'getDimensions',
          value: function getDimensions() {
            this.checkIsNull();
            if (this.target.project && this.target.metric) {
              return this.datasource.getDimensions(this.target.project, this.target.metric, this.target.group, this.target.dimensions, this.target.period);
            }
          }
        }, {
          key: 'dimensionsPush',
          value: function dimensionsPush(dimension) {
            this.checkIsNull();
            if (!dimension || _.includes(this.target.dimensions, dimension)) {
              return;
            }
            this.target.dimensions.push(dimension);
            this.dimensions = "";
            this.panelCtrl.refresh();
          }
        }, {
          key: 'dimensionsSplice',
          value: function dimensionsSplice(dimension) {
            this.checkIsNull();
            if (!dimension || !_.includes(this.target.dimensions, dimension)) {
              return;
            }
            var i = this.target.dimensions.indexOf(dimension);
            this.target.dimensions.splice(i, 1);
            this.dimensions = "";
            this.panelCtrl.refresh();
          }
        }, {
          key: 'toggleEditorMode',
          value: function toggleEditorMode() {
            this.target.rawQuery = !this.target.rawQuery;
          }
        }, {
          key: 'onChangeInternal',
          value: function onChangeInternal() {
            this.checkIsNull();
            this.panelCtrl.refresh(); // Asks the panel to refresh data.
          }
        }, {
          key: 'checkIsNull',
          value: function checkIsNull() {
            var re = new RegExp("^[ ]+$");
            if (!this.target.project || this.target.project == "null" || this.target.project == " " || this.target.project == '""' || re.test(this.target.project)) {
              this.target.project = "";
            }
            if (!this.target.metric || this.target.metric == "null" || this.target.metric == " " || this.target.metric == '""' || re.test(this.target.metric)) {
              this.target.metric = "";
            }
            if (!this.target.period || this.target.period == "null" || this.target.period == " " || this.target.period == '""' || re.test(this.target.period)) {
              this.target.period = "";
            }
            if (!this.target.group || this.target.group == "null" || this.target.group == " " || this.target.group == '""' || re.test(this.target.group)) {
              this.target.group = "";
            };
            if (!this.target.dimensions || this.target.dimensions == "null" || this.target.dimensions == " " || this.target.dimensions == '""' || re.test(this.target.dimensions)) {
              this.target.dimensions = "";
            }
            if (!this.dimensions || this.dimensions == "null" || this.dimensions == " " || this.dimensions == '""' || re.test(this.dimensions)) {
              this.dimensions = "";
            }
            if (!this.target.ycol || this.target.ycol == "null" || this.target.ycol == " " || this.target.ycol == '""' || re.test(this.target.ycol)) {
              this.target.ycol = "";
            }
            if (!this.statistics || this.statistics == "null" || this.statistics == " " || this.statistics == '""' || re.test(this.statistics)) {
              this.statistics = "";
            }
            if (!this.target.xcol || this.target.xcol == "null" || this.target.xcol == " " || this.target.xcol == '""' || re.test(this.target.xcol)) {
              this.target.xcol = "";
            }
            if (!this.target.describe || this.target.describe == "null" || this.target.describe == " " || this.target.describe == '""' || re.test(this.target.describe)) {
              this.target.describe = "";
            }
          }
        }]);

        return GenericDatasourceQueryCtrl;
      }(QueryCtrl));

      _export('GenericDatasourceQueryCtrl', GenericDatasourceQueryCtrl);

      GenericDatasourceQueryCtrl.templateUrl = 'partials/query.editor.html';
    }
  };
});
//# sourceMappingURL=query_ctrl.js.map
