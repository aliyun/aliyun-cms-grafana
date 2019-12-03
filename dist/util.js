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
        }, {
          key: 'base64_decode',
          value: function base64_decode(input) {
            var key_str = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
            var output = "";
            var chr1, chr2, chr3;
            var enc1, enc2, enc3, enc4;
            var i = 0;
            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
            while (i < input.length) {
              enc1 = key_str.indexOf(input.charAt(i++));
              enc2 = key_str.indexOf(input.charAt(i++));
              enc3 = key_str.indexOf(input.charAt(i++));
              enc4 = key_str.indexOf(input.charAt(i++));
              chr1 = enc1 << 2 | enc2 >> 4;
              chr2 = (enc2 & 15) << 4 | enc3 >> 2;
              chr3 = (enc3 & 3) << 6 | enc4;
              output = output + String.fromCharCode(chr1);
              if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
              }
              if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
              }
            }
            return this.decode(output);
          }
        }, {
          key: 'decode',
          value: function decode(decode_text) {
            var string = "";
            var i = 0;
            var c,
                c1,
                c2 = 0;
            while (i < decode_text.length) {
              c = decode_text.charCodeAt(i);
              if (c < 128) {
                string += String.fromCharCode(c);
                i++;
              } else if (c > 191 && c < 224) {
                c2 = decode_text.charCodeAt(i + 1);
                string += String.fromCharCode((c & 31) << 6 | c2 & 63);
                i += 2;
              } else {
                c2 = decode_text.charCodeAt(i + 1);
                c3 = decode_text.charCodeAt(i + 2);
                string += String.fromCharCode((c & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
                i += 3;
              }
            }
            return string;
          }
        }]);

        return Util;
      }());

      _export('Util', Util);
    }
  };
});
//# sourceMappingURL=util.js.map
