var preferences_template = {
	"showAlerts":{
		"default_value": false
	},
	"showCommandsLabels":{
		"default_value": false
	},
	"showDomain":{
		"default_value": true
	},
	"showDomainBeforeName":{
		"default_value": true
	},
	"showFlagAndDeleteAll":{
		"default_value": false
	},
	"showContextMenu":{
		"default_value": true
	},
	"refreshAfterSubmit":{
		"default_value": false
	},
	"skipCacheRefresh":{
		"default_value": true
	},
	"useMaxCookieAge":{
		"default_value": false
	},
	"maxCookieAgeType":{					//The multiplier for maxCookieAge in order to obtain the right numbers of seconds. 3600 for hour, 86400 for day, ...
		"default_value": -1
	},
	"maxCookieAge":{
		"default_value": 1
	},
	"useCustomLocale":{
		"default_value": false
	},
	"customLocale":{
		"default_value": "en"
	},
	"copyCookiesType":{						//Supported: netscape, json, semicolonPairs -> as in cookie_helpers.js "cookiesToString"
		"default_value": "json"
	},
	"useMaxCookieAge":{
		"default_value": false
	},
	"useMaxCookieAge":{
		"default_value": false
	},
	"useMaxCookieAge":{
		"default_value": false
	},
	"useMaxCookieAge":{
		"default_value": false
	},
	"showChristmasIcon":{
		"default_value": true
	},
	"sortCookiesType":{
		"default_value": "domain_alpha"		//Supported: domain_alpha, alpha
	},
	"showDevToolsPanel":{
		"default_value": true
	},
	"showLabelChooserBanner":{
		"default_value": true
	},
};

var data_template = {
	"filters":{
		"default_value": new Array()
	},
	"readOnly":{
		"default_value": new Array()
	},
	"installDate":{
		"default_value": new Date()
	},
	"startStatsDate":{
		"default_value": new Date()
	},
	"nCookiesCreated":{
		"default_value": 0
	},
	"nCookiesChanged":{
		"default_value": 0
	},
	"nCookiesDeleted":{
		"default_value": 0
	},
	"nCookiesProtected":{
		"default_value": 0
	},
	"nCookiesFlagged":{
		"default_value": 0
	},
	"nCookiesShortened":{
		"default_value": 0
	},
	"nPopupClicked":{
		"default_value": 0
	},
	"nPanelClicked":{
		"default_value": 0
	},
	"nCookiesImported":{
		"default_value": 0
	},
	"nCookiesExported":{
		"default_value": 0
	},
	"lastVersionRun":{
		"default_value": undefined
	}
};

var preferences = {};
var data = {};
var preferences_prefix = "options_";
var data_prefix = "data_";
var an_prefix = "AN_";

var updateCallback = undefined;
var dataToSync = new Array();
var syncTimeout = false;
var syncTime = 200;

var editThisCookieID = "fngmhnnpilhplaeedifhccceomclgfbg";
var swapMyCookiesID = "dffhipnliikkblkhpjapbecpmoilcama";
var forgetMeID = "gekpdemielcmiiiackmeoppdgaggjgda";

var ls = {
	set : function(name, value) {
		localStorage.setItem(name, JSON.stringify(value));
	},
	get : function(name, default_value) {
		if(localStorage[name] == undefined) {
			if(default_value!=undefined)
				ls.set(name, default_value);
			else
				return null;
			return default_value;
		}
		try {
			return JSON.parse(localStorage.getItem(name));
		} catch(e) {
			ls.set(name, default_value);
			return default_value;
		}
	},
	remove : function(name) {
		return localStorage.removeItem(name);
	}
}

function syncDataToLS() {				//This way we limit the max amount of storage change events to one per second
	for(var cID in dataToSync) {
		var cVal = dataToSync[cID];
		delete dataToSync[cID];
		ls.set(cID, cVal);
	}
	syncTimeout = false;
}

function fetchData() {
	for(var key in preferences_template) {
		default_value = preferences_template[key].default_value;
		preferences[key] = ls.get(preferences_prefix+key, default_value);
	
		preferences.watch(key,
			function (id, oldval, newval) {
				//ls.set(preferences_prefix+id, newval);
				//return;
				dataToSync[preferences_prefix+id] = newval;
				if(!syncTimeout)
					syncTimeout = setTimeout(syncDataToLS, syncTime);
				return newval;
			},
			function (id) {							//This one gets called upon reading a value
				preferences_template[id].used = true;
			}
		);
	}

	for(var key in data_template) {
		default_value = data_template[key].default_value;
		data[key] = ls.get(data_prefix+key, default_value);
		
		data.watch(key,
			function (id, oldval, newval) {
				//ls.set(data_prefix+id, newval);
				//return;
				dataToSync[data_prefix+id] = newval;
				if(!syncTimeout)
					syncTimeout = setTimeout(syncDataToLS, syncTime);
				return newval;
			},
			function (id) {
				data_template[id].used = true;
			}
		);
	}
}

window.addEventListener("storage", function(event) {
	try {
		//event.key | event.oldValue | event.newValue
		//console.log("Storage event key:" + event.key);
		var varUsed = false;
		var varChanged = false;
		var oldValue = (event.oldValue != null) ? JSON.parse(event.oldValue) : null;
		var newValue = (event.newValue != null) ? JSON.parse(event.newValue) : null;
		
		if(oldValue == newValue)
			return;
	
		var key;
		if(event.key.indexOf(preferences_prefix) == 0) {
			key = event.key.substring(preferences_prefix.length);
			varUsed = !!preferences_template[key].used;
			varChanged = preferences[key] != newValue;
			preferences[key] = (newValue == null) ? preferences_template[key].default_value : newValue;
			preferences_template[key].used = varUsed;
		} else if(event.key.indexOf(data_prefix) == 0) {
			key = event.key.substring(data_prefix.length);
			varUsed = (data_template[key].used!=undefined && data_template[key].used);
			varChanged = data[key] != newValue;
			data[key] = (newValue == null) ? data_template[key].default_value : newValue;
			data_template[key].used = varUsed;
		}
		if(varUsed && varChanged && updateCallback != undefined) {
			updateCallback();
		}
	} catch(e) {
	}
}, false);

fetchData();

firstRun = ls.get("status_firstRun");
if(firstRun != null) {
	data.lastVersionRun = chrome.app.getDetails().version;
}


var syncTimeout = setTimeout(syncDataToLS, syncTime);
$(window).bind("beforeunload", syncDataToLS);
