// Generated by CoffeeScript 2.1.0
(function() {
  var addComment, addGift, allData, avatarCache, bcsvrKey, broadcastHost, broadcastPort, clear, clearComment, clearMessage, connect, connected, count, disconnect, endSearch, error, getUrl, giftCache, giftSettingChanged, imgId, keyComment, keyCountComment, keyFreeGift, keyPaidGift, keySPGift, keyVoice, kigou_ex, liveId, loadSetting, onButtonClicked, onReceive, onSearchClicked, ping, playVoice, processing, qs, ranges, readData, roomId, saveSetting, searching, server, showComment, showCountComment, showFreeGift, showMessage, showPaidGift, showSPGift, start, startSearch, urlKey, ws, www_ex,
    indexOf = [].indexOf;

  server = "https://xlv7zi96k3.execute-api.ap-northeast-1.amazonaws.com/prod/";

  roomId = 0;

  liveId = 0;

  bcsvrKey = "";

  broadcastHost = "";

  broadcastPort = 0;

  connected = false;

  ws = null;

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

  keyVoice = "setting.voice";

  showComment = false;

  showCountComment = false;

  showSPGift = false;

  showPaidGift = false;

  showFreeGift = false;

  playVoice = false;

  ranges = ['\ud83c[\udf00-\udfff]', '\ud83d[\udc00-\ude4f]', '\ud83d[\ude80-\udeff]', '\ud7c9[\ude00-\udeff]', '[\u2600-\u27BF]', '["#$&()\*\/:;<=>@\[\\\]^_`{|}~]', '[　”＃’（）＊．／：；＜＞＠［￥］＾＿‘｛｜｝￣・゛゜´｀¨ヽヾゝゞ〃〇―‐＼∥‥“〔〕〈〉《》「」『』【】±×÷≠≦≧∞∴♂♀°′″℃￠￡§☆★○●◎◇◇◆□■△▲▽▼※〒→←↑↓〓]'];

  kigou_ex = new RegExp(ranges.join('|'), 'g');

  www_ex = new RegExp('[wWｗＷ][wWｗＷ][wWｗＷ]+', 'g');

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
    return server + urlKey();
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
    var htmlDoc, json, parser;
    parser = new DOMParser();
    htmlDoc = parser.parseFromString(data, "text/html");
    if (!htmlDoc.getElementById("js-live-data")) {
      showMessage("ライブが終了しています");
      return;
    }
    json = JSON.parse(htmlDoc.getElementById("js-live-data").getAttribute("data-json"));
    // room_id
    roomId = parseInt(json.room_id);
    // live_id
    liveId = parseInt(json.live_id);
    // bcsvrKey
    bcsvrKey = json.broadcast_key;
    // host
    broadcastHost = json.broadcast_host;
    // port
    broadcastPort = json.broadcast_port;
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
        return showMessage("ページがみつかりません");
      }
    });
  };

  disconnect = function() {
    if (ws !== null) {
      ws.send("QUIT");
      ws.close();
      ws = null;
      clearInterval(ping);
    }
    connected = false;
    $("#connectButton").html("接続");
    $("#connectButton").removeClass("gray");
    return $("#room_url").prop("disabled", false);
  };

  onButtonClicked = function() {
    if (connected) {
      disconnect();
      return processing = false;
    } else {
      if (urlKey() === "") {
        showMessage("URLを入力してください。");
        processing = false;
        return;
      }
      return start();
    }
  };

  connect = function() {
    clearComment();
    allData = [];
    if (ws) {
      disconnect();
    }
    ws = new WebSocket('ws://' + broadcastHost + ':' + broadcastPort);
    ws.onopen = function() {
      ws.send("SUB\t" + bcsvrKey);
      ws.onmessage = onReceive;
      connected = true;
      $("#connectButton").html("切断");
      $("#connectButton").addClass("gray");
      return $("#room_url").prop("disabled", true);
    };
    return ping = setInterval(function() {
      if (ws && ws.readyState === ws.OPEN) {
        return ws.send("PING");
      } else {
        return disconnect();
      }
    }, 30000);
  };

  onReceive = function(message) {
    var data, json, jsonStr, now, splited, type;
    if (!message.isTrusted) {
      return;
    }
    splited = message.data.split("\t");
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
    var avatar, comment, id, msg, name, ref, row;
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
    row = `<tr> <td class='user-column'> <img class='avatar' id='user-img-${id}' src='https://image.showroom-live.com/showroom-prod/image/avatar/${avatar}.png'> ${name} </td> <td class='date-column'>${data['time']}</td> <td>${comment}</td> </tr>`;
    $("#main-tbody").prepend(row);
    if (ref = !'SpeechSynthesisUtterance', indexOf.call(window, ref) >= 0) {
      return;
    }
    if (!playVoice) {
      return;
    }
    msg = new SpeechSynthesisUtterance();
    msg.volume = 0.3;
    msg.rate = 1;
    msg.pitch = 1.2;
    msg.text = `${name.replace(kigou_ex, ' ').substr(0, 5)}さん。${comment.replace(kigou_ex, ' ').replace(www_ex, 'www')}`;
    msg.lang = "ja-UP";
    return speechSynthesis.speak(msg);
  };

  addGift = function(data) {
    var avatar, gift, giftType, h, id, name, num, row;
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
    row = `<tr> <td class='user-column'> <img class='avatar' id='user-img-${id}' src='https://image.showroom-live.com/showroom-prod/image/avatar/${avatar}.png'> ${name} </td> <td class='date-column'>${data['time']}</td> <td> <img class='gift' id='gift-img-${id}' src='https://image.showroom-live.com/showroom-prod/assets/img/gift/${gift}_s.png'> <span class='gift-num'>x${num}</span> </td> </tr>`;
    return $("#main-tbody").prepend(row);
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
    var items;
    items = {};
    items[keyComment] = localStorage.getItem(keyComment);
    items[keyCountComment] = localStorage.getItem(keyCountComment);
    items[keySPGift] = localStorage.getItem(keySPGift);
    items[keyFreeGift] = localStorage.getItem(keyFreeGift);
    items[keyPaidGift] = localStorage.getItem(keyPaidGift);
    items[keyVoice] = localStorage.getItem(keyVoice);
    if (!items[keyComment]) {
      items[keyComment] = "true";
    }
    if (items[keyComment] === "true") {
      showComment = true;
      $("#showComment").prop("checked", true);
    }
    if (items[keyCountComment] === "true") {
      showCountComment = true;
      $("#showCountComment").prop("checked", true);
    }
    if (!items[keySPGift]) {
      items[keySPGift] = "true";
    }
    if (items[keySPGift] === "true") {
      showSPGift = true;
      $("#showSPGift").prop("checked", true);
    }
    if (!items[keyPaidGift]) {
      items[keyPaidGift] = "true";
    }
    if (items[keyPaidGift] === "true") {
      showPaidGift = true;
      $("#showPaidGift").prop("checked", true);
    }
    if (items[keyFreeGift] === "true") {
      showFreeGift = true;
      $("#showFreeGift").prop("checked", true);
    }
    if (items[keyVoice] === "true") {
      playVoice = true;
      return $("#playVoice").prop("checked", true);
    }
  };

  saveSetting = function() {
    showComment = $("#showComment").prop("checked");
    showCountComment = $("#showCountComment").prop("checked");
    showSPGift = $("#showSPGift").prop("checked");
    showPaidGift = $("#showPaidGift").prop("checked");
    showFreeGift = $("#showFreeGift").prop("checked");
    playVoice = $("#playVoice").prop("checked");
    localStorage.setItem(keyComment, showComment);
    localStorage.setItem(keyCountComment, showCountComment);
    localStorage.setItem(keySPGift, showSPGift);
    localStorage.setItem(keyPaidGift, showPaidGift);
    localStorage.setItem(keyFreeGift, showFreeGift);
    return localStorage.setItem(keyVoice, playVoice);
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

//# sourceMappingURL=comment.js.map
