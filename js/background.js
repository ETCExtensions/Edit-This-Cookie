var PAUSED = false;
var showContextMenu = undefined;

updateCallback = function() {
    if(showContextMenu != preferences.showContextMenu) {
    	showContextMenu = preferences.showContextMenu;
    	setContextMenu(showContextMenu);
	}
};

if(AN_status.showADS)
	_gaq.push(['_setCustomVar', 1, 'Ads Enabled', AN_status.showADS, 2]);
if(AN_status.collectData)
	_gaq.push(['_setCustomVar', 2, 'Data OptIn', AN_status.collectData, 2]);

//Every time the browser restarts the first time the user goes to the options he ends up in the default page (support)
ls.set("option_panel",null);

var currentVersion = chrome.app.getDetails().version;
_gaq.push(['_setCustomVar', 3, 'Extension version', currentVersion, 2]);
if(data.lastVersionRun != currentVersion) {
	if(data.lastVersionRun == undefined) { //Is firstrun
	    //chrome.tabs.create({url:chrome.extension.getURL('options_main_page.html')/*+"?page=ads_info"*/}); // ?page=options
	    chrome.tabs.create({url:chrome.extension.getURL('options_pages/support.html')});
	}
	data.lastVersionRun = currentVersion;
}

setContextMenu(preferences.showContextMenu);

chrome.cookies.onChanged.addListener(onCookiesChanged);

function onCookiesChanged(changeInfo) {
	var removed = changeInfo.removed;
    var cookie = changeInfo.cookie;
    var cause = changeInfo.cause;
    
    var name = cookie.name;
    var domain = cookie.domain;
    var value = cookie.value;
    
    if(cause == "expired" || cause == "evicted")
    	return;
    
    console.log("Name: " + name + "\t\tDomain: " + domain + "\t\tCause: " + cause + "\t\tRemoved:" + removed);

	if(!PAUSED) {
		
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
						console.log("Cookie Protected! Name:" + name + " / Url:" + newCookie.url + " / Value: " + newCookie.value);
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
				        console.log("Cookie Blocked! Name:" + name + " / Url:" + toRemove.url);
				        ++data.nCookiesFlagged;
				        return;
				    });
			    }
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
    		console.log("Cookie Shortened! Name:'"+cookie.name+"' from '"+cookie.expirationDate+"' to '"+maxAllowedExpiration+"'");
    		++data.nCookiesShortened;
	    	return;
    	}
    }
};

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

chrome.extension.onRequestExternal.addListener(function(request, sender, sendResponse) {
    console.assert(sender.id == editThisCookieID || sender.id == swapMyCookiesID || sender.id == forgetMeID);
    if(request.action != undefined && request.action == "ping") {
        sendResponse({});
    }
});


chrome.extension.onConnectExternal.addListener(function(port){
    console.log("Connection coming!");
    console.assert(port.sender.id == editThisCookieID || port.sender.id == swapMyCookiesID || port.sender.id == forgetMeID);
    port.onMessage.addListener(function(request) {
        if (request.action != undefined) {
            if(request.action == "pause") {
                console.log("Protection paused");
                PAUSED = true;
                port.postMessage({
                    "pause": true
                });
            }
            else if(request.action == "resume") {
                console.log("Protection resumed");
                PAUSED = false;
                port.postMessage({
                    "resume": true
                });
            }
        }
    });
});

function setContextMenu(show) {
	chrome.contextMenus.removeAll();
	if(show) {
		chrome.contextMenus.create({
		    "title":_getMessage("ContextMenu"),
		    "contexts":["all"],
		    "onclick":function(info,tab){
		        showPopup(info,tab);
		    }
		});
	}
}
