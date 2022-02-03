var Foundation = (function () {
  var dateFormat = function dateFormat(oDate, fmt) {
    var o = {
      'M+': oDate.getMonth() + 1, //월
      'd+': oDate.getDate(), //낮
      'h+': oDate.getHours(), //시
      'm+': oDate.getMinutes(), //분
      's+': oDate.getSeconds(), //둘째
      'q+': Math.floor((oDate.getMonth() + 3) / 3), //4 분의 1
      S: oDate.getMilliseconds(), //밀리 초
    };
    if (/(y+)/.test(fmt)) {
      fmt = fmt.replace(
        RegExp.$1,
        (oDate.getFullYear() + '').substr(4 - RegExp.$1.length),
      );
    }
    for (var k in o) {
      if (new RegExp('(' + k + ')').test(fmt)) {
        fmt = fmt.replace(
          RegExp.$1,
          RegExp.$1.length == 1
            ? o[k]
            : ('00' + o[k]).substr(('' + o[k]).length),
        );
      }
    }
    return fmt;
  };

  return {
    dateFormat: dateFormat,
  };
})();

/**
 *
 *
 *@returns{Map}
 */
function Map() {
  var node = function (key, value) {
    this.key = key;
    this.value = value;
  };

  //지도 키를 추가하십시오
  var put = function (key, value) {
    for (var i = 0; i < this.arr.length; i++) {
      if (this.arr[i].key == key) {
        this.arr[i].value = value;
        return;
      }
    }
    this.arr[this.arr.length] = new node(key, value);
  };

  //키에 따라 값을 가져 오십시오
  var get = function (key) {
    for (var i = 0; i < this.arr.length; i++) {
      if (this.arr[i].key == key) {
        return this.arr[i].value;
      }
    }
  };

  //삭제 키
  var remove = function (key) {
    var v;
    for (var i = 0; i < this.arr.length; i++) {
      v = this.arr.pop();
      if (v.key == key) {
        continue;
      }
      this.arr.unshift(v);
    }
  };

  //바로 사이드
  var each = function (fCallback) {
    for (var i = 0; i < this.arr.length; i++) {
      fCallback(this.arr[i].value);
    }
  };

  this.arr = new Array();
  this.get = get;
  this.put = put;
  this.remove = remove;
  this.each = each;
}
