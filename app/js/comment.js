(function() {
  var addComment, addGift, allData, avatarCache, bcsvrKey, broadcastHost, broadcastPort, clear, clearComment, clearMessage, connect, connected, count, disconnect, endSearch, error, getUrl, giftCache, giftSettingChanged, imgId, keyComment, keyCountComment, keyFreeGift, keyPaidGift, keySPGift, l, liveId, loadSetting, localize, onButtonClicked, onReceive, onSearchClicked, ping, processing, qs, readData, roomId, saveSetting, searching, server, showComment, showCountComment, showFreeGift, showMessage, showPaidGift, showSPGift, start, startSearch, tcpClient, urlKey;

  server = "https://www.showroom-live.com";

  roomId = 0;

  liveId = 0;

  bcsvrKey = "";

  broadcastHost = "";

  broadcastPort = 0;

  connected = false;

  tcpClient = null;

  ping = null;

  processing = false;

  qs = null;

  searching = false;

  count = 0;

  allData = [];

  avatarCache = {};

  giftCache = {};

  imgId = 1;

  keyComment = "setting.comment";

  keyCountComment = "setting.count";

  keySPGift = "setting.spgift";

  keyPaidGift = "setting.paidgift";

  keyFreeGift = "setting.freegift";

  showComment = false;

  showCountComment = false;

  showSPGift = false;

  showPaidGift = false;

  showFreeGift = false;

  l = function(str) {
    return chrome.i18n.getMessage(str);
  };

  localize = function() {
    $("#titleLabel").html(l("titleLabel"));
    $("#howToLabel").html(l("howToLabel"));
    $("#connectButton").html(l("connectButton"));
    $("#searchLabel").html(l("searchLabel"));
    $("#numOfCommentLabel").html(l("numOfCommentLabel"));
    $("#userLabel").html(l("userLabel"));
    $("#userLabel").html(l("userLabel"));
    $("#dateLabel").html(l("dateLabel"));
    $("#logLabel").html(l("logLabel"));
    $("#settingTitleLabel").html(l("settingTitleLabel"));
    $("#showCommentLabel").html(l("showComment"));
    $("#showCountCommentLabel").html(l("showCountComment"));
    $("#showSPGiftLabel").html(l("showSPGift"));
    $("#showPaidGiftLabel").html(l("showPaidGift"));
    $("#showFreeGiftLabel").html(l("showFreeGift"));
    $("#setting-open").html(l("settingOpen"));
    return $("#closeLabel").html(l("closeLabel"));
  };

  clearMessage = function() {
    $("#message").html("");
    return count = 0;
  };

  showMessage = function(text) {
    return $("#message").html(text);
  };

  urlKey = function() {
    return $("#room_url").val();
  };

  getUrl = function() {
    return server + "/" + urlKey();
  };

  clear = function() {
    roomId = 0;
    liveId = 0;
    bcsvrKey = "";
    broadcastHost = "";
    broadcastPort = 0;
    return allData = [];
  };

  readData = function(data) {
    if (data.match(/SrGlobal\.roomId *= *([0-9]+)/)) {
      roomId = parseInt(RegExp.$1);
    } else {
      showMessage(l("pageNotFound"));
      return false;
    }
    if (data.match(/SrGlobal\.liveId *= *([0-9]+)/)) {
      liveId = parseInt(RegExp.$1);
    }
    if (!liveId || liveId === 0) {
      showMessage(l("liveEnded"));
      return false;
    }
    if (data.match(/"bcsvr_key"\s*:\s*"([^"]+)"/)) {
      bcsvrKey = RegExp.$1;
    } else {
      showMessage(l("pageReadError"));
      return false;
    }
    if (data.match(/"broadcast_host"\s*:\s*"([^"]+)"/)) {
      broadcastHost = RegExp.$1;
    } else {
      showMessage(l("pageReadError"));
      return false;
    }
    if (data.match(/"broadcast_port"\s*:\s*([0-9]+),/)) {
      broadcastPort = parseInt(RegExp.$1);
    } else {
      showMessage(l("pageReadError"));
      return false;
    }
    return true;
  };

  start = function() {
    var url;
    clearMessage();
    url = getUrl();
    return $.ajax({
      type: "GET",
      url: url,
      success: function(data) {
        var res;
        processing = false;
        res = readData(data);
        if (!res) {
          clear();
          return;
        }
        return connect();
      },
      error: function(XMLHttpRequest, textStatus, errorThrown) {
        processing = false;
        return showMessage(l("pageNotFound"));
      }
    });
  };

  disconnect = function() {
    if (tcpClient !== null) {
      tcpClient.sendMessage("QUIT");
      tcpClient.disconnect();
      tcpClient = null;
      clearInterval(ping);
    }
    connected = false;
    $("#connectButton").html(l("connect"));
    $("#connectButton").removeClass("gray");
    return $("#room_url").prop("disabled", false);
  };

  onButtonClicked = function() {
    if (connected) {
      disconnect();
      return processing = false;
    } else {
      if (urlKey() === "") {
        showMessage(l("inputUrl"));
        processing = false;
        return;
      }
      return start();
    }
  };

  connect = function() {
    clearComment();
    allData = [];
    if (tcpClient) {
      disconnect();
    }
    tcpClient = new TcpClient(broadcastHost, broadcastPort);
    tcpClient._onReceive = onReceive;
    tcpClient.connect(function() {
      tcpClient.sendMessage("SUB\t" + bcsvrKey);
      connected = true;
      $("#connectButton").html(l("disconnect"));
      $("#connectButton").addClass("gray");
      return $("#room_url").prop("disabled", true);
    });
    return ping = setInterval(function() {
      if (tcpClient && tcpClient.isConnected) {
        return tcpClient.sendMessage("PING");
      } else {
        return disconnect();
      }
    }, 30000);
  };

  onReceive = function(receiveInfo) {
    var data, dataView, decoder, json, jsonStr, message, now, splited, type;
    dataView = new DataView(receiveInfo.data);
    decoder = new TextDecoder('utf-8');
    message = decoder.decode(dataView);
    splited = message.split("\t");
    if (splited.length < 2 || splited[0] !== 'MSG') {
      return;
    }
    jsonStr = splited[2];
    if (!jsonStr) {
      return;
    }
    json = JSON.parse(jsonStr);
    type = parseInt(json["t"]);
    if (type !== 1 && type !== 2) {
      return;
    }
    now = new Date();
    data = {
      type: type,
      json: json,
      time: now.toLocaleString()
    };
    allData.push(data);
    if (type === 1) {
      addComment(data);
      count = count + 1;
      $("#comment-count").html(count);
    }
    if (type === 2) {
      addGift(data);
    }
    if (searching) {
      return qs.cache();
    }
  };

  addComment = function(data) {
    var avatar, comment, id, name, row, xhr;
    name = data["json"]["ac"];
    comment = data["json"]["cm"];
    avatar = data["json"]["av"];
    if (comment.match(/^[1-5]?[0-9]$/)) {
      if (!showCountComment) {
        return;
      }
    } else if (!showComment) {
      return;
    }
    id = imgId++;
    row = "<tr> <td class='user-column'> <img class='avatar' id='user-img-" + id + "' src='/img/loading.png'> " + name + " </td> <td class='date-column'>" + data['time'] + "</td> <td>" + comment + "</td> </tr>";
    $("#main-tbody").prepend(row);
    if (avatarCache[avatar]) {
      return $("#user-img-" + id).attr("src", avatarCache[avatar]);
    } else {
      xhr = new XMLHttpRequest();
      xhr.open('GET', "https://image.showroom-live.com/showroom-prod/image/avatar/" + avatar + ".png", true);
      xhr.responseType = 'blob';
      xhr.onload = function(e) {
        var res;
        res = window.URL.createObjectURL(this.response);
        avatarCache[avatar] = res;
        return $("#user-img-" + id).attr("src", res);
      };
      return xhr.send();
    }
  };

  addGift = function(data) {
    var avatar, gift, giftType, h, id, name, num, row, xhr;
    gift = data["json"]["g"];
    giftType = parseInt(data["json"]["gt"]);
    h = parseInt(data["json"]["h"]);
    num = data["json"]["n"];
    name = data["json"]["ac"];
    avatar = data["json"]["av"];
    if (h === 1) {
      if (!showSPGift) {
        return;
      }
    } else if (giftType === 1) {
      if (!showPaidGift) {
        return;
      }
    } else {
      if (!showFreeGift) {
        return;
      }
    }
    id = imgId++;
    row = "<tr> <td class='user-column'> <img class='avatar' id='user-img-" + id + "' src='/img/loading.png'> " + name + " </td> <td class='date-column'>" + data['time'] + "</td> <td> <img class='gift' id='gift-img-" + id + "' src='/img/loading.png'> <span class='gift-num'>x" + num + "</span> </td> </tr>";
    $("#main-tbody").prepend(row);
    if (avatarCache[avatar]) {
      $("#user-img-" + id).attr("src", avatarCache[avatar]);
    } else {
      xhr = new XMLHttpRequest();
      xhr.open('GET', "https://image.showroom-live.com/showroom-prod/image/avatar/" + avatar + ".png", true);
      xhr.responseType = 'blob';
      xhr.onload = function(e) {
        var res;
        res = window.URL.createObjectURL(this.response);
        avatarCache[avatar] = res;
        return $("#user-img-" + id).attr("src", res);
      };
      xhr.send();
    }
    if (giftCache[gift]) {
      return $("#gift-img-" + id).attr("src", giftCache[gift]);
    } else {
      xhr = new XMLHttpRequest();
      xhr.open('GET', "https://image.showroom-live.com/showroom-prod/assets/img/gift/" + gift + "_s.png", true);
      xhr.responseType = 'blob';
      xhr.onload = function(e) {
        var res;
        res = window.URL.createObjectURL(this.response);
        giftCache[gift] = res;
        return $("#gift-img-" + id).attr("src", res);
      };
      return xhr.send();
    }
  };

  clearComment = function() {
    return $("#main-tbody").html("");
  };

  onSearchClicked = function() {
    if (searching) {
      return endSearch();
    } else {
      return startSearch();
    }
  };

  $("#room_url").keypress(function(e) {
    if (e.which === 13) {
      return $("#connectButton").click();
    }
  });

  startSearch = function() {
    qs.cache();
    qs.trigger();
    $("#searchButton").html("ON");
    $("#searchButton").removeClass("gray");
    searching = true;
    return $("#filterText").prop("disabled", false);
  };

  endSearch = function() {
    searching = false;
    $("#searchButton").html("OFF");
    $("#searchButton").addClass("gray");
    $("#filterText").prop("disabled", true);
    qs.reset();
    return qs.search("");
  };

  loadSetting = function() {
    return chrome.storage.sync.get([keyComment, keyCountComment, keySPGift, keyPaidGift, keyFreeGift], function(items) {
      if (items[keyComment] === void 0) {
        items[keyComment] = true;
      }
      if (items[keyComment] === true) {
        showComment = true;
        $("#showComment").prop("checked", true);
      }
      if (items[keyCountComment] === true) {
        showCountComment = true;
        $("#showCountComment").prop("checked", true);
      }
      if (items[keySPGift] === true) {
        showSPGift = true;
        $("#showSPGift").prop("checked", true);
      }
      if (items[keyPaidGift] === true) {
        showPaidGift = true;
        $("#showPaidGift").prop("checked", true);
      }
      if (items[keyFreeGift] === true) {
        showFreeGift = true;
        return $("#showFreeGift").prop("checked", true);
      }
    });
  };

  saveSetting = function() {
    var items;
    showComment = $("#showComment").prop("checked");
    showCountComment = $("#showCountComment").prop("checked");
    showSPGift = $("#showSPGift").prop("checked");
    showPaidGift = $("#showPaidGift").prop("checked");
    showFreeGift = $("#showFreeGift").prop("checked");
    items = {};
    items[keyComment] = showComment;
    items[keyCountComment] = showCountComment;
    items[keySPGift] = showSPGift;
    items[keyPaidGift] = showPaidGift;
    items[keyFreeGift] = showFreeGift;
    return chrome.storage.sync.set(items);
  };

  giftSettingChanged = function() {
    saveSetting();
    clearComment();
    allData.forEach(function(data) {
      if (data["type"] === 1) {
        addComment(data);
      }
      if (data["type"] === 2) {
        return addGift(data);
      }
    });
    if (searching) {
      return qs.cache();
    }
  };

  $(function() {
    localize();
    $("#connectButton").click(function() {
      if (processing) {
        return false;
      }
      processing = true;
      return onButtonClicked();
    });
    $("table").resizableColumns();
    qs = $("#filterText").quicksearch('table tbody tr');
    $("#searchButton").click(function() {
      return onSearchClicked();
    });
    $("#setting-open").leanModal({
      closeButton: ".modal-close"
    });
    loadSetting();
    return $("input.gift-setting").change(giftSettingChanged);
  });

  error = function(msg) {
    showMessage(msg);
    return disconnect;
  };

}).call(this);
