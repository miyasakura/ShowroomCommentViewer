onInitWindow = (appWindow) -> 
  appWindow.show()
  document = appWindow.contentWindow.document
  appWindow.onClosed.addListener ->
    chatClient.exit()

createMainWindow = ->
  chrome.app.window.create('index.html', {
    id: 'main-window',
    innerBounds: {
      left: 100,
      top: 100,
      width: 650,
      height: 780,
      minWidth: 520,
      minHeight: 400
    },
    hidden: true
  }, onInitWindow)

chrome.app.runtime.onLaunched.addListener -> 
  createMainWindow()

