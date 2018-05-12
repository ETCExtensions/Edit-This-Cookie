(function () {
    if (preferences.showDevToolsPanel)
        chrome.devtools.panels.create('EditThisCookie', 'img/icon_32x32.png', 'devtools/panel.html');
})();
