"use strict";

System.register(["app/plugins/sdk", "./css/query-editor.css!"], function (_export, _context) {
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

			_export("GenericDatasourceQueryCtrl", GenericDatasourceQueryCtrl = function (_QueryCtrl) {
				_inherits(GenericDatasourceQueryCtrl, _QueryCtrl);

				function GenericDatasourceQueryCtrl($scope, $injector) {
					_classCallCheck(this, GenericDatasourceQueryCtrl);

					var _this = _possibleConstructorReturn(this, (GenericDatasourceQueryCtrl.__proto__ || Object.getPrototypeOf(GenericDatasourceQueryCtrl)).call(this, $scope, $injector));

					_this.scope = $scope;
					_this.project_list = _this.project_list || [];
					_this.metric_list = _this.metric_list || [];
					_this.metric_name_list = _this.metric_name_list || [];
					_this.fieldName = _this.fieldName || '';
					_this.panel.columns = _this.panel.columns || [];
					_this.dimensionValues = _this.dimensionValues || [];
					_this.oldDimensionKeys = [];

					_this.init = function () {
						this.ListProjectDetail();
						this.target.project = this.target.project || '';
						this.target.metric = this.target.metric || '';
						this.target.fieldNames = this.target.fieldNames || [];
						this.target.selectedFieldNames = this.target.selectedFieldNames || [];
						this.target.periods = this.target.periods || ['60'];
						this.target.period = this.target.period || '';
						this.target.dimensions = this.target.dimensions || [];
						this.target.dimKVs = this.target.dimKVs || [];
						this.target.dimensionKeys = this.target.dimensionKeys || [];
					};
					_this.init();

					_this.projectChanged = function () {
						if (!this.checkProject()) {
							this.panel.title = '';
							this.target.metric = '';
							this.metric_list = [];
							this.target.selectedFieldNames = [];
							this.target.period = '';
							this.target.periods = [];
							this.target.dimensions = [];
							this.target.dimKVs = [{
								key: this.target.dimensionKeys[0],
								value: ''
							}];
							this.onChangeInternal();
							return;
						}
						this.ListMetricDetail(this.target.project, "");
					};

					_this.metricChanged = function () {
						if (!this.checkMetric()) {
							this.panel.title = '';
							this.target.selectedFieldNames = [];
							this.target.period = '';
							this.target.periods = [];
							this.target.dimensions = [];
							this.target.dimKVs = [{
								key: this.target.dimensionKeys[0],
								value: ''
							}];
							this.ListMetricDetail(this.target.project, "");
							this.onChangeInternal();
							return;
						}
						this.ListMetricDetail(this.target.project, this.target.metric);
						//修改图表标题
						if (!this.metric_name_list || this.metric_name_list.length === 0) {
							var metrics = [];
							_.each(this.metric_list, function (metric) {
								metrics.push(metric);
							});
							this.metric_name_list = _.uniq(metrics);
						}
						var panelTitle = this.panel.title;
						if (!panelTitle || panelTitle === '' || panelTitle === 'Panel Title' || _.includes(this.metric_name_list, this.panel.title)) {
							this.panel.title = this.target.metric;
						}

						this.panel.columns = [];
					};

					_this.ensureDimension = function () {
						var _this2 = this;

						if (!this.checkProject()) {
							return;
						}
						var dimensionKeys = this.target.dimensionKeys;
						if (dimensionKeys.length !== 0) {
							_.each(dimensionKeys, function (dimensionKey) {
								_this2.getDimensionValues(dimensionKey);
							});
						}
						if (!_.isEqual(dimensionKeys, this.oldDimensionKeys)) {
							this.target.dimKVs = [{
								key: dimensionKeys[0],
								value: ''
							}];
							this.target.selectedFieldNames = [];
							this.target.dimensions = [];
							this.oldDimensionKeys = dimensionKeys;
						}
						this.onChangeInternal();
					};

					_this.fieldNameChanged = function (fieldName) {
						if (!fieldName || !_.includes(this.target.fieldNames, fieldName)) {
							return;
						}
						var oldList = angular.copy(this.target.selectedFieldNames);
						oldList.push(fieldName);
						this.target.selectedFieldNames = _.uniq(oldList);
						this.onChangeInternal();
						this.panel.columns.push({
							text: fieldName,
							value: fieldName
						});
						this.panel.columns = _.uniqBy(this.panel.columns, "text");
						this.fieldName = '';
					};

					_this.removeSelectedField = function ($event, feild) {
						this.target.selectedFieldNames = _.without(this.target.selectedFieldNames, feild);
						_.remove(this.panel.columns, {
							text: feild,
							value: feild
						});
						this.onChangeInternal();
					};

					_this.onTargetBlur = function (key, index) {
						var _this3 = this;

						//判断下标合法性
						var len = this.target.dimensionKeys.length;
						if (index >= len) {
							return;
						}

						//截除下级dimension信息
						var start = index + 1;
						var end = len - index;
						this.target.dimKVs.splice(start, end);

						//判断dimensionValue合法性
						var dimValue = this.target.dimKVs[index].value;
						if (!dimValue) {
							this.onChangeInternal();
							return;
						}

						//更新dimension键值列表
						this.target.dimensions = [];
						_.each(this.target.dimKVs, function (dimKV) {
							_this3.target.dimensions.push(dimKV);
						});

						//表格类型的时序数据title添加dimension信息
						if (this.panel.type === 'table') {
							if (this.metric_name_list.length === 0) {
								this.ListProjectDetail();
								this.ListMetricDetail();
							}
							//没有指定title才修改
							if (!this.panel.title || this.panel.title === '' || this.panel.title === 'Panel Title' || _.includes(this.metric_name_list, this.panel.title) || _.includes(this.metric_name_list, this.panel.title.split("_")[0])) {
								this.panel.title = this.target.metric;
								_.each(this.target.dimensions, function (dimension) {
									_this3.panel.title += '_' + dimension.value;
								});
							}
						}

						this.onChangeInternal();

						//判断dimensionKey是否重复
						var dimKs = [];
						_.each(this.target.dimKVs, function (kv) {
							dimKs.push(kv.key);
						});
						dimKs = _.uniq(dimKs);
						var nextKey = this.target.dimensionKeys[index + 1];
						if (!nextKey || _.includes(dimKs, nextKey)) {
							return;
						}

						//将新键值推送入dimKVs
						this.target.dimKVs.push({
							key: nextKey,
							value: ''
						});

						this.dimensionValues = [];
					};
					return _this;
				}

				_createClass(GenericDatasourceQueryCtrl, [{
					key: "onChangeInternal",
					value: function onChangeInternal() {
						if (this.target.selectedFieldNames.length > 0 && this.target.project && this.target.metric) {
							this.panelCtrl.refresh(); // Asks the panel to refresh data.
						}
					}
				}, {
					key: "checkProject",
					value: function checkProject() {
						return this.project_list.length > 0 && this.target.project && _.includes(this.project_list, this.target.project);
					}
				}, {
					key: "checkMetric",
					value: function checkMetric() {
						return this.metric_list.length > 0 && this.target.metric && _.includes(this.metric_list, this.target.metric);
					}
				}, {
					key: "getDimensionValues",
					value: function getDimensionValues(nextKey) {
						var _this4 = this;

						if (!nextKey || !this.target.project || this.target.project === '' || !this.target.metric || this.target.metric === '') {
							return;
						}
						var dimKeyIndex = _.indexOf(this.target.dimensionKeys, nextKey);
						if (dimKeyIndex >= 1 && this.target.dimensionKeys[dimKeyIndex - 1].value === 'no result') {
							return;
						}
						var query = {};
						query.Project = this.target.project;
						query.Metric = this.target.metric;
						query.Period = this.target.period;
						var now = new Date();
						query.StartTime = now.getTime() - 1000 * 60 * 60;
						query.EndTime = now.getTime();
						query.Dimensions = [];
						query.Dimensions = _.slice(this.target.dimensions, 0, dimKeyIndex);
						query.NextKey = nextKey;

						this.datasource.listDimensionValues(query).then(function (result) {
							var dimensionValues = [];
							var dimData = result.data;
							if (!dimData || dimData.length === 0) {
								dimensionValues.push('no result');
							} else {
								dimensionValues = dimData;
							}
							_this4.dimensionValues = dimensionValues;
						});
					}
				}, {
					key: "ListProjectDetail",
					value: function ListProjectDetail() {
						var _this5 = this;

						this.datasource.ListProjectDetail().then(function (result) {
							_this5.project_list = result;
						});
					}
				}, {
					key: "ListMetricDetail",
					value: function ListMetricDetail(project, metric) {
						var _this6 = this;

						this.datasource.ListMetricDetail({
							Project: project,
							Metric: metric
						}).then(function (result) {
							var data = result.data;
							if (data.ErrorCode === 200 && data.Success === true) {
								if (metric != "") {
									var Resource = data.Resources.Resource[0];
									_this6.target.fieldNames = Resource.Statistics.split(",");
									_this6.target.selectedFieldNames = _.intersection(_this6.target.selectedFieldNames, _this6.target.fieldNames);
									var Dimensions = [];
									if (Resource.Dimensions.indexOf(",") === -1) {
										Dimensions.push(Resource.Dimensions);
									} else {
										Dimensions = Resource.Dimensions.split(",");
									};
									_this6.target.dimensionKeys = _.filter(Dimensions, function (key) {
										return key !== 'userId';
									});
									_this6.panel.columns.push({
										text: 'Time',
										value: 'Time'
									});
									var periods = Resource.Periods.split(",");
									if (!periods || periods[0] === 0) {
										var tempPeriod = _this6.datasource.loadDefaultPeroid(project, metric);
										_this6.target.periods = [tempPeriod];
									} else {
										_this6.target.periods = periods;
									}
								} else {
									var metric_list = [];
									_.each(data.Resources.Resource, function (Resource) {
										metric_list.push(Resource.Metric);
									});
									_this6.metric_list = metric_list;
								}
							}
						});
					}
				}]);

				return GenericDatasourceQueryCtrl;
			}(QueryCtrl));

			_export("GenericDatasourceQueryCtrl", GenericDatasourceQueryCtrl);

			GenericDatasourceQueryCtrl.templateUrl = 'partials/query.editor.html';
		}
	};
});
//# sourceMappingURL=query_ctrl.js.map
