import _ from 'lodash';

export class Util {

  constructor(templateSrv) {
    this.templateSrv = templateSrv;
  }

  resolve(target, options) {
    const variableNames = (this.templateSrv.variables || []).map(v => '$' + v.name);
    // For each variable in target, and each values of a given variable, build a resolved target string
    let resolved = [target];
    if (variableNames) {
      variableNames.forEach(name => {
        if (target.indexOf(name) >= 0) {
          const values = this.getVarValues(name, options.scopedVars);
          const newResolved = [];
          const regex = new RegExp('\\' + name, 'g');
          values.forEach(val => {
            resolved.forEach(newTarget => {
              newResolved.push(newTarget.replace(regex, val));
            });
          });
          resolved = newResolved;
        }
      });
    }
    return resolved;
  }

  resolveForQL(target, options) {
    return this.templateSrv.replace(target, options.scopedVars, values => {
      if (_.isArray(values)) {
        return values.map(v => `'${v}'`).join(',');
      }
      return `'${values}'`;
    });
  }

  getVarValues(name, scopedVars) {
    const values = this.templateSrv.replace(name, scopedVars);
    // result might be in like "{id1,id2,id3}" (as string)
    if (values.charAt(0) === '{') {
        return values.substring(1, values.length-1).split(',');
    }
    return [values];
  }

  exists(name) {
    return this.templateSrv.variableExists(name);
  }

  isEmpty(obj) { 
    var re = new RegExp("^[ ]+$");
    if(!obj || obj == "null" || obj == null || obj == " " || obj == "" 
      || obj == '""' || re.test(obj) || typeof(obj) == "undefined"){
      return true
    }// 为空
    return false; // 不为空
  }

  //将数组处理成Map对象集 
  arrayToMap(result) {
    return _.map(result, (d, i) => {
      return { text: d, value: d };
    });
  }

  //处理str模板变量数据
  templateToStr(tmp_str){
    if(this.isEmpty(tmp_str)){
      return [];
    }
    tmp_str = this.exists(tmp_str) ? this.resolve(tmp_str, {}) : tmp_str;
    if("object" == typeof tmp_str && Object.keys(tmp_str).length){
      tmp_str = tmp_str[0];
    }
    return tmp_str;
  }

  // 处理str类型字符串数组成[]类型
  strToArray(str_var){
    str_var = this.templateToStr(str_var);

    if(str_var.includes("[") || str_var.includes("]")){
      str_var = str_var.replace("[", "").replace("]", "");
    }

    var str_var_array = []
    if(str_var.includes(";")){
      str_var_array = str_var.split(";");
    }else if(str_var.includes(",")){
      str_var_array = str_var.split(",");
    }else{
      str_var_array.push(str_var);
    }
    var result_array = [];
    str_var_array.forEach(i => {
      i = this.exists(i) ? this.resolve(i, {}) : i;
      result_array.push(i);
    })

    return result_array;
  }
}