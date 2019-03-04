'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var GenericConfigCtrl = exports.GenericConfigCtrl = function () {
    function GenericConfigCtrl() {
        _classCallCheck(this, GenericConfigCtrl);

        this.current.url = this.current.url || "http://metrics.cn-hangzhou.aliyuncs.com";
        this.current.access = 'direct';
        this.accessKeyExist = this.current.jsonData.cmsAccessKey;
        this.secretKeyExist = this.current.jsonData.cmsSecretKey;
        this.regions = ['cn-hangzhou', 'cn-shanghai', 'cn-hangzhou-finance-intranet', 'cn-qingdao', 'cn-beijing', 'cn-zhangjiakou', 'cn-shenzhen', 'cn-hongkong', 'ap-northeast-1', 'ap-southeast-1', 'ap-southeast-2', 'me-east-1', 'us-west-1', 'eu-central-1'];
    }

    _createClass(GenericConfigCtrl, [{
        key: 'resetAccessKey',
        value: function resetAccessKey() {
            this.accessKeyExist = false;
        }
    }, {
        key: 'resetSecretKey',
        value: function resetSecretKey() {
            this.secretKeyExist = false;
        }
    }]);

    return GenericConfigCtrl;
}();

GenericConfigCtrl.templateUrl = 'partials/config.html';
//# sourceMappingURL=config_ctrl.js.map
