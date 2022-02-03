//초기화 작업은 플러그인이로드 된 후에 수행됩니다.
$(function () {
  // 플러그인이 설치되어 있는지 확인하십시오
  WebVideoCtrl.checkPluginInstall()
    .done(function () {
      WebVideoCtrl.insertPluginObject('divPlugin', 500, 300);
      //초기화 플러그인
      WebVideoCtrl.initPlugin('Protocol2', function () {
        WebVideoCtrl.setOpInfoCallback(showOPInfo);
        var left = $('#divPlugin').offset().left;
        var top =
          $('#divPlugin').offset().top +
          window.outerHeight -
          window.innerHeight;
        var width = $('#divPlugin').width();
        var height = $('#divPlugin').height();
        WebVideoCtrl.resizeVideo(left, top, width, height);
        //비디오 창을 만듭니다
        WebVideoCtrl.createMultiNodeDisplay(36);
        //비디오 창의 디스플레이를 설정합니다
        var num = parseInt($('#wndNum').find('option:selected').val());
        //창 섹션 수를 설정하십시오
        WebVideoCtrl.setSplitNum(num);
        //등록 문제shc1-3.iptime.org
        WebVideoCtrl.registerEvent('SelectedView', responseSelectedViewSignal);
        //초기화경로
        WebVideoCtrl.getUserDirectory().done(function (szDir) {
          var szPath = szDir + '\\' + 'LiveRecord';
          $('#LiveRecord').val(szPath);
          szPath = szDir + '\\' + 'Download';
          $('#Download').val(szPath);

          szPath = szDir + '\\' + 'LiveSnapshot';
          $('#LiveSnapshot').val(szPath);

          szPath = szDir + '\\' + 'PlaybackPicPath';
          $('#PlaybackPicPath').val(szPath);

          szPath = szDir + '\\' + 'PlaybackFilePath';
          $('#PlaybackFilePath').val(szPath);
          $('#tabs').tabs();
          //창문 시퀀스 번호 선택 상자 숨기기
          $('#winIndex').hide();
        });
      });
      $('#tabs_ptz').tabs();
      $('#tabs_playback').tabs();
      $('#tabs_control').tabs();
      $('#closePtzLocate').hide();
      $('#openPtzLocate').show();
    })
    .fail(function () {
      alert(
        '플러그인을 설치하지 않았습니다. 개발 패키지 카탈로그에서 패키지 아래에서 WebPlugin을 두 번 클릭하십시오..exe설치',
      );
    });
});

//비디오 창
/**
 *@description 프로세싱 윈도우 스위칭 이벤트
 *@param{Num} iNodeIndex  노드 일련 번호
 *@param{Num} iViewIndex  일련 번호보기
 *@param{Num} iWinID      창 ID.
 */
function responseSelectedViewSignal(iNodeIndex, iViewIndex, iWinID) {
  //플레이어에 대한 정보를 업데이트하십시오
  var playrInfo = WebVideoCtrl.getPlayerInfo(iWinID);
  //UI 정보를 업데이트하십시오
  if (typeof playrInfo != 'undefined') {
    //장치 정보
    var deviceInfo = WebVideoCtrl.getDeviceInfo(playrInfo.ip);
    if (typeof deviceInfo != 'undefined') {
      DemoUI.updateDeviceInfo(playrInfo.ip);
      DemoUI.setCurChannel(playrInfo.channle);
      DemoUI.setCurStreamType(playrInfo.streamType);
    }
  }
}

//디스플레이 조작 정보
function showOPInfo(szInfo, status, error) {
  var szTip =
    '<div>' +
    Foundation.dateFormat(new Date(), 'yyyy-MM-dd hh:mm:ss') +
    ' ' +
    szInfo;
  if (typeof status != 'undefined') {
    szTip += '(' + status.toString() + ', ' + error.toString() + ')';
  }
  szTip += '</div>';
  $('#opinfo').html(szTip + $('#opinfo').html());
}

//창 스위칭 이벤트
function changeWndNum(num) {
  //비디오 창의 디스플레이를 설정합니다
  var num = parseInt($('#wndNum').find('option:selected').val());
  WebVideoCtrl.setSplitNum(num);
  DemoUI.setWinIndex(num);
}

//창 스위칭 이벤트
function changeWndRow(row) {
  //비디오 창의 디스플레이를 설정합니다
  var row = parseInt($('#wndRow').find('option:selected').val());
  var col = parseInt($('#wndCol').find('option:selected').val());
  WebVideoCtrl.setSplitRowAndCol(row, col);
  DemoUI.setWinIndex(row * col);
}

//창 스위칭 이벤트
function changeWndCol(col) {
  //비디오 창의 디스플레이를 설정합니다
  var row = parseInt($('#wndRow').find('option:selected').val());
  var col = parseInt($('#wndCol').find('option:selected').val());
  WebVideoCtrl.setSplitRowAndCol(row, col);
  DemoUI.setWinIndex(row * col);
}

//장치 로그인
function clickLogin() {
  // var szLang = navigator.browserLanguage.toLowerCase();
  // var szUserLang = navigator.userLanguage.toLowerCase();
  // var szLanguage = (navigator.browserLanguage || navigator.language ).toLowerCase();
  // szLanguage = szLanguage.substring(0, 2);

  var szIP = $('#loginip').val();
  szPort = $('#port').val() - 0;
  szUsername = $('#username').val();
  szPassword = $('#password').val();
  rtspPort = $('#rtspport').val() - 0;
  protocol = $('#protocolType').val() - 0;
  timeout = $('#loginTimeout').val() - 0;
  if ('' == szIP || '' == szPort) {
    return;
  }
  var port = parseInt($('#port').val());
  //현재 장치가 이미 로그인한지 확인하십시오
  var deviceInfo = WebVideoCtrl.getDeviceInfo(szIP);
  if (typeof deviceInfo != 'undefined') {
    if (WebVideoCtrl.logout(szIP)) {
      //프롬프트 추가
      showOPInfo(szIP + ' Logout Device ');
      //장치 정보를 삭제하십시오
      DemoUI.removeDeviceInfo(szIP);
    }
  }
  WebVideoCtrl.login(
    szIP,
    port,
    szUsername,
    szPassword,
    rtspPort,
    protocol,
    timeout,
    function (sIp, iDeviceID) {
      showOPInfo(sIp + ' Login Succeed ');
      //삽입 장치
      DemoUI.addDeviceIP(sIp);
      //채널 번호를 가져옵니다
      WebVideoCtrl.getChannelNumber(iDeviceID).done(function (ret) {
        //채널 데이터를 업데이트합니다
        DemoUI.modifyChannelList(ret);
      });
    },
    function (iErrorCode, sError) {
      showOPInfo(szIP + ' Login Fail ', iErrorCode, sError);
    },
  );
}

function switchDeviceInfo(ip) {
  DemoUI.updateDeviceInfo(ip);
}

function clickLogout() {
  //현재 선택된 것을 얻으십시오
  var ip = DemoUI.getCurDeviceIP();
  if (WebVideoCtrl.logout(ip)) {
    //프롬프트 추가
    showOPInfo(ip + ' Logout Device ');
    //장치 정보를 삭제하십시오
    DemoUI.removeDeviceInfo(ip);
  }
}

function changeProtocol(protocol) {
  //현재 프로토콜 유형을 가져옵니다
  var protocol = parseInt($('#protocolType').find('option:selected').val());
  /**
	//현재 장치 정보를 얻으십시오
	var ip = DemoUI.getCurDeviceIP();
	//장비 정보를 얻으십시오
	var deviceInfo = WebVideoCtrl.getDeviceInfo(ip);
	if(typeof deviceInfo != "undefined")
	{
		//프로토콜 스위치
		if(protocol != deviceInfo.protocol){
			//로그 아웃 장치
			if(WebVideoCtrl.logout(ip))
			{
				//프롬프트 추가
				showOPInfo(ip + " 장비에서 로그 아웃하십시오!");
				//장치 정보를 삭제하십시오
				DemoUI.removeDeviceInfo(ip);
			}
			clickLogin();
		}
	}
	**/
}

function clickStartRealPlay() {
  //현재 선택된 장치 IP를 가져옵니다
  var sIP = DemoUI.getCurDeviceIP();
  //채널 번호를 가져옵니다
  var iChannel = $('#channels').val() - 0;
  //스트림 타입을 얻으십시오
  var iStreamType = parseInt($('#streamtype').val(), 10);
  //창 선택 모드
  var iMode = parseInt($('#winMode').val(), 10);
  if (0 == iMode) {
    WebVideoCtrl.connectRealVideo(
      sIP,
      iChannel,
      iStreamType,
      function (iPlayerID) {
        showOPInfo(sIP + ' Channel:' + iChannel.toString() + ' Live succeed');
      },
      function (status, error) {
        showOPInfo(
          sIP + ' Channel:' + iChannel.toString() + ' Live Fail',
          status,
          error,
        );
      },
    );
  } else {
    //창 일련 번호
    var iWinIndex = parseInt($('#winIndex').val(), 10);
    WebVideoCtrl.connectRealVideoEx(
      iWinIndex,
      sIP,
      iChannel,
      iStreamType,
      function (iPlayerID) {
        showOPInfo(sIP + ' Channel:' + iChannel.toString() + ' Live succeed');
      },
      function (status, error) {
        showOPInfo(
          sIP + ' Channel:' + iChannel.toString() + ' Live Fail',
          status,
          error,
        );
      },
    );
  }
}

function changeStreamType(streamtype) {
  //플레이어 정보를 얻으십시오
  if (0 != WebVideoCtrl.getSelectedPlayerID()) {
    clickStartRealPlay();
  }
}

//선택한 창의 실시간 모니터링을 닫습니다.
function clickStopRealPlay() {
  WebVideoCtrl.closePlayer();
}

//열려있는
function clickStartVoiceTalk() {
  //현재 선택된 장치 IP를 가져옵니다
  var sIP = DemoUI.getCurDeviceIP();
  WebVideoCtrl.startVoiceTalk(sIP, {
    cbSuccess: function () {
      showOPInfo(sIP + ' Enable AudioTalk Succeed');
    },
    cbFailed: function () {
      showOPInfo(sIP + ' Enable AudioTalk Fail');
    },
  });
}

//확대
function clickStopVoiceTalk() {
  //현재 선택된 장치 IP를 가져옵니다
  var sIP = DemoUI.getCurDeviceIP();
  WebVideoCtrl.stopVoiceTalk(sIP);
}

// 선택 상자를 엽니 다
function clickOpenFileDlg(id) {
  WebVideoCtrl.selectDirectory(id, {
    cbSuccess: function (path) {
      if (path != -1 && path != '' && path != null) {
        $('#' + id).val(path);
      }
    },
  });
}

function clickSetVolume() {
  //선택한 창의 볼륨을 설정합니다
  WebVideoCtrl.setVolume(parseInt($('#volume').val(), 10), {
    cbSuccess: function (winIndex) {},
    cbFailed: function (winIndex) {},
  });
}

function clickOpenSound() {
  WebVideoCtrl.openSound({
    cbSuccess: function (winIndex) {},
    cbFailed: function (winIndex) {},
  });
}

function clickCloseSound() {
  WebVideoCtrl.closeSound({
    cbSuccess: function (winIndex) {},
    cbFailed: function (winIndex) {},
  });
}

function clickEnableEZoom() {
  if (WebVideoCtrl.enableEZoom()) {
    showOPInfo('Enable Enlarger Succeed');
  } else {
    showOPInfo('Enable Enlarger Fail');
  }
}

function clickDisableEZoom() {
  if (WebVideoCtrl.disableEZoom()) {
    showOPInfo('Disable Enlarger Succeed');
  } else {
    showOPInfo('Disable Enlarger Fail');
  }
}

function clickFullScreen() {
  WebVideoCtrl.setFullscreen();
}

function clickOpenSound() {
  var winID = WebVideoCtrl.getSelectedWinID();
  if (WebVideoCtrl.openSound()) {
    showOPInfo('open Sound Succeed');
  } else {
    showOPInfo('open Sound Fail');
  }
}

function clickCloseSound() {
  var winID = WebVideoCtrl.getSelectedWinID();
  if (WebVideoCtrl.closeSound()) {
    showOPInfo('Close Sound Succeed');
  } else {
    showOPInfo('Close Sound Fail');
  }
}

function clickCapturePic() {
  var path = $('#LiveSnapshot').val();
  var format = $('#captureFileFormat').val() - 0;
  WebVideoCtrl.crabOnePicture(format, path, false).done(function (ret) {
    if (ret) {
      showOPInfo('Snapshot Succeed,Path:' + path);
    } else {
      showOPInfo('Snapshot Fail');
    }
  });
}

function clickStartRecord() {
  var path = $('#LiveRecord').val();
  var format = parseInt($('#recordFormat').val(), 10);
  WebVideoCtrl.startRecordingVideo(format, path).done(function (ret) {
    if (ret) {
      showOPInfo('Start Record Succeed,Path:' + path);
    } else {
      showOPInfo('Start Record Fail');
    }
  });
}

function clickStopRecord() {
  WebVideoCtrl.stopRecordingVideo().done(function (ret) {
    if (ret) {
      showOPInfo('Stop Record Succeed');
    } else {
      showOPInfo('Stop Record Fail');
    }
  });
}

function mouseUPLeftPTZControl(flag) {
  //움직이는 속도를 얻으십시오
  var speed = parseInt($('#ptzspeed').val(), 10);
  WebVideoCtrl.moveUpperLeft(speed, speed, flag);
}

function mouseUpPTZControl(flag) {
  var speed = parseInt($('#ptzspeed').val(), 10);
  WebVideoCtrl.moveUpwards(speed, flag);
}

function mouseUPRightPTZControl(flag) {
  //움직이는 속도를 얻으십시오
  var speed = parseInt($('#ptzspeed').val(), 10);
  WebVideoCtrl.moveUpperRight(speed, speed, flag);
}

function mouseLefPTZControl(flag) {
  var speed = parseInt($('#ptzspeed').val(), 10);
  WebVideoCtrl.moveLeft(speed, flag);
}

function mouseRightPTZControl(flag) {
  //움직이는 속도를 얻으십시오
  var speed = parseInt($('#ptzspeed').val(), 10);
  WebVideoCtrl.moveRight(speed, flag);
}

function mouseDownLeftPTZControl(flag) {
  //움직이는 속도를 얻으십시오
  var speed = parseInt($('#ptzspeed').val(), 10);
  WebVideoCtrl.moveLowerLeft(speed, speed, flag);
}

function mouseDownRightPTZControl(flag) {
  //움직이는 속도를 얻으십시오
  var speed = parseInt($('#ptzspeed').val(), 10);
  WebVideoCtrl.moveLowerRight(speed, speed, flag);
}

function mouseDownPTZControl(flag) {
  var speed = parseInt($('#ptzspeed').val(), 10);
  WebVideoCtrl.moveLower(speed, flag);
}

function openPtzLocate() {
  if (WebVideoCtrl.enablePTZLocate()) {
    //열기 버튼을 숨 깁니다
    $('#openPtzLocate').hide();
    //표시 버튼을 보여줍니다
    $('#closePtzLocate').show();
  }
}

function closePtzLocate() {
  WebVideoCtrl.disablePTZLocate(false);
  $('#closePtzLocate').hide();
  $('#openPtzLocate').show();
}

function PTZZoomout(flag) {
  var speed = parseInt($('#ptzspeed').val(), 10);
  WebVideoCtrl.controlZoom(speed, 1, flag);
}

function PTZZoomIn(flag) {
  var speed = parseInt($('#ptzspeed').val(), 10);
  WebVideoCtrl.controlZoom(speed, 0, flag);
}

function PTZFocusIn(flag) {
  var speed = parseInt($('#ptzspeed').val(), 10);
  WebVideoCtrl.controlFocus(speed, 0, flag);
}

function PTZFoucusOut(flag) {
  var speed = parseInt($('#ptzspeed').val(), 10);
  WebVideoCtrl.controlFocus(speed, 1, flag);
}

function PTZIrisIn(flag) {
  //움직이는 속도를 얻으십시오
  var speed = parseInt($('#ptzspeed').val(), 10);
  WebVideoCtrl.controlAperture(speed, 0, flag);
}

function PTZIrisOut(flag) {
  var speed = parseInt($('#ptzspeed').val(), 10);
  WebVideoCtrl.controlAperture(speed, 1, flag);
}

function GetPresets() {
  WebVideoCtrl.getPresets(function (index, name) {
    showOPInfo('Get Presets Succeed');
    var subNode =
      '<option value=' + index.toString() + '>' + name + '</option>';
    $('#presetList').append(subNode);
  });
  $('#presetList option:last').attr('selected', 'selected');
}

function GotoPreset() {
  //프리 세트 포인트 일련 번호 가져 오기
  var index = parseInt($('#presetList').val(), 10);
  var speed = parseInt($('#ptzspeed').val(), 10);
  WebVideoCtrl.gotoPreset(index, speed);
}

function RemovePreset() {
  //프리 세트 포인트 일련 번호 가져 오기
  var index = parseInt($('#presetList').val(), 10);
  if (WebVideoCtrl.removePreset(index)) {
    $('#presetList' + " option[value='" + index.toString() + "']").remove();
    $('#presetList option:last').attr('selected', 'selected');
  }
}

function SetPreset() {
  //프리 세트 포인트 길이를 얻으십시오
  var length = $('#presetList option').length;
  var name = 'Preset' + (length + 1).toString();
  WebVideoCtrl.setPreset(length + 1, name);
}

function clickStartTrafficDataQuery() {
  //현재 선택된 장치 IP를 가져옵니다
  var sIP = DemoUI.getCurDeviceIP();
  //채널 번호를 가져옵니다
  var iChannel = $('#channels').val() - 0;
  var startTime = $('#humanFlowStarttime').val();
  var endTime = $('#humanFlowEndtime').val();
  var ruleType = parseInt($('#humanFlowRule').val(), 10);
  var span = parseInt($('#humanFlowGranularity').val(), 10);
  var minStayTime = parseInt($('#humanFlowMinStayTime').val(), 10);
  WebVideoCtrl.startTrafficDataQuery(
    sIP,
    0,
    startTime,
    endTime,
    ruleType,
    span,
    minStayTime,
  ).done(function (handle) {
    if (handle > 0) {
      $('#humanFlowQueryHandle').val(handle.toString());
    }
  });
}

function clickGetTrafficDataTotalCount() {
  var handle = parseInt($('#humanFlowQueryHandle').val(), 10);
  WebVideoCtrl.getTrafficDataTotalCount(handle).done(function (ret) {
    if (ret >= 0) {
      $('#humanFlowInfoCount').val(ret.toString());
    }
  });
}

function clickQueryTrafficData() {
  var handle = parseInt($('#humanFlowQueryHandle').val(), 10);
  var beginIndex = 0;
  var total = parseInt($('#humanFlowInfoCount').val(), 10);
  WebVideoCtrl.queryTrafficData(handle, beginIndex, total);
}

function clickStopTrafficDataQuery() {
  var handle = parseInt($('#humanFlowQueryHandle').val(), 10);
  WebVideoCtrl.stopTrafficDataQuery(handle);
  $('#humanFlowQueryHandle').val('');
  $('#humanFlowInfoCount').val('');
}

function clickRecordSearch() {}

function changeWinMode() {
  var mode = parseInt($('#winMode').val(), 10);
  if (0 == mode) {
    $('#winIndex').hide();
  } else {
    //세트 창 일련 번호
    var num = parseInt($('#wndNum').find('option:selected').val());
    DemoUI.setWinIndex(num);
    $('#winIndex').show();
  }
}

function changeWndIndex() {
  var iWinIndex = parseInt($('#winIndex').val(), 10);
  //비디오 창을 선택하십시오
  WebVideoCtrl.selectWindow(iWinIndex);
}

function clickStartAllRealPlay() {
  DemoUI.getEachDeviceIP(function (sIP, iIndex) {
    //채널 번호를 가져옵니다
    var iChannel = $('#channels').val() - 0;
    //스트림 타입을 얻으십시오
    var iStreamType = parseInt($('#streamtype').val(), 10);
    //Windows 수
    var iWndNum = parseInt($('#wndNum').val(), 10);
    if (iIndex > iWndNum * iWndNum - 1) {
      return;
    }
    WebVideoCtrl.connectRealVideoEx(
      iIndex,
      sIP,
      iChannel,
      iStreamType,
      function (iPlayerID) {
        showOPInfo(sIP + ' Channel:' + iChannel.toString() + ' Live succeed');
      },
      function (status, error) {
        showOPInfo(
          sIP + ' Channel:' + iChannel.toString() + ' Live Fail',
          status,
          error,
        );
      },
    );
  });
}

function clickStopAllRealPlay() {
  WebVideoCtrl.closeAllPlayer();
}

//오픈 등록 모니터
function startRegisterListen() {
  //등록 문제
  WebVideoCtrl.registerEvent('DetectedDeviceInfo', function (ip, port, state) {
    DemoUI.setLoginDeviceIP(ip);
    DemoUI.setSvrPort(port);
  });
  var ip = $('#serverip').val();
  var port = $('#serverport').val() - 0;
  WebVideoCtrl.startDevciceDetection(ip, port);
}

//열린 비디오 쿼리
function clickStartRecordSearch() {
  //빈 파일 목록
  $('#recordInfor').empty();
  var sIP = DemoUI.getCurDeviceIP();
  var iChannel = $('#channels').val() - 0;
  var iStreamType = parseInt($('#record_streamtype').val(), 10);
  var szStartTime = $('#starttime').val();
  var szEndTime = $('#endtime').val();
  WebVideoCtrl.startRecordInfoSearch(
    sIP,
    iChannel,
    iStreamType,
    szStartTime,
    szEndTime,
  ).done(function (handle) {
    if (handle > 0) {
      $('#recordQueyrHandle').val(handle.toString());
      showOPInfo(
        sIP + ' Channel:' + iChannel.toString() + 'start query succeed',
      );
    } else {
      showOPInfo(sIP + ' Channel:' + iChannel.toString() + 'start query fail');
    }
  });
}

function findNextRecordInfoCb(fileInfor) {
  var sIP = DemoUI.getCurDeviceIP();
  var iChannel = $('#channels').val() - 0;
  if (fileInfor.length == 0) {
    showOPInfo(sIP + ' Channel:' + iChannel.toString() + 'no info');
  } else {
    var dataObject = $.parseJSON(fileInfor);
    if ('found' in dataObject) {
      var length = dataObject['found'];
      if (0 != parseInt(length)) {
        //모든 노드를 가로 지르고 recordinfor를 추가하십시오
        $.each(dataObject.infos, function (i, item) {
          var infor = item.StartTime + '--' + item.EndTime;
          var subNode = '<option value=' + infor + '>' + infor + '</option>';
          $('#recordInfor').append(subNode);
        });
      }
    }
  }
}

//쿼리 비디오 정보
function clickNextRecordSearch() {
  var iChannel = $('#channels').val() - 0;
  var sIP = DemoUI.getCurDeviceIP();
  var handle = parseInt($('#recordQueyrHandle').val(), 10);
  WebVideoCtrl.findNextRecordInfo(handle, 13, findNextRecordInfoCb);
}

function clickStartPlayback() {
  var fileID = $('#recordInfor').find('option:selected').text();
  WebVideoCtrl.playRemoteFileByFile(fileID);
}

function clickStopPlayback() {
  WebVideoCtrl.stopPlayBack();
}

function clickPause() {
  WebVideoCtrl.pausePlayBack();
}

function clickResume() {
  WebVideoCtrl.resumePlayBack();
}

function clickPlayOneFrame() {
  WebVideoCtrl.playOneFrame();
}

function clickPlaySlow() {
  WebVideoCtrl.slowPlayBack();
}

function clickPlayFast() {
  WebVideoCtrl.fastPlayBack();
}

function clickStopRecordSearch() {
  var handle = parseInt($('#recordQueyrHandle').val(), 10);
  WebVideoCtrl.stopRecordInfoQuerying(handle);
}

function enableIVS() {
  WebVideoCtrl.enableIVS();
}

function disableIVS() {
  WebVideoCtrl.disableIVS();
}

function clickSearchRecordStatus() {
  var sIP = DemoUI.getCurDeviceIP();
  var iChannel = $('#channels').val() - 0;
  var year = parseInt($('#recordStatus_year').find('option:selected').text());
  var month = parseInt($('#recordStatus_month').find('option:selected').text());
  WebVideoCtrl.queryRecordFileBitmap(sIP, iChannel, year, month, 0).done(
    function (sStatus) {
      DemoUI.setRecordStatus(sStatus);
    },
  );
}

function clickFocusRegion() {
  WebVideoCtrl.activeFocusRegion();
}

function clickSubScribeEvent() {
  var iChannel = $('#channels').val() - 0;
  var event = $('#subscribeEventName').val();
  WebVideoCtrl.subscribeEvent(iChannel, event);
}

function clickUnSubScribeEvent() {
  var iChannel = $('#channels').val() - 0;
  var event = $('#subscribeEventName').val();
  WebVideoCtrl.unsubscribeEvent(iChannel, event);
}

function clickstartTour() {
  var index = parseInt($('#tourIndex').val(), 10);
  WebVideoCtrl.startTour(index);
}

function clickstopTour() {
  var index = parseInt($('#tourIndex').val(), 10);
  WebVideoCtrl.stopTour(index);
}

function clickchannelstartTour() {
  var index = parseInt($('#tourIndex').val(), 10);
  var iChannel = $('#channels1').val() - 0;

  if (WebVideoCtrl.startTourByChannel(iChannel, index)) {
    //프롬프트 추가
    showOPInfo(' startTourByChannel ok ');
  }
}

function responseShowTemper(val) {
  DemoUI.setTemper(val);
}

function clickenableCheck(flag) {
  WebVideoCtrl.enableCheck(flag);
  if (flag == true) {
    //등록 문제
    WebVideoCtrl.registerEvent('PointTemper', responseShowTemper);
  }
}

function downloadLink() {
  var url = $('#linkUrl').val();
  var filename = $('#fileName').val();
  WebVideoCtrl.downloadByLink(url, filename).done(function (requestID) {
    DemoUI.addDownloadLinkID(requestID);
  });
}

function stopdownloadLink() {
  var requestID = parseInt($('#downloadID').val(), 10);
  WebVideoCtrl.stopDownloadByLink(requestID);
}

window.onscroll = function () {
  var coverInfo = document.getElementById('divPlugin').getBoundingClientRect();
  // 가능한 문서에는 스크롤 막대가 있고 왼쪽 상단의 값을 수정합니다.
  var pos = {
    width: coverInfo.width,
    height: coverInfo.height,
    top: coverInfo.top + window.pageYOffset,
    left: coverInfo.left + window.pageXOffset,
    topToWindow: coverInfo.top,
    leftToWindow: coverInfo.left,
  };
  var headerHeight = 0;
  var dE = document.documentElement;
  var windowBorder = Math.ceil((window.outerWidth - window.innerWidth) / 2);
  var windowHeader = window.outerHeight - window.innerHeight - windowBorder;
  var left =
    Math.max(pos.leftToWindow, 0) +
    (WebVideoCtrl.browser().firefox ? 0 : windowBorder);
  var top = Math.max(pos.topToWindow, headerHeight) + windowHeader;
  var width = Math.min(
    pos.width,
    dE.clientWidth - Math.max(pos.leftToWindow, 0),
    Math.max(pos.width - (dE.scrollLeft - pos.left), 0),
  );
  var height = Math.min(
    pos.height,
    dE.clientHeight - Math.max(headerHeight, pos.topToWindow),
    Math.max(pos.height - (dE.scrollTop - pos.top) - headerHeight, 0),
  );
  WebVideoCtrl.resizeVideo(left, top, width, height);
};
