package main

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/aliyun/alibaba-cloud-sdk-go/sdk/requests"
	"github.com/aliyun/alibaba-cloud-sdk-go/services/cms"
	"github.com/aliyun/alibaba-cloud-sdk-go/services/ecs"
	"github.com/aliyun/alibaba-cloud-sdk-go/services/rds"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/datasource"
	"github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/grafana-plugin-sdk-go/backend/resource/httpadapter"
)

// newDatasource returns datasource.ServeOpts.
func newDatasource() *CmsDatasource {
	log.DefaultLogger.Debug("new_cms_datasource")
	im := datasource.NewInstanceManager(newDataSourceInstance)
	ds := &CmsDatasource{
		im:     im,
		logger: log.New(),
	}
	return ds
}

type CmsSetting struct {
	CmsAccessKey   string `json:"cmsAccessKey"`
	CmsAcessSecret string `json:"cmsSecretKey"`
}

// CmsDatasource is an example datasource used to scaffold
// new datasource plugins with an backend.
type CmsDatasource struct {
	im     instancemgmt.InstanceManager
	logger log.Logger
}

// QueryData 非直接proxy代码，目前无须实现
func (td *CmsDatasource) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	return nil, nil
}

// 参数都是唯一的，转换为map
func parseRequestParams(req *http.Request) (map[string]string, error) {
	result := map[string]string{}
	for k, values := range req.URL.Query() {
		if len(values) > 0 {
			result[k] = values[0]
		}
	}
	data, _ := json.Marshal(result)
	log.DefaultLogger.Debug("request_params: ", string(data))
	_, hasAction := result["Action"]
	if !hasAction {
		return result, errors.New("Action parameter is missing")
	}
	return result, nil
}

func (ds *CmsDatasource) getDataSourceSetting(req *http.Request) (*instanceSettings, error) {
	pluginCxt := httpadapter.PluginConfigFromContext(req.Context())

	instance, err := ds.im.Get(pluginCxt)
	if err != nil {
		log.DefaultLogger.Info("Failed getting connection", "error", err)
		return nil, errors.New("Failed getting connection")
	}
	// create response struct
	instSetting, ok := instance.(*instanceSettings)
	log.DefaultLogger.Debug("setting", instSetting)

	if !ok {
		log.DefaultLogger.Info("Failed load setting connection !", "error", err)
		return nil, errors.New("Failed getting connection")
	}
	return instSetting, nil
}

func proxyListMetricMeta(instSetting *instanceSettings, params map[string]string, rw http.ResponseWriter) {
	client, err := cms.NewClientWithAccessKey("cn-hangzhou", instSetting.accessKey, instSetting.accessSecret)
	request := cms.CreateDescribeMetricMetaListRequest()
	request.Scheme = "https"
	if project, ok := params["Project"]; ok {
		request.Namespace = project
	}
	if metric, ok := params["Metric"]; ok {
		request.MetricName = metric
	}
	if pageSize, ok := params["PageSize"]; ok {
		size, err := strconv.ParseInt(pageSize, 10, 32)
		if err != nil {
			request.PageSize = requests.NewInteger(int(size))
		} else {
			request.PageSize = requests.NewInteger(1000)
		}
	} else {
		request.PageSize = requests.NewInteger(1000)
	}

	response, err := client.DescribeMetricMetaList(request)
	if err != nil {
		log.DefaultLogger.Error(err.Error())
		handleResponse(rw, nil, err)
	} else {
		data, err := json.Marshal(response)
		log.DefaultLogger.Debug(string(data))
		handleResponse(rw, data, err)
	}
}

func proxyListProjectMeta(instSetting *instanceSettings, params map[string]string, rw http.ResponseWriter) {
	client, err := cms.NewClientWithAccessKey("cn-hangzhou", instSetting.accessKey, instSetting.accessSecret)
	request := cms.CreateDescribeProjectMetaRequest()
	request.Scheme = "https"
	if pageSize, ok := params["PageSize"]; ok {
		size, err := strconv.ParseInt(pageSize, 10, 32)
		if err != nil {
			request.PageSize = requests.NewInteger(int(size))
		} else {
			request.PageSize = requests.NewInteger(1000)
		}
	} else {
		request.PageSize = requests.NewInteger(1000)
	}

	response, err := client.DescribeProjectMeta(request)
	if err != nil {
		log.DefaultLogger.Error(err.Error())
		handleResponse(rw, nil, err)
	} else {
		data, err := json.Marshal(response)
		log.DefaultLogger.Debug(string(data))
		handleResponse(rw, data, err)
	}
}

func proxyListMyGroups(instSetting *instanceSettings, params map[string]string, rw http.ResponseWriter) {
	client, err := cms.NewClientWithAccessKey("cn-hangzhou", instSetting.accessKey, instSetting.accessSecret)
	request := cms.CreateDescribeMonitorGroupsRequest()
	request.Scheme = "https"
	if pageSize, ok := params["PageSize"]; ok {
		size, err := strconv.ParseInt(pageSize, 10, 32)
		if err != nil {
			request.PageSize = requests.NewInteger(int(size))
		} else {
			request.PageSize = requests.NewInteger(1000)
		}
	} else {
		request.PageSize = requests.NewInteger(1000)
	}
	if pageNumber, ok := params["PageNumber"]; ok {
		num, err := strconv.ParseInt(pageNumber, 10, 32)
		if err != nil {
			request.PageNumber = requests.NewInteger(int(num))
		} else {
			request.PageNumber = requests.NewInteger(1)
		}
	} else {
		request.PageNumber = requests.NewInteger(1)
	}

	response, err := client.DescribeMonitorGroups(request)
	if err != nil {
		log.DefaultLogger.Error(err.Error())
		handleResponse(rw, nil, err)
	} else {
		data, err := json.Marshal(response)
		log.DefaultLogger.Debug(string(data))
		handleResponse(rw, data, err)
	}
}

func proxyAccessKeyGet(instSetting *instanceSettings, params map[string]string, rw http.ResponseWriter) {
	client, err := cms.NewClientWithAccessKey("cn-hangzhou", instSetting.accessKey, instSetting.accessSecret)
	request := cms.CreateDescribeMonitoringAgentAccessKeyRequest()
	request.Scheme = "https"

	response, err := client.DescribeMonitoringAgentAccessKey(request)
	if err != nil {
		log.DefaultLogger.Error(err.Error())
		handleResponse(rw, nil, err)
	} else {
		data, err := json.Marshal(response)
		log.DefaultLogger.Debug(string(data))
		handleResponse(rw, data, err)
	}
}

func proxyQueryMetricData(instSetting *instanceSettings, params map[string]string, rw http.ResponseWriter) {
	client, err := cms.NewClientWithAccessKey("cn-hangzhou", instSetting.accessKey, instSetting.accessSecret)
	request := cms.CreateDescribeMetricListRequest()
	request.Scheme = "https"
	if project, ok := params["Project"]; ok {
		request.Namespace = project
	}
	if metric, ok := params["Metric"]; ok {
		request.MetricName = metric
	}
	if dims, ok := params["Dimensions"]; ok {
		request.Dimensions = dims
	} else {
		request.Dimensions = "{}"
	}
	if period, ok := params["Period"]; ok {
		request.Period = period
	} else {
		request.Period = "60"
	}
	if size, ok := params["Length"]; ok {
		request.Length = size
	} else {
		request.Length = "1000"
	}
	if startTime, ok := params["StartTime"]; ok {
		request.StartTime = startTime
	} else {
		request.StartTime = "60"
	}
	if endTime, ok := params["EndTime"]; ok {
		request.EndTime = endTime
	} else {
		request.EndTime = "60"
	}

	response, err := client.DescribeMetricList(request)
	if err != nil {
		log.DefaultLogger.Error(err.Error())
		handleResponse(rw, nil, err)
	} else {
		data, err := json.Marshal(response)
		log.DefaultLogger.Debug(string(data))
		handleResponse(rw, data, err)
	}
}

func proxyQueryMetricLast(instSetting *instanceSettings, params map[string]string, rw http.ResponseWriter) {
	client, err := cms.NewClientWithAccessKey("cn-hangzhou", instSetting.accessKey, instSetting.accessSecret)
	request := cms.CreateDescribeMetricLastRequest()
	request.Scheme = "https"

	if project, ok := params["Project"]; ok {
		request.Namespace = project
	}
	if metric, ok := params["Metric"]; ok {
		request.MetricName = metric
	}
	if dims, ok := params["Dimensions"]; ok {
		request.Dimensions = dims
	} else {
		request.Dimensions = "{}"
	}
	if period, ok := params["Period"]; ok {
		request.Period = period
	} else {
		request.Period = "60"
	}
	if size, ok := params["Length"]; ok {
		request.Length = size
	} else {
		request.Length = "1000"
	}
	if startTime, ok := params["StartTime"]; ok {
		request.StartTime = startTime
	} else {
		request.StartTime = "60"
	}
	if endTime, ok := params["EndTime"]; ok {
		request.EndTime = endTime
	} else {
		request.EndTime = "60"
	}

	response, err := client.DescribeMetricLast(request)
	if err != nil {
		log.DefaultLogger.Error(err.Error())
		handleResponse(rw, nil, err)
	} else {
		data, err := json.Marshal(response)
		log.DefaultLogger.Debug(string(data))
		handleResponse(rw, data, err)
	}
}

func proxyRdsDescribeTags(instSetting *instanceSettings, params map[string]string, rw http.ResponseWriter) {
	client, err := rds.NewClientWithAccessKey("cn-hangzhou", instSetting.accessKey, instSetting.accessSecret)

	request := rds.CreateDescribeTagsRequest()
	request.Scheme = "https"

	if regionID, ok := params["RegionId"]; ok {
		request.RegionId = regionID
	}

	if tags, ok := params["Tags"]; ok {
		request.Tags = tags
	}

	if tags, ok := params["Tags"]; ok {
		request.Tags = tags
	}

	if instanceID, ok := params["DBInstanceId"]; ok {
		request.DBInstanceId = instanceID
	}

	response, err := client.DescribeTags(request)
	if err != nil {
		log.DefaultLogger.Error(err.Error())
		handleResponse(rw, nil, err)
	} else {
		data, err := json.Marshal(response)
		log.DefaultLogger.Debug(string(data))
		handleResponse(rw, data, err)
	}
}

func proxyRdsListTagResources(instSetting *instanceSettings, params map[string]string, rw http.ResponseWriter) {
	client, err := rds.NewClientWithAccessKey("cn-hangzhou", instSetting.accessKey, instSetting.accessSecret)

	request := rds.CreateListTagResourcesRequest()
	request.Scheme = "https"
	if regionID, ok := params["RegionId"]; ok {
		request.RegionId = regionID
	} else {
		request.RegionId = "cn-hangzhou"
	}

	if resourceType, ok := params["ResourceType"]; ok {
		request.ResourceType = resourceType
	} else {
		request.ResourceType = "INSTANCE"
	}

	tags := []rds.ListTagResourcesTag{}
	// only support 20 tags at most
	for i := 1; i < 21; i++ {
		tagkey := "Tag." + strconv.Itoa(i) + ".Key"
		tagValue := "Tag." + strconv.Itoa(i) + ".Value"
		tagObj := rds.ListTagResourcesTag{}
		if val, ok := params[tagkey]; ok {
			tagObj.Key = val
		} else {
			continue
		}
		if val, ok := params[tagValue]; ok {
			tagObj.Value = val
		}
		tags = append(tags, tagObj)
	}
	if len(tags) > 0 {
		request.Tag = &tags
	}

	resourceIDs := []string{}
	// only support 50 tags at most
	for i := 1; i < 51; i++ {
		tagkey := "ResourceId." + strconv.Itoa(i)
		if val, ok := params[tagkey]; ok {
			resourceIDs = append(resourceIDs, val)
		} else {
			continue
		}
	}
	if len(resourceIDs) > 0 {
		request.ResourceId = &resourceIDs
	}

	if nextToken, ok := params["NextToken"]; ok {
		request.NextToken = nextToken
	}

	response, err := client.ListTagResources(request)
	if err != nil {
		log.DefaultLogger.Error(err.Error())
		handleResponse(rw, nil, err)
	} else {
		data, err := json.Marshal(response)
		log.DefaultLogger.Debug(string(data))
		handleResponse(rw, data, err)
	}
}

func proxyEcsDescribeTags(instSetting *instanceSettings, params map[string]string, rw http.ResponseWriter) {
	client, err := ecs.NewClientWithAccessKey("cn-hangzhou", instSetting.accessKey, instSetting.accessSecret)

	request := ecs.CreateDescribeTagsRequest()
	request.Scheme = "https"
	if pageSize, ok := params["PageSize"]; ok {
		size, err := strconv.ParseInt(pageSize, 10, 32)
		if err != nil {
			request.PageSize = requests.NewInteger(int(size))
		} else {
			request.PageSize = requests.NewInteger(100)
		}
	} else {
		request.PageSize = requests.NewInteger(100)
	}

	if pageNumber, ok := params["PageNumber"]; ok {
		num, err := strconv.ParseInt(pageNumber, 10, 32)
		if err != nil {
			request.PageNumber = requests.NewInteger(int(num))
		} else {
			request.PageNumber = requests.NewInteger(1)
		}
	} else {
		request.PageNumber = requests.NewInteger(1)
	}

	if resourceType, ok := params["ResourceType"]; ok {
		request.ResourceType = resourceType
	}

	if resourceID, ok := params["ResourceId"]; ok {
		request.ResourceId = resourceID
	}

	if category, ok := params["Category"]; ok {
		request.Category = category
	}

	tags := []ecs.DescribeTagsTag{}
	// only support 5 tags at most
	for i := 1; i < 6; i++ {
		tagkey := "Tag." + strconv.Itoa(i) + ".Key"
		tagValue := "Tag." + strconv.Itoa(i) + ".Value"
		tagObj := ecs.DescribeTagsTag{}
		if val, ok := params[tagkey]; ok {
			tagObj.Key = val
		} else {
			continue
		}
		if val, ok := params[tagValue]; ok {
			tagObj.Value = val
		}
		tags = append(tags, tagObj)
	}
	log.DefaultLogger.Debug("tags_length:" + strconv.Itoa(len(tags)))
	if len(tags) > 0 {
		log.DefaultLogger.Debug("tags_key:" + tags[0].Key)
		request.Tag = &tags
	}

	response, err := client.DescribeTags(request)
	if err != nil {
		log.DefaultLogger.Error(err.Error())
		handleResponse(rw, nil, err)
	} else {
		data, err := json.Marshal(response)
		log.DefaultLogger.Debug(string(data))
		handleResponse(rw, data, err)
	}
}

func proxyEcsListTagResources(instSetting *instanceSettings, params map[string]string, rw http.ResponseWriter) {
	client, err := ecs.NewClientWithAccessKey("cn-hangzhou", instSetting.accessKey, instSetting.accessSecret)

	request := ecs.CreateListTagResourcesRequest()
	request.Scheme = "https"

	if regionID, ok := params["RegionId"]; ok {
		request.RegionId = regionID
	}

	if regionID, ok := params["RegionId"]; ok {
		request.RegionId = regionID
	} else {
		request.RegionId = "cn-hangzhou"
	}

	if resourceType, ok := params["ResourceType"]; ok {
		request.ResourceType = resourceType
	} else {
		request.ResourceType = "instance"
	}

	if nextToken, ok := params["NextToken"]; ok {
		request.NextToken = nextToken
	}

	tags := []ecs.ListTagResourcesTag{}
	// only support 5 tags at most
	for i := 1; i < 6; i++ {
		tagkey := "Tag." + strconv.Itoa(i) + ".Key"
		tagValue := "Tag." + strconv.Itoa(i) + ".Value"
		tagObj := ecs.ListTagResourcesTag{}
		if val, ok := params[tagkey]; ok {
			tagObj.Key = val
		} else {
			continue
		}
		if val, ok := params[tagValue]; ok {
			tagObj.Value = val
		}
		tags = append(tags, tagObj)
	}
	if len(tags) > 0 {
		request.Tag = &tags
	}

	tagFilters := []ecs.ListTagResourcesTagFilter{}
	// only support 5 tags at most
	for i := 1; i < 6; i++ {
		tagObj := ecs.ListTagResourcesTagFilter{}
		tagkey := "TagFilter." + strconv.Itoa(i) + ".TagKey"
		if val, ok := params[tagkey]; ok {
			tagObj.TagKey = val
		} else {
			continue
		}
		tagFilterValues := []string{}
		for ii := 1; ii < 6; ii++ {
			tagValue := "TagFilter." + strconv.Itoa(i) + ".TagValues." + strconv.Itoa(ii)
			if val, ok := params[tagValue]; ok {
				tagFilterValues = append(tagFilterValues, val)
			}
		}
		if len(tagFilterValues) > 0 {
			tagObj.TagValues = &tagFilterValues
		}
		tagFilters = append(tagFilters, tagObj)
	}
	if len(tagFilters) > 0 {
		request.TagFilter = &tagFilters
	}

	response, err := client.ListTagResources(request)
	if err != nil {
		log.DefaultLogger.Error(err.Error())
		handleResponse(rw, nil, err)
	} else {
		data, err := json.Marshal(response)
		log.DefaultLogger.Debug(string(data))
		handleResponse(rw, data, err)
	}
}

func handleResponse(rw http.ResponseWriter, data []byte, err error) {
	if err != nil {
		rw.Write([]byte(err.Error()))
		rw.WriteHeader(http.StatusInternalServerError)
	} else {
		rw.Header().Add("Content-Type", "application/json")
		rw.WriteHeader(http.StatusOK)
		rw.Write(data)
	}
}

func (ds *CmsDatasource) ProxyCmsPopApi(rw http.ResponseWriter, req *http.Request) {
	//parse param map
	params, err := parseRequestParams(req)
	if err != nil {
		handleResponse(rw, nil, err)
		return
	}
	// 获取AK 配置
	instSetting, err := ds.getDataSourceSetting(req)
	if err != nil {
		handleResponse(rw, nil, err)
		return
	}
	// redirect by action
	switch params["Action"] {
	case "QueryMetricLast":
		proxyQueryMetricLast(instSetting, params, rw)
		break
	case "QueryMetricList":
		proxyQueryMetricData(instSetting, params, rw)
		break
	case "QueryMetricMeta":
		proxyListMetricMeta(instSetting, params, rw)
		break
	case "QueryProjectMeta":
		proxyListProjectMeta(instSetting, params, rw)
		break
	case "ListMyGroups":
		proxyListMyGroups(instSetting, params, rw)
		break
		//disable for security reason
		// case "AccessKeyGet":
		// 	proxyAccessKeyGet(instSetting, params, rw)
		// 	break
	}
}

func (ds *CmsDatasource) ProxyEcsPopApi(rw http.ResponseWriter, req *http.Request) {
	//parse param map
	params, err := parseRequestParams(req)
	if err != nil {
		handleResponse(rw, nil, err)
		return
	}
	// 获取AK 配置
	instSetting, err := ds.getDataSourceSetting(req)
	if err != nil {
		handleResponse(rw, nil, err)
		return
	}
	// redirect by action
	switch params["Action"] {
	case "DescribeTags":
		proxyEcsDescribeTags(instSetting, params, rw)
		break
	case "ListTagResources":
		proxyEcsListTagResources(instSetting, params, rw)
		break
	}
}

func (ds *CmsDatasource) ProxyRdsPopApi(rw http.ResponseWriter, req *http.Request) {
	//parse param map
	params, err := parseRequestParams(req)
	if err != nil {
		handleResponse(rw, nil, err)
		return
	}
	// 获取AK 配置
	instSetting, err := ds.getDataSourceSetting(req)
	if err != nil {
		handleResponse(rw, nil, err)
		return
	}
	// redirect by action
	switch params["Action"] {
	case "DescribeTags":
		proxyRdsDescribeTags(instSetting, params, rw)
		break
	case "ListTagResources":
		proxyRdsListTagResources(instSetting, params, rw)
		break
	}
}

// 保存datasource时检查datasource是否工作正常
func (td *CmsDatasource) CheckHealth(ctx context.Context, req *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
	var status = backend.HealthStatusOk
	var message = "Data source is working"

	return &backend.CheckHealthResult{
		Status:  status,
		Message: message,
	}, nil
}

type instanceSettings struct {
	endpoint     string
	name         string
	accessKey    string
	accessSecret string
}

func newDataSourceInstance(setting backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
	type editModel struct {
		Host string `json:"host"`
	}

	log.DefaultLogger.Debug("newDataSourceInstance ak: ", setting.DecryptedSecureJSONData["cmsAccessKey"]+"/"+setting.DecryptedSecureJSONData["cmsSecretKey"])

	cmsConfigObj := &CmsSetting{}

	if accessKey, hasIt := setting.DecryptedSecureJSONData["cmsAccessKey"]; hasIt {
		cmsConfigObj.CmsAccessKey = accessKey
		cmsConfigObj.CmsAcessSecret = setting.DecryptedSecureJSONData["cmsSecretKey"]
	} else {
		json.Unmarshal(setting.JSONData, &cmsConfigObj)
	}

	log.DefaultLogger.Debug("newDataSourceInstance" + "/" + cmsConfigObj.CmsAccessKey + "/" + cmsConfigObj.CmsAcessSecret)

	return &instanceSettings{
		// cluster: newCluster,
		// authenticator: authenticator,
		endpoint:     setting.URL,
		accessKey:    cmsConfigObj.CmsAccessKey,
		accessSecret: cmsConfigObj.CmsAcessSecret,
	}, nil
}
