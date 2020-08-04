'use strict';

System.register(['lodash'], function (_export, _context) {
  "use strict";

  var _, _typeof, _createClass, Util;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  return {
    setters: [function (_lodash) {
      _ = _lodash.default;
    }],
    execute: function () {
      _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
        return typeof obj;
      } : function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };

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

      _export('Util', Util = function () {
        function Util(templateSrv) {
          _classCallCheck(this, Util);

          this.templateSrv = templateSrv;
        }

        _createClass(Util, [{
          key: 'resolve',
          value: function resolve(target, options) {
            var _this = this;

            var variableNames = (this.templateSrv.variables || []).map(function (v) {
              return '$' + v.name;
            });
            // For each variable in target, and each values of a given variable, build a resolved target string
            var resolved = [target];
            if (variableNames) {
              variableNames.forEach(function (name) {
                if (target.indexOf(name) >= 0) {
                  var values = _this.getVarValues(name, options.scopedVars);
                  var newResolved = [];
                  var regex = new RegExp('\\' + name, 'g');
                  values.forEach(function (val) {
                    resolved.forEach(function (newTarget) {
                      newResolved.push(newTarget.replace(regex, val));
                    });
                  });
                  resolved = newResolved;
                }
              });
            }
            return resolved;
          }
        }, {
          key: 'resolveForQL',
          value: function resolveForQL(target, options) {
            return this.templateSrv.replace(target, options.scopedVars, function (values) {
              if (_.isArray(values)) {
                return values.map(function (v) {
                  return '\'' + v + '\'';
                }).join(',');
              }
              return '\'' + values + '\'';
            });
          }
        }, {
          key: 'getVarValues',
          value: function getVarValues(name, scopedVars) {
            var values = this.templateSrv.replace(name, scopedVars);
            // result might be in like "{id1,id2,id3}" (as string)
            if (values.charAt(0) === '{') {
              return values.substring(1, values.length - 1).split(',');
            }
            return [values];
          }
        }, {
          key: 'exists',
          value: function exists(name) {
            return this.templateSrv.variableExists(name);
          }
        }, {
          key: 'isEmpty',
          value: function isEmpty(obj) {
            var re = new RegExp("^[ ]+$");
            if (!obj || obj == "null" || obj == null || obj == " " || obj == "" || obj == '""' || re.test(obj) || typeof obj == "undefined") {
              return true;
            } // 为空
            return false; // 不为空
          }
        }, {
          key: 'arrayToMap',
          value: function arrayToMap(result) {
            return _.map(result, function (d, i) {
              return { text: d, value: d };
            });
          }
        }, {
          key: 'templateToStr',
          value: function templateToStr(tmp_str) {
            if (this.isEmpty(tmp_str)) {
              return [];
            }
            tmp_str = this.exists(tmp_str) ? this.resolve(tmp_str, {}) : tmp_str;
            if ("object" == (typeof tmp_str === 'undefined' ? 'undefined' : _typeof(tmp_str)) && Object.keys(tmp_str).length) {
              tmp_str = tmp_str[0];
            }
            return tmp_str;
          }
        }, {
          key: 'strToArray',
          value: function strToArray(str_var) {
            var _this2 = this;

            str_var = this.templateToStr(str_var);

            if (str_var.includes("[") || str_var.includes("]")) {
              str_var = str_var.replace("[", "").replace("]", "");
            }

            var str_var_array = [];
            if (str_var.includes(";")) {
              str_var_array = str_var.split(";");
            } else if (str_var.includes(",")) {
              str_var_array = str_var.split(",");
            } else {
              str_var_array.push(str_var);
            }
            var result_array = [];
            str_var_array.forEach(function (i) {
              i = _this2.exists(i) ? _this2.resolve(i, {}) : i;
              result_array.push(i);
            });

            return result_array;
          }
        }]);

        return Util;
      }());

      _export('Util', Util);
    }
  };
});
//# sourceMappingURL=util.js.map
