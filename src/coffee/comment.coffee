server = "https://www.showroom-live.com"

roomId = 0
liveId = 0
bcsvrKey = ""
broadcastHost = ""
broadcastPort = 0
connected = false
tcpClient = null
ping = null
processing = false
qs = null
searching = false
count = 0
allData = []
avatarCache = {}
giftCache = {}
imgId = 1

keyComment = "setting.comment"
keyCountComment = "setting.count"
keySPGift = "setting.spgift"
keyPaidGift = "setting.paidgift"
keyFreeGift = "setting.freegift"
showComment = false
showCountComment = false
showSPGift = false
showPaidGift = false
showFreeGift = false

l = (str) ->
 chrome.i18n.getMessage(str)

localize = ->
  $("#titleLabel").html(l("titleLabel"))
  $("#howToLabel").html(l("howToLabel"))
  $("#connectButton").html(l("connectButton"))
  $("#searchLabel").html(l("searchLabel"))
  $("#numOfCommentLabel").html(l("numOfCommentLabel"))
  $("#userLabel").html(l("userLabel"))
  $("#userLabel").html(l("userLabel"))
  $("#dateLabel").html(l("dateLabel"))
  $("#logLabel").html(l("logLabel"))
  $("#settingTitleLabel").html(l("settingTitleLabel"))
  $("#showCommentLabel").html(l("showComment"))
  $("#showCountCommentLabel").html(l("showCountComment"))
  $("#showSPGiftLabel").html(l("showSPGift"))
  $("#showPaidGiftLabel").html(l("showPaidGift"))
  $("#showFreeGiftLabel").html(l("showFreeGift"))
  $("#setting-open").html(l("settingOpen"))
  $("#closeLabel").html(l("closeLabel"))

clearMessage = ->
  $("#message").html("")
  count = 0

showMessage = (text) ->
  $("#message").html(text)

urlKey = ->
  return $("#room_url").val()

getUrl = ->
  server + "/" + urlKey()

clear = ->
  roomId = 0
  liveId = 0
  bcsvrKey = ""
  broadcastHost = ""
  broadcastPort = 0
  allData = []

readData = (data) ->
  parser=new DOMParser();
  htmlDoc=parser.parseFromString(data, "text/html")

  if !htmlDoc.getElementById("js-live-data")
    showMessage(l("liveEnded"))
    return

  json = JSON.parse(htmlDoc.getElementById("js-live-data").getAttribute("data-json"))

  # room_id
  roomId = parseInt(json.room_id)

  # live_id
  liveId = parseInt(json.live_id)

  # bcsvrKey
  bcsvrKey = json.broadcast_key

  # host
  broadcastHost = json.broadcast_host

  # port
  broadcastPort = json.broadcast_port

  return true

start = ->
  clearMessage()
  url = getUrl()
  $.ajax({
    type: "GET",
    url: url,
    success: (data) ->
      processing = false
      res = readData(data)
      if !res
        clear()
        return
      connect()
    error: (XMLHttpRequest, textStatus, errorThrown) ->
      processing = false
      showMessage(l("pageNotFound"))
  })

disconnect = ->
  if tcpClient != null
    tcpClient.sendMessage("QUIT")
    tcpClient.disconnect()
    tcpClient = null
    clearInterval(ping)
  connected = false
  $("#connectButton").html(l("connect"))
  $("#connectButton").removeClass("gray")
  $("#room_url").prop("disabled", false)

onButtonClicked = ->
  if connected
    disconnect()
    processing = false
  else
    if urlKey() == ""
      showMessage(l("inputUrl"))
      processing = false
      return
    start()

connect = ->
  clearComment()
  allData = []
  if tcpClient
    disconnect()

  tcpClient = new TcpClient(broadcastHost, broadcastPort)
  tcpClient._onReceive = onReceive
  tcpClient.connect( ->
    tcpClient.sendMessage("SUB\t" + bcsvrKey)
    connected = true
    $("#connectButton").html(l("disconnect"))
    $("#connectButton").addClass("gray")
    $("#room_url").prop("disabled", true)
  )
  ping = setInterval(->
    if tcpClient and tcpClient.isConnected
      tcpClient.sendMessage("PING")
    else
      disconnect()
  , 30000);

onReceive = (receiveInfo) ->
  dataView = new DataView(receiveInfo.data)
  decoder = new TextDecoder('utf-8')
  message = decoder.decode(dataView)
  splited = message.split("\t")
  if splited.length < 2 || splited[0] != 'MSG'
    return
  jsonStr = splited[2]
  if !jsonStr 
    return
  json = JSON.parse(jsonStr)
  type = parseInt(json["t"])
  if type != 1 && type != 2
    return
  now = new Date()
  data = {type: type, json: json, time: now.toLocaleString()}
  allData.push(data)
  if type == 1
    addComment(data)
    count = count + 1
    $("#comment-count").html(count)
  if type == 2
    addGift(data)
  if searching
    qs.cache()

addComment = (data) ->
  name = data["json"]["ac"]
  comment = data["json"]["cm"]
  avatar = data["json"]["av"]
  if comment.match(/^[1-5]?[0-9]$/)
    if !showCountComment
      return
  else if !showComment
    return

  id = imgId++
  row = "
  <tr>
    <td class='user-column'>
      <img class='avatar' id='user-img-#{id}' src='/img/loading.png'>
      #{name}
    </td>
    <td class='date-column'>#{data['time']}</td>
    <td>#{comment}</td>
  </tr>
  "
  $("#main-tbody").prepend(row)
  if avatarCache[avatar]
    $("#user-img-#{id}").attr("src", avatarCache[avatar])
  else
    xhr = new XMLHttpRequest();
    xhr.open('GET', "https://image.showroom-live.com/showroom-prod/image/avatar/#{avatar}.png", true);
    xhr.responseType = 'blob';
    xhr.onload = (e) ->
      res = window.URL.createObjectURL(this.response)
      avatarCache[avatar] = res
      $("#user-img-#{id}").attr("src", res)
    xhr.send();

addGift = (data) ->
  gift = data["json"]["g"]
  giftType = parseInt(data["json"]["gt"])
  h = parseInt(data["json"]["h"])
  num = data["json"]["n"]
  name = data["json"]["ac"]
  avatar = data["json"]["av"]
  if h == 1
    if !showSPGift
      return
  else if giftType == 1
    if !showPaidGift
      return
  else 
    if !showFreeGift
      return

  id = imgId++
  row = "
  <tr>
    <td class='user-column'>
      <img class='avatar' id='user-img-#{id}' src='/img/loading.png'>
      #{name}
    </td>
    <td class='date-column'>#{data['time']}</td>
    <td>
      <img class='gift' id='gift-img-#{id}' src='/img/loading.png'>
      <span class='gift-num'>x#{num}</span>
    </td>
  </tr>
  "
  $("#main-tbody").prepend(row)
  if avatarCache[avatar]
    $("#user-img-#{id}").attr("src", avatarCache[avatar])
  else
    xhr = new XMLHttpRequest();
    xhr.open('GET', "https://image.showroom-live.com/showroom-prod/image/avatar/#{avatar}.png", true);
    xhr.responseType = 'blob';
    xhr.onload = (e) ->
      res = window.URL.createObjectURL(this.response)
      avatarCache[avatar] = res
      $("#user-img-#{id}").attr("src", res)
    xhr.send();
  if giftCache[gift]
    $("#gift-img-#{id}").attr("src", giftCache[gift])
  else
    xhr = new XMLHttpRequest();
    xhr.open('GET', "https://image.showroom-live.com/showroom-prod/assets/img/gift/#{gift}_s.png", true);
    xhr.responseType = 'blob';
    xhr.onload = (e) ->
      res = window.URL.createObjectURL(this.response)
      giftCache[gift] = res
      $("#gift-img-#{id}").attr("src", res)
    xhr.send();

clearComment = ->
  $("#main-tbody").html("")
  
onSearchClicked = ->
  if searching
    endSearch()
  else
    startSearch()

$("#room_url").keypress( (e) ->
  if e.which == 13
    $("#connectButton").click()
)

startSearch =  ->
  qs.cache()
  qs.trigger()
  $("#searchButton").html("ON")
  $("#searchButton").removeClass("gray")
  searching = true
  $("#filterText").prop("disabled", false)

endSearch =  ->
  searching = false
  $("#searchButton").html("OFF")
  $("#searchButton").addClass("gray")
  $("#filterText").prop("disabled", true)
  qs.reset()
  qs.search("")

loadSetting = ->
  chrome.storage.sync.get([keyComment, keyCountComment, keySPGift, keyPaidGift, keyFreeGift], (items) ->
    if items[keyComment] == undefined
      items[keyComment] = true
    if items[keyComment] == true
      showComment = true
      $("#showComment").prop("checked", true)
    if items[keyCountComment] == true
      showCountComment = true
      $("#showCountComment").prop("checked", true)
    if items[keySPGift] == true
      showSPGift = true
      $("#showSPGift").prop("checked", true)
    if items[keyPaidGift] == true
      showPaidGift = true
      $("#showPaidGift").prop("checked", true)
    if items[keyFreeGift] == true
      showFreeGift = true
      $("#showFreeGift").prop("checked", true)
  )

saveSetting = ->
  showComment = $("#showComment").prop("checked")
  showCountComment = $("#showCountComment").prop("checked")
  showSPGift = $("#showSPGift").prop("checked")
  showPaidGift = $("#showPaidGift").prop("checked")
  showFreeGift = $("#showFreeGift").prop("checked")

  items = {}
  items[keyComment] = showComment
  items[keyCountComment] = showCountComment
  items[keySPGift] = showSPGift
  items[keyPaidGift] = showPaidGift
  items[keyFreeGift] = showFreeGift

  chrome.storage.sync.set(items)

giftSettingChanged = ->
  saveSetting()
  clearComment()
  allData.forEach (data) ->
    if data["type"] == 1
      addComment(data)
    if data["type"] == 2
      addGift(data)
  if searching
    qs.cache()

$ ->
  localize()
  $("#connectButton").click ->
    if processing
      return false
    processing = true
    onButtonClicked()
  $("table").resizableColumns()
  qs = $("#filterText").quicksearch('table tbody tr')
  $("#searchButton").click ->
    onSearchClicked()
  $("#setting-open").leanModal({closeButton: ".modal-close"})
  loadSetting()
  $("input.gift-setting").change(giftSettingChanged)

error = (msg) ->
  showMessage(msg)
  disconnect

