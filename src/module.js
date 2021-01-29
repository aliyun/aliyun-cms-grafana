import {GenericDatasource} from './datasource';
import {GenericDatasourceQueryCtrl} from './query_ctrl';

class GenericConfigCtrl {
  constructor() {
    this.current.url = this.current.url || "http://metrics.cn-hangzhou.aliyuncs.com";
    this.current.secureJsonData = {};
    this.current.jsonData = {};
}
}
GenericConfigCtrl.templateUrl = 'partials/config.html';

class GenericQueryOptionsCtrl {}
GenericQueryOptionsCtrl.templateUrl = 'partials/query.options.html';

class GenericAnnotationsQueryCtrl {}
GenericAnnotationsQueryCtrl.templateUrl = 'partials/annotations.editor.html'

export {
  GenericDatasource as Datasource,
  GenericDatasourceQueryCtrl as QueryCtrl,
  GenericConfigCtrl as ConfigCtrl,
  GenericQueryOptionsCtrl as QueryOptionsCtrl,
  GenericAnnotationsQueryCtrl as AnnotationsQueryCtrl
};
