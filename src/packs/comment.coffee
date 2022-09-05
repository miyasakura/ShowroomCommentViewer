server = "https://6uqm5v4due.execute-api.ap-northeast-1.amazonaws.com/prod/"

roomId = 0
liveId = 0
bcsvrKey = ""
broadcastHost = ""
broadcastPort = 0
connected = false
ws = null
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
keyVoice = "setting.voice"
showComment = false
showCountComment = false
showSPGift = false
showPaidGift = false
showFreeGift = false
playVoice = false

ranges = [
  '\ud83c[\udf00-\udfff]',
  '\ud83d[\udc00-\ude4f]',
  '\ud83d[\ude80-\udeff]',
  '\ud7c9[\ude00-\udeff]',
  '[\u2600-\u27BF]',
  '["#$&()\*\/:;<=>@\[\\\]^_`{|}~]',
  '[　”＃’（）＊．／：；＜＞＠［￥］＾＿‘｛｜｝￣・゛゜´｀¨ヽヾゝゞ〃〇―‐＼∥‥“〔〕〈〉《》「」『』【】±×÷≠≦≧∞∴♂♀°′″℃￠￡§☆★○●◎◇◇◆□■△▲▽▼※〒→←↑↓〓]'
]
kigou_ex = new RegExp(ranges.join('|'), 'g')
www_ex = new RegExp('[wWｗＷ][wWｗＷ][wWｗＷ]+', 'g')
clearMessage = ->
  $("#message").html("")
  count = 0

showMessage = (text) ->
  $("#message").html(text)

urlKey = ->
  return $("#room_url").val()

getUrl = ->
  server + urlKey()

clear = ->
  roomId = 0
  liveId = 0
  bcsvrKey = ""
  broadcastHost = ""
  broadcastPort = 0
  allData = []

readData = (data) ->
  json = JSON.parse(data)
  if json.live_status != 2
    showMessage("ライブが終了しています")
    return

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

      showMessage("ページがみつかりません")
  })

disconnect = ->
  if ws != null
    ws.send("QUIT")
    ws.close()
    ws = null
    clearInterval(ping)
  connected = false
  $("#connectButton").html("接続")
  $("#connectButton").removeClass("gray")
  $("#room_url").prop("disabled", false)

onButtonClicked = ->
  if connected
    disconnect()
    processing = false
  else
    if urlKey() == ""
      showMessage("URLを入力してください。")
      processing = false
      return
    start()

connect = ->
  clearComment()
  allData = []
  if ws
    disconnect()

  ws = new WebSocket('ws://' + broadcastHost + ':' + broadcastPort);
  ws.onopen = ->
    ws.send("SUB\t" + bcsvrKey)
    ws.onmessage = onReceive
    connected = true
    $("#connectButton").html("切断")
    $("#connectButton").addClass("gray")
    $("#room_url").prop("disabled", true)
  ping = setInterval(->
    if ws and ws.readyState == ws.OPEN
      ws.send("PING")
    else
      disconnect()
  , 30000);

onReceive = (message) ->
  if !message.isTrusted
    return
  splited = message.data.split("\t")
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
      <img class='avatar' id='user-img-#{id}' src='https://image.showroom-cdn.com/showroom-prod/image/avatar/#{avatar}.png'>
      #{name}
    </td>
    <td class='date-column'>#{data['time']}</td>
    <td>#{comment}</td>
  </tr>
  "
  $("#main-tbody").prepend(row)
  if !'SpeechSynthesisUtterance' in window
    return

  if !playVoice
    return

  msg = new SpeechSynthesisUtterance()
  msg.volume = 0.3
  msg.rate = 1
  msg.pitch = 1.2
  msg.text = "#{name.replace(kigou_ex, ' ').substr(0,5)}さん。#{comment.replace(kigou_ex,' ').replace(www_ex, 'www')}"
  msg.lang = "ja-UP"
  speechSynthesis.speak(msg)

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
      <img class='avatar' id='user-img-#{id}' src='https://image.showroom-cdn.com/showroom-prod/image/avatar/#{avatar}.png'>
      #{name}
    </td>
    <td class='date-column'>#{data['time']}</td>
    <td>
      <img class='gift' id='gift-img-#{id}' src='https://image.showroom-cdn.com/showroom-prod/assets/img/gift/#{gift}_s.png'>
      <span class='gift-num'>x#{num}</span>
    </td>
  </tr>
  "
  $("#main-tbody").prepend(row)

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
  items = {}
  items[keyComment] = localStorage.getItem(keyComment)
  items[keyCountComment] = localStorage.getItem(keyCountComment)
  items[keySPGift] = localStorage.getItem(keySPGift)
  items[keyFreeGift] = localStorage.getItem(keyFreeGift)
  items[keyPaidGift] = localStorage.getItem(keyPaidGift)
  items[keyVoice] = localStorage.getItem(keyVoice)
  if !items[keyComment]
    items[keyComment] = "true"
  if items[keyComment] == "true"
    showComment = true
    $("#showComment").prop("checked", true)

  if items[keyCountComment] == "true"
    showCountComment = true
    $("#showCountComment").prop("checked", true)

  if !items[keySPGift]
    items[keySPGift] = "true"
  if items[keySPGift] == "true"
    showSPGift = true
    $("#showSPGift").prop("checked", true)

  if !items[keyPaidGift]
    items[keyPaidGift] = "true"
  if items[keyPaidGift] == "true"
    showPaidGift = true
    $("#showPaidGift").prop("checked", true)

  if items[keyFreeGift] == "true"
    showFreeGift = true
    $("#showFreeGift").prop("checked", true)

  if items[keyVoice] == "true"
    playVoice = true
    $("#playVoice").prop("checked", true)

saveSetting = ->
  showComment = $("#showComment").prop("checked")
  showCountComment = $("#showCountComment").prop("checked")
  showSPGift = $("#showSPGift").prop("checked")
  showPaidGift = $("#showPaidGift").prop("checked")
  showFreeGift = $("#showFreeGift").prop("checked")
  playVoice = $("#playVoice").prop("checked")

  localStorage.setItem(keyComment, showComment)
  localStorage.setItem(keyCountComment, showCountComment)
  localStorage.setItem(keySPGift, showSPGift)
  localStorage.setItem(keyPaidGift, showPaidGift)
  localStorage.setItem(keyFreeGift, showFreeGift)
  localStorage.setItem(keyVoice, playVoice)

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
