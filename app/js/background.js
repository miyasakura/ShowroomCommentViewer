(function() {
  var createMainWindow, onInitWindow;

  onInitWindow = function(appWindow) {
    var document;
    appWindow.show();
    document = appWindow.contentWindow.document;
    return appWindow.onClosed.addListener(function() {
      return chatClient.exit();
    });
  };

  createMainWindow = function() {
    return chrome.app.window.create('index.html', {
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
    }, onInitWindow);
  };

  chrome.app.runtime.onLaunched.addListener(function() {
    return createMainWindow();
  });

}).call(this);
