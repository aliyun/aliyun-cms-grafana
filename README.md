# aliyun-cms-grafana 2.0 服务端数据源安装使用说明文档

## 安装依赖
    2.0 服务端版本需要 Grafana 版本 7+ 
    如果是旧版本 Grafana，只能安装 1.0 版本 https://github.com/aliyun/aliyun-cms-grafana/tree/v1.0
## 1、直接安装云监控grafana数据源
    a. 直接 从release 页面 https://github.com/aliyun/aliyun-cms-grafana/releases 里面下载 aliyun_cms_grafana_datasource_v2.0.tar.gz
    b. 下载到 grafan的plugin目录中，解压缩 tar -xzf aliyun_cms_grafana_datasource_v2.0.tar.gz
    c. 修改 conf/defaults.ini 允许未签名插件运行
        allow_loading_unsigned_plugins = aliyun_cms_grafana_datasource
    d. 重启grafana

## 2、源代码安装
    a. 前端编译
        进入aliyun-cms-grafana目录下,执行grunt命令(需要安装nodejs和npm),则会按照Gruntfile.js里面的配置将项目里面的文件打包到指定的目录,
        当前配置是将项目文件打包到dist目录下,发布的时候打包发布整个插件目录下的文件,dist目录下一定是经源文件编译后的。
    b. 服务端编译
    需要安装   
        go 1.14   
        mage
        之后在目录中运行 mage -v， 会自动在 dist目录下生成 相应的二进制包。之后跟随前端代码统一发布

    c. 部署
        1）按照上面顺序编译完成后，代码都会到dist下面。包括前端文件和二进制可执行文件 cms-datasource*。
        2）保证 cms-datasource* 都具有可执行权限。chmod +x cms-datasource*
        3) 在grafana 的plugin目录中，创建 aliyun_cms_grafana_datasource 目录，把编译出来的dist目录拷贝到此
        4) 修改 conf/defaults.ini 允许未签名插件运行
            allow_loading_unsigned_plugins = aliyun_cms_grafana_datasource
        5) 重启grafana


## 3、配置云监控grafana数据源
    a.进入grafana的数据源配置页面(Data Sources),点击Add data source进入配置表单页面,填入数据源名称(Name),
        在数据源类型(Type)对应的下拉列表中选择CMS Grafana Service。
    b. 配置你的AK 和阿里云ID
        如果显示Success Data source is working,说明数据源配置成功,可以开始在grafana中访问阿里云监控的数据了。
        具体可参考:https://help.aliyun.com/document_detail/109434.html?spm=a2c4g.11186623.6.565.70d048adQpRZsT

