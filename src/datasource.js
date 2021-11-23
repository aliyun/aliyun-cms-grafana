import _ from "lodash";
import { Util } from "./util.js";
import { CmsSigner } from "./signer.js";

export class GenericDatasource {
  constructor(instanceSettings, $q, backendSrv, templateSrv) {
	this.type = instanceSettings.type;
	this.datasourceId = instanceSettings.id;
	this.aliyunUserId = instanceSettings.jsonData.userId;
    this.basePath = instanceSettings.url;
    this.name = instanceSettings.name;
    this.jsonData = instanceSettings.jsonData;
    this.q = $q;
    this.backendSrv = backendSrv;
    this.templateSrv = templateSrv;
    this.util = new Util(templateSrv);
    this.headers = { "Content-Type": "application/json" };
    this.cmsVersion = "2018-03-08";
    this.ecsVersion = "2014-05-26";
    this.ecsBasePath = "https://ecs.aliyuncs.com";
    this.rdsVersion = "2014-08-15";
    this.rdsBasePath = "https://rds.aliyuncs.com";
    this.cacheMeta = new Map();
  }

  query(options) {
    var requests = [];
    var result = [];
    options.targets.forEach((target) => {
      //非空参数判空处理
      if (!target.project || !target.metric || !target.ycol || !target.xcol) {
        return;
      }
      //默认数据
      var ycol = target.ycol;
      var xcol = target.xcol;
      var describe = !target.describe ? target.describe : target.describe + ".";
      //处理模版
      var project = this.util.exists(target.project) ? this.util.resolve(target.project, {}) : target.project;
      var metric = this.util.exists(target.metric) ? this.util.resolve(target.metric, {}) : target.metric;
      var period = this.util.exists(target.period) ? this.util.resolve(target.period, {}) : target.period;
      var group = this.util.exists(target.group) ? this.util.resolve(target.group, {}) : target.group;
      //处理数组模版
      var dimensions = "";

      var dimensions_variables = [];

      target.dimensions.forEach((dimension) => {
        this.util.exists(dimension) ? dimensions_variables.push(this.util.resolve(dimension, {})) : dimensions_variables.push(dimension);
      });
      var ycol_variables = [];
      ycol.forEach((y_col) => {
        y_col.indexOf("$") != -1 ? ycol_variables.push(this.util.resolve(y_col, {})) : ycol_variables.push(y_col);
      });
      ycol = ycol_variables.length > 0 ? ycol_variables : ycol;

      //自定义监控(acs_custom)、日志监控(acs_logMonitor)处理,只取下标为0的数据
      if (project.indexOf("acs_custom") != -1 || project.indexOf("acs_logMonitor") != -1) {
        var dimensionAcsJson = target.dimensions[0];
        var dimensionAcsObj = {
          groupId: group.toString(),
          dimension: dimensionAcsJson.replace(/\&/gi, "%26").replace(/\{/gi, "%7B").replace(/\}/gi, "%7D"),
        };
        dimensions = JSON.stringify(dimensionAcsObj);
      } else {
        //正常数据
        dimensions = "";
        dimensions_variables.forEach((dimension, i) => {
          if (typeof dimension == "string") {
            dimension = dimension.includes("{") ? dimension : "{" + dimension;
            dimension = dimension.includes("}") ? dimension : dimension + "}";
            // dimension = dimension.includes("\\") ? dimension.replace("\\/gi", "\\\\") : dimension;
            dimensions += dimension + ",";
          } else {
            dimension.forEach((dimension_i) => {
              dimension_i = dimension_i.includes("{") ? dimension_i : "{" + dimension_i;
              dimension_i = dimension_i.includes("}") ? dimension_i : dimension_i + "}";
              // dimension = dimension.includes("\\") ? dimension.replace("\\/gi", "\\\\") : dimension;

              dimensions += dimension_i + ",";
            });
          }
        });
        dimensions = dimensions.substring(0, dimensions.length - 1);
        dimensions = "[" + dimensions + "]";
        dimensions = dimensions.replace(/\&/gi, "%26").replace(/\{/gi, "%7B").replace(/\}/gi, "%7D");
      }
      var target_keys = [];
      var resource = "";
      if(this.isEmpty(project) || this.isEmpty(metric) || this.isEmpty(xcol) || ycol.length == 0){
        return;
      }
      this.queryMetricMeta(project, metric).then(response => {
        resource = response;
        if (resource.length == 0 || this.isEmpty(resource[0].Dimensions)) {
          return;
        }
        var target_key_arr = resource[0].Dimensions.split(",");
        target_key_arr.forEach(value =>{
          if(target_key_arr.length == 1){
            target_keys.push(value);
          }else{
            if(value != "userId"){
              target_keys.push(value);
            }
          }
        })
      });
      
      //拼接url参数
      var queryConcat = "/?Action=QueryMetricList&Length=1000&Project=" + project + "&Metric=" + metric + "&Period=" + period
         + "&Dimensions=" + dimensions + "&StartTime=" + parseInt(options.range.from._d.getTime()) + "&EndTime=" + parseInt(options.range.to._d.getTime());

      //定义Promise元数据、根据URL发起请求
      var request = this.doNextToken(queryConcat, "", 0, "list").then((response) => {
        var resResult = [];
        this.dataGroupByKeys(response, target_keys).then(dataMap => {
          dataMap.forEach((value, key) => {

            ycol.map((ycolTarget) => {
              var dataPoints = [];
              
              value.forEach(valueObj =>{
                var dataPoint = [];
                dataPoint.push(valueObj[ycolTarget], valueObj[xcol]);
                  // 封装返回目标的第二层数组值
                  dataPoints.push(dataPoint);
                // 封装返回目标的第三层数组值
              })

              resResult.push({
                target: describe + key + "." + ycolTarget,
                datapoints: dataPoints,
              });
            });
          });

          result = result.concat(typeof resResult == "string" ? JSON.parse(resResult) : resResult);
        });
      });
      requests.push(request);
    });

    // 统一单独处理返回值
    return Promise.all(requests.map((p) => p.catch((e) => e))).then(() => {
      return { data: result };
    });
  }

  async dataGroupByKeys(list, keys) {
    let tmpMap = new Map();
    for(let i = 0; i < list.length; i++){
      let dataPoint = list[i];
      
      let key_obj = {};
      let key_target = dataPoint[keys[0]];
      for(let j = 0; j < keys.length; j++){
        let key = keys[j];
        let value = dataPoint[key];
        key_obj[key] = value;

        if(j > 0){
          key_target += "_" + value;
        }
      }
      let value_arr = [];
      if(tmpMap.has(key_target)){
        value_arr = tmpMap.get(key_target);
      }

      value_arr.push(dataPoint);
      tmpMap.set(key_target, value_arr);
    }
    return tmpMap;
  }

  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async doNextToken(queryConcat, cursor, count, type) {
    var path = "";
    if (this.isEmpty(cursor)) {
      path = queryConcat;
    } else {
      path = queryConcat + "&Cursor=" + cursor;
    }
    var param = {
      path: path,
      method: "GET",
    };
    // 签名已拼接的待查询URL
    var query = this.buildRealUrl(param);
    if (_.isEmpty(query)) {
      var d = this.q.defer();
      d.resolve({ data: [] });
      return d.promise;
    }
    if("list" == type){
      await this.wait(1000);
    }else if("last" == type){
      await this.wait(100);
    }
    //定义Promise元数据、根据URL发起请求
    return this.backendSrv.datasourceRequest({
        url: query,
        method: "GET",
        headers: this.headers,
      }).then((response) => {
        var result = [];
        if (response.status == "200" && response.data.Code == "200") {
          result = angular.fromJson(response.data.Datapoints);
          if(count > 20){
            return result;
          }
          count++;
          var nextToken = response.data.Cursor;
          if (this.isEmpty(response.data.Cursor)) {
            return result;
          } else {
            return this.doNextToken(queryConcat, nextToken, count, type).then((data) => {
              return result.concat(data); 
            });
          }
        }
        return result;
      }).catch(() => {
        return [];
      });
  }

  // 测试连接数据源接口
  testDatasource() {
    var param = {
      path: "?Action=QueryMetricMeta&PageNumber=1&PageSize=1&Project=acs_ecs_dashboard",
      method: "GET",
    };
    return this.backendSrv.datasourceRequest({
        url: this.buildRealUrl(param),
        method: "GET",
      }).then((response) => {
        var data = response.data;
        if (data.Code == "200" && data.Success == true) {
          return {
            status: "success",
            message: "Data source is working",
            title: "Success",
          };
        }else{
			return {
				status: "failure",
				message: "Data source is not working",
				title: "Failure",
			  };
		}
      });
  }

  annotationQuery(options) {}

  metricFindQuery(options) {
    var result = [];
    //接受一个参数
    var namespacesQuery = options.match(/^namespaces\(([^\)]+?)(,\s?([^,]+?))?\)/);
    namespacesQuery =
      namespacesQuery == null ? options.match(/^namespace\(([^\)]+?)(,\s?([^,]+?))?\)/) : namespacesQuery;
    if (namespacesQuery != null) {
      var filter = this.util.templateToStr(namespacesQuery[1]);
      return this.getProject().then((namespaces) => {
        result = namespaces;
        if (!this.isEmpty(filter)) {
          result = [];
          namespaces.map((namespace) => {
            if (namespace.text.includes(filter)) {
              result.push(namespace);
            }
          });
        }
        return result;
      });
    }

    //接受二个参数
    var metricsQuery = options.match(/^metrics\(([^,]+?),\s?([^,]+?)\)/);
    metricsQuery =
      metricsQuery == null ? options.match(/^metric\(([^,]+?),\s?([^,]+?)\)/) : metricsQuery;
    if (metricsQuery != null) {
      var namespace = this.util.templateToStr(metricsQuery[1]);
      var filter = this.util.templateToStr(metricsQuery[2]);

      result = [];
      return this.getMetrics(namespace).then((metrics) => {
        result = metrics;
        if (!this.isEmpty(filter)) {
          result = [];
          metrics.map((metric) => {
            if (metric.text.includes(filter)) {
              result.push(metric);
            }
          });
        }
        return result;
      });
    }

    //接受四个参数，过滤Tag提供key、value选择
    var tagFilterQuery = options.match(/^tagFilter\(([^,]+?),\s?([^,]+?),\s?([^,]+?),\s?([^,]+?)(,\s?(.+))?\)/);
    tagFilterQuery =
      tagFilterQuery == null ? options.match(/^tagsFilter\(([^,]+?),\s?([^,]+?),\s?([^,]+?),\s?([^,]+?)(,\s?(.+))?\)/) : tagFilterQuery;
    if (tagFilterQuery != null) {
      var type = this.util.templateToStr(tagFilterQuery[1]);
      var regionId = this.util.templateToStr(tagFilterQuery[2]);
      var tagType = this.isEmpty(tagFilterQuery[3]) ? "" : tagFilterQuery[3];
      var tagKey = this.isEmpty(tagFilterQuery[4]) ? "" : tagFilterQuery[4];
      var path = "/?Action=DescribeTags&PageNumber=1&PageSize=100&RegionId=" + regionId;
      var tagKeyFilter = [];
      if(tagKey){
        path = "/?Action=DescribeTags&PageNumber=1&PageSize=100&RegionId=" + regionId + "&Tag.1.Key=" + tagKey;
        if(tagKey.indexOf("&Tag.2.Key=") != -1){
          var tagKeyArry = tagKey.split("&");
          tagKeyArry.forEach(tagKeyInd => {
            tagKeyFilter.push(tagKeyInd.substring(tagKeyInd.indexOf("Key=") == -1 ? 0 : tagKeyInd.indexOf("Key=") + 4));
          })
        }else{
          tagKeyFilter.push(tagKey);
        }

        if(tagKey.indexOf("Tag.1.Key=") != -1){
          path = "/?Action=DescribeTags&PageNumber=1&PageSize=100&RegionId=" + regionId + "&" + tagKey;
        }
        if(tagKey.indexOf("PageNumber=") != -1){
          path = "/?Action=DescribeTags&PageSize=100&RegionId=" + regionId + "&" + tagKey;
        }
        if(tagKey.indexOf("&") == 0){
          path = "/?Action=DescribeTags&PageSize=100&RegionId=" + regionId + tagKey;
        }
      }
      var nextToken = "";
      result = [];
      return this.tagsFilter(type.toUpperCase(), nextToken, path, tagType, tagKeyFilter).then((tagsList) => {
        return this.util.arrayToMap(tagsList);
      });
    }

    //接受四个参数,暂不支持数组，提供dimensions选择
    var dimensionsQuery = options.match(/^dimension\(([^,]+?),\s?([^,]+?),\s?([^,]+?),\s?([^,]+?)(,\s?(.+))?\)/);
    dimensionsQuery =
      dimensionsQuery == null ? options.match(/^dimensions\(([^,]+?),\s?([^,]+?),\s?([^,]+?),\s?([^,]+?)(,\s?(.+))?\)/) : dimensionsQuery;
    if (dimensionsQuery != null) {
      var namespace = this.util.templateToStr(dimensionsQuery[1]);
      var metric = this.util.templateToStr(dimensionsQuery[2]);

      var instanceId = dimensionsQuery[3];
      var instanceId_array = this.util.exists(instanceId) ? this.util.resolve(instanceId, {}) : [];
      if (instanceId_array.length == 0) {
        if (this.isEmpty(instanceId)) {
          instanceId_array = [];
        } else {
          instanceId_array = this.util.strToArray(instanceId);
        }
      }
      var filter = dimensionsQuery[4];
      var filter_array = this.util.exists(filter) ? this.util.resolve(filter, {}) : [];
      if (filter_array.length == 0) {
        if (this.isEmpty(filter)) {
          filter_array = [];
        } else {
          filter_array = this.util.strToArray(filter);
        }
      }
      result = [];
      return this.getDimensions(namespace, metric, "", "", []).then(
        (dimensions) => {
          var is_instanceId_bool = this.isEmpty(instanceId);
          var is_filter_bool = this.isEmpty(filter);
          if (is_instanceId_bool) {
            result = dimensions;
          } else {
            var instanceId_result = [];
            dimensions.map((dimension) => {
              instanceId_array.forEach((i) => {
                if (dimension.text.includes(i)) {
                  instanceId_result.push(dimension);
                }
              });
            });
            if (is_filter_bool) {
              result = instanceId_result;
            } else {
              instanceId_result.map((dimension) => {
                filter_array.forEach((i) => {
                  if (dimension.text.includes(i)) {
                    result.push(dimension);
                  }
                });
              });
            }
          }
          return result;
        }
      );
    }

    //接受5个参数,暂不支持数组，提供tag选择
    var tagQuery = options.match(/^tag\(([^,]+?),\s?([^,]+?),\s?([^,]+?),\s?([^,]+?),\s?([^,]+?)(,\s?(.+))?\)/);
    tagQuery =
      tagQuery == null ? options.match(/^tags\(([^,]+?),\s?([^,]+?),\s?([^,]+?),\s?([^,]+?),\s?([^,]+?)(,\s?(.+))?\)/) : tagQuery;
    if (tagQuery != null) {
      var resourceId = tagQuery[4];
      var resourceId_array = this.util.exists(resourceId) ? this.util.resolve(resourceId, {}) : [];
      if (resourceId_array.length == 0) {
        if (this.isEmpty(resourceId)) {
          resourceId_array = [];
        } else {
          resourceId_array = [];
          resourceId_array = this.util.strToArray(resourceId);
        }
      }
      var tag = tagQuery[5];
      var tag_array = this.util.exists(tag) ? this.util.resolve(tag, {}) : [];
      if (tag_array.length == 0) {
        if (this.isEmpty(tag)) {
          tag_array = [];
        } else {
          tag_array = [];
          tag_array = this.util.strToArray(tag);
        }
      }
      return this.listTagResources(
        tagQuery[1].toUpperCase(),
        tagQuery[2],
        tagQuery[3],
        resourceId_array,
        tag_array
      );
    }
    return [];
  }

  //返回所有的Project,QueryProjectMeta的API无自定义监控project、日志监控project，已拼接
  getProject() {
    var param = {
      path: "?Action=QueryProjectMeta&PageNumber=1&PageSize=1000",
      method: "GET",
    };
    return this.backendSrv
      .datasourceRequest({
        url: this.buildRealUrl(param),
        method: "GET",
      })
      .then((response) => {
        var result = [];
        var data = response.data;
        if (data.Code == "200" && data.Success == true) {
          data.Resources.Resource.map((resource) => {
            if (!this.isEmpty(resource.Namespace)) {
              result.push(resource.Namespace);
            }
          });
		}
        //增加自定义监控、日志监控选项
		result.push("acs_logMonitor_" + this.aliyunUserId);
		result.push("acs_customMetric_" + this.aliyunUserId);
		return this.util.arrayToMap(result);
      })
      .catch(function (error) {
        console.log(error);
        return;
      });
  }

  //根据Project返回对应的所有的Metrics,无自定义监控、日志监控project对应的Metrics
  getMetrics(project) {
    var param = {
      path:
        "?Action=QueryMetricMeta&PageNumber=1&PageSize=1000&Project=" +
        project,
      method: "GET",
    };
    return this.backendSrv
      .datasourceRequest({
        url: this.buildRealUrl(param),
        method: "GET",
      })
      .then((response) => {
        var data = response.data;
        if (data.Code == "200" && data.Success == true) {
          var result = [];
          data.Resources.Resource.map((resource) => {
            if (!this.isEmpty(resource.MetricName)) {
              result.push(resource.MetricName);
            }
          });
          return this.util.arrayToMap(result);
        }
      })
      .catch(function (error) {
        console.log(error);
        return;
      });
  }

  //根据Project及Metrics返回对应的所有的Period,无自定义监控、日志监控project对应的Period
  getPeriod(project, metric) {
    var param = {
      path: "?Action=QueryMetricMeta&PageNumber=1&PageSize=1&Project=" + project + "&Metric=" + metric,
      method: "GET",
    };
    return this.backendSrv.datasourceRequest({
        url: this.buildRealUrl(param),
        method: "GET",
      }).then((response) => {
        var data = response.data;
        if (data.Code == "200" && data.Success == true) {
          var period = [];
          var resource = data.Resources.Resource;
          if (resource.length > 0 && !this.isEmpty(resource[0].Periods)) {
            period = resource[0].Periods.split(",");
            period.splice(0, 0, "auto");
          }
          return this.util.arrayToMap(period);
        }
      }).catch(function (error) {
        console.log(error);
        return;
      });
  }

  //根据Project及Metrics返回对应的所有的Statistics,未去除已选项,无自定义监控、日志监控project对应的Period
  getStatistics(project, metric) {
    var param = {
      path: "?Action=QueryMetricMeta&PageNumber=1&PageSize=1&Project=" + project + "&Metric=" + metric,
      method: "GET",
    };
    return this.backendSrv.datasourceRequest({
        url: this.buildRealUrl(param),
        method: "GET",
      }).then((response) => {
        var data = response.data;
        if (data.Code == "200" && data.Success == true) {
          var statistics = [];
          var resource = data.Resources.Resource;
          if (resource.length > 0 && !this.isEmpty(resource[0].Statistics)) {
            statistics = resource[0].Statistics.split(",");
          }
          return this.util.arrayToMap(statistics);
        }
      }).catch(function (error) {
        console.log(error);
        return;
      });
  }

  //返回所有的Groups,自定义监控、日志使用
  getGroups() {
    var param = {
      path: "?Action=ListMyGroups&PageNumber=1&PageSize=9000",
      method: "GET",
    };
    return this.backendSrv.datasourceRequest({
        url: this.buildRealUrl(param),
        method: "GET",
      }).then((response) => {
        var data = response.data;
        if (data.Code == "200" && data.Success == true) {
          var result = [];
          var resource = data.Resources.Resource;
          var i = resource.length;
          while (i--) {
            var group = resource[i];
            var groupInfo = [];
            var groupId = group.GroupId;
            var groupName = group.GroupName;
            if (this.isEmpty(groupId) || this.isEmpty(groupName)) {
              continue;
            }
            groupInfo.push(groupId, groupName + " / " + groupId);
            result.push(groupInfo);
          }
          return _.map(result, (d, i) => {
            return { text: d[1], value: d[0] };
          });
        }
      })
      .catch(function (error) {
        console.log(error);
        return;
      });
  }

  getDimensions(project, metric, period, dimensions, resource) {
    if (project.indexOf("acs_customMetric") != -1 || project.indexOf("acs_logMonitor") != -1) {
      return;
    }
    var endTime = new Date().getTime();
    var startTime = endTime - 15 * 60 * 1000;
    // TODO
    var queryConcat = "?Action=QueryMetricLast&Period=" + period + "&Project=" + project + "&Metric=" + metric + "&StartTime=" + startTime + "&EndTime=" + endTime;
    return this.doNextToken(queryConcat, "", 0, "last").then((data) => {
        if (data.length == 0) {
          return[];
        }
        // 构建可选参数dimensions
        if(!this.isEmpty(resource)){
          return this.dimensionData(data, resource, dimensions);
        }else{
          return this.queryMetricMeta(project, metric).then(response => {
            resource = response;
            if (this.isEmpty(resource) || this.isEmpty(resource[0].Dimensions)) {
              return[];
            }
            return this.dimensionData(data, resource, dimensions);
          });
        }
      }).catch(function (error) {
        console.log(error);
        return[];
      });
  }

  async dimensionData(data, resource, dimensions){
    var result = [];
    var dimension = resource[0].Dimensions.split(",");

    // var datapoints = JSON.parse(data.Datapoints);
    data.map((datapoint) => {
      var datapointInfo = '{"';
      dimension.forEach(function (value, index) {
        value = value.replace(/"/g, "");
        if (value != "userId" || (value == "userId" && dimension.length == 1)) {
          if (datapoint[value].indexOf(":\\") != -1) {
            datapointInfo += value + '":"' + datapoint[value] + '\\"';
          } else {
            datapointInfo += value + '":"' + datapoint[value] + '"';
          }
          if (index == dimension.length - 1) {
            datapointInfo += "}";
          } else {
            datapointInfo += ',"';
          }
        }
      });
      //去重
      if (result.length == 0) {
        if (dimensions.length == 0) {
          result.push(datapointInfo);
        } else if (dimensions.length > 0 && !dimensions.includes(datapointInfo)) {
          result.push(datapointInfo);
        }
      } else if (result.length > 0 && !result.includes(datapointInfo)) {
        if (dimensions.length == 0) {
          result.push(datapointInfo);
        } else if (dimensions.length > 0 && !dimensions.includes(datapointInfo)) {
          result.push(datapointInfo);
        }
      }
    });
    return this.util.arrayToMap(result);  
  }

  async queryMetricMeta(project, metric){
    let rand = Math.floor(Math.random() * 4) + 5;
    await this.wait(100 * rand);
    
    let resource = this.cacheMeta.get(project + "_" + metric);
    if(this.isEmpty(resource)){
      var param = {
        path: "?Action=QueryMetricMeta&PageNumber=1&PageSize=1&Project=" + project + "&Metric=" + metric,
        method: "GET",
      };
      return this.backendSrv.datasourceRequest({
        url: this.buildRealUrl(param),
        method: "GET",
      }).then((response_meta) => {
        var data_meta = response_meta.data;
        if (data_meta.Code == "200" && data_meta.Success == true) {
          resource = data_meta.Resources.Resource;
          this.cacheMeta.set(project + "_" + metric, resource);
          return resource;
        }
      });
    }else{
      return resource;
    }
  }

  // 暂时无翻页功能,无nextToken字段返回
  tagsFilter(type, nextToken, path, tagType, tagKeyFilter) {
    var reqUrl = path;
    if (!this.isEmpty(nextToken)) {
      reqUrl += "&NextToken=" + nextToken;
    }
    var param = {
      path: reqUrl,
      method: "GET",
    };
    var realUrl = "";
    if ("ECS" == type) {
      realUrl = this.buildECSRealUrl(param);
      return this.backendSrv.datasourceRequest({
          url: realUrl,
          method: "GET",
        }).then((response) => {
          var result = [];
          var data = response.data;
          var tags = data.Tags.Tag;
          if (tags.length > 0) {
            tags.forEach((tag) => {
              if ("key" == tagType) {
                if (!result.includes(tag.TagKey)) {
                  result.push(tag.TagKey);
                }
              } else if ("value" == tagType) {
                if (tagKeyFilter.includes(tag.TagKey) || tagKeyFilter.length == 0) {
                  var value = tag.TagKey + ":/:" + tag.TagValue;
                  if (!result.includes(value)) {
                    result.push(value);
                  }
                }
              }
            });
          }
          return result;
        });
    } else if ("RDS" == type) {
      realUrl = this.buildRDSRealUrl(param);
      return this.backendSrv
        .datasourceRequest({
          url: realUrl,
          method: "GET",
        })
        .then((response) => {
          var result = [];
          var data = response.data;
          var tags = data.Items.TagInfos;
          if (tags.length > 0) {
            tags.forEach((tag) => {
              if ("key" == tagType) {
                if (!result.includes(tag.TagKey)) {
                  result.push(tag.TagKey);
                }
              } else if ("value" == tagType) {
                if (tagKeyFilter.includes(tag.TagKey) || tagKeyFilter.length == 0) {
                  var value = tag.TagKey + ":/:" + tag.TagValue;
                  if (!result.includes(value)) {
                    result.push(value);
                  }
                }
              }
            });
          }
          return result;
        });
    }
  }

  listTagResources(type, regionId, resourceType, resourceId, tag) {
    type = this.isEmpty(type) ? "ECS" : type;
    regionId = this.isEmpty(regionId) ? "cn-hangzhou" : regionId;
    if ("ECS" == type) {
      resourceType = this.isEmpty(resourceType) ? "instance" : resourceType;
    } else if ("RDS" == type) {
      resourceType = this.isEmpty(resourceType) ? "INSTANCE" : resourceType;
    }
    var path = "/?Action=ListTagResources&RegionId=" + regionId + "&ResourceType=" + resourceType;
    for (var i = 0; i < resourceId.length; i++) {
      if (50 > i) {
        var v = resourceId[i];
        if (!this.isEmpty(v)) {
          path += "&ResourceId." + (parseInt(i) + 1).toString() + "=" + v;
        }
      }
    }
    var tag_key_array = [];
    var tag_value_array = [];
    tag.forEach((t) => {
      if (!this.isEmpty(t)) {
        if (t.indexOf(":/:") != -1) {
          var t_split = t.split(":/:");
          if (!tag_key_array.includes(t_split[0])) {
            tag_key_array.push(t_split[0]);
          }
          if (!tag_value_array.includes(t_split[1])) {
            tag_value_array.push(t_split[1]);
          }
        }
      }
    });
    if (tag_key_array.length > 0) {
      for (var i = 0; i < tag_key_array.length; i++) {
        var key = tag_key_array[i];
        path += "&Tag." + (parseInt(i) + 1).toString() + ".Key=" + key;
      }
    } else if (tag_key_array.length == 0 && tag.length > 0) {
      for (var i = 0; i < tag.length; i++) {
        var key = tag[i];
        path += "&Tag." + (parseInt(i) + 1).toString() + ".Key=" + key;
      }
    }
    var nextToken = "";
    return this.tagList(type, nextToken, path, tag_value_array).then((rep) => {
      var distinct_result = [];
      rep.forEach((instanceId) => {
        if (!distinct_result.includes(instanceId)) {
          distinct_result.push(instanceId);
        }
      });
      return this.util.arrayToMap(distinct_result);
    });
  }
  // 处理nextToken问题
  tagList(type, nextToken, path, tag_value_array) {
    var reqUrl = path;
    if (!this.isEmpty(nextToken)) {
      reqUrl += "&NextToken=" + nextToken;
    }
    var param = {
      path: reqUrl,
      method: "GET",
    };
    var realUrl = "";
    if ("ECS" == type) {
      realUrl = this.buildECSRealUrl(param);
    } else if ("RDS" == type) {
      realUrl = this.buildRDSRealUrl(param);
    }
    return this.backendSrv.datasourceRequest({
        url: realUrl,
        method: "GET",
      }).then((response) => {
        var result = [];
        var data = response.data;
        var tagResource = data.TagResources.TagResource;
        if (tagResource.length > 0) {
          tagResource.forEach((resource) => {
            if (tag_value_array.length > 0) {
              if (tag_value_array.includes(resource.TagValue)) {
                result.push(resource.ResourceId);
              }
            } else {
              result.push(resource.ResourceId);
            }
          });
        }
        if (this.isEmpty(data.NextToken)) {
          return result;
        } else {
          return this.tagList(type, data.NextToken, path, tag_value_array).then(
            (nextList) => {
              return result.concat(nextList);
            }
          );
        }
      });
  }

  // 根据云监控API文档处理URL签名,做封装调用接口用
  buildRealUrl(param) {
    return "/api/datasources/"+this.datasourceId+"/resources/proxy_aliyun_cms_pop" +  param.path;
  }

  // 根据ECS API文档处理URL签名,做封装调用接口用
  buildECSRealUrl(param) {
	return "/api/datasources/"+this.datasourceId+"/resources/proxy_aliyun_ecs_pop" +  param.path;
  }

  // 根据RDS API文档处理URL签名,做封装调用接口用
  buildRDSRealUrl(param) {
	return "/api/datasources/"+this.datasourceId+"/resources/proxy_aliyun_rds_pop" +  param.path;
  }

  // 判断对象是否为空对象 true 空
  isEmpty(obj) {
    var re = new RegExp("^[ ]+$");
    if (!obj || obj == "null" || obj == null || obj == " " || obj == "" || obj == '""' || re.test(obj) || typeof obj == "undefined") {
      return true;
    } // 为空
    return false; // 不为空
  }
}
