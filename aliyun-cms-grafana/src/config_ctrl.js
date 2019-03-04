export class GenericConfigCtrl {

    constructor() {
        this.current.url = this.current.url || "http://metrics.cn-hangzhou.aliyuncs.com";
        this.current.access = 'direct';
        this.accessKeyExist = this.current.jsonData.cmsAccessKey;
        this.secretKeyExist = this.current.jsonData.cmsSecretKey;
        this.regions = ['cn-hangzhou', 'cn-shanghai', 'cn-hangzhou-finance-intranet', 'cn-qingdao', 'cn-beijing',
            'cn-zhangjiakou', 'cn-shenzhen', 'cn-hongkong', 'ap-northeast-1', 'ap-southeast-1', 'ap-southeast-2', 'me-east-1',
            'us-west-1', 'eu-central-1'];
    }

    resetAccessKey() {
        this.accessKeyExist = false;
    }

    resetSecretKey() {
        this.secretKeyExist = false;
    }
}

GenericConfigCtrl.templateUrl = 'partials/config.html';