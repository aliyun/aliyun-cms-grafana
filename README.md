# aliyun-cms-grafana数据源使用说明文档

## 1、安装云监控grafana数据源
    a.下载数据源插件,将解压后的文件夹放入grafana安装目录下的数据源目录中(${GRAFANA_HOME}\public\app\plugins\);
    b.重启grafana即完成安装。service grafana-server restart。
## 2、配置云监控grafana数据源
    a.进入grafana的数据源配置页面(Data Sources),点击Add data source进入配置表单页面,填入数据源名称(Name),
        在数据源类型(Type)对应的下拉列表中选择CMS Grafana Service。
    b.然后开始配置HTTP以及cloudmonitor service details,URL是所有获取云监控数据的请求地址,根据你所在Endpoint填写,
        默认为http://metrics.cn-hangzhou.aliyuncs.com, Access key ID和Secret access key填写账号AK,填写完成点击Save & Test,
        如果显示Success Data source is working,说明数据源配置成功,可以开始在grafana中访问阿里云监控的数据了。
        具体可参考:https://help.aliyun.com/document_detail/109434.html?spm=a2c4g.11186623.6.565.70d048adQpRZsT
## 3、数据源打包发布方式
    a.进入aliyun-cms-grafana目录下,执行grunt命令(需要安装nodejs和npm),则会按照Gruntfile.js里面的配置将项目里面的文件打包到指定的目录,
        当前配置是将项目文件打包到dist目录下,发布的时候打包发布整个插件目录下的文件,dist目录下一定是经源文件编译后的。
## 4、FAQ
    a.云监控grafana数据源配置的AK保存在哪里?有没有AK被窃取的风险？
        数据源配置AK存储在grafana内置的数据库里,不会通过网络传输AK,只要保证安装grafana机器的安全AK就不会被窃取。
    b.云监控grafana数据源实现原理是什么样的?
        云监控数据源通过实现js版本的[签名算法](https://help.aliyun.com/document_detail/28616.html?spm=5176.doc28618.6.639.5rgcw8);
        用配置的AK生成签名拼接URL请求阿里云网关的open api获取数据,这种方式安装配置简单,不需要部署其他额外的服务即可使用。
## 5、20181120更新内容：
    (更新对应cms open api version 20180308,aliyun-java-sdk-cms 6.0.*)
    a.Project项目: 动态从QueryProjectMeta接口获取,且设置一个默认值为acs_ecs_dashboard;
    b.Metric监控项: 根据已选择的Project动态从QueryMetricMeta接口获取(默认150,不足可输入),默认为空;
    c.Period时间间隔: 根据已选择的Metric监控项动态从QueryMetricMeta接口获取,且支持输入联想框、手动输入;
    d.Group分组: 根据ListMyGroups接口动态获取该Ak信息下的所有分组;
    e.Dimensions实例维度: 若不选择Group分组,择根据QueryMetricLast接口动态获取该AK下的所有实例信息,且支持输入联想、多选、去除已选项;
        若选择Group分组后,根据ListMyGroupInstances接口动态获取该分组下的所有实例信息,且支持输入联想、多选、去除重复已选项;
    f.Y - column目标源: 根据已选择的Metric监控项动态从QueryMetricMeta接口获取,且支持输入联想框、手动输入、多选。
## 6、20181229更新内容：
    a.Project可选择自定义监控;
    b.Metric无接口可查询自定义监控的Metric信息;
    c.Group可查看groupName / groupId; 在自定义监控下,group必选; 在其他情况下,group可选;
    d.Dimensions分二大种情况：
        一.自定义监控、日志监控类: 此情况下,Dimensions不做任何提示,原因是QueryMetricList接口无法根据GroupId和MetricName获取维度信息,必须传入Dimension才可获取;
        二.正常监控,选Group,获取该分组下的实例信息; 不选Group获取QueryMetricLast查询下的数据解析后去重实例信息;
    e.页面参数全部增加提示信息。
## 7、20190328更新内容：
    a.支持对project、metric、period、group、dimensions、ycol的variables的custom变量模版支持。
## 8、20190826更新内容：
    a.新增对variables的Query语法支持,提供更灵活的模版功能,不在单纯只是custom模版,解放更多的手动输入,让模版使用更方便快捷;
        暂支持:
            namespace(filter),metric(namespace,filter),dimension(namespace,metric,instanceId,filter);
            namespace、metric必须输入,不能为空,且为字符串,不需要符号;
            filter、instanceId可输入null,为null时全部数据返回,不做过滤,且可输入字符串,或数组,数组使用";"分割数据。
        eg:
            namespace(_ecs_),namespace(null);
            metric(acs_ecs_dashboard,disk),metric($namespace,disk),metric($namespace,null);
            dimension(acs_ecs_dashboard,diskusage_used,i-2zed,/dev/vd),
            dimension($namespace,$metric,[i-2zed;i-2zeg;i-2zeb],/dev/vda1),
            dimension($namespace,$metric,i-2zed;i-2zeg;i-2zeb,/dev/vda1),
            dimension($namespace,$metric,/dev/vda1,[i-2zed;i-2zeg;i-2zeb]),
            dimension($namespace,$metric,/dev/vda1,null),

            $instanceId	[g99hxhnnyr;1egdhoza;kty4zk40hh] type(constant/custom)
            dimension($namespace,$metric,$instanceId,/dev/vda1),

            $instanceId	[g99hxhnnyr;1egdhoza;kty4zk40hh] $filter [/dev/vda1;/dev/vdb] type(constant/custom)
            dimension($namespace,$metric,$instanceId,$filter)。
    b.修改Project为Namespace,保持原因功能不变;
    c.优化dimensions,使用更强大的dimensions信息组合,提供更明了的dimensions信息展示;支持dimensions多选,包含模版、和下方条件;
    d.去除非自定义监控、日志监控下的Group筛选实例信息功能,即Group只适用于自定义监控、日志监控,不在提供过滤dimensions信息支持;
    e.优化dashboard数据展示,根据模版选定分条展示数据,暂只支持包含有instanceId的查询数据。
## 9、20191030更新内容：
    a.增加tagFilter,tag方法,对ECS和RDS的打Tag标签对应的实例进行过滤:
        格式:
            tagFilter(type, regionId, tagType, tagKey),
            tags(type, regionId, resourceType, resourceId_array, tag_array);
        eg:
            1.tagFilter支持获取当前账户下的对应实例打Tag的Key和Key:/:Value集合;
                //获取当前账户下北京地区的rds的Tag的key集合,即Tag Kye集合
                    tagFilter(rds, cn-beijing, key, null) 
                //获取当前账户下北京地域的rds的Tag的$tag对应的key:/:value集合,对应Tag Kye下的Key:/:Value集合
                    tagFilter(rds, cn-beijing, value, $tag) 
            
            2.tag支持获取当前账户下的对应实例打Tag的instanceId集合;
                resourceId_array 需过滤的instanceId集合,ResourceId.N 格式["instanceId_1","instanceId_2","instanceId_3"]
                tag_array 需过滤tag集合,Tag.N.Key,Tag.N.Value;  参数形式以 key:/:value or key形式填入参数
                格式: ["key1:/:value1","key2:/:value2","key3:/:value3"] or ["key1","key2","key3"],
                //获取当前账户下北京地域的rds的instanceId集合;
                    过滤条件:ResourceId.1=instanceId_1&ResourceId.2=instanceId_2&Tag.1.Key=key1&Tag.1.Value=value1&Tag.2.Key=key2&Tag.2.Value=value2
                    tag(rds, cn-beijing, INSTANCE, ["instanceId_1","instanceId_2"], ["key1:/:value1","key2:/:value2"]);
                resourceId_array,tag_array支持variables语法,与tagFilter配合使用,效果更好,tagFilter支持分组模式,更好的使用Tag的标签;
                    tags(rds, cn-beijing, INSTANCE, null, $tagFilter);
## 10、20200107：
    a.修复window磁盘\转义问题
## 11、20200730：
    a.tagFilter(type, regionId, tagType, tagKey)
        支持tagKey参数请求
    b.优化variable dimensions功能；
    c.优化部分代码逻辑
    d.取消加密验证