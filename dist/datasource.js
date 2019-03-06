"use strict";

System.register(["lodash", "./signer.js"], function (_export, _context) {
  "use strict";

  var _, CmsSigner, _createClass, GenericDatasource;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  return {
    setters: [function (_lodash) {
      _ = _lodash.default;
    }, function (_signerJs) {
      CmsSigner = _signerJs.CmsSigner;
    }],
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

      _export("GenericDatasource", GenericDatasource = function () {
        function GenericDatasource(instanceSettings, $q, backendSrv, templateSrv) {
          _classCallCheck(this, GenericDatasource);

          this.type = instanceSettings.type;
          this.basePath = instanceSettings.url;
          this.name = instanceSettings.name;
          this.jsonData = instanceSettings.jsonData;
          this.q = $q;
          this.backendSrv = backendSrv;
          this.templateSrv = templateSrv;
          this.headers = { 'Content-Type': 'application/json' };
        }

        _createClass(GenericDatasource, [{
          key: "query",
          value: function query(options) {
            var _this = this;

            var requests = [];
            var promise = Promise.resolve();
            var result = [];
            _(options.targets).forEach(function (target) {
              //非空参数判空处理
              if (!target.project || !target.metric || !target.ycol || !target.xcol) {
                return;
              }
              var project = target.project;
              var metric = target.metric;
              //默认数组
              var ycol = target.ycol;
              var xcol = target.xcol;
              var describe = target.describe;
              if (!describe) {
                describe = '';
              } else {
                describe = describe + ".";
              }
              var query = "/?Action=QueryMetricList&Length=2000";
              var dimensions = "";
              var period = target.period;
              var group = target.group;
              if (!period) {
                period = '';
              }
              if (!group) {
                group = '';
              }
              //定义Promise元数据
              var request = _this.getDimensionsByGroup(group, project).then(function (response) {
                // console.log(JSON.stringify(response));
                //处理group--根据GroupId获取该组下的所有实例Id
                if ('200' == response.code && response.data.length > 0) {
                  var data = response.data;
                  dimensions = dimensions.concat(JSON.stringify(data));
                } else {
                  dimensions = '';
                }
                //自定义监控(acs_custom)、日志监控(acs_logMonitor)自动取消分组功能
                if (project.indexOf("acs_custom") == -1 || project.indexOf("acs_logMonitor") == -1) {
                  dimensions = '';
                }
              }).then(function () {
                //GroupId存在的同时,dimensions存在,则dimensions覆盖Group下的所有实例Id，以dimensions为准
                if (target.dimensions.length == 0) {
                  dimensions = dimensions;
                } else {
                  //自定义监控(acs_custom)、日志监控(acs_logMonitor)处理
                  // console.log(project.indexOf("acs_custom") == -1);
                  // console.log(project.indexOf("acs_logMonitor") == -1);
                  if (project.indexOf("acs_custom") != -1 || project.indexOf("acs_logMonitor") != -1) {
                    var dimensionAcsJson = target.dimensions[0];
                    var dimensionAcsObj = { "groupId": group.toString(),
                      "dimension": dimensionAcsJson.replace(/\&/gi, '%26').replace(/\{/gi, '%7B').replace(/\}/gi, '%7D') };
                    dimensions = JSON.stringify(dimensionAcsObj);
                  } else {
                    //数组对象
                    var dimensionArray = [];
                    var dimensionJson = target.dimensions;
                    var i = dimensionJson.length;
                    while (i--) {
                      dimensionArray.push({ "instanceId": dimensionJson[i] });
                    }
                    dimensions = '';
                    dimensions = dimensions.concat(JSON.stringify(dimensionArray));
                  }
                }
                //拼接查询参数
                var queryConcat = query + "&Project=" + project + "&Metric=" + metric + "&Period=" + period + "&Dimensions=" + dimensions + "&StartTime=" + parseInt(options.range.from._d.getTime()) + "&EndTime=" + parseInt(options.range.to._d.getTime());
                var param = {
                  path: queryConcat,
                  method: "GET"
                };
                // 签名已拼接的待查询URL
                query = _this.buildRealUrl(param);
                // console.log("查看query的值："+query);
                if (_.isEmpty(query)) {
                  var d = _this.q.defer();
                  d.resolve({ data: [] });
                  return d.promise;
                }
                // 根据URL发起请求
                return _this.backendSrv.datasourceRequest({
                  url: query,
                  method: 'GET',
                  headers: _this.headers
                }).then(function (response) {
                  if (response.status == '200' && response.data.Code == '200') {
                    // 处理返回结果 (需优化)
                    var resResult = [];
                    // 解析返回的Datapoints数据集
                    var dataDatapoints = angular.fromJson(response.data.Datapoints);
                    // console.log("长度"+dataDatapoints.length);
                    // console.log(JSON.stringify(dataDatapoints));
                    // 处理Grafana所需的target值
                    var i = ycol.length;
                    // 处理Target组的所需返回结果集
                    while (i--) {
                      var datapoints = [];
                      var ycolTarget = ycol[i];
                      // console.log(ycolTarget);
                      // console.log(xcol);
                      // 封装返回目标的第一层数组值
                      _.each(dataDatapoints, function (Datapoint) {
                        var datapoint = [];
                        datapoint.push(Datapoint[ycolTarget], Datapoint[xcol]);
                        // 封装返回目标的第二层数组值
                        datapoints.push(datapoint);
                      });
                      // 封装返回目标的第三层数组值
                      resResult.push({
                        "target": describe + ycolTarget,
                        "datapoints": datapoints
                      });
                      // console.log(JSON.stringify(resResult));
                    }
                    // 转对象封装
                    result = result.concat(typeof resResult == 'string' ? JSON.parse(resResult) : resResult);
                  }
                }).catch(function (error) {
                  console.log(error);
                });
              });
              requests.push(request);
            });
            // 统一单独处理返回值(可优化)
            return Promise.all(requests.map(function (p) {
              return p.catch(function (e) {
                return e;
              });
            })).then(function (requests) {
              return { data: result };
            });
          }
        }, {
          key: "testDatasource",
          value: function testDatasource() {
            var param = {
              path: "/?Action=AccessKeyGet",
              method: "GET"
            };
            return this.backendSrv.datasourceRequest({
              url: this.buildRealUrl(param),
              method: 'GET'
            }).then(function (response) {
              // console.log(response);
              var data = response.data;
              if (data.ErrorCode == 200 && data.Success == true) {
                return { status: "success", message: "Data source is working", title: "Success" };
              }
            });
          }
        }, {
          key: "annotationQuery",
          value: function annotationQuery(options) {}
        }, {
          key: "metricFindQuery",
          value: function metricFindQuery(options) {}
        }, {
          key: "buildRealUrl",
          value: function buildRealUrl(param) {
            var signer = new CmsSigner({
              accessKeyId: this.jsonData.cmsAccessKey,
              secretAccessKey: this.jsonData.cmsSecretKey
            }, param);
            signer.addAuthorization();
            return this.basePath + signer.request.path;
          }
        }, {
          key: "mapToTextValue",
          value: function mapToTextValue(result) {
            return _.map(result, function (d, i) {
              if (d && d.text && d.value) {
                return { text: d.text, value: d.value };
              } else if (_.isObject(d)) {
                return { text: d, value: i };
              }
              return { text: d, value: d };
            });
          }
        }, {
          key: "getProject",
          value: function getProject() {
            var _this2 = this;

            var param = {
              path: "/?Action=QueryProjectMeta&PageNumber=1&PageSize=100",
              method: "GET"
            };
            return this.backendSrv.datasourceRequest({
              url: this.buildRealUrl(param),
              method: 'GET'
            }).then(function (response) {
              var result = [];
              var data = response.data;
              if (data.ErrorCode == 200 && data.Success == true) {
                // console.log(JSON.stringify(data));
                var projectArray = data.Resources.Resource;
                // console.log(JSON.stringify(projectArray));
                var i = projectArray.length;
                // console.log(i);
                while (i--) {
                  var projectInfo = projectArray[i];
                  // console.log(projectInfo);
                  var project = [];
                  project.push(projectInfo.Project);
                  result.push(project);
                }
              }
              // console.log(this.jsonData.uid);
              //增加自定义监控、日志监控选项
              var acs_param = {
                path: "/?Action=AccessKeyGet",
                method: "GET"
              };
              return _this2.backendSrv.datasourceRequest({
                url: _this2.buildRealUrl(acs_param),
                method: 'GET'
              }).then(function (response) {
                var data = response.data;
                if (data.ErrorCode == 200 && data.Success == true) {
                  var projectAcsLog = [];
                  projectAcsLog.push("acs_logMonitor_" + data.UserId);
                  result.push(projectAcsLog);
                  var projectAcsCustom = [];
                  projectAcsCustom.push("acs_customMetric_" + data.UserId);
                  result.push(projectAcsCustom);
                }
                return _.map(result, function (d, i) {
                  return { text: d, value: d };
                });
              });
            }).catch(function (error) {
              console.log(error);
              return;
            });
          }
        }, {
          key: "getMetrics",
          value: function getMetrics(project) {
            var param = {
              path: "/?Action=QueryMetricMeta&PageNumber=1&PageSize=150&Project=" + project,
              method: "GET"
            };
            return this.backendSrv.datasourceRequest({
              url: this.buildRealUrl(param),
              method: 'GET'
            }).then(function (response) {
              var data = response.data;
              if (data.ErrorCode == 200 && data.Success == true) {
                var result = [];
                // console.log(JSON.stringify(data));
                var resource = data.Resources.Resource;
                // console.log(JSON.stringify(projectArray));
                var i = resource.length;
                // console.log(i);
                while (i--) {
                  var resourceInfo = resource[i];
                  // console.log(projectInfo);
                  var metric = [];
                  metric.push(resourceInfo.Metric);
                  result.push(metric);
                }
                return _.map(result, function (d, i) {
                  return { text: d, value: d };
                });
              }
            }).catch(function (error) {
              console.log(error);
              return;
            });
          }
        }, {
          key: "getPeriod",
          value: function getPeriod(project, metric) {
            var _this3 = this;

            var param = {
              path: "/?Action=QueryMetricMeta&PageNumber=1&PageSize=1&Project=" + project + "&Metric=" + metric,
              method: "GET"
            };
            return this.backendSrv.datasourceRequest({
              url: this.buildRealUrl(param),
              method: 'GET'
            }).then(function (response) {
              var data = response.data;
              if (data.ErrorCode == 200 && data.Success == true) {
                var result = [];
                var period = [];
                var resource = data.Resources.Resource;
                if (resource.length == 0 || !resource[0].Periods) {
                  return _this3.mapToTextValue(period);
                }
                period = resource[0].Periods.split(",");
                // console.log(period);
                return _this3.mapToTextValue(period);
              }
            }).catch(function (error) {
              console.log(error);
              return;
            });
          }
        }, {
          key: "getStatistics",
          value: function getStatistics(project, metric, ycol) {
            var _this4 = this;

            var param = {
              path: "/?Action=QueryMetricMeta&PageNumber=1&PageSize=1&Project=" + project + "&Metric=" + metric,
              method: "GET"
            };
            return this.backendSrv.datasourceRequest({
              url: this.buildRealUrl(param),
              method: 'GET'
            }).then(function (response) {
              var data = response.data;
              if (data.ErrorCode == 200 && data.Success == true) {
                var result = [];
                var statistics = [];
                var resource = data.Resources.Resource;
                if (resource.length == 0 || !resource[0].Statistics) {
                  return _this4.mapToTextValue(statistics);
                }
                statistics = resource[0].Statistics.split(",");
                return _this4.mapToTextValue(statistics);
              }
            }).catch(function (error) {
              console.log(error);
              return;
            });
          }
        }, {
          key: "getGroups",
          value: function getGroups() {
            var param = {
              path: "/?Action=ListMyGroups&PageNumber=1&PageSize=1000",
              method: "GET"
            };
            return this.backendSrv.datasourceRequest({
              url: this.buildRealUrl(param),
              method: 'GET'
            }).then(function (response) {
              var data = response.data;
              if (data.ErrorCode == 200 && data.Success == true) {
                var result = [];
                var resource = data.Resources.Resource;
                var i = resource.length;
                while (i--) {
                  var group = resource[i];
                  var groupInfo = [];
                  groupInfo.push(group.GroupId, group.GroupName + " / " + group.GroupId);
                  result.push(groupInfo);
                }
                return _.map(result, function (d, i) {
                  return { text: d[1], value: d[0] };
                });
              }
            }).catch(function (error) {
              console.log(error);
              return;
            });
          }
        }, {
          key: "getDimensions",
          value: function getDimensions(project, metric, group, dimensions, period, query) {
            var result = [];
            if (!group || typeof group == 'string') {
              group = 0;
            }
            if (isNaN(parseInt(group))) {
              group = 0;
            }
            if (project.indexOf("acs_customMetric") != -1 || project.indexOf("acs_logMonitor") != -1) {
              return;
            }
            if (group != 0) {
              var param = {
                path: "/?Action=ListMyGroupInstances&PageNumber=1&PageSize=1000&GroupId=" + parseInt(group),
                method: "GET"
              };
              return this.backendSrv.datasourceRequest({
                url: this.buildRealUrl(param),
                method: 'GET'
              }).then(function (response) {
                // console.log(JSON.stringify(response));
                var data = response.data;
                if (data.ErrorCode == 200 && data.Success == true) {
                  var resource = data.Resources.Resource;

                  var i = resource.length;
                  while (i--) {
                    var instance = resource[i];
                    var instanceInfo = [];
                    //判断空对象处理
                    if (!instance.InstanceId) {
                      continue;
                    }
                    // 去掉页面已选择实例
                    if (_.includes(dimensions, instance.InstanceId)) {
                      continue;
                    }
                    instanceInfo.push(instance.InstanceId);
                    result.push(instanceInfo);
                  }
                  return _.map(result, function (d, i) {
                    return { text: d, value: d };
                  });
                }
              }).catch(function (error) {
                console.log(error);
                return;
              });
            } else {
              var endTime = new Date().getTime();
              var startTime = endTime - 1 * 60 * 60 * 1000;
              var param = {
                path: "/?Action=QueryMetricLast&Page=1&Length=1000&Period=" + period + "&Project=" + project + "&Metric=" + metric + "&StartTime=" + startTime + "&EndTime=" + endTime,
                method: "GET"
              };
              return this.backendSrv.datasourceRequest({
                url: this.buildRealUrl(param),
                method: 'GET'
              }).then(function (response) {
                var data = response.data;
                // console.log(JSON.stringify(data));
                var datapoints = JSON.parse(data.Datapoints);
                // console.log(JSON.stringify(datapoints));
                var i = datapoints.length;
                if (i > 0) {
                  while (i--) {
                    var datapoint = datapoints[i];
                    var datapointInfo = [];
                    //判断空对象处理
                    if (!datapoint.instanceId) {
                      continue;
                    }
                    // 去掉页面已选择实例
                    if (_.includes(dimensions, datapoint.instanceId)) {
                      continue;
                    }
                    datapointInfo.push(datapoint.instanceId);
                    result.push(datapointInfo);
                  }
                  return _.map(result, function (d, i) {
                    return { text: d, value: d };
                  });
                }
              }).catch(function (error) {
                console.log(error);
                return;
              });
            }
          }
        }, {
          key: "getDimensionsByGroup",
          value: function getDimensionsByGroup(group) {
            var result = [];
            if (!group || typeof group == 'string') {
              group = 0;
            }
            if (isNaN(parseInt(group))) {
              group = 0;
            }
            var param = {
              path: "/?Action=ListMyGroupInstances&PageNumber=1&PageSize=1000&GroupId=" + parseInt(group),
              method: "GET"
            };
            return this.backendSrv.datasourceRequest({
              url: this.buildRealUrl(param),
              method: 'GET'
            }).then(function (response) {
              var dimensions = [];
              var data = response.data;
              if (data.ErrorCode == 200 && data.Success == true) {
                var resource = data.Resources.Resource;
                var i = resource.length;
                while (i--) {
                  var instance = resource[i];
                  dimensions.push({ "instanceId": instance.InstanceId });
                }
                result = result.concat(typeof dimensions == 'string' ? JSON.parse(dimensions) : dimensions);
                return { data: result, code: '200' };
              } else {
                return { data: result, code: '400' };
              }
            }).catch(function (error) {
              console.log(error);
              return { data: result, code: '400' };
            });
          }
        }, {
          key: "isNotEmpty",
          value: function isNotEmpty(obj) {
            // 判断对象是否为空对象
            for (var name in obj) {
              return true;
            } // 不为空
            return false; // 为空
          }
        }]);

        return GenericDatasource;
      }());

      _export("GenericDatasource", GenericDatasource);
    }
  };
});
//# sourceMappingURL=datasource.js.map
