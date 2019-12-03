import {QueryCtrl} from 'app/plugins/sdk';
import {Util} from './util.js';
import './css/query-editor.css!'

export class GenericDatasourceQueryCtrl extends QueryCtrl {

  constructor($scope, $injector, templateSrv)  {
    super($scope, $injector,templateSrv);
    this.scope = $scope;
    this.util = new Util(templateSrv);
    this.target.type = this.target.type || 'timeserie';
    this.target.target = this.target.ycol;
    this.target.describe = this.target.describe;
    this.target.xcol = this.target.xcol || 'timestamp';
    this.target.project = this.target.project || 'acs_ecs_dashboard';
    this.target.metric = this.target.metric;
    this.target.period = this.target.period;
    this.target.group = this.target.group;
    this.target.dimensions = this.target.dimensions || [];
    this.dimensions;
    this.target.ycol = this.target.ycol || [];
    this.statistics;

  }

  getOptions(query) {
    this.checkIsNull();
    return this.datasource.metricFindQuery(query || '');
  }

  getProjects() {
    this.checkIsNull();
    return this.datasource.getProject();
  }

  getMetrics() {
    this.checkIsNull();
    if(this.target.project){
      var project = this.util.exists(this.target.project) == true?this.util.resolve(this.target.project, {}):this.target.project;
      return this.datasource.getMetrics(project);
    }
  }

  getPeriod() {
    this.checkIsNull();
    if(this.target.project && this.target.metric){
      var project = this.util.exists(this.target.project) == true?this.util.resolve(this.target.project, {}):this.target.project;
      var metric = this.util.exists(this.target.metric) == true?this.util.resolve(this.target.metric, {}):this.target.metric;
      return this.datasource.getPeriod(project,metric);
    }
  }

  getStatistics() {
    this.checkIsNull();
    if(this.target.project && this.target.metric){
      var project = this.util.exists(this.target.project) == true?this.util.resolve(this.target.project, {}):this.target.project;
      var metric = this.util.exists(this.target.metric) == true?this.util.resolve(this.target.metric, {}):this.target.metric;
      return this.datasource.getStatistics(project,metric);
    }
  }

  ycolPush(ycol){
    this.checkIsNull();
    if(!ycol || _.includes(this.target.ycol, ycol)) {
        return;
    }
    this.target.ycol.push(ycol);
    this.statistics = "";
    this.panelCtrl.refresh();
  }

  ycolSplice(ycol){
    this.checkIsNull();
    if(!ycol || !_.includes(this.target.ycol, ycol)) {
        return;
    }
    let i = this.target.ycol.indexOf(ycol)
    this.target.ycol.splice(i,1);
    this.statistics = "";
    this.panelCtrl.refresh(); 
  }

  getGroups() {
    this.checkIsNull();
    return this.datasource.getGroups();
  }

  getDimensions() {
    this.checkIsNull();
    if(this.target.project && this.target.metric){
      var project = this.util.exists(this.target.project) == true?this.util.resolve(this.target.project, {}):this.target.project;
      var metric = this.util.exists(this.target.metric) == true?this.util.resolve(this.target.metric, {}):this.target.metric;
      var period = this.util.exists(this.target.period) == true?this.util.resolve(this.target.period, {}):this.target.period;
      var dimensions = this.target.dimensions;
      if(this.target.dimensions.indexOf("$") != -1){
        dimensions=this.util.resolve(this.target.dimensions, {});
      };
      return this.datasource.getDimensions(project,metric,period,dimensions);
    }
  }

  dimensionsPush(dimension){
    this.checkIsNull();
    if(!dimension || _.includes(this.target.dimensions, dimension)) {
        return;
    }
    this.target.dimensions.push(dimension);
    this.dimensions = "";
    this.panelCtrl.refresh();
  }

  dimensionsSplice(dimension){
    this.checkIsNull();
    if(!dimension || !_.includes(this.target.dimensions, dimension)) {
        return;
    }
    let i = this.target.dimensions.indexOf(dimension)
    this.target.dimensions.splice(i,1);
    this.dimensions = "";
    this.panelCtrl.refresh(); 
  }

  toggleEditorMode() {
    this.target.rawQuery = !this.target.rawQuery;
  }

  onChangeInternal() {
    this.checkIsNull();
    this.panelCtrl.refresh(); // Asks the panel to refresh data.
  }
  
  // 校验页面可输入参数，防止脏乱
  checkIsNull(){
    var re = new RegExp("^[ ]+$");
    if(!this.target.project || this.target.project == "null" 
      || this.target.project == " " || this.target.project == '""' 
      || re.test(this.target.project)){
      this.target.project = "";
    }
    if(!this.target.metric || this.target.metric == "null" 
      || this.target.metric == " " || this.target.metric == '""' 
      || re.test(this.target.metric)){
      this.target.metric = "";
    }
    if(!this.target.period || this.target.period == "null" 
      || this.target.period == " " || this.target.period == '""' 
      || re.test(this.target.period)){
      this.target.period = "";
    }
    if(!this.target.group || this.target.group == "null" 
      || this.target.group == " " || this.target.group == '""' 
      || re.test(this.target.group)){
      this.target.group = "";
    };
    if(this.target.dimensions.length < 1){
      this.target.dimensions = [];
    }
    if(!this.dimensions || this.dimensions == "null" 
      || this.dimensions == " " || this.dimensions == '""' 
      || re.test(this.dimensions)){
      this.dimensions = "";
    }
    if(!this.target.ycol || this.target.ycol == "null" 
      || this.target.ycol == " " || this.target.ycol == '""' 
      || re.test(this.target.ycol)){
      this.target.ycol = "";
    }
    if(!this.statistics || this.statistics == "null" 
      || this.statistics == " " || this.statistics == '""' 
      || re.test(this.statistics)){
      this.statistics = "";
    }
    if(!this.target.xcol || this.target.xcol == "null" 
      || this.target.xcol == " " || this.target.xcol == '""' 
      || re.test(this.target.xcol)){
      this.target.xcol = "";
    }
    if(!this.target.describe || this.target.describe == "null" 
      || this.target.describe == " " || this.target.describe == '""' 
      || re.test(this.target.describe)){
      this.target.describe = "";
    }
  }
}

GenericDatasourceQueryCtrl.templateUrl = 'partials/query.editor.html';

