console.log("Starting background-devtools");

// Background page -- background.js
chrome.runtime.onConnect.addListener(function (port) {
    if (port.name != "devtools-page") {
        return;
    }
    // assign the listener function to a variable so we can remove it later
    var devToolsListener = function (message, sender, sendResponse) {
        var action = message.action;
        if (action === "getall") {
            getAll(port, message);
        } else if (action === "submitCookie") {
            var cookie = message.cookie;
            var origName = message.origName;
            deleteCookie(cookie.url, origName, cookie.storeId);
            chrome.cookies.set(cookie);
            issueRefresh(port);
        }

    };
    // add the listener
    port.onMessage.addListener(devToolsListener);

    port.onDisconnect.addListener(function () {
        port.onMessage.removeListener(devToolsListener);
    });
});

function issueRefresh(port) {
    port.postMessage({
        action: "refresh"
    });
}

function getAll(port, message) {
    chrome.tabs.get(message.tabId, function (tab) {
        var url = tab.url;
        console.log("Looking for cookies on: " + url);
        chrome.cookies.getAll({
            url: url
        }, function (cks) {
            console.log("I have " + cks.length + " cookies");
            port.postMessage({
                action: "getall",
                url: url,
                cks: cks
            });
        });
    });
}
