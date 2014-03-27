var showContextMenu = undefined;

updateCallback = function() {
	if(showContextMenu != preferences.showContextMenu) {
		showContextMenu = preferences.showContextMenu;
		setContextMenu(showContextMenu);
	}
	setChristmasIcon();
};

/*
chrome.browserAction.setBadgeBackgroundColor({
	color: [80, 80, 80, 255]
});
chrome.browserAction.setBadgeText({
	text: "6"
});
*/

setChristmasIcon();
setInterval(setChristmasIcon, 60 * 60 * 1000); //Every hour

//Every time the browser restarts the first time the user goes to the options he ends up in the default page (support)
localStorage.setItem("option_panel", "null");

var currentVersion = chrome.app.getDetails().version;
var oldVersion = data.lastVersionRun;
data.lastVersionRun = currentVersion;
if(oldVersion != currentVersion) {
	if(oldVersion == undefined) { //Is firstrun
		//chrome.tabs.create({url:chrome.extension.getURL('options_pages/support.html')});
		chrome.tabs.create({url:'http://www.editthiscookie.com/start/'});
	} else {
		chrome.notifications.onClicked.addListener(function(notificationId) {
			chrome.tabs.create({
				url: 'http://www.editthiscookie.com/changelog/'
			});
			chrome.notifications.clear(notificationId, function(wasCleared){});
			/*
			chrome.notifications.getAll(function(notifications) {
				for(n in notifications)
					chrome.notifications.clear(n, function(wasCleared){});
			});
			*/
		});
		var opt = {
			type: "basic",
			title: "EditThisCookie",
			message: _getMessage("updated"),
			iconUrl: "/img/icon_128x128.png",
			isClickable: true
		}
		chrome.notifications.create("", opt, function(notificationId){
		});
	}
}

setContextMenu(preferences.showContextMenu);

chrome.cookies.onChanged.addListener( function(changeInfo) {
	var removed = changeInfo.removed;
	var cookie = changeInfo.cookie;
	var cause = changeInfo.cause;
	
	var name = cookie.name;
	var domain = cookie.domain;
	var value = cookie.value;
	
	if(cause == "expired" || cause == "evicted")
		return;
	
	//console.log("Name: " + name + "\t\tDomain: " + domain + "\t\tCause: " + cause + "\t\tRemoved:" + removed);

	for(var i=0; i<data.readOnly.length; i++) {
		var currentRORule = data.readOnly[i];
		if(compareCookies(cookie, currentRORule)) {
			if(removed) {
				chrome.cookies.get({
					'url': "http" + ((currentRORule.secure) ? "s" : "") + "://" + currentRORule.domain + currentRORule.path,
					'name': currentRORule.name,
					'storeId': currentRORule.storeId
				}, function(currentCookie){
					if(compareCookies(currentCookie, currentRORule))
						return;
					var newCookie = cookieForCreationFromFullCookie(currentRORule);
					chrome.cookies.set(newCookie);
					//console.log("Cookie Protected! Name:" + name + " / Url:" + newCookie.url + " / Value: " + newCookie.value);
					++data.nCookiesProtected;
					return;
				});
			}
			return;
		}
	}
	
	if(!removed) {		//Check if a blocked cookie was added
		for(var i=0; i<data.filters.length; i++) {
			var currentFilter = data.filters[i];
			if(filterMatchesCookie(currentFilter,name,domain,value)) {
				chrome.tabs.getSelected(null, function(tab) {
					var toRemove = {};
					toRemove.url = tab.url;
					toRemove.url = "http" + ((cookie.secure) ? "s" : "") + "://" + cookie.domain + cookie.path;
					toRemove.name = name;
					chrome.cookies.remove(toRemove);
					//console.log("Cookie Blocked! Name:" + name + " / Url:" + toRemove.url);
					++data.nCookiesFlagged;
					return;
				});
			}
		}
	}
	
	if(!removed && preferences.useMaxCookieAge && preferences.maxCookieAgeType>0) {	//Check expiration, if too far in the future shorten on user's preference
		var maxAllowedExpiration = Math.round((new Date).getTime()/1000) + (preferences.maxCookieAge * preferences.maxCookieAgeType);
		if(cookie.expirationDate != undefined && cookie.expirationDate > maxAllowedExpiration+60) {
			var newCookie = cookieForCreationFromFullCookie(cookie);
			if(!cookie.session)
				newCookie.expirationDate = maxAllowedExpiration;
			chrome.cookies.set(newCookie);
			//console.log("Cookie Shortened! Name:'"+cookie.name+"' from '"+cookie.expirationDate+"' to '"+maxAllowedExpiration+"'");
			++data.nCookiesShortened;
			return;
		}
	}
});

/*
chrome.extension.onMessageExternal.addListener(function(details) {
	var message = details.message;
	var sender = details.sender;
	var sendResponse = details.sendResponse;
	
	console.assert(sender.id == editThisCookieID || sender.id == swapMyCookiesID || sender.id == forgetMeID);
	if(request.action != undefined && request.action == "ping") {
		sendResponse({});
	}
});
*/

function setContextMenu(show) {
	chrome.contextMenus.removeAll();
	if(show) {
		chrome.contextMenus.create({
			"title": "EditThisCookie", //_getMessage("ContextMenu"),
			"contexts":["all"],
			"onclick":function(info,tab){
				showPopup(info,tab);
			}
		});
	}
}

function setChristmasIcon() {
	if (isChristmasPeriod() && preferences.showChristmasIcon) {
		chrome.browserAction.setIcon({"path":"/img/cookie_xmas_19x19.png"});
	} else {
		chrome.browserAction.setIcon({"path":"/img/icon_19x19.png"});
	}
}
