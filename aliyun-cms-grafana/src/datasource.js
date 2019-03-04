import _ from "lodash";
import { CmsSigner } from "./signer";

export class GenericDatasource {

	constructor(instanceSettings, $q, backendSrv, templateSrv) {
		this.type = instanceSettings.type;
		this.basePath = instanceSettings.url;
		this.name = instanceSettings.name;
		this.jsonData = instanceSettings.jsonData;
		this.q = $q;
		this.backendSrv = backendSrv;
		this.templateSrv = templateSrv;
		this.default_period = {
			acs_ecs_dashboard: '60',
			acs_rds_dashboard: '300',
			acs_slb_dashboard: '60',
			acs_memcache: '60',
			acs_ocs: '60',
			acs_vpc_eip: '60',
			acs_kvstore: '60',
			acs_mns_new: '300',
			acs_cdn: '60',
			acs_ads: '300',
			acs_mongodb: '300',
			acs_express_connect: '60',
			acs_fc: '60',
			acs_nat_gateway: '60'
		};
	}

	query(options) {
		console.log("hello", options)
		var paramPattern = "/?Action=QueryMetricList&Project={Project}&Metric={Metric}&Period={Period}&" +
			"StartTime={StartTime}&EndTime={EndTime}&Dimensions={Dimensions}&Length=1000";
		var start = new Date(options.range.from).getTime();
		var end = new Date(options.range.to).getTime();
		var queries = [];
		_(options.targets).forEach(target => {
			if(!target.project && target.project === '' && !target.metric && target.metric === '') {
				return;
			}
			var query = {};
			query.Project = target.project;
			query.Metric = target.metric;
			var period = target.period;
			if(period && period > 0 && period % this.loadDefaultPeroid(target.project, target.metric) === 0) {
				query.Period = period;
			} else {
				query.Period = '';
			}
			query.StartTime = start;
			query.EndTime = end;

			var dimension = {};
			_.each(target.dimensions, function(dim) {
				if(dim.value && dim.value !== '') {
					//dimension[dim.key] = this.templateSrv.replace(dim.value);
					dimension[dim.key] = dim.value;
				}
			});
			query.Dimensions = JSON.stringify(dimension);

			_.each(_.keys(query), key => {
				paramPattern = paramPattern.replace('{' + key + '}', this.uriEscape(query[key]));
			});

			var param = {
				path: paramPattern,
				method: "GET"
			};
			queries.push(this.buildRealUrl(param));
		});

		if(_.isEmpty(queries)) {
			var d = this.q.defer();
			d.resolve({
				data: []
			});
			return d.promise;
		}

		var allQueryPromise = _.map(queries, function(query) {
			var options = {
				method: 'GET',
				url: query,
				headers: {
					'Content-Type': 'application/json'
				}
			};
			return this.backendSrv.datasourceRequest(options);
		}.bind(this));

		return this.q.all(allQueryPromise).then(function(allResponse) {
			var result = [];
			_.each(allResponse, function(response, index) {
				var target = options.targets[index];
				var selectedFieldNames = target.selectedFieldNames;
				var resResult = [];
				_.each(selectedFieldNames, selectedFieldName => {
					var datapoints = [];
					var Datapoints = JSON.parse(response.data.Datapoints);
					_.each(Datapoints, Datapoint => {
						let datapoint = [];
						datapoint.push(Datapoint[selectedFieldName], Datapoint.timestamp);
						datapoints.push(datapoint);
					});
					resResult.push({
						"target": selectedFieldName,
						"datapoints": datapoints
					});
				});
				result = result.concat(typeof resResult == 'string' ? JSON.parse(resResult) : resResult);
			});
			return {
				data: result
			};
		});
	}

	uriEscape(string) {
		var output = encodeURIComponent(string);
		output = output.replace(/[^A-Za-z0-9_.~\-%]+/g, escape);
		output = output.replace(/[*]/g, function(ch) {
			return '%' + ch.charCodeAt(0).toString(16).toUpperCase();
		});
		return output;
	}

	ListProjectDetail() {
		var param = {
			path: "/?Action=QueryProjectMeta&PageSize=1000",
			method: "GET"
		};
		return this.backendSrv.datasourceRequest({
			url: this.buildRealUrl(param),
			method: 'GET'
		}).then(response => {
			var data = response.data;
			var result = [];
			_.each(data.Resources.Resource, Resource => {
				result.push(Resource.Project);
			});
			return result;
		});
	}

	ListMetricDetail(parameters) {
		var paramPattern = "/?Action=QueryMetricMeta&Project={Project}&Metric={Metric}&PageSize=1000";
		_.each(_.keys(parameters), key => {
			paramPattern = paramPattern.replace('{' + key + '}', this.uriEscape(parameters[key]));
		});
		var param = {
			path: paramPattern,
			method: "GET"
		};
		return this.backendSrv.datasourceRequest({
			url: this.buildRealUrl(param),
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}

	//	getGroupList() {
	//		var param = {
	//			path: "/?Action=ListMyGroups",
	//			method: "GET"
	//		};
	//		return this.backendSrv.datasourceRequest({
	//			url: this.buildRealUrl(param),
	//			method: 'GET'
	//		}).then(response => {
	//			var data = response.data;
	//			var result = [];
	//			_.each(data.Resources.Resource, Group => {
	//				let group = [];
	//				group.push(Group.GroupName, Group.GroupId);
	//				result.push(group.join("/"));
	//			});
	//			return result;
	//		});
	//	}

	listDimensionValues(query) {
		var paramPattern = "/?Action=QueryMetricLast&Project={Project}&Metric={Metric}&Period={Period}&" +
			"StartTime={StartTime}&EndTime={EndTime}&Dimensions={Dimensions}";
		var dimensions = {};
		for(var index in query.Dimensions) {
			var dim = query.Dimensions[index];
			if(dim.value && dim.value !== '') {
				dimensions[dim.key] = this.templateSrv.replace(dim.value);
			}
		}
		query.Dimensions = JSON.stringify(dimensions);
		if(!query.Period || query.Period === '') {
			if(this.loadDefaultPeroid(query.Project, query.Metric) === undefined) {
				query.Period = '';
			} else {
				query.Period = this.loadDefaultPeroid(query.Project, query.Metric);
			}
		}
		_.each(_.keys(query), key => {
			paramPattern = paramPattern.replace('{' + key + '}', this.uriEscape(query[key]));
		});
		var param = {
			path: paramPattern,
			method: "GET"
		};
		return this.backendSrv.datasourceRequest({
			url: this.buildRealUrl(param),
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			}
		}).then(response => {
			var data = response.data;
			if(data.Code == 200) {
				let dimList = [];
				var Datapoints = JSON.parse(response.data.Datapoints);
				_.each(Datapoints, Datapoint => {
					dimList.push(Datapoint[query.NextKey]);
				});
				return {
					data: dimList
				};
			}
		});
	}

	testDatasource() {
		var param = {
			path: "/?Action=QueryMetricList&Project=acs_ecs_dashboard&Metric=cpu_idle&Length=1",
			method: "GET"
		};
		return this.backendSrv.datasourceRequest({
			url: this.buildRealUrl(param),
			method: 'GET'
		}).then(response => {
			var data = response.data;
			if(data.Code == 200) {
				return {
					status: "success",
					message: "Data source is working",
					title: "Success"
				};
			}
		});
	}

	metricFindQuery(query) {
		var paramPattern = "/?Action=QueryMetricLast&Project={Project}&Metric={Metric}&Period={Period}&" +
			"StartTime={StartTime}&EndTime={EndTime}&Dimensions={Dimensions}";
		var items = query.match(/^dimension_values\((.*)\)/);
		var dimensionValues = [];
		_.each(items[1].split(","), i => {
			dimensionValues.push(i.match(/"(.*)"/)[1]);
		});
		var pm = dimensionValues[0];
		if(!pm || pm.indexOf('/') === -1) {
			return;
		}
		var arr = pm.split("/");
		var dimensionKeys = _.filter(["userId", "instanceId"], key => {
			return key !== 'userId';
		});
		var dimension = {};
		var j = 1;
		for(var k in dimensionKeys) {
			var key = dimensionKeys[k];
			if(dimensionValues[j]) {
				dimension[key] = this.templateSrv.replace(dimensionValues[j]);
				j++;
			}
		}
		if(!dimensionKeys[j - 1]) {
			return [];
		}
		var param = {};
		param.Project = arr[0];
		param.Metric = arr[1];
		param.Period = this.loadDefaultPeroid(arr[0], arr[1]);
		var now = new Date();
		param.StartTime = now.getTime() - 1000 * 60 * 60;
		param.EndTime = now.getTime();
		param.Dimensions = JSON.stringify(dimension);
		_.each(_.keys(param), key => {
			paramPattern = paramPattern.replace('{' + key + '}', this.uriEscape(param[key]));
		});
		var param = {
			path: paramPattern,
			method: "GET"
		};

		return this.backendSrv.datasourceRequest({
			url: this.buildRealUrl(param),
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			}
		}).then(response => {
			var data = response.data;
			if(data.Code == 200) {
				let dimList = [];
				_.each(response.data.Datapoints, Datapoint => {
					dimList.push(Datapoint[dimensionKeys[j - 1]]);
				});
				return this.mapToTextValue(dimList);
			}
		});
	}

	mapToTextValue(result) {
		return _.map(result, (d, i) => {
			if(d && d.text && d.value) {
				return {
					text: d.text,
					value: d.value
				};
			} else if(_.isObject(d)) {
				return {
					text: d,
					value: i
				};
			}
			return {
				text: d,
				value: d
			};
		});
	}

	loadDefaultPeroid(project, metric) {
		if(project === 'acs_ecs_dashboard' &&
			metric.indexOf('_') > 0 &&
			metric.indexOf('InternetOutRate') === -1 &&
			metric.indexOf('VPC') === -1) {
			return '15';
		} else {
			return this.default_period[project];
		}
	}

	buildRealUrl(param) {
		var signer = new CmsSigner({
			accessKeyId: this.jsonData.cmsAccessKey,
			secretAccessKey: this.jsonData.cmsSecretKey
		}, param);
		signer.addAuthorization();
		return this.basePath + signer.request.path;
	}
}