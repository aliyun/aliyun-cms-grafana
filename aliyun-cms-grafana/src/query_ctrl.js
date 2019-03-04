import { QueryCtrl } from "app/plugins/sdk";
import "./css/query-editor.css!";

export class GenericDatasourceQueryCtrl extends QueryCtrl {

	constructor($scope, $injector) {

		super($scope, $injector);
		this.scope = $scope;
		this.project_list = this.project_list || [];
		this.metric_list = this.metric_list || [];
		this.metric_name_list = this.metric_name_list || [];
		this.fieldName = this.fieldName || '';
		this.panel.columns = this.panel.columns || [];
		this.dimensionValues = this.dimensionValues || [];
		this.oldDimensionKeys = [];

		this.init = function() {
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
		this.init();

		this.projectChanged = function() {
			if(!this.checkProject()) {
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

		this.metricChanged = function() {
			if(!this.checkMetric()) {
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
			if(!this.metric_name_list || this.metric_name_list.length === 0) {
				var metrics = [];
				_.each(this.metric_list, metric => {
					metrics.push(metric);
				});
				this.metric_name_list = _.uniq(metrics);
			}
			var panelTitle = this.panel.title;
			if(!panelTitle || panelTitle === '' || panelTitle === 'Panel Title' ||
				_.includes(this.metric_name_list, this.panel.title)) {
				this.panel.title = this.target.metric;
			}

			this.panel.columns = [];
		};

		this.ensureDimension = function() {
			if(!this.checkProject()) {
				return;
			}
			var dimensionKeys = this.target.dimensionKeys;
			if(dimensionKeys.length !== 0) {
				_.each(dimensionKeys, dimensionKey => {
					this.getDimensionValues(dimensionKey);
				});
			}
			if(!_.isEqual(dimensionKeys, this.oldDimensionKeys)) {
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

		this.fieldNameChanged = function(fieldName) {
			if(!fieldName || !_.includes(this.target.fieldNames, fieldName)) {
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

		this.removeSelectedField = function($event, feild) {
			this.target.selectedFieldNames = _.without(this.target.selectedFieldNames, feild);
			_.remove(this.panel.columns, {
				text: feild,
				value: feild
			});
			this.onChangeInternal();
		};

		this.onTargetBlur = function(key, index) {
			//判断下标合法性
			var len = this.target.dimensionKeys.length;
			if(index >= len) {
				return;
			}

			//截除下级dimension信息
			var start = index + 1;
			var end = len - index;
			this.target.dimKVs.splice(start, end);

			//判断dimensionValue合法性
			var dimValue = this.target.dimKVs[index].value;
			if(!dimValue) {
				this.onChangeInternal();
				return;
			}

			//更新dimension键值列表
			this.target.dimensions = [];
			_.each(this.target.dimKVs, dimKV => {
				this.target.dimensions.push(dimKV);
			});

			//表格类型的时序数据title添加dimension信息
			if(this.panel.type === 'table') {
				if(this.metric_name_list.length === 0) {
					this.ListProjectDetail();
					this.ListMetricDetail();
				}
				//没有指定title才修改
				if(!this.panel.title ||
					this.panel.title === '' ||
					this.panel.title === 'Panel Title' ||
					_.includes(this.metric_name_list, this.panel.title) ||
					_.includes(this.metric_name_list, this.panel.title.split("_")[0])) {
					this.panel.title = this.target.metric;
					_.each(this.target.dimensions, dimension => {
						this.panel.title += ('_' + dimension.value);
					});
				}
			}

			this.onChangeInternal();

			//判断dimensionKey是否重复
			var dimKs = [];
			_.each(this.target.dimKVs, kv => {
				dimKs.push(kv.key);
			});
			dimKs = _.uniq(dimKs);
			var nextKey = this.target.dimensionKeys[index + 1];
			if(!nextKey || _.includes(dimKs, nextKey)) {
				return;
			}

			//将新键值推送入dimKVs
			this.target.dimKVs.push({
				key: nextKey,
				value: ''
			});

			this.dimensionValues = [];
		};
	}

	onChangeInternal() {
		if(this.target.selectedFieldNames.length > 0 &&
			this.target.project && this.target.metric) {
			this.panelCtrl.refresh(); // Asks the panel to refresh data.
		}
	}

	checkProject() {
		return this.project_list.length > 0 &&
			this.target.project &&
			_.includes(this.project_list, this.target.project);
	}

	checkMetric() {
		return this.metric_list.length > 0 &&
			this.target.metric &&
			_.includes(this.metric_list, this.target.metric);
	}

	getDimensionValues(nextKey) {
		if(!nextKey || !this.target.project || this.target.project === '' || !this.target.metric || this.target.metric === '') {
			return;
		}
		var dimKeyIndex = _.indexOf(this.target.dimensionKeys, nextKey);
		if(dimKeyIndex >= 1 && this.target.dimensionKeys[dimKeyIndex - 1].value === 'no result') {
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

		this.datasource.listDimensionValues(query).then(result => {
			var dimensionValues = [];
			var dimData = result.data;
			if(!dimData || dimData.length === 0) {
				dimensionValues.push('no result');
			} else {
				dimensionValues = dimData;
			}
			this.dimensionValues = dimensionValues;
		});
	}

	ListProjectDetail() {
		this.datasource.ListProjectDetail().then(result => {
			this.project_list = result;
		});
	}

	ListMetricDetail(project, metric) {
		this.datasource.ListMetricDetail({
			Project: project,
			Metric: metric
		}).then(result => {
			var data = result.data;
			if(data.ErrorCode === 200 && data.Success === true) {
				if(metric != "") {
					var Resource = data.Resources.Resource[0];
					this.target.fieldNames = Resource.Statistics.split(",");
					this.target.selectedFieldNames = _.intersection(this.target.selectedFieldNames, this.target.fieldNames);
					var Dimensions = [];
					if(Resource.Dimensions.indexOf(",") === -1) {
						Dimensions.push(Resource.Dimensions)
					} else {
						Dimensions = Resource.Dimensions.split(",");
					};
					this.target.dimensionKeys = _.filter(Dimensions, key => {
						return key !== 'userId';
					});
					this.panel.columns.push({
						text: 'Time',
						value: 'Time'
					});
					var periods = Resource.Periods.split(",");
					if(!periods || periods[0] === 0) {
						var tempPeriod = this.datasource.loadDefaultPeroid(project, metric);
						this.target.periods = [tempPeriod];
					} else {
						this.target.periods = periods;
					}
				} else {
					var metric_list = [];
					_.each(data.Resources.Resource, Resource => {
						metric_list.push(Resource.Metric);
					});
					this.metric_list = metric_list;
				}
			}
		});
	}
}

GenericDatasourceQueryCtrl.templateUrl = 'partials/query.editor.html';