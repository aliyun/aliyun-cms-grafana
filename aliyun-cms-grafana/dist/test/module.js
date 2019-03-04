"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AnnotationsQueryCtrl = exports.QueryOptionsCtrl = exports.ConfigCtrl = exports.QueryCtrl = exports.Datasource = undefined;

var _datasource = require("./datasource");

var _query_ctrl = require("./query_ctrl");

var _config_ctrl = require("./config_ctrl");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var GenericQueryOptionsCtrl = function GenericQueryOptionsCtrl() {
  _classCallCheck(this, GenericQueryOptionsCtrl);
};

GenericQueryOptionsCtrl.templateUrl = 'partials/query.options.html';

var GenericAnnotationsQueryCtrl = function GenericAnnotationsQueryCtrl() {
  _classCallCheck(this, GenericAnnotationsQueryCtrl);
};

GenericAnnotationsQueryCtrl.templateUrl = 'partials/annotations.editor.html';
exports.Datasource = _datasource.GenericDatasource;
exports.QueryCtrl = _query_ctrl.GenericDatasourceQueryCtrl;
exports.ConfigCtrl = _config_ctrl.GenericConfigCtrl;
exports.QueryOptionsCtrl = GenericQueryOptionsCtrl;
exports.AnnotationsQueryCtrl = GenericAnnotationsQueryCtrl;
//# sourceMappingURL=module.js.map
