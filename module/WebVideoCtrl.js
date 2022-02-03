var WebVideoCtrl = (function (e) {
  //�3�3�1�5�5�7 �3�8�9�6 �6�5�2�1 �0�8�0�0
  var eventHandler = {
    selectDir: function (path) {},
  };

  //�5�3�0�7�8�9�3�7 �7�4�4�7
  var pluginObject;
  //�4�1�8�5�6�1 �1�0�7�0 �8�5�8�6
  var initSuccess;
  //�3�3�1�5�5�7 �2�1�6�3 �0�8�0�0
  var SignalMap = new Map();
  //�0�3�3�1�5�7 �4�8 �1�3�5�2�6�3 �2�1�6�3
  SignalMap.put('SelectedView', new Array());
  SignalMap.put('DetectedDeviceInfo', new Array());
  SignalMap.put('PointTemper', new Array());
  //�3�2�1�1 �3�4�1�5 �5�7
  var deviceInfoMap = new Map();
  //Play Information Tade
  var playerInfoMap = new Map();
  //�8�1�5�7�3�5�5�9 �5�5�0�9�5�7�4�7 2 �1�7�9�7, 3 �1�7�9�7
  var sProtocol;
  //�1�1�9�9�2�7 �3�4�1�5
  var remoteFileInfor = [];
  //websocket
  var socket;
  //�1�1�9�4�8�5 �0�3�1�9�9�3 �3�3�1�5�5�7 �0�8�0�0
  var g_id = 0;
  //�5�3�0�7�8�9�3�7 �4�1�5�3�3�3�8�3
  var g_container;
  //�0�5�6�5 �7�3 �3�1�2�5 �7�3�4�7 �5�7
  var defMap = {};
  //�3�2�9�4 �3�4�1�5 �0�9�8�9 �8�5�8�6
  var showOpInfo;

  //�3�3�1�5�5�7 �4�9�0�5 �8�5�8�6
  function handleEvent(message) {
    //console.log(message);
    var messageObject = $.parseJSON(message);
    if ('event' in messageObject) {
      var eventType = messageObject['event'];
      //�9�9�0�3 �3�3�1�5�5�7 �3�9�6�8�2�3 �9�7�9�5 �4�9�0�5�6�6�9�1�9�9
      if ('SelectedDirectory' == eventType) {
        //�1�9�1�0 �3�9�6�8 �0�6 �7�4�0�9
        var pathType = messageObject['params']['Type'];
        var pathName = messageObject['params']['PathName'];
        //�7�4�0�9�0�7 �1�7�3�4�6�9�2�4�2�7�2�7
        pluginObject.SetStoragePath(pathType, pathName);
        eventHandler.selectDir(pathName);
      } else if ('SelectedView' == eventType) {
        var callBackList = SignalMap.get('SelectedView');
        //�4�7�0�0 �6�5�2�1�0�7 �6�3�4�9�6�9�2�4�2�7�2�7
        for (var i = 0; i < callBackList.length; i++) {
          callBackList[i](
            messageObject['params']['nodeIndex'],
            messageObject['params']['viewIndex'],
            messageObject['params']['winID'],
          );
        }
      } else if ('DetectedDeviceInfo' == eventType) {
        var callBackList = SignalMap.get('DetectedDeviceInfo');
        //�4�7�0�0 �6�5�2�1�0�7 �6�3�4�9�6�9�2�4�2�7�2�7
        for (var i = 0; i < callBackList.length; i++) {
          callBackList[i](
            messageObject['params']['deviceIP'],
            messageObject['params']['svrPort'],
            messageObject['params']['state'],
          );
        }
      } else if ('SnapManagerEvent' == eventType) {
        var szTip =
          '<div>' +
          Foundation.dateFormat(new Date(), 'yyyy-MM-dd hh:mm:ss') +
          ' ' +
          JSON.stringify(messageObject['params']);
        szTip += '</div>';
        $('#eventMessage').html(szTip);
      } else if ('PointTemper' == eventType) {
        var szTemper = messageObject['params']['Temper'];
        var callBackList = SignalMap.get('PointTemper');
        //�4�7�0�0 �6�5�2�1�0�7 �6�3�4�9�6�9�2�4�2�7�2�7
        for (var i = 0; i < callBackList.length; i++) {
          callBackList[i](szTemper);
        }
      } else if ('downloadLink' == eventType) {
        console.log(JSON.stringify(messageObject['params']));
      } else if ('RealTimeVideoException' == eventType) {
        var deviceID = messageObject['params']['deviceID'];
        var errorCode = messageObject['params']['error'];
        if (1 == errorCode) {
          //�3�7�3�6 �2�5�5�9
          showOpInfo(
            getDeviceIP(deviceID),
            'connect disconnected',
            'username or password is not valid',
          );
        } else if (2 == errorCode) {
          //�2�5�7�1�2�3 �2�5�5�9
          showOpInfo(
            getDeviceIP(deviceID),
            'connect disconnected',
            'device connect failed',
          );
        }
      } else {
        console.log(JSON.stringify(messageObject['params']));
      }
    } else {
      var id = messageObject['id'];
      defMap[id].resolve(messageObject['result']);
      defMap[id] = null;
    }
  }

  /**
   *@description �5�3�0�7�8�9�3�7�3�3 �1�7�4�7�9�7�2�5 �3�3�8�9�3�1 �5�5�9�3�6�6�9�1�9�9
   *@return Boolean
   */
  var checkPluginInstall = function () {
    return $.Deferred(function (def) {
      if (browser().msie) {
        try {
          new ActiveXObject('WebActiveX.Plugin.4.0.0.0');
          def.resolve();
        } catch (n) {
          def.reject();
        }
      } else if (browser().npapi) {
        for (var r = 0, s = navigator.mimeTypes.length; s > r; r++) {
          if (
            'application/media-plugin-version-4.0.0.0' ==
            navigator.mimeTypes[r].type.toLowerCase()
          ) {
            def.resolve();
          }
        }
        def.reject();
      } else {
        var port = 23480;
        connect(port)
          .done(function () {
            def.resolve();
          })
          .fail(function () {
            var ele = document.createElement('iframe');
            ele.src = 'CustomerWebSocketServer://' + port;
            ele.style.display = 'none';
            document.body.appendChild(ele);

            port++;
            setTimeout(function () {
              reconnect(port, def);
            }, 2000);
          });
      }
    });
  };

  var reconnect = function (port, def) {
    if (port > 23488) {
      return def.reject();
    }

    connect(port)
      .done(function () {
        return def.resolve();
      })
      .fail(function () {
        port++;
        return reconnect(port, def);
      });
  };

  var connect = function (port) {
    return $.Deferred(function (def) {
      try {
        var url = 'ws://127.0.0.1:' + port;
        socket = new WebSocket(url);
        socket.onopen = function () {
          console.log('open');
        };
        socket.onerror = function (e) {
          console.log('error:' + e.code);
        };
        socket.onmessage = function (msg) {
          if (msg.data == 'websocketserver connect ok') {
            //�2�5�0�1�0�3 �3�0 �2�1�4�4 �1�9�1�1�2�1�0�7 �8�1�5�3�8�6�9�1�9�9
            def.resolve();
          } else {
            handleEvent(msg.data);
          }
        };
        socket.onclose = function () {
          def.reject();
        };
      } catch (e) {
        def.reject();
      }
    }).promise();
  };

  //�1�5�9�5�3�7�3�3 �3�9�6�8�3�5 �7�5�3�9�2�4�9�1�9�9
  var browser = function () {
    var e = /(chrome)[ \/]([\w.]+)/,
      t = /(safari)[ \/]([\w.]+)/,
      n = /(opera)(?:.*version)?[ \/]([\w.]+)/,
      r = /(msie) ([\w.]+)/,
      s = /(trident.*rv:)([\w.]+)/,
      o = /(mozilla)(?:.*? rv:([\w.]+))?/,
      i = navigator.userAgent.toLowerCase(),
      a = e.exec(i) ||
        t.exec(i) ||
        n.exec(i) ||
        r.exec(i) ||
        s.exec(i) ||
        (i.indexOf('compatible') < 0 && o.exec(i)) || ['unknow', '0'];
    a.length > 0 && a[1].indexOf('trident') > -1 && (a[1] = 'msie');
    var c = {};
    var verArr = a[2].split('.');
    if (a[1] === 'chrome') {
      verArr[0] - 0 < 42 ? (c.npapi = true) : (c.websocket = true),
        (c.type = 'chrome');
    }
    if (a[1] === 'mozilla') {
      verArr[0] - 0 < 52 ? (c.npapi = true) : (c.websocket = true),
        (c.type = 'firefox');
    }
    return (c[a[1]] = !0), (c.version = a[2]), c;
  };

  /**
   *@description �1�4�3�0 �1�4�3�0
   *@param{String} sContainerID �5�3�0�7�8�9�3�7 �4�1�5�3�3�3�8�3 ID.
   *@param{Num}    iWidth       �8�4�3�1 �1�4�3�0�0�5
   *@param{Num}    iHeight      �8�1�3�1 �5�3�0�7�8�9�3�7
   *@return void
   */
  function insertPluginObject(sContainerID, iWidth, iHeight) {
    g_container = sContainerID;
    //IE �1�5�9�5�3�7�3�3�9�5�0�5
    if (browser().msie) {
      var sSize =
        ' width=' +
        '"' +
        iWidth.toString() +
        '"' +
        ' height=' +
        '"' +
        iHeight.toString() +
        '"';
      var sHtmlValue =
        '<object classid="CLSID:95AF23C8-F168-4602-91F9-DB8D733BF200"' +
        sSize +
        'id="dhVideo">' +
        '</object>';
      $('#' + sContainerID).html(sHtmlValue);
    } else if (browser().npapi) {
      var sSize =
        ' width=' +
        '"' +
        iWidth.toString() +
        '"' +
        ' height=' +
        '"' +
        iHeight.toString() +
        '"';
      var sHtmlValue =
        '<object type="application/media-plugin-version-4.0.0.0"' +
        sSize +
        'id="dhVideo">' +
        '</object>';
      $('#' + sContainerID).html(sHtmlValue);
    } else if (browser().websocket) {
    } else {
      $('#' + sContainerID).html('Do not support this browser');
    }
    return true;
  }

  /**
   *@description �3�3�1�5�5�7 �2�1�6�3�0�7 �9�0�2�8�9�1�9�9
   *@param{String} event  �3�3�1�5�5�7 �3�3�0�5
   *@param{Function} cb �3�3�1�5�5�7 �4�7�0�0 �8�5�8�6
   */
  function registerEvent(event, cb) {
    var callBackList = SignalMap.get(event);
    if (typeof callBackList != 'undefined') {
      callBackList.push(cb);
    }
    return true;
  }

  /**
   *@description �2�9�0�9 �3�2�4�7 �5�9�3�1
   *@param{String} ip    �3�2�4�7 IP.
   *@param{Num}    port  �1�9�1�1�2�1 �5�5�5�7
   */
  function startDevciceDetection(ip, port) {
    return pluginObject.StartDevciceDetection(ip, port);
  }

  /**
   *@description �4�1�8�5�6�1 �5�3�0�7�8�9�3�7
   *@param{String} sp    �7�1�2�0 �3�9�6�8
   *@param{Function} fnCallback �4�1�8�5�6�1 �1�0�7�0�3�4�3�7 �4�7�0�0 �8�5�8�6
   */
  var initPlugin = function (sp, fnCallback) {
    initSuccess = fnCallback;
    sProtocol = sp;
    checkReady();
    return true;
  };

  var MethodTable = {
    StartDevciceDetection: ['ip', 'port'], //�2�7�5�9 �3�2�4�7 �6�9�1�0 �9�4�0�0 �3�4�1�5
    CreatePluginWindow: ['browser'], //�4�8, WebSocket �2�9�0�9�1�9�3�5 �0�7�9�0�9�1�9�9
    ResizeVideo: ['left', 'top', 'width', 'height'], //�1�3�7�4 �4�8 �3�1�4�7 �5�9�8�5, WebSocket.
    ShowWindow: ['show'], //�4�8�3�3 �5�7�2�7�9�7�8�9�3�1 �2�1�1�5�2�3 �7�1�7�1�2�3�3�3 WebSocket �2�9�0�9�1�9�3�3 �1�7�3�0�9�4�9�1�9�9.
    SetProductType: ['type'], //�3�1�5�1 �3�9�6�8 �1�7�3�4
    SetSplitNum: ['num'], //�1�5�1�9�3�5 �2�1�0�7 �1�7�3�4�6�9�2�4�2�7�2�7
    GetLastError: ['svrName'], //�2�7�0�1 �4�9�9�3 �7�5�3�9 �2�7�8�5
    GetChannelTotal: ['deviceID'], //�3�2�1�1 �4�5�8�1 �2�1�0�7 �2�2�3�7�2�4�2�7�2�7
    GetSelectedNodeIndex: [], //�6�1�3�9 �1�3�5�2�9�1 �8�5�9�3 �1�6�3�7�3�5 �7�5�3�9�2�4�9�1�9�9
    GetSelectedViewIndex: null, //�6�1�3�9 �1�3�5�2�9�1�1�5�8�5 �3�7�9�0�2�1�0�7 �7�5�3�9�2�4�9�1�9�9
    GetSelectedWinID: [], //�6�1�3�9 �1�3�5�2�9�1 �4�8 �1�6�3�7�3�5 �7�5�3�9�2�4�9�1�9�9
    ConnectRealVideo: [
      'deviceID',
      'nodeIndex',
      'viewIndex',
      'channel',
      'stream',
      'protocol',
    ], //�1�1�9�9�2�7�0�7 �2�8�9�1 �9�9
    GetUserDirectory: null, //�0�9�4�5 �2�7�2�1�5�9�2�3 �9�7�6�3 �1�7�3�0�3�1 �7�4�0�9�0�7 �7�5�3�9�2�4�9�1�9�9
    SetStoragePath: ['pathKey', 'path'], //�3�3�3�2�2�1 �7�4�0�9�0�7 �1�7�3�4�6�6�9�1�9�9 pathKey: LiveRecord|LiveSnapshot|PlaybackSnapshot|PlaybackRecord|VideoClips|HeatMap
    GetStoragePath: ['pathKey'], //�3�3�3�2�9�1 �7�4�0�9�0�7 �2�2�3�7�2�4�2�7�2�7
    NoticeInitializedSignal: null, //�5�3�0�7�8�9�3�7 �3�8�3�0 �5�5�0�9�8�9�9�9 �3�4�1�5 �4�1�8�5�6�1�0�7 �2�1�0�2�9�1�9�9
    CreateMultiNodeDisplay: ['num', 'viewConfig'], //�3�1�3�4�9�1 �2�0�3�1 �0�7�9�1�8�5 �2�1�0�7 �4�5�8�1�1�5�8�5�1�5�8�5 ViewConfig �8�5�1�9 �2�3�2�5 �0�1�3�1�2�9�1�5�8�5
    SetFullscreen: null, //�3�7�4�7 �6�1�0�5 �9�9�2�1�5�3�0�5�3�3
    ExitFullscreen: null, //�3�7�4�7 �6�1�0�5�3�5 �3�6�0�1�6�9�2�4�2�7�2�7
    ClosePlayer: ['playerID'], //�3�1�3�4�9�1 �5�3�0�5�3�3�2�5 �5�9�3�5 �0�5�6�5 �7�3�3�5 ConnectRealTimeVideo�0�9 �8�7�8�5
    LoginDevice: [
      'ip',
      'svrPort',
      'userName',
      'password',
      'rtspPort',
      'specCap',
      'timeout',
    ], //�0�9�8�9�3�7 �5�5�0�9�5�7�4�7 �5�5�0�1�5�7 �2�7�9�3�8�9 DahuA3 SVRPort �0�9�8�9�3�7 �5�5�5�7 SPECCAP 0 : TCP �0�9�8�9�3�7 �0�7�9�3 2 : �8�6�9�4�3�4 �3�7 �9�4�0�0 �0�9�8�9�3�7 �0�7�9�3 3 : �0�3�5�3 �4�3�2�1�5�7 �0�9�8�9�3�7 4 : UDP �0�9�8�9�3�7 �0�7�9�3
    LogoutDevice: ['deviceID'], //�0�9�8�9 �2�3�3�6�6�9�2�4�2�7�2�7
    SetNetProtocolType: ['protocol'], //�0�9�8�9�3�7 �5�5�0�9�5�7�4�7 �1�7�3�4
    PlaybackRemoteRecord: ['fileInfo', 'locateTime'], //�3�9�1�6 �1�1�9�9�2�7(locateTime�3�3 �3�9�1�6 �2�7�7�9�3�5 �2�7�3�2�6�6�9�1�9�9)
    StopPlayBack: null, //�3�9�1�6 �3�6�3�1
    PausePlayBack: null, // �3�1�2�7 �3�6�3�1 �3�9�1�6
    ResumePlayBack: null, //�3�9�1�6�3�5 �1�6�7�9�6�9�2�4�2�7�2�7
    FastPlayBack: null, //�5�7�6�1�6�9�9�9
    SlowPlayBack: null, //�8�5�0�9
    PlayOneFrame: null, //�9�3�3�1 �5�5�0�5�3�9
    SelectDirectory: ['type'], //�0�9�4�5 �7�4�0�9 �1�3�5�2 �1�8�3�1 �6�3�4�9 �1�3�5�2�6�3 �7�4�0�9 �3�3�0�5�3�5 �7�5�3�9�2�5 �0�9�4�5 �7�4�0�9�0�7 �1�3�5�2�6�9�2�4�2�7�2�7.
    StartIntercom: ['deviceID'], //�2�7�5�9 �3�7�5�5�4�3
    StopIntercom: ['deviceID'], //�6�2�9�7
    CrabOnePicture: ['format', 'path', 'open'], //�5�1�2�4
    ControlRecordingVideo: ['path', 'format', 'enable'], //�9�4�2�2�1�8
    SetVolume: ['volume'], //�1�3�0�7 �1�7�3�4
    ControlAudio: ['playerID', 'enable'], //�2�7�9�9�2�7 �2�1�3�1�4�7
    MoveUpperLeft: ['verticalSpeed', 'levelSpeed', 'flag'], //�0�7�0�1�3�1�3�3 �3�5�3�4�3�7�0�9 �3�3�9�4�6�6�9�1�9�9
    MoveUpperRight: ['verticalSpeed', 'levelSpeed', 'flag'], //Yuntai�8�9 �2�7�0�3�3�4�3�7�0�9 �3�3�3�2�3�0�9�1�9�9
    MoveLowerLeft: ['verticalSpeed', 'levelSpeed', 'flag'], //Punxai�7�5 �3�5�3�4�3�7�0�9 �2�7�7�3�2�8�9�1�9�9
    MoveLowerRight: ['verticalSpeed', 'levelSpeed', 'flag'], //Yuntai�3�5 �2�5�0�1�0�3 �3�1�9�4
    MoveUpwards: ['verticalSpeed', 'flag'], //�1�6�7�1�0�5 �2�7�5�5�5�7
    MoveLeft: ['levelSpeed', 'flag'], //Yuntai �3�5�3�4 �2�7�5�5�5�7
    MoveRight: ['levelSpeed', 'flag'], //Yuntai �2�7�0�3�3�4 �2�7�5�5�5�7
    MoveLower: ['verticalSpeed', 'flag'], //�2�3�9�3�2�3
    ActivePTZLocate: ['enable'], //3D �3�1�4�7 �7�1�3�4
    ControlZoom: ['nMultiple', 'flag', 'flag1'], //�3�1�2�5
    ControlFocus: ['nMultiple', 'flag', 'flag1'], //�4�1�5�7�0�7 �3�1
    ControlAperture: ['nMultiple', 'flag', 'flag1'], //�3�1�2�5 �3�5�0�5�7�3
    GetPresetInfo: null, //�1�7�3�7 �1�7�3�4 �3�4�1�5�0�7 �2�2�3�7�2�4�2�7�2�7
    GotoPreset: ['index', 'nSpeed'], //�5�5�3�7�5�7�0�7 �0�3�0�5 �1�7�3�4 �6�3 �3�1�4�7
    RemovePreset: ['index'], //�1�7�3�7 �1�7�3�4 �5�5�3�7�5�7 �1�8�3�1
    SetPreset: ['index', 'name'], //�1�7�3�4 �5�5�0�5�1�6 �5�5�3�7�5�7
    StartTrafficDataQuery: [
      'deviceID',
      'channel',
      'startTime',
      'endTime',
      'ruleType',
      'granularity',
      'MinStayTime',
    ], //�2�9�0�9 �1�7�9�1�9�1 �5�7�9�3�6�2 �5�8�7�1 �4�7�0�5
    GetTrafficDataTotalCount: ['token'], //�3�4�1�5 �2�1
    QueryTrafficData: ['token', 'beginIndex', 'count'], //�7�3�1�6 �3�4�1�5
    StopTrafficDataQuery: ['token'], //�0�1�3�5�0�7 �3�6�3�1�6�9�2�4�2�7�2�7
    CreateVideoAnalyseContainer: [], //�3�1�8�6�6�8�3�1�9�3 �4�1�5�3�3�3�8�3�0�7 �0�7�9�0�9�1�9�9
    EnableVideoAnalyseContainer: ['containerID', 'enable'], //�3�1�8�6�6�8�3�1�9�3 �4�1�5�3�3�3�8�3�0�7 �6�9�1�0�6�1�6�6�9�1�9�9
    CreateMainVideoAnalyseShape: [
      'containerID',
      'eventName',
      'shapeType',
      'shapeName',
      'data',
      'param',
    ], //�3�5 �8�9�9�3�5�5�0�7 �4�1�7�5�6�9�2�4�2�7�2�7
    AddSubVideoAnalyseShape: [
      'containerID',
      'mainShapeID',
      'markedName',
      'data',
      'param',
    ], //�6�9�3�1 �8�9�9�3�6�2�3�5 �4�1�7�5�6�9�2�4�2�7�2�7
    GetVideoAnalyseShapeConfigData: ['containerID', 'shapeID'], //�8�9�9�3�6�2 �9�9�3�3�5�5 �7�5�3�9 �2�7�8�5
    EnableCrowdDistriMap: ['nodeIndex', 'enable'], //�6�7�9�0 �8�5�9�3�0�7 �6�9�1�0�6�1�6�9�8�9 �7�3�3�6 �5�5�0�9�6�9
    SetShowMultiScreenMode: ['mode'], //�7�3�4�7 �4�1�3�4 �1�9�6�7 �6�1�0�5 �9�9�2�1�5�3�0�5�3�3 �0�7�9�3�0�7 �1�7�3�4�6�6�9�1�9�9
    SetIVSEnable: ['enable'], //IVS �0�3�0�5�1�5�8�5 Enable�3�5 �1�7�3�4�6�9�2�4�2�7�2�7
    StartVideoJoin: ['channel'], //�0�9�3�1 �0�1�8�5�3�9�3�5 �2�9�2�5 �9�5
    SetLensInfo: ['leninfo'], //�0�9�3�5 �0�1�7�3 �1�3�2�1 �1�7�3�4 (�9�1 �0�9�3�1 �3�0�6�6 �6�9�3�9)
    SubscribeEvent: ['channel', 'event'], //�7�9�9�4 �6�8�1�7
    UnSubscribeEvent: ['channel', 'event'], //�7�9�9�4 �3�3�1�5�5�7�0�7 �4�5�2�1�6�9�2�4�2�7�2�7
    //recordType�1�1�9�9�2�7 �3�9�6�8 0 : �0�7�9�7 �8�6�3�3, 1 : �3�1�1�5 �2�1�9�1, 2 : �9�4�3�4 �5�3�2�1�5�7 �2�1�9�1, 3 : �0�7�9�7 �2�1�9�1,
    StartRecordInfoQuerying: [
      'deviceID',
      'channel',
      'streamType',
      'recordType',
      'startTime',
      'endTime',
      'cardInfo',
    ], //�4�7�0�5 �1�1�9�9�2�7 �2�7�3�2 (�1�6�3�7 �0�7 �1�7�3�4)
    StopRecordInfoQuerying: ['handle'], //�4�7�0�5 �1�1�9�9�2�7�0�7 �3�6�3�1�6�9�2�4�2�7�2�7
    FindNextRecordInfo: ['handle', 'count'], //�4�7�0�5 �1�1�9�9�2�7
    QueryRecordFileBitmap: [
      'deviceID',
      'channel',
      'recordType',
      'year',
      'month',
      'cardInfo',
    ], //�3�3�7�9 �1�1�9�9�2�7 �0�3�2�1�5�9 �4�7�0�5
    GetWinID: ['nodeIndex', 'viewIndex'],
    OpenVoiceTalk: ['deviceID', 'sampleRate', 'depth', 'encode'], //�3�1�3�4�9�1 �0�1�7�3 �1�3�2�1�7�5 �2�9�0�3�2�8�9�1�9�9
    CloseVoiceTalk: ['deviceID'], //�6�2�9�7
    GetDeviceConfig: ['deviceID', 'name'], //�3�2�1�1 �7�9�1�0 �7�5�3�9 �2�7�8�5
    StartTour: ['index'], //�2�9�0�9 �5�9�0�9�3�5
    StopTour: ['index'], //�5�9�0�9�3�5�0�7 �3�6�3�1�6�9�2�4�2�7�2�7
    EnableCheck: ['bFlag'], //�3�0�0�2
    SetSplitRowAndCol: ['row', 'col'], //�1�9�6�7 �2�1�0�7 �1�7�3�4�6�9�2�4�2�7�2�7
    DownloadByLink: ['link', 'fileName'], //Weci �9�9�3�1�0�9�9�3 �5�1�3�1
    StopDownloadByLink: ['requestID'], //�9�9�3�1�0�9�9�3�0�7 �3�6�3�1�6�9�2�4�2�7�2�7
    GetDownoadProgress: ['requestID'], //�9�9�3�1�0�9�9�3 �3�5�6�8�3�5�6�9�2�4�2�7�2�7
    SetOEM: ['oem'], //�1�7�3�0�3�1 �3�4�3�5 �3�4�1�5�0�7 �1�7�3�4�6�9�2�4�2�7�2�7
    SelectWindow: ['nodeIndex', 'viewIndex'], //�4�8�3�5 �1�3�5�2�6�9�2�4�2�7�2�7
    OpenPath: ['path'], //�7�4�0�9�0�7 �2�8�9�1 �9�9
    StartTourByChannel: ['channel', 'index'], //�4�5�8�1�0�9 �5�9�0�9�3�5�0�7 �5�3�2�4�2�7�2�7
  };

  var RegisterMethod = function () {
    $.each(MethodTable, function (method, params) {
      pluginObject[method] = function () {
        var args = arguments;
        var methodParams = {};
        methodParams['method'] = method;
        methodParams['params'] = {};
        if (g_id === Number.MAX_VALUE) {
          g_id = Number.MIN_VALUE;
        }
        methodParams['id'] = g_id;
        for (var i = 0; i < args.length; i++) {
          methodParams['params'][params[i]] = args[i];
        }
        //console.log(JSON.stringify(methodParams));
        var defer = $.Deferred();
        defMap[g_id] = defer;
        g_id++;
        if (browser().websocket) {
          socket.send(JSON.stringify(methodParams));
        } else {
          document
            .getElementById('dhVideo')
            .PostMessage(JSON.stringify(methodParams));
        }
        return defer;
      };
    });
  };

  function checkReady() {
    try {
      pluginObject = {};
      RegisterMethod();
      if (browser().msie || browser().npapi) {
        //�9�0�8�5 �3�3�1�5�5�7
        document
          .getElementById('dhVideo')
          .AddEventListener('message', handleEvent);
      } else if (browser().websocket) {
        pluginObject.CreatePluginWindow(browser().type);
        pluginObject.ShowWindow(true);
      }
      //�3�1�5�1 �3�4�1�5�0�7 �1�7�3�4�6�9�2�4�2�7�2�7
      pluginObject.SetProductType('Customer');
      //�1�7�3�0�3�1 �3�4�3�5 �3�9�6�8 �1�7�3�4
      //pluginObject.SetOEM("SenseTime");
      //�5�8�2�1 �5�5�0�9�5�7�4�7 �1�7�3�4
      pluginObject.SetNetProtocolType(sProtocol);
      //�5�3�0�7�8�9�3�7 �4�1�8�5�6�1�0�7 �3�6�0�1�6�9�2�4�2�7�2�7
      pluginObject.NoticeInitializedSignal().done(function () {
        //�4�7�0�0
        initSuccess();
      });
    } catch (e) {
      setTimeout(checkReady, 500);
    }
  }

  /**
   *@description �6�7�7�1 �0�2�0�0 �2�7�0�1 �0�3�2�7�3�1
   *@param{String} �2�3�0�7 �0�3�2�7�3�1
   *@return String �2�7�0�1 �1�7�0�2 �3�4�1�5
   */
  var parseError = function (errorInfo) {
    var errorObject = $.parseJSON(errorInfo);
    if ('error' in errorObject) {
      return errorObject['error'];
    }
  };

  /**
   *@description �1�1�9�9�2�7 �4�8�3�5 �0�7�9�0�9�1�9�9
   *@param{Num}  iNum �1�6�1�0 �6�7 Windows �2�1
   *@return Boolean
   */
  var createMultiNodeDisplay = function (iNum) {
    pluginObject.CreateMultiNodeDisplay(iNum);
  };

  /**
   *@description �4�8 �5�7�2�7 �2�1�0�7 �1�7�3�4�6�9�2�4�2�7�2�7
   *@param{Num}  iNum �5�7�2�7�9�1 �0�7�6�3
   *@return Boolean
   */
  var setSplitNum = function (iNum) {
    pluginObject.SetSplitNum(iNum * iNum);
  };

  /**
   *@description �5�3�0�7�8�9�3�7�3�5 �5�9�8�5 �3�5�3�4 (�8�1�3�1 �0�3�3�7 �5�3�0�7�8�9�3�7 �0�7 �6�7�9�0)
   *@param{left}  left �5�3�0�7�8�9�3�7 �2�2�2�2�3�5 �3�5�3�4 �1�8�9�3 �0�7�1�9�0�5�3�5 �3�1�4�7 (�1�5�9�5�3�7�3�3�3�5 �3�5�3�4 �1�8�9�3 �0�7�1�9�0�5 �5�5�6�5)
   *@param{top}  top �5�3�0�7�8�9�3�7 �2�2�2�2�3�5 �3�5�3�4 �1�8�9�3 �0�7�1�9�0�5�3�5 �3�1�4�7 (�1�5�9�5�3�7�3�3�3�5 �3�5�3�4 �1�8�9�3 �0�7�1�9�0�5 �5�5�6�5)
   *@param{width}  width�5�3�0�7�8�9�3�7 �2�2�2�2 �7�7�3�3�9�3
   *@param{height}  height	�8�1�3�1 �5�3�0�7�8�9�3�7 �2�2�2�2
   *@return Boolean
   */
  var resizeVideo = function (left, top, width, height) {
    pluginObject.ResizeVideo(left, top, width, height);
  };

  /**
   *@description �4�8 �5�7�2�7 �2�1�0�7 �1�7�3�4�6�9�2�4�2�7�2�7
   *@param{Num} row ����
   *@param{Num} col�2�9 �0�7�6�3
   *@return Boolean
   */
  var setSplitRowAndCol = function (row, col) {
    pluginObject.SetSplitRowAndCol(row, col);
  };

  /**�3�8�3�0 �5�5�0�9�8�9�9�9 �2�7�0�1�0�7 �7�5�3�9�2�4�9�1�9�9
   *@description �3�8�3�0 �5�5�0�9�8�9�9�9 �2�7�0�1 �4�9�9�3 �7�5�3�9 �2�7�8�5
   *@param{String} name �0�3�1�9�9�3 �3�3�0�5
   *@return �2�3�0�7 �4�9�9�3
   */
  var getLastError = function (name) {
    return pluginObject.GetLastError(name);
  };

  /**��¼�豸
   *@description ��ʼ�����
   *@param{String} sIp         �豸IP
   *@param{Num} iPort          ����˿�
   *@param{String} sUserName   �û���
   *@param{String} sPassword   ����
   *@param{Num} iRtspPort      Rtsp�˿�
   *@param{Num} iProtocol      ͨ��Э��
   *@param{Num} iTimeout       ��ʱ
   *@param{Function} fnSuccess ��¼�ɹ���Ļص�����
   *@param{Function} fnFail    ��¼ʧ�ܺ�Ļص�����
   */
  var login = function (
    sIp,
    iPort,
    sUserName,
    sPassword,
    iRtspPort,
    iProtocol,
    iTimeout,
    fnSuccess,
    fnFail,
  ) {
    pluginObject
      .LoginDevice(
        sIp,
        iPort,
        sUserName,
        sPassword,
        iRtspPort,
        iProtocol,
        iTimeout,
      )
      .done(function (ret) {
        if (ret > 0) {
          //�����豸��Ϣ
          pluginObject.GetChannelTotal(ret).done(function (channelNum) {
            insertDeviceInfo(
              sIp,
              iPort,
              sUserName,
              sPassword,
              iRtspPort,
              iProtocol,
              channelNum,
              ret,
            );
            fnSuccess(sIp, ret);
          });
        } else if (ret <= 0) {
          //�2�7�0�1 �0�3�2�7�3�1 �7�5�3�9 �2�7�8�5
          pluginObject.GetLastError('LoginDevice').done(function (err) {
            //�1�9�1�0 �2�7�0�1 �1�7�0�2
            fnFail(ret, parseError(err));
          });
        }
      });
  };

  /**
   *@description �3�2�4�7 �3�4�1�5�0�7 �1�4�3�0�6�9�2�4�2�7�2�7
   *@param{Num} deviceID    �3�2�4�7 �2�3�3�3�9�9
   *@param{String} ip        �3�2�4�7 IP.
   *@param{Num} port         �1�9�1�1�2�1 �5�5�5�7
   *@param{String} userName  �1�7�3�0�3�1 �3�3�0�5
   *@param{String} password  �1�1�0�1�0�7�6�3
   *@param{Num} rtspPort     RTSP �5�5�5�7
   *@param{Num} channelNum   �4�2 �4�5�8�1 �2�1
   *@param{Num} deviceID     �3�2�4�7 �2�3�3�3�9�9
   */
  function insertDeviceInfo(
    ip,
    port,
    userName,
    password,
    rtspPort,
    protocol,
    channelNum,
    deviceID,
  ) {
    var info = {
      ip: ip,
      port: port,
      userName: userName,
      password: password,
      rtspPort: rtspPort,
      channelNum: channelNum,
      deviceID: deviceID,
      protocol: protocol,
    };
    deviceInfoMap.put(ip, info);
  }

  /**
   *@description �3�2�1�1 �3�4�1�5�0�7 �2�2�3�7�2�4�2�7�2�7
   */
  function getDeviceInfo(ip) {
    var info = deviceInfoMap.get(ip);
    return info;
  }

  function getDeviceIP(id) {
    var ip;
    deviceInfoMap.each(function (value) {
      if (value.deviceID == id) {
        ip = value.ip;
      }
    });
    return ip;
  }

  /**
   *@description �5�3�0�5�3�3�2�5�0�7 �8�0�3�7�2�4�2�7�2�7
   *@param{Num} iWinID       �4�8 ID.
   *@param{Num} iDeviceID    �3�2�4�7 �2�3�3�3�9�9
   *@param{Num} iPlayerID    �5�3�0�5�3�3�2�5 ID.
   *@param{string} sIP       �3�2�4�7 IP.
   *@param{Num} iProtocol    �7�1�2�0 �3�9�6�8
   *@param{Num} iChannle     �4�5�8�1 �0�7�6�3
   *@param{Num} iStreamType  �4�9�9�3 �6�1�3�9 �3�9�6�8
   *@param{Num} iPlayerType  �5�3�0�5�3�3�2�5 �3�9�6�8 0 : �2�5�2�7�7�9 �0�7�9�1�5�5�0�6 1 : �8�1�5�7�3�5�5�9 �3�9�1�6
   */
  function insertPlayer(
    iWinID,
    iDeviceID,
    iPlayerID,
    sIP,
    iProtocol,
    iChannle,
    iStreamType,
    iPlayerType,
  ) {
    var info = {
      winID: iWinID,
      deviceID: iDeviceID,
      ip: sIP,
      channle: iChannle,
      streamType: iStreamType,
      protocol: iProtocol,
      playerID: iPlayerID,
      type: iPlayerType,
    };
    playerInfoMap.put(iWinID, info);
  }

  /**
   *@description �3�1�3�4�9�1 �3�2�4�7�3�5 �4�2 �4�5�8�1 �2�1�0�7 �2�2�3�7�2�4�2�7�2�7.
   *@param{Num} deviceID �3�2�4�7 �2�3�3�3�9�9
   */
  var getChannelNumber = function (deviceID) {
    return pluginObject.GetChannelTotal(deviceID);
  };

  /**
   *@description �0�9�8�9 �2�3�3�6 �3�2�4�7
   *@param{String} ip
   *@return Boolean
   */
  var logout = function (ip) {
    var info = WebVideoCtrl.getDeviceInfo(ip);
    if (typeof info != 'undefined') {
      pluginObject.LogoutDevice(info.deviceID).done(function (ret) {
        //�3�1�7�7 �3�2�4�7
        deviceInfoMap.remove(ip);
      });
    }
  };

  /**
   *@description �1�3�5�2�6�3 �1�1�9�9�2�7 �4�8 �3�9�1�6
   *@param{String} sIP
   *@param{Num} iChannel
   *@param{Num} iStream
   *@param{Function} fnSuccess
   *@param{Function} fnFail
   *@return Num
   */
  var connectRealVideo = function (sIP, iChannel, iStream, fnSuccess, fnFail) {
    pluginObject.GetSelectedNodeIndex().done(function (iNodeIndex) {
      console.log('iNodeIndex > ', iNodeIndex);

      pluginObject.GetSelectedViewIndex().done(function (iViewIndex) {
        console.log('iViewIndex > ', iViewIndex);
        var ODeviceInfo = getDeviceInfo(sIP);
        console.log('ODeviceInfo > ', ODeviceInfo);
        pluginObject
          .ConnectRealVideo(
            ODeviceInfo.deviceID,
            iNodeIndex + 2,
            iViewIndex + 2,
            iChannel - 1,
            iStream,
            ODeviceInfo.protocol,
          )
          .done(function (iRet) {
            console.log('**********************************************');
            console.log('iRet > ', iRet);
            if (iRet > 0) {
              //�1�0�7�0�3�4�3�7 �3�9�1�6
              if (typeof fnSuccess != 'undefined') {
                fnSuccess(iRet);
                pluginObject.GetSelectedWinID().done(function (iWinID) {
                  console.log('1�0�7�3�7 iWinID > ', iWinID + 2);
                  insertPlayer(
                    iWinID + 2,
                    ODeviceInfo.deviceID,
                    iRet,
                    ODeviceInfo.ip,
                    ODeviceInfo.protocol,
                    iChannel,
                    iStream,
                    0,
                  );
                });
              }
            } else if (iRet <= 0) {
              if (typeof fnSuccess != 'undefined') {
                //�2�7�0�1 �0�3�2�7�3�1 �7�5�3�9 �2�7�8�5
                pluginObject
                  .GetLastError('ConnectRealVideo')
                  .done(function (errorInfo) {
                    //�1�9�1�0 �2�7�0�1 �1�7�0�2
                    fnFail(iRet, parseError(errorInfo));
                  });
              }
            }
          });
        pluginObject
          .ConnectRealVideo(
            ODeviceInfo.deviceID,
            iNodeIndex,
            iViewIndex,
            iChannel - 1,
            iStream,
            ODeviceInfo.protocol,
          )
          .done(function (iRet) {
            console.log('************************2********************');
            console.log('iRet > ', iRet);
            if (iRet > 0) {
              //�1�0�7�0�3�4�3�7 �3�9�1�6
              if (typeof fnSuccess != 'undefined') {
                fnSuccess(iRet);
                pluginObject.GetSelectedWinID().done(function (iWinID) {
                  console.log('2�0�7�3�7 iWinID > ', iWinID);
                  insertPlayer(
                    iWinID,
                    ODeviceInfo.deviceID,
                    iRet,
                    ODeviceInfo.ip,
                    ODeviceInfo.protocol,
                    iChannel,
                    iStream,
                    0,
                  );
                });
              }
            } else if (iRet <= 0) {
              if (typeof fnSuccess != 'undefined') {
                //�2�7�0�1 �0�3�2�7�3�1 �7�5�3�9 �2�7�8�5
                pluginObject
                  .GetLastError('ConnectRealVideo')
                  .done(function (errorInfo) {
                    //�1�9�1�0 �2�7�0�1 �1�7�0�2
                    fnFail(iRet, parseError(errorInfo));
                  });
              }
            }
          });
      });
    });
  };

  /**
   *@description �3�1�3�4�9�1 �1�1�9�9�2�7 �4�8�3�5 �1�3�5�2�6�9�2�4�2�7�2�7
   *@param{Num} iIndex
   */
  var selectWindow = function (iIndex) {
    pluginObject.SelectWindow(iIndex, 0);
  };

  /**
   *@description �3�1�3�4�9�1 �4�8 �3�1�0�7 �0�7�6�3�2�3�1�9 �1�1�9�9�2�7�0�7 �3�9�1�6�6�6�9�1�9�9
   *@param{Num} iIndex
   *@param{String} sIP
   *@param{Num} iChannel
   *@param{Num} iStream
   *@param{Function} fnSuccess
   *@param{Function} fnFail
   *@return Num
   */
  var connectRealVideoEx = function (
    iIndex,
    sIP,
    iChannel,
    iStream,
    fnSuccess,
    fnFail,
  ) {
    pluginObject.GetWinID(iIndex, 0).done(function (iWinID) {
      //�3�2�1�1 �3�4�1�5�0�7 �2�2�3�7�2�4�2�7�2�7
      var ODeviceInfo = getDeviceInfo(sIP);
      console.log("�8�1")
      pluginObject
        .ConnectRealVideo(
          ODeviceInfo.deviceID,
          iIndex,
          0,
          iChannel - 1,
          iStream,
          ODeviceInfo.protocol,
        )
        .done(function (iRet) {
          if (iRet > 0) {
            //�1�0�7�0�3�4�3�7 �8�3�3�3
            if (typeof fnSuccess != 'undefined') {
              fnSuccess(iRet);
              insertPlayer(
                iWinID,
                ODeviceInfo.deviceID,
                iRet,
                ODeviceInfo.ip,
                ODeviceInfo.protocol,
                iChannel,
                iStream,
                0,
              );
            }
          } else if (iRet <= 0) {
            if (typeof fnSuccess != 'undefined') {
              //�2�7�0�1 �0�3�2�7�3�1 �7�5�3�9 �2�7�8�5
              var errorInfo = pluginObject.GetLastError('ConnectRealVideo');
              //�1�9�1�0 �2�7�0�1 �1�7�0�2
              fnFail(iRet, parseError(errorInfo));
            }
          }
        });
    });
  };

  //�1�3�5�2�6�3 �3�1�0�7 �0�7�6�3�1�5�8�5�0�7 �1�3�5�2�6�9�2�4�2�7�2�7
  var getSelectedWinIndex = function () {
    return pluginObject.GetSelectedNodeIndex();
  };

  /**
   *@description �6�1�3�9 �1�3�5�2�6�3 �4�8�3�5 �5�3�0�5�3�3�2�5�0�7 �9�6�2�8�9�1�9�9
   */
  var closePlayer = function () {
    //�6�1�3�9 �1�3�5�2�9�1 �4�8 ID�0�7 �7�5�3�9�2�4�9�1�9�9
    getSelectedWinID().done(function (iWinID) {
      //�5�3�0�5�3�3�2�5 ID�0�7 �2�2�3�7�2�4�2�7�2�7
      var oInfo = playerInfoMap.get(iWinID);
      if (typeof oInfo != 'undefined') {
        pluginObject.ClosePlayer(oInfo.playerID);
        return true;
      } else {
        return true;
      }
    });
  };

  /**
   *@description �0�7�9�7 �5�3�0�5�3�3�2�5�0�7 �9�6�2�8�9�1�9�9
   */
  var closeAllPlayer = function () {
    //�5�3�0�5�3�3�2�5 ID�0�7 �5�9�1�6�6�6�9�1�9�9
    playerInfoMap.each(function (info) {
      if (typeof info != 'undefined') {
        pluginObject.ClosePlayer(info.playerID);
      }
    });
  };

  /**
   *@description �5�3�0�5�3�3�2�5 �3�4�1�5�0�7 �2�2�3�7�2�4�2�7�2�7
   *@param{Num} iWinID �4�8 ID.
   */
  function getPlayerInfo(iWinID) {
    return playerInfoMap.get(iWinID);
  }

  /**
   *@description �1�3�5�2�6�3 �4�8�2�3�1�9 �5�3�0�5�3�3�2�5 ID�0�7 �7�5�3�9�2�4�9�1�9�9
   */
  function getSelectedPlayerID() {
    var iWinID = WebVideoCtrl.getSelectedWinID().done(function (iWinID) {
      var info = playerInfoMap.get(iWinID);
      if (typeof info != 'undefined') {
        return info.playerID;
      } else {
        return 0;
      }
    });
  }

  //�3�3�1�0 �3�7�5�5�4�5
  var startVoiceTalk = function (sIP, cb) {
    var ODeviceInfo = getDeviceInfo(sIP);
    if (typeof ODeviceInfo == 'undefined') {
      return 0;
    }
    pluginObject
      .GetDeviceConfig(ODeviceInfo.deviceID, 'Encode')
      .done(function (ret) {
        var params = JSON.parse(ret);
        var type = params.table[0].Compression || 'G.711A';
        var sampleRate = params.table[0].Frequency || 8000;
        var depth = params.table[0].Depth || 16;
        pluginObject
          .OpenVoiceTalk(ODeviceInfo.deviceID, sampleRate, depth, type)
          .done(function (ret) {
            if (ret > 0) {
              cb.cbSuccess(ret);
            } else {
              cb.cbFailed();
            }
          });
      });
  };

  //�6�2�9�7
  var stopVoiceTalk = function (sIP) {
    var ODeviceInfo = getDeviceInfo(sIP);
    if (typeof ODeviceInfo == 'undefined') {
      return 0;
    }
    pluginObject.StopIntercom(ODeviceInfo.deviceID);
  };

  //�7�4�0�9�0�7 �1�3�5�2�6�9�2�4�2�7�2�7
  var selectDirectory = function (type, cb) {
    //�9�4�0�0 �7�4�0�9 �1�3�5�2 �3�3�1�5�5�7
    eventHandler.selectDir = cb.cbSuccess;
    pluginObject.SelectDirectory(type);
  };

  /**
   *@description �6�1�3�9 �4�8�2�3�1�9 �1�1�9�9�2�7�0�7 �3�9�1�6�6�9�8�9 �2�5�2�7�7�9 �8�9�0�1�3�5 �5�9�0�7�0�6�6�6�9�1�9�9.
   *@param{Num} iFormat �3�3�0�3�3�1 �6�8�2�8 �2�3�4�5�3�3�1�5
   *@param{Num} sPath   �2�1�5�7�0�5�3�1 �7�4�0�9
   *@param{Boolean} bOpen   �2�1�5�7�0�5�3�1 �7�4�0�9
   */
  var crabOnePicture = function (iFormat, sPath, bOpen) {
    return pluginObject.CrabOnePicture(iFormat, sPath, bOpen);
  };

  /**
   *@description �6�1�3�9 �4�8�2�3�1�9 �1�1�9�9�2�7�0�7 �3�9�1�6�6�9�8�9 �1�1�9�9�2�7 �8�5�8�6�3�5 �4�3�2�4�2�7�2�7.
   *@param{Num} iFormat �1�1�9�9�2�7 �6�8�2�8
   *@param{Num} sPath   �3�3�3�2 �7�4�0�9�3�5 �8�5�0�0
   */
  var startRecordingVideo = function (iFormat, sPath) {
    return pluginObject.ControlRecordingVideo(sPath, iFormat, true);
  };

  //�8�6�3�3�3�5 �3�6�3�1�6�9�2�4�2�7�2�7
  var stopRecordingVideo = function () {
    return pluginObject.ControlRecordingVideo('', -1, false);
  };

  //�1�3�0�7 �1�7�3�4
  var setVolume = function (volume, cb) {
    pluginObject.SetVolume(volume);
  };

  //�2�9�0�9 �2�1�0�5
  var openSound = function (cb) {
    var playerID = getSelectedPlayerID();
    return pluginObject.ControlAudio(playerID, true);
  };

  //�1�7�3�1�9�3�0�7 �9�6�2�3�9�9
  var closeSound = function (cb) {
    var playerID = getSelectedPlayerID();
    return pluginObject.ControlAudio(playerID, false);
  };

  /**
   *@description �2�7�5�9 �3�7�3�1 �3�1
   */
  var enableEZoom = function (cb) {
    return pluginObject.ActiveLocalEnlarge(true);
  };

  /**
   *@description �3�7�3�1 �3�1�3�5 �8�7�2�4�2�7�2�7
   */
  var disableEZoom = function (cb) {
    return pluginObject.ActiveLocalEnlarge(false);
  };

  /**
   *@description �3�7�4�7 �6�1�0�5�3�7�0�9 �3�7�6�5�6�9�2�4�2�7�2�7
   */
  var setFullscreen = function () {
    pluginObject.SetFullscreen();
    return true;
  };

  /**
   *@description �3�7�4�7 �6�1�0�5�3�5 �3�6�0�1�6�9�2�4�2�7�2�7
   */
  var exitFullscreen = function () {
    pluginObject.ExitFullscreen();
    return true;
  };

  //�1�7�3�0�3�1 �7�4�0�9�0�7 �7�5�3�9�2�4�9�1�9�9
  var getUserDirectory = function () {
    return pluginObject.GetUserDirectory();
  };

  //�1�3�5�2�6�3 �4�8 ID�0�7 �7�5�3�9�2�4�9�1�9�9
  var getSelectedWinID = function () {
    return pluginObject.GetSelectedWinID();
  };

  /**
   *@description �5�3�0�5�3�3�2�5�3�5 �2�1�0�5�0�7 �3�1�2�5�6�9�2�4�2�7�2�7
   *@param{Num} playerID    �5�3�0�5�3�3�2�5 ID.
   *@param{Boolean} enable  �9�6�8�5 �9�6�8�5
   */
  var controlAudio = function (playerID, enable) {
    return pluginObject.ControlAudio(playerID, enable);
  };

  /**
   *@description �3�5�3�4 �3�3�1�7
   *@param{Num} iVerticalSpeed    �2�1�3�2 �2�2�9�3
   *@param{Num} iLevelSpeed       �0�5�1�9 �2�2�9�3
   *@param{Boolean} flag  �3�4�3�1 �2�1�6�3�0�7 �4�3�2�4�2�7�2�7
   */
  var moveUpperLeft = function (iVerticalSpeed, iLevelSpeed, flag) {
    return pluginObject.MoveUpperLeft(iVerticalSpeed, iLevelSpeed, flag);
  };

  /**
   *@description �2�5�0�1�0�3 �3�1�9�4
   *@param{Num} iVerticalSpeed    �2�1�3�2 �2�2�9�3
   *@param{Num} iLevelSpeed       �0�5�1�9 �2�2�9�3
   *@param{Boolean} flag  �3�4�3�1 �2�1�6�3�0�7 �4�3�2�4�2�7�2�7
   */
  var moveUpperRight = function (iVerticalSpeed, iLevelSpeed, flag) {
    return pluginObject.MoveUpperRight(iVerticalSpeed, iLevelSpeed, flag);
  };

  /**
   *@description �3�5�3�4 �3�1�9�4
   *@param{Num} iVerticalSpeed    �2�1�3�2 �2�2�9�3
   *@param{Num} iLevelSpeed       �0�5�1�9 �2�2�9�3
   *@param{Boolean} flag  �3�4�3�1 �2�1�6�3�0�7 �4�3�2�4�2�7�2�7
   */
  var moveLowerLeft = function (iVerticalSpeed, iLevelSpeed, flag) {
    return pluginObject.MoveLowerLeft(iVerticalSpeed, iLevelSpeed, flag);
  };

  /**
   *@description �2�5�0�1�0�3 �3�1�9�4
   *@param{Num} iVerticalSpeed    �2�1�3�2 �2�2�9�3
   *@param{Num} iLevelSpeed       �0�5�1�9 �2�2�9�3
   *@param{Boolean} flag  �3�4�3�1 �2�1�6�3�0�7 �4�3�2�4�2�7�2�7
   */
  var moveLowerRight = function (iVerticalSpeed, iLevelSpeed, flag) {
    return pluginObject.MoveLowerRight(iVerticalSpeed, iLevelSpeed, flag);
  };

  /**
   *@description �3�3�3�2�3�3�8�9
   *@param{Num} iVerticalSpeed   �2�1�3�2 �2�2�9�3
   *@param{Boolean} flag         �3�4�3�1 �2�1�6�3�0�7 �4�3�2�4�2�7�2�7
   */
  var moveUpwards = function (iVerticalSpeed, flag) {
    return pluginObject.MoveUpwards(iVerticalSpeed, flag);
  };

  /**
   *@description �2�3�9�3�0�9 �3�3�9�4
   *@param{Num} iVerticalSpeed   �2�1�3�2 �2�2�9�3
   *@param{Boolean} flag         �3�4�3�1 �2�1�6�3�0�7 �4�3�2�4�2�7�2�7
   */
  var moveLower = function (iVerticalSpeed, flag) {
    return pluginObject.MoveLower(iVerticalSpeed, flag);
  };

  /**
   *@description �3�5�3�4 �3�3�9�4
   *@param{Num} iLevelSpeed   �0�5�1�9 �2�2�9�3
   *@param{Boolean} flag      �3�4�3�1 �2�1�6�3�0�7 �4�3�2�4�2�7�2�7
   */
  var moveLeft = function (iLevelSpeed, flag) {
    return pluginObject.MoveLeft(iLevelSpeed, flag);
  };

  /**
   *@description �2�5�0�1�0�3 �3�1�9�4
   *@param{Num} iLevelSpeed   �0�5�1�9 �2�2�9�3
   *@param{Boolean} flag      �3�4�3�1 �2�1�6�3�0�7 �4�3�2�4�2�7�2�7
   */
  var moveRight = function (iLevelSpeed, flag) {
    return pluginObject.MoveRight(iLevelSpeed, flag);
  };

  /**
   *@description PTZ �3�1�4�7 �3�1�3�4�3�5 �6�9�1�0�6�1�6�6�9�1�9�9
   */
  var enablePTZLocate = function () {
    return pluginObject.ActivePTZLocate(true);
  };

  /**
   *@description �1�1 �7�5�8�6�1�0 PTZ �3�1�4�7 �3�1�3�4
   */
  var disablePTZLocate = function () {
    return pluginObject.ActivePTZLocate(false);
  };

  /**
   *@description �3�1�2�5
   *@param{Num} iSpeed     �9�9�2�1�3�5
   *@param{Num} flag      �0�9�7�9�0�7 �8�3�0�5�7�7�8�1 �3�3�3�0�9�1�9�9
   *       -0 : �3�6�7�5
   * - 1 : �7�1�2�1
   *@param{Boolean} flag1      �3�4�3�1 �2�1�6�3�0�7 �4�3�2�4�2�7�2�7
   */
  var controlZoom = function (iSpeed, flag, flag1) {
    return pluginObject.ControlZoom(iSpeed, flag, flag1);
  };

  /**
   *@description �4�1�5�7�0�7 �3�1
   *@param{Num} speed    �9�9�2�1�3�5
   *@param{Num} flag      �0�9�7�9�0�7 �8�3�0�5�7�7�8�1 �3�3�3�0�9�1�9�9
   *     - 0 : �3�6�7�5
   * - 1 : �7�1�2�1
   *@param{Boolean} flag1    �3�4�3�1 �2�1�6�3�0�7 �4�3�2�4�2�7�2�7
   */
  var controlFocus = function (speed, flag, flag1) {
    return pluginObject.ControlFocus(speed, flag, flag1);
  };

  /**
   *@description �3�1�2�5 �3�5�0�5�7�3
   *@param{Num} speed     �9�9�2�1�3�5
   *@param{Num} flag      �0�9�7�9�0�7 �8�3�0�5�7�7�8�1 �3�3�3�0�9�1�9�9
   *   - 0 : �3�6�7�5
   * - 1 : �7�1�2�1
   *@param{Boolean} flag1    �3�4�3�1 �2�1�6�3�0�7 �4�3�2�4�2�7�2�7
   */
  var controlAperture = function (speed, flag, flag1) {
    return pluginObject.ControlAperture(speed, flag, flag1);
  };

  /**
   *@description�1�7�3�7 �1�7�3�4 �3�4�1�5�0�7 �2�2�3�7�2�4�2�7�2�7
   */
  var getPresets = function (cb) {
    pluginObject.GetPresetInfo().done(function (info) {
      if (info != '') {
        DemoUI.clearPresets();
        var dataObject = $.parseJSON(info);
        $.each(dataObject, function (i, item) {
          cb(item.Index, item.Name);
        });
      }
    });
  };

  /**
   *@description�5�5�3�7�5�7�0�7 �0�3�0�5 �1�7�3�4 �6�3 �3�1�4�7
   *@param{Num} index     �1�7�3�7 �1�7�3�4 �5�5�3�7�5�7 �3�1�0�7 �0�7�6�3
   *@param{Num} speed     �2�2�9�3
   */
  var gotoPreset = function (index, speed) {
    return pluginObject.GotoPreset(index, speed);
  };

  /**
   *@description�1�7�3�7 �1�7�3�4 �5�5�3�7�5�7 �1�8�3�1
   *@param{Num} index    �1�7�3�7 �1�7�3�4 �5�5�3�7�5�7 �3�1�0�7 �0�7�6�3
   */
  var removePreset = function (index) {
    return pluginObject.RemovePreset(index);
  };

  /**
   *@description ����Ԥ�õ�
   *@param{Num} index     Ԥ�õ����
   *@param{Num} name      Ԥ�õ�����
   */
  var setPreset = function (index, name) {
    return pluginObject.SetPreset(index, name);
  };

  /**
   *@description ����������ͳ�Ʋ�ѯ
   *@param{String} sIP
   *@param{Num} iChannel
   *@param{String} sStartTime
   *@param{String} sEndTime
   *@param{Num} iRuleType
   *@param{Num} iSpan
   *@param{Num} iMinStayTime
   *@return Num
   */
  var startTrafficDataQuery = function (
    sIP,
    iChannel,
    sStartTime,
    sEndTime,
    iRuleType,
    iSpan,
    iMinStayTime,
  ) {
    //�3�2�1�1 �3�4�1�5�0�7 �2�2�3�7�2�4�2�7�2�7
    var ODeviceInfo = getDeviceInfo(sIP);
    if (typeof ODeviceInfo == 'undefined') {
      return 0;
    }
    return pluginObject.StartTrafficDataQuery(
      ODeviceInfo.deviceID,
      iChannel,
      sStartTime,
      sEndTime,
      iRuleType,
      iSpan,
      iMinStayTime,
    );
  };

  /**
   *@description �3�4�1�5 �2�1
   *@param{Num} iHandle
   *@return Num
   */
  var getTrafficDataTotalCount = function (iHandle) {
    return pluginObject.GetTrafficDataTotalCount(iHandle);
  };

  /**
   *@description �3�4�1�5�0�7 �2�2�9�9
   *@param{Num} iHandle
   *@return Num
   */
  var queryTrafficData = function (iHandle, iBeginIndex, iCount) {
    return pluginObject.QueryTrafficData(iHandle, iBeginIndex, iCount);
  };

  var stopTrafficDataQuery = function (iHandle) {
    return pluginObject.StopTrafficDataQuery(iHandle);
  };

  /**
   *@description �2�9�0�9 �1�1�9�9�2�7 �4�7�0�5
   *@param{String} szIP             �3�2�4�7 IP.
   *@param{Num} iChannel            �4�5�8�1 �0�7�6�3
   *@param{Num} iStreamType        �4�9�9�3 �6�1�3�9 �3�9�6�8
   *@param{String}  szStartTime    �2�7�3�2 �2�7�7�9
   *@param{String}  szEndTime       �8�2 �2�7�7�9
   *@return String
   */
  var startRecordInfoSearch = function (
    szIP,
    iChannel,
    iStreamType,
    szStartTime,
    szEndTime,
  ) {
    //�8�6�3�3 �3�4�1�5�0�7 �3�1�3�7�2�4�2�7�2�7
    remoteFileInfor.length = 0;
    //�3�2�1�1 �3�4�1�5�0�7 �2�2�3�7�2�4�2�7�2�7
    var ODeviceInfo = getDeviceInfo(szIP);
    if (typeof ODeviceInfo == 'undefined') {
      return 0;
    }
    return pluginObject.StartRecordInfoQuerying(
      ODeviceInfo.deviceID,
      iChannel - 1,
      iStreamType,
      0,
      szStartTime,
      szEndTime,
      '',
    );
  };

  /**
   *@description �0�1�3�5�0�7 �3�6�3�1�6�9�2�4�2�7�2�7
   *@param{Num} iHandle             �4�7�0�5 �6�1�9�1
   */
  var stopRecordInfoQuerying = function (iHandle) {
    return pluginObject.StopRecordInfoQuerying(iHandle);
  };

  /**
   *@description �2�9�0�9 �1�1�9�9�2�7 �4�7�0�5
   *@param{Num} iHandle             �4�7�0�5 �6�1�9�1
   *@param{Num} icout               �4�7�0�5 �2�1
   *@return String
   */
  var findNextRecordInfo = function (iHandle, icout, cb) {
    return pluginObject
      .FindNextRecordInfo(iHandle, icout)
      .done(function (info) {
        if (info.length != 0) {
          var dataObject = $.parseJSON(info);
          remoteFileInfor.push(dataObject);
        }
        cb(info);
      });
  };

  /**
   *@description �2�9�0�9 �1�1�9�9�2�7 �4�7�0�5
   *@param{Num} fileInfo             �0�1�1�9
   *@return String
   */
  var playRemoteFileByFile = function (fileInfo) {
    var locateTime;
    var playFile;
    var find = false;
    for (var i = 0; i < remoteFileInfor.length; i++) {
      if ('found' in remoteFileInfor[i]) {
        var length = remoteFileInfor[i]['found'];
        if (0 != parseInt(length)) {
          //�0�7�9�7 �8�5�9�3�0�7 �7�5�0�9 �3�1�0�9�7�9 recordinfor�0�7 �4�1�7�5�6�9�2�4�2�7�2�7
          $.each(remoteFileInfor[i].infos, function (i, item) {
            var infor = item.StartTime + '--' + item.EndTime;
            if (infor == fileInfo) {
              locateTime = item.StartTime;
              playFile = item;
              find = true;
            }
          });
        }
      }
    }
    if (find) {
      var file = JSON.stringify(playFile);
      pluginObject.PlaybackRemoteRecord(file, locateTime);
    }
  };

  /**
   *@description �3�9�1�6 �3�6�3�1
   */
  var stopPlayBack = function stopPlayBack() {
    return pluginObject.StopPlayBack();
  };

  /**
   *@description �3�1�2�7 �3�6�3�1 �3�9�1�6
   */
  var pausePlayBack = function pausePlayBack() {
    //�3�1�3�4�9�1 �2�1�3�5 �1�1�9�9�2�7 �3�4�1�5�0�7 �4�7�0�5�6�9�2�4�2�7�2�7
    return pluginObject.PausePlayBack();
  };

  /**
   *@description �3�9�1�6�3�5 �1�6�7�9�6�9�2�4�2�7�2�7
   */
  var resumePlayBack = function resumePlayBack() {
    //�3�1�3�4�9�1 �2�1�3�5 �1�1�9�9�2�7 �3�4�1�5�0�7 �4�7�0�5�6�9�2�4�2�7�2�7
    return pluginObject.ResumePlayBack();
  };

  /**
   *@description �9�3�3�1 �5�5�0�5�3�9 �3�9�1�6
   */
  var playOneFrame = function playOneFrame() {
    return pluginObject.PlayOneFrame();
  };

  /**
   *@description ���
   */
  var fastPlayBack = function fastPlayBack() {
    //�3�1�3�4�9�1 �2�1�3�5 �1�1�9�9�2�7 �3�4�1�5�0�7 �4�7�0�5�6�9�2�4�2�7�2�7
    return pluginObject.FastPlayBack();
  };

  /**
   *@description ����
   */
  var slowPlayBack = function slowPlayBack() {
    //�3�1�3�4�9�1 �2�1�3�5 �1�1�9�9�2�7 �3�4�1�5�0�7 �4�7�0�5�6�9�2�4�2�7�2�7
    return pluginObject.SlowPlayBack();
  };

  /**
   *@description ��������
   */
  var enableIVS = function enableIVS() {
    //�3�1�3�4�9�1 �2�1�3�5 �1�1�9�9�2�7 �3�4�1�5�0�7 �4�7�0�5�6�9�2�4�2�7�2�7
    return pluginObject.SetIVSEnable(true);
  };

  /**
   *@description �3�1�8�6�3�5 �0�1�4�1�2�4�2�7�2�7
   */
  var disableIVS = function disableIVS() {
    //�3�1�3�4�9�1 �2�1�3�5 �1�1�9�9�2�7 �3�4�1�5�0�7 �4�7�0�5�6�9�2�4�2�7�2�7
    return pluginObject.SetIVSEnable(false);
  };

  var queryRecordFileBitmap = function (
    sIP,
    iChannel,
    iYear,
    iMonth,
    iRecordType,
  ) {
    //�3�2�1�1 �3�4�1�5�0�7 �2�2�3�7�2�4�2�7�2�7
    var ODeviceInfo = getDeviceInfo(sIP);
    if (typeof ODeviceInfo == 'undefined') {
      return '';
    }
    return pluginObject.QueryRecordFileBitmap(
      ODeviceInfo.deviceID,
      iChannel - 1,
      iRecordType,
      iYear,
      iMonth,
      '',
    );
  };

  /**
   *@description �3�1�3�4�9�1 �4�8 �2�1�3�8 �2�2�2�2�3�5 �2�8�9�1 �9�9
   */
  var activeFocusRegion = function () {
    return pluginObject.ActiveFocusRegion(true);
  };

  var startTour = function (index) {
    return pluginObject.StartTour(index);
  };

  var stopTour = function (index) {
    return pluginObject.StopTour(index);
  };

  var startTourByChannel = function (channel, index) {
    return pluginObject.StartTourByChannel(channel - 1, index);
  };

  var enableCheck = function (bFlag) {
    return pluginObject.EnableCheck(bFlag);
  };

  var subscribeEvent = function (channel, name) {
    pluginObject.SubscribeEvent(channel - 1, name);
  };

  var unsubscribeEvent = function (channel, name) {
    pluginObject.UnSubscribeEvent(channel - 1, name);
  };

  var downloadByLink = function (link, fileName) {
    return pluginObject.DownloadByLink(link, fileName);
  };

  var stopDownloadByLink = function (requestID) {
    return pluginObject.StopDownloadByLink(requestID);
  };

  var getDownoadProgress = function (requestID) {
    return pluginObject.getDownoadProgress(requestID);
  };

  var openPath = function (path) {
    return pluginObject.OpenPath(path);
  };

  var getPluginObject = function () {
    return pluginObject;
  };

  window.blur = function (e) {
    pluginObject.ShowWindow(false);
  };

  window.focus = function (e) {
    pluginObject.ShowWindow(true);
  };

  window.onload = function () {
    function getHiddenProp() {
      var prefixes = ['webkit', 'moz', 'ms', 'o'];

      // if 'hidden' is natively supported just return it
      if ('hidden' in document) return 'hidden';

      // otherwise loop over all the known prefixes until we find one
      for (var i = 0; i < prefixes.length; i++) {
        if (prefixes[i] + 'Hidden' in document) return prefixes[i] + 'Hidden';
      }

      // otherwise it's not supported
      return null;
    }

    function getVisibilityState() {
      var prefixes = ['webkit', 'moz', 'ms', 'o'];
      if ('visibilityState' in document) return 'visibilityState';
      for (var i = 0; i < prefixes.length; i++) {
        if (prefixes[i] + 'VisibilityState' in document)
          return prefixes[i] + 'VisibilityState';
      }
      // otherwise it's not supported
      return null;
    }

    function isHidden() {
      var prop = getHiddenProp();
      if (!prop) return false;

      return document[prop];
    }

    var visProp = getHiddenProp();
    if (visProp) {
      //�0�1�3�7�9�0 �5�8 �9�9�2�1�5�3�0�5�3�3 / �2�7�7�3�3�5 �1�8�5�1 �1�3�7�4 �3�3�1�5�5�7
      var evtname = visProp.replace(/[H|h]idden/, '') + 'visibilitychange';
      document.addEventListener(
        evtname,
        function () {
          pluginObject.ShowWindow(!isHidden());
        },
        false,
      );
    }
  };

  var setOpInfoCallback = function (cb) {
    showOpInfo = cb;
  };

  return {
    checkPluginInstall: checkPluginInstall,
    browser: browser,
    insertPluginObject: insertPluginObject,
    createMultiNodeDisplay: createMultiNodeDisplay,
    initPlugin: initPlugin,
    setSplitNum: setSplitNum,
    setSplitRowAndCol: setSplitRowAndCol,
    login: login,
    getDeviceInfo: getDeviceInfo,
    logout: logout,
    connectRealVideo: connectRealVideo,
    getChannelNumber: getChannelNumber,
    closePlayer: closePlayer,
    closeAllPlayer: closeAllPlayer,
    getSelectedPlayerID: getSelectedPlayerID,
    getPlayerInfo: getPlayerInfo,
    getSelectedWinIndex: getSelectedWinIndex,
    startVoiceTalk: startVoiceTalk,
    stopVoiceTalk: stopVoiceTalk,
    selectDirectory: selectDirectory,
    crabOnePicture: crabOnePicture,
    startRecordingVideo: startRecordingVideo,
    stopRecordingVideo: stopRecordingVideo,
    setVolume: setVolume,
    openSound: openSound,
    closeSound: closeSound,
    enableEZoom: enableEZoom,
    disableEZoom: disableEZoom,
    setFullscreen: setFullscreen,
    exitFullscreen: exitFullscreen,
    getUserDirectory: getUserDirectory,
    getSelectedWinID: getSelectedWinID,
    registerEvent: registerEvent,
    controlAudio: controlAudio,
    moveUpperLeft: moveUpperLeft,
    moveUpperRight: moveUpperRight,
    moveLowerLeft: moveLowerLeft,
    moveLowerRight: moveLowerRight,
    moveLeft: moveLeft,
    moveRight: moveRight,
    moveUpwards: moveUpwards,
    moveLower: moveLower,
    enablePTZLocate: enablePTZLocate,
    disablePTZLocate: disablePTZLocate,
    controlZoom: controlZoom,
    controlFocus: controlFocus,
    controlAperture: controlAperture,
    getPresets: getPresets,
    gotoPreset: gotoPreset,
    removePreset: removePreset,
    setPreset: setPreset,
    startTrafficDataQuery: startTrafficDataQuery,
    getTrafficDataTotalCount: getTrafficDataTotalCount,
    queryTrafficData: queryTrafficData,
    stopTrafficDataQuery: stopTrafficDataQuery,
    startDevciceDetection: startDevciceDetection,
    connectRealVideoEx: connectRealVideoEx,
    selectWindow: selectWindow,
    startRecordInfoSearch: startRecordInfoSearch,
    findNextRecordInfo: findNextRecordInfo,
    playRemoteFileByFile: playRemoteFileByFile,
    stopPlayBack: stopPlayBack,
    pausePlayBack: pausePlayBack,
    resumePlayBack: resumePlayBack,
    fastPlayBack: fastPlayBack,
    slowPlayBack: slowPlayBack,
    stopRecordInfoQuerying: stopRecordInfoQuerying,
    enableIVS: enableIVS,
    disableIVS: disableIVS,
    queryRecordFileBitmap: queryRecordFileBitmap,
    activeFocusRegion: activeFocusRegion,
    getPluginObject: getPluginObject,
    subscribeEvent: subscribeEvent,
    unsubscribeEvent: unsubscribeEvent,
    playOneFrame: playOneFrame,
    startTour: startTour,
    stopTour: stopTour,
    enableCheck: enableCheck,
    resizeVideo: resizeVideo,
    downloadByLink: downloadByLink,
    stopDownloadByLink: stopDownloadByLink,
    getDownoadProgress: getDownoadProgress,
    setOpInfoCallback: setOpInfoCallback,
    getLastError: getLastError,
    openPath: openPath,
    startTourByChannel: startTourByChannel,
  };
})(this);
