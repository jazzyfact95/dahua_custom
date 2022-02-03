var DemoUI = (function (e) {
  return {
    setLoginDeviceIP: function () {},
    getLoginDeviceIP: function () {},
    removeDeviceInfo: function (ip) {},
    updateDeviceInfo: function (ip) {},
    setSvrPort: function () {},
    getSvrPort: function () {},
    setRtspPort: function () {},
    getRtspPort: function () {},
    setUsrName: function () {},
    getUsrName: function () {},
    setPassword: function () {},
    getPassword: function () {},
    addDeviceIP: function () {},
    removeDeviceIP: function () {},
    getCurDeviceIP: function () {},
    getEachDeviceIP: function () {},
    modifyChannelList: function () {},
    setCurChannel: function () {},
    getCurChannel: function () {},
    setCurStreamType: function () {},
    getCurStreamType: function () {},
    setCurProtocol: function () {},
    getCurProtocol: function () {},
    clearPresets: function () {},
    setWinIndex: function () {},
    setRecordStatus: function () {},
    setTemper: function () {},
  };
})(this);

$(function () {
  DemoUI.setLoginDeviceIP = function (ip) {
    $('#loginip').val(ip);
  };

  DemoUI.getLoginDeviceIP = function () {
    return $('#loginip').val();
  };

  DemoUI.removeDeviceInfo = function (ip) {
    //선명한 장비 정보
    DemoUI.removeDeviceIP();
    //현재 장치 정보를 설정합니다
    var selectDevice = DemoUI.getCurDeviceIP();
    DemoUI.updateDeviceInfo(selectDevice);
  };

  DemoUI.updateDeviceInfo = function (ip) {
    var info = WebVideoCtrl.getDeviceInfo(ip);
    if (typeof info != 'undefined') {
      //선택한 장치에 대한 정보를 업데이트하십시오
      DemoUI.setLoginDeviceIP(ip);
      DemoUI.setUsrName(info.userName);
      DemoUI.setPassword(info.password);
      DemoUI.setRtspPort(info.rtspPort);
      DemoUI.setSvrPort(info.port);
      DemoUI.setCurProtocol(info.protocol);
      $('#ips').val(ip);
      //채널 데이터를 업데이트하십시오
      DemoUI.modifyChannelList(info.channelNum);
    } else {
      //채널 목록 데이터를 정리하십시오
      DemoUI.modifyChannelList(0);
    }
  };

  DemoUI.setSvrPort = function (port) {
    $('#port').val(port.toString());
  };

  DemoUI.getSvrPort = function () {
    return $('#port').val() - 0;
  };

  DemoUI.setRtspPort = function (port) {
    $('#rtspport').val(port.toString());
  };

  DemoUI.getRtspPort = function () {
    return $('#rtspport').val() - 0;
  };

  DemoUI.setUsrName = function (usrName) {
    $('#username').val(usrName);
  };

  DemoUI.getUsrName = function () {
    return $('#username').val();
  };

  DemoUI.setPassword = function (password) {
    $('#password').val(password);
  };

  DemoUI.getPassword = function () {
    return $('#password').val();
  };

  DemoUI.addDeviceIP = function (ip) {
    $('#ips').append("<option value='" + ip + "'>" + ip + '</option>');
    $('#ips').val(ip);
  };

  DemoUI.removeDeviceIP = function () {
    var selectDevice = $('#ips').find('option:selected').text();
    $('#ips' + " option[value='" + selectDevice + "']").remove();
  };

  DemoUI.getCurDeviceIP = function () {
    return $('#ips').find('option:selected').text();
  };

  DemoUI.getEachDeviceIP = function (fCallback) {
    var index = 0;
    $('#ips option').each(function () {
      fCallback(this.text, index++);
    });
  };

  DemoUI.modifyChannelList = function (num) {
    $('#channels').empty();
    $('#channels1').empty();
    //채널 목록 정보를 업데이트하십시오
    if (-1 != num) {
      var i = 1;
      for (; i <= num; i++) {
        var subNode =
          '<option value=' + i.toString() + '>' + i.toString() + '</option>';
        $('#channels').append(subNode);

        var subNode =
          '<option value=' + i.toString() + '>' + i.toString() + '</option>';
        $('#channels1').append(subNode);
      }
    }
  };

  DemoUI.setCurChannel = function (chan) {
    $('#channels').val(chan.toString());
  };

  DemoUI.getCurChannel = function () {
    return $('#channels').val();
  };

  DemoUI.setCurStreamType = function (type) {
    $('#streamtype').val(type.toString());
  };

  DemoUI.getCurStreamType = function () {
    return $('#streamtype').val();
  };

  DemoUI.setCurProtocol = function (protocol) {
    $('#protocolType').val(protocol.toString());
  };

  DemoUI.getCurProtocol = function () {
    return $('#protocolType').val();
  };

  DemoUI.clearPresets = function () {
    $('#presetList').empty();
  };

  DemoUI.setWinIndex = function (num) {
    $('#winIndex').empty();
    //채널 목록 정보를 업데이트하십시오
    var i = 0;
    for (; i < num * num; i++) {
      var subNode =
        '<option value=' + i.toString() + '>' + i.toString() + '</option>';
      $('#winIndex').append(subNode);
    }
  };

  DemoUI.setRecordStatus = function (status) {
    //비디오가있는 날짜를 추가하십시오
    var i = 0;
    for (; i < 32 && i < status.length; i++) {
      if ('1' == status.charAt(i)) {
        var day = 31 - i;
        var subNode =
          '<option value=' +
          day.toString() +
          '>' +
          day.toString() +
          '</option>';
        $('#record_Status').prepend(subNode);
      }
    }
  };

  //월 정보를 초기화하십시오
  var i = 1;
  for (; i <= 12; i++) {
    var subNode =
      '<option value=' + i.toString() + '>' + i.toString() + '</option>';
    $('#recordStatus_month').append(subNode);
  }

  DemoUI.setTemper = function (val) {
    $('#Temper').val(val.toString());
  };

  DemoUI.addDownloadLinkID = function (val) {
    $('#downloadID').append("<option value='" + val + "'>" + val + '</option>');
  };
});
