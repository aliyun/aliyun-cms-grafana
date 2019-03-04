# 阿里云监控grafana数据源使用说明文档

## 1、安装云监控grafana数据源
    从阿里云监控官网下载数据源压缩包，将解压后的文件夹放入grafana安装目录下的数据源目录中（${GRAFANA_HOME}\public\app\plugins\datasource），
    重启grafana即完成安装。
## 2、配置云监控grafana数据源
    进入grafana的数据源配置页面(Data Sources)，点击Add data source进入配置表单页面，填入数据源名称（Name），在数据源类型（Type）下拉列表中
    选择metricstore。然后开始配置Endpoint以及认证信息，Endpoint是所有获取云监控数据的请求地址，根据你所在Endpoint填写，
    默认为http://metrics.cn-hangzhou.aliyuncs.com，Access key ID和Secret access key填写账号AK，填写完成点击Save & Test，
    如果显示Success Data source is working，说明数据源配置成功，可以开始在grafana中访问阿里云监控的数据了。
## 3、使用云监控grafana数据源
    云监控数据源支持多种grafana原生的数据展示方式，下面主要介绍Graph和Table两种展示方式和Templating功能的使用：
###（1）、图表（Graph）方式
    在dashboard上点击ADD ROW时选择Graph，在Panel data source中选择配置的云监控数据源，上方会显示配置表单，下面解释表单中各项的意义：
    **Metric**：Project/Metric格式的所有云监控预设监控项，详细请访问: https://help.aliyun.com/document_detail/28619.html?spm=5176.doc51936.6.654.zVApOa，
    必须首先选择Metric，因为其他各项会依赖Metric的选择。
    **Period**：数据点时间间隔，按照所选metric定义的peroid或者peroid的整数倍填写，默认为空，当Period为空时云监控后台会根据选择的时间
    范围计算一个最合适的Period。由于每次请求后台只返回1000个数据点，所以建议选择时间段较长的时候保持此项为空，避免图表中出现数据断层。
    **Values**：统计方法，比如Average 、Minimum 、Maximum等，此项可以下拉选择一项或者多项，已选项会以标签的方式列在右侧，你可以点击
    标签上的X删除一个已选项。注意：选择此项必须先选择Metric。
    **Dimensions**：维度，比如instanceId、device等，根据选择的Metric不同会有所不同。Dimensions是有层级关系的，必须先选择上一层级
    Dimension的值才会显示下一层级Dimension的名称和可选的值，当你点击Dimension的输入框时，会下拉提示设置账号下所属资源的列表。注意：
    需要先选择Metric才可以配置Dimensions。
    当你配置完成所有配置项的时候，点击表单空白位置就会在图标中出现数据，当然你修改Period、Values、Dimensions任意一项的时候，都会按照你
    最新的配置重新获取数据。如果你修改了Metric，若新的Metric和旧的Metric各配置项不匹配的时候会清空所有表单中的配置，因为不同Metric可以
    配置的项目内容可能不同。
    **说明**：图表标题默认为配置Metric的名称；图表各线条的命名规则为：Metric_Dimensions_Value，其中Dimensions有几级就显示几级，
    用"_"分割，这种组合命名方式方便区分不同线条所代表的意义。
###（2）、表格（Table）方式
    在dashboard上点击ADD ROW时选择Table，在Panel data source中选择配置的云监控数据源，上方会显示配置表单，下面解释表单中各项的意义：
    **Metric**：同图表（Graph）方式。
    **Period**：同图表（Graph）方式。
    **listByTop**：不勾选表示以表格方式列出时序数据，数据意义同图表（Graph）方式，其实就是图表数据内容表格化，其他各项配置也和
    图表（Graph）方式一样；勾选表示获取某个账号中所有机器所选Metric的整体统计信息，适用于例如列出本账号下CPU使用率最高的多少台机器这类
    的场景，勾选此项时Dimensions配置项隐藏，增加Limit、Order By、orderDesc三项。
    **Values**：同图表（Graph）方式。
    **Dimensions**：同图表（Graph）方式。
    **Limit**：列出数据条数，例如上述CPU使用率最高的条数。
    **Order By**：排序字段。
    **orderDesc**：是否倒序，不勾选按照Order By的字段从大到小选择前Limit条数据，勾选反之，默认不勾选。
    当你配置完成所有配置项的时候，点击表单空白位置就会在图标中出现数据，当然你修改Period、Values、Dimensions、Limit、Order By、
    orderDesc任意一项的时候，都会按照你最新的配置重新获取数据。如果你修改了Metric时，若新的Metric和旧的Metric各配置项不匹配的时候会
    清空所有表单中的设置，因为不同Metric可以配置的项目内容可能不同。
     **说明**：勾选listByTop时表格标题默认为配置Metric的名称，表中列为Time、各级Dimensions、选择的Values；不勾选listByTop时表格标
     题默认为Metric和各级Dimensions的组合，表中列为Time、选择的Values。
###（3）、Templating功能
    Templating功能可以方便切换查看不同机器的监控数据而不需要修改配置表单，云监控数据源支持简单的匹配模式提供Templating功能。
    进入Templating新建页面，填入名称（name）、下拉选择Data source为设置的云监控数据源，在Query里面填写查询格式：dimension_values("${Metric}"),
    ${Metric}即为配置表单中的Metric，如：acs_ecs_dashboard/CPUUtilization。其中dimension_values()是固定格式，小括号里面是
    双引号包裹的Metric字符串。当然这种格式也支持级联的格式，可以在下一级的Query语句通过$name引用上一级的Query结果，从左往右逐级
    引用对应级别的Query name即可，例如针对acs_slb_dashboard/InactiveConnection这个Metric，Dimensions有三级：instanceId、
    port、vip，那么可以定义以下Query语句查询各个层级的Dimension值：
    $instanceId：dimension_values("acs_slb_dashboard/InactiveConnection")//列出所有instanceId
    $port：dimension_values("acs_slb_dashboard/InactiveConnection","$instanceId")//列出所有port
    $vip：dimension_values("acs_slb_dashboard/InactiveConnection","$instanceId","$port")//列出所有vip
    **注意**：引用上级别的Query时候name前需要加"$"，并用双引号包裹起来。
## 4、数据源打包发布方式
    进入metricstore4grafana\metricstore-datasource 目录下，执行grunt命令（需要安装nodejs和npm），则会按照Gruntfile.js里面的配置
    将项目里面的文件打包到指定的目录，当前配置是将项目文件打包到dist目录下，发布的时候打包发布dist目录下的文件。
## 5、FAQ
   （1）、云监控grafana数据源配置的AK保存在哪里？有没有AK被窃取的风险？
         数据源配置AK存储在grafana内置的数据库里，不会通过网络传输AK，只要保证安装grafana机器的安全AK就不会被窃取。

   （2）、云监控grafana数据源实现原理是什么样的？
         云监控数据源通过实现js版本的[签名算法](https://help.aliyun.com/document_detail/28616.html?spm=5176.doc28618.6.639.5rgcw8)，
         用配置的AK生成签名拼接URL请求阿里云网关的open api获取数据，这种方式安装配置简单，不需要部署其他额外的服务即可使用。