import _ from "lodash";
import {CmsSigner} from "./signer.js";

export class GenericDatasource {
  constructor(instanceSettings, $q, backendSrv, templateSrv) {
    this.type = instanceSettings.type;
    this.basePath = instanceSettings.url;
    this.name = instanceSettings.name;
    this.jsonData = instanceSettings.jsonData;
    this.q = $q;
    this.backendSrv = backendSrv;
    this.templateSrv = templateSrv;
    this.headers = {'Content-Type': 'application/json'};
  }

  query(options){
    let requests = []
    let promise = Promise.resolve();
    var result =[];
    _(options.targets).forEach(target => {
        //非空参数判空处理
        if(!target.project || !target.metric || !target.ycol || !target.xcol){
          return;
        }
        var project = target.project;
        var metric = target.metric;
        //默认数组
        var ycol = target.ycol;
        var xcol = target.xcol;
        var describe = target.describe;
        if(!describe){
          describe = '';
        }else{
          describe = describe +".";
        }
        var query ="/?Action=QueryMetricList&Length=2000";
        var dimensions ="";
        var period = target.period;
        var group = target.group
        if(!period){
          period = '';
        }
        if(!group){
          group = '';
        }
        //定义Promise元数据
        let request = this.getDimensionsByGroup(group,project).then(response=>{
          // console.log(JSON.stringify(response));
          //处理group--根据GroupId获取该组下的所有实例Id
          if('200' == response.code && response.data.length > 0){
              var data = response.data;
              dimensions = dimensions.concat(JSON.stringify(data));
          }else{
            dimensions = '';
          }
          //自定义监控(acs_custom)、日志监控(acs_logMonitor)自动取消分组功能
          if(project.indexOf("acs_custom") == -1 || project.indexOf("acs_logMonitor") == -1){
            dimensions = '';
          }
        }).then(()=>{
          //GroupId存在的同时,dimensions存在,则dimensions覆盖Group下的所有实例Id，以dimensions为准
          if(target.dimensions.length == 0){
             dimensions = dimensions;
          }else{
            //自定义监控(acs_custom)、日志监控(acs_logMonitor)处理
            // console.log(project.indexOf("acs_custom") == -1);
            // console.log(project.indexOf("acs_logMonitor") == -1);
            if(project.indexOf("acs_custom") != -1 || project.indexOf("acs_logMonitor") != -1){
              var dimensionAcsJson = target.dimensions[0];
              var dimensionAcsObj = {"groupId":group.toString(),
                              "dimension":dimensionAcsJson.replace(/\&/gi, '%26').replace(/\{/gi, '%7B').replace(/\}/gi, '%7D')};
              dimensions = JSON.stringify(dimensionAcsObj);
            }else{
              //数组对象
              var dimensionArray =[];
              var dimensionJson = target.dimensions;
              var i = dimensionJson.length;
              while (i--) {
                dimensionArray.push({"instanceId":dimensionJson[i]});
              }
              dimensions ='';
              dimensions =dimensions.concat(JSON.stringify(dimensionArray));
            }
          }
          //拼接查询参数
          var queryConcat= query + "&Project="+project+"&Metric="+metric+
                                        "&Period="+period+"&Dimensions="+dimensions+
                                        "&StartTime="+(parseInt(options.range.from._d.getTime()))+
                                        "&EndTime="+(parseInt(options.range.to._d.getTime())) ;
          var param = {
              path: queryConcat,
              method: "GET"
          };
          // 签名已拼接的待查询URL
          query = this.buildRealUrl(param);
          // console.log("查看query的值："+query);
          if (_.isEmpty(query)) {
              var d = this.q.defer();
              d.resolve({data: []});
              return d.promise;
          } 
          // 根据URL发起请求
          return this.backendSrv.datasourceRequest({
              url: query,
              method: 'GET',
              headers: this.headers
          }).then(response => {
            if(response.status == '200' && response.data.Code == '200'){
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
                _.each(dataDatapoints, Datapoint => {
                    let datapoint = [];
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
      })
    // 统一单独处理返回值(可优化)
    return Promise.all(requests.map(p => p.catch(e => e)))
            .then(requests => {
              return {data: result};
            });
  } 

  // 测试连接数据源接口
  testDatasource() {
      var param = {
          path: "/?Action=AccessKeyGet",
          method: "GET"
      };
      return this.backendSrv.datasourceRequest({
          url: this.buildRealUrl(param),
          method: 'GET'
      }).then(response => {
          // console.log(response);
          var data = response.data;
          if (data.ErrorCode == 200 && data.Success == true ) {
              return {status: "success", message: "Data source is working", title: "Success"};
          }
      });
  }

  annotationQuery(options){

  } 
  metricFindQuery(options){

  }

  // 根据阿里监控API文档处理URL签名,做封装调用接口用
  buildRealUrl(param) {
      var signer = new CmsSigner({
          accessKeyId: this.jsonData.cmsAccessKey,
          secretAccessKey: this.jsonData.cmsSecretKey
      }, param);
      signer.addAuthorization();
      return this.basePath + signer.request.path;
  }

  //将数组处理成Map对象集 
  mapToTextValue(result) {
    return _.map(result, (d, i) => {
      if (d && d.text && d.value) {
        return { text: d.text, value: d.value };
      } else if (_.isObject(d)) {
        return { text: d, value: i};
      }
      return { text: d, value: d };
    });
  }

  //返回所有的Project TODO等API待优化  
  // QueryProjectMeta的API无自定义监控project、日志监控project，待确认是否拼接
  getProject(){
    var param = {
        path: "/?Action=QueryProjectMeta&PageNumber=1&PageSize=100",
        method: "GET"
    };
    return this.backendSrv.datasourceRequest({
        url: this.buildRealUrl(param),
        method: 'GET'
    }).then(response => {
        var result =[];
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
            var project =[];
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
        return this.backendSrv.datasourceRequest({
          url: this.buildRealUrl(acs_param),
          method: 'GET'
        }).then(response => {
          var data = response.data;
          if (data.ErrorCode == 200 && data.Success == true ) {
              var projectAcsLog =[];
              projectAcsLog.push("acs_logMonitor_"+data.UserId);
              result.push(projectAcsLog);
              var projectAcsCustom =[];
              projectAcsCustom.push("acs_customMetric_"+data.UserId);
              result.push(projectAcsCustom);
          }
          return _.map(result, (d, i) => {
            return { text: d, value: d};
          });
        });
    }).catch(function (error) {
      console.log(error);
      return;
    });
  }

  //根据Project返回对应的所有的Metrics 无自定义监控project、日志监控project对应的Metrics TODO等API待优化
  getMetrics(project){
    var param = {
        path: "/?Action=QueryMetricMeta&PageNumber=1&PageSize=150&Project=" + project,
        method: "GET"
    };
    return this.backendSrv.datasourceRequest({
        url: this.buildRealUrl(param),
        method: 'GET'
    }).then(response => {
        var data = response.data;
        if (data.ErrorCode == 200 && data.Success == true) {
          var result =[];
          // console.log(JSON.stringify(data));
          var resource = data.Resources.Resource;
          // console.log(JSON.stringify(projectArray));
          var i = resource.length;
          // console.log(i);
          while (i--) {
            var resourceInfo = resource[i];
            // console.log(projectInfo);
            var metric =[];
            metric.push(resourceInfo.Metric);
            result.push(metric);
          }
          return _.map(result, (d, i) => {
            return { text: d, value: d};
          });
        }
    }).catch(function (error) {
      console.log(error);
      return;
    });
  }

  //根据Project及Metrics返回对应的所有的Period 无自定义监控project、日志监控project对应的Period,TODO等API待优化
  getPeriod(project,metric){
    var param = {
        path: "/?Action=QueryMetricMeta&PageNumber=1&PageSize=1&Project="+ project + "&Metric=" + metric,
        method: "GET"
    };
    return this.backendSrv.datasourceRequest({
        url: this.buildRealUrl(param),
        method: 'GET'
    }).then(response => {
        var data = response.data;
        if (data.ErrorCode == 200 && data.Success == true) {
          var result =[];
          var period = [];
          var resource = data.Resources.Resource;
          if(resource.length == 0 || !resource[0].Periods ){
            return this.mapToTextValue(period);
          }
          period =resource[0].Periods.split(",");
          // console.log(period);
          return this.mapToTextValue(period);
        }
    }).catch(function (error) {
      console.log(error);
      return;
    });
  }

  //根据Project及Metrics返回对应的所有的Statistics，未处理去除已选项 自定义监控无处理
  getStatistics(project,metric,ycol){
    var param = {
        path: "/?Action=QueryMetricMeta&PageNumber=1&PageSize=1&Project=" + project + "&Metric=" + metric,
        method: "GET"
    };
    return this.backendSrv.datasourceRequest({
        url: this.buildRealUrl(param),
        method: 'GET'
    }).then(response => {
        var data = response.data;
        if (data.ErrorCode == 200 && data.Success == true) {
          var result =[];
          var statistics=[];
          var resource = data.Resources.Resource;
          if(resource.length == 0 || !resource[0].Statistics){
            return this.mapToTextValue(statistics);
          }
          statistics = resource[0].Statistics.split(",");
          return this.mapToTextValue(statistics);
        }
    }).catch(function (error) {
      console.log(error);
      return;
    });
  }

  //返回所有的Groups
  getGroups(){
    var param = {
        path: "/?Action=ListMyGroups&PageNumber=1&PageSize=1000" ,
        method: "GET"
    };
    return this.backendSrv.datasourceRequest({
        url: this.buildRealUrl(param),
        method: 'GET'
    }).then(response => {
      var data = response.data;
      if (data.ErrorCode == 200 && data.Success == true) {
        var result =[];
        var resource = data.Resources.Resource;
        var i = resource.length;
        while (i--) {
            var group = resource[i];
            var groupInfo =[];
            groupInfo.push(group.GroupId,group.GroupName +" / " + group.GroupId);
            result.push(groupInfo);
        }
        return _.map(result, (d, i) => {
          return { text: d[1], value: d[0]};
        });
      }
    }).catch(function (error) {
      console.log(error);
      return;
    });
  }

  //返回所有的Dimensions 自定义监控无处理
  // -- 如果有应用分组Id则根据该值查询该组下所有的Dimensions
  // -- 如果无应用分组Id则根据查询该账户下所有的Dimensions
  getDimensions(project,metric,group,dimensions,period,query){
    var result =[];
    if(!group || typeof group == 'string'){
        group = 0;
    }
    if(isNaN(parseInt(group))){
        group = 0;
    }
    if(project.indexOf("acs_customMetric") != -1 || project.indexOf("acs_logMonitor") != -1){
      return;
    }
    if(group !=0){
      var param = {
          path: "/?Action=ListMyGroupInstances&PageNumber=1&PageSize=1000&GroupId=" + parseInt(group),
          method: "GET"
      };
      return this.backendSrv.datasourceRequest({
          url: this.buildRealUrl(param),
          method: 'GET'
      }).then(response => {
        // console.log(JSON.stringify(response));
        var data = response.data;
        if (data.ErrorCode == 200 && data.Success == true){
          var resource = data.Resources.Resource;

          var i = resource.length;
          while (i--) {
              var instance = resource[i];
              var instanceInfo =[];
              //判断空对象处理
              if(!instance.InstanceId){
                continue;
              }
              // 去掉页面已选择实例
              if(_.includes(dimensions, instance.InstanceId)){
                continue;
              }
              instanceInfo.push(instance.InstanceId);
              result.push(instanceInfo);
          }
          return _.map(result, (d, i) => {
            return { text: d, value: d};
          });
        }
      }).catch(function (error) {
        console.log(error);
        return;
      });
    }else{
      var endTime = new Date().getTime();
      var startTime = endTime - 1 * 60 * 60 * 1000;
      var param = {
          path: "/?Action=QueryMetricLast&Page=1&Length=1000&Period="+period+"&Project=" 
                              + project + "&Metric=" + metric + "&StartTime=" + startTime + "&EndTime=" + endTime,
          method: "GET"
      };
      return this.backendSrv.datasourceRequest({
          url: this.buildRealUrl(param),
          method: 'GET'
      }).then(response => {
        var data = response.data;
        // console.log(JSON.stringify(data));
        var datapoints = JSON.parse(data.Datapoints);
        // console.log(JSON.stringify(datapoints));
        var i = datapoints.length;
        if (i >0) {
          while (i--) {
              var datapoint = datapoints[i];
              var datapointInfo =[];
              //判断空对象处理
              if(!datapoint.instanceId){
                continue;
              }
              // 去掉页面已选择实例
              if(_.includes(dimensions, datapoint.instanceId)){
                continue;
              }
              datapointInfo.push(datapoint.instanceId);
              result.push(datapointInfo);
          }
          return _.map(result, (d, i) => {
            return { text: d, value: d};
          });
        }
      }).catch(function (error) {
        console.log(error);
        return;
      });
    }
  }

  // 根据应用分组Id返回该组下所有的Dimensions 
  getDimensionsByGroup(group){
    var result =[];
    if(!group || typeof group == 'string'){
        group = 0;
    }
    if(isNaN(parseInt(group))){
        group = 0;
    }
    var param = {
        path: "/?Action=ListMyGroupInstances&PageNumber=1&PageSize=1000&GroupId=" + parseInt(group),
        method: "GET"
    };
    return this.backendSrv.datasourceRequest({
        url: this.buildRealUrl(param),
        method: 'GET'
    }).then(response => {
      var dimensions = [];
      var data = response.data;
      if (data.ErrorCode == 200 && data.Success == true) {
        var resource = data.Resources.Resource;
        var i = resource.length;
        while (i--) {
            var instance = resource[i];
            dimensions.push({"instanceId":instance.InstanceId});
        }
        result = result.concat(typeof dimensions == 'string' ? JSON.parse(dimensions) : dimensions);
        return {data:result,code:'200'};
      }else{
        return {data:result,code:'400'};
      }
    }).catch(function (error) {
      console.log(error);
      return {data:result,code:'400'};
    });
  }

  isNotEmpty(obj) { // 判断对象是否为空对象
    for (var name in obj) {
        return true;
    } // 不为空
    return false; // 为空
  }
}