//TAKEN FROM:
//https://adblockforchrome.googlecode.com/svn/trunk/port.js

// Chrome to Safari port
// Author: Michael Gundlach (gundlach@gmail.com)
// License: GPLv3 as part of adblockforchrome.googlecode.com
//          or MIT if GPLv3 conflicts with your code's license.

chrome.i18n = chrome.i18n || {};
chrome.i18n = (function() {

  //Supported locales as in:
  //https://developers.google.com/chrome/web-store/docs/i18n?hl=it#localeTable
  var supportedLocales = 
	[{"code":"ar", "name":"Arabic"},
	{"code":"bg", "name":"Bulgarian"},
	{"code":"ca", "name":"Catalan"},
	{"code":"zh_CN", "name":"Chinese (China)"},
	{"code":"zh_TW", "name":"Chinese (Taiwan)"},
	{"code":"hr", "name":"Croatian"},
	{"code":"cs", "name":"Czech"},
	{"code":"da", "name":"Danish"},
	{"code":"nl", "name":"Dutch"},
	{"code":"en", "name":"English"},
	{"code":"en_GB", "name":"English (Great Britain)"},
	{"code":"en_US", "name":"English (USA)"},
	{"code":"et", "name":"Estonian"},
	{"code":"fil", "name":"Filipino"},
	{"code":"fi", "name":"Finnish"},
	{"code":"fr", "name":"French"},
	{"code":"de", "name":"German"},
	{"code":"el", "name":"Greek"},
	{"code":"he", "name":"Hebrew"},
	{"code":"hi", "name":"Hindi"},
	{"code":"hu", "name":"Hungarian"},
	{"code":"id", "name":"Indonesian"},
	{"code":"it", "name":"Italian"},
	{"code":"ja", "name":"Japanese"},
	{"code":"ko", "name":"Korean"},
	{"code":"lv", "name":"Latvian"},
	{"code":"lt", "name":"Lithuanian"},
	{"code":"no", "name":"Norwegian"},
	{"code":"pl", "name":"Polish"},
	{"code":"pt_BR", "name":"Portuguese (Brazil)"},
	{"code":"pt_PT", "name":"Portuguese (Portugal)"},
	{"code":"ro", "name":"Romanian"},
	{"code":"ru", "name":"Russian"},
	{"code":"sr", "name":"Serbian"},
	{"code":"sk", "name":"Slovak"},
	{"code":"sl", "name":"Slovenian"},
	{"code":"es", "name":"Spanish"},
	{"code":"es_419", "name":"Spanish (Latin America and Caribbean)"},
	{"code":"sv", "name":"Swedish"},
	{"code":"th", "name":"Thai"},
	{"code":"tr", "name":"Turkish"},
	{"code":"uk", "name":"Ukrainian"},
	{"code":"vi", "name":"Vietnamese"}];
	
  function syncFetch(file, fn) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", chrome.extension.getURL(file), false);
    xhr.onreadystatechange = function() {
      if(this.readyState == 4 && this.responseText != "") {
        fn(this.responseText);
      }
    };
    try {
      xhr.send();
    }
    catch (e) {
      // File not found, perhaps
    }
  }

  // Insert substitution args into a localized string.
  function parseString(msgData, args) {
    // If no substitution, just turn $$ into $ and short-circuit.
    if (msgData.placeholders == undefined && args == undefined)
      return msgData.message.replace(/\$\$/g, '$');

    // Substitute a regex while understanding that $$ should be untouched
    function safesub(txt, re, replacement) {
      var dollaRegex = /\$\$/g, dollaSub = "~~~I18N~~:";
      txt = txt.replace(dollaRegex, dollaSub);
      txt = txt.replace(re, replacement);
      // Put back in "$$" ("$$$$" somehow escapes down to "$$")
      var undollaRegex = /~~~I18N~~:/g, undollaSub = "$$$$";
      txt = txt.replace(undollaRegex, undollaSub);
      return txt;
    }

    var $n_re = /\$([1-9])/g;
    var $n_subber = function(_, num) { return args[num - 1]; };

    var placeholders = {};
    // Fill in $N in placeholders
    for (var name in msgData.placeholders) {
      var content = msgData.placeholders[name].content;
      placeholders[name.toLowerCase()] = safesub(content, $n_re, $n_subber);
    }
    // Fill in $N in message
    var message = safesub(msgData.message, $n_re, $n_subber);
    // Fill in $Place_Holder1$ in message
    message = safesub(message, /\$(\w+?)\$/g, function(full, name) {
      var lowered = name.toLowerCase();
      if (lowered in placeholders)
        return placeholders[lowered];
      return full; // e.g. '$FoO$' instead of 'foo'
    });
    // Replace $$ with $
    message = message.replace(/\$\$/g, '$');

    return message;
  }

  var l10nData = undefined;

  var theI18nObject = {
    // chrome.i18n.getMessage() may be used in any extension resource page
    // without any preparation.  But if you want to use it from a content
    // script in Safari, the content script must first run code like this:
    //
    //   get_localization_data_from_global_page_async(function(data) {
    //     chrome.i18n._setL10nData(data);
    //     // now I can call chrome.i18n.getMessage()
    //   });
    //   // I cannot call getMessage() here because the above call
    //   // is asynchronous.
    //
    // The global page will need to receive your request message, call
    // chrome.i18n._getL10nData(), and return its result.
    //
    // We can't avoid this, because the content script can't load
    // l10n data for itself, because it's not allowed to make the xhr
    // call to load the message files from disk.  Sorry :(
    _getL10nData: function() {
      var result = { locales: [] };

      // == Find all locales we might need to pull messages from, in order
      // 0: The user's chosen locale, if present
      if(preferences.useCustomLocale && preferences.customLocale != null)
      	result.locales.push(preferences.customLocale);
      // 1: The user's current locale, converted to match the format of
      //    the _locales directories (e.g. "en-US" becomes "en_US"
      result.locales.push(navigator.language.replace('-', '_'));
      // 2: Perhaps a region-agnostic version of the current locale
      if (navigator.language.length > 2)
        result.locales.push(navigator.language.substring(0, 2));
      // 3: Set English 'en' as default locale
      if (result.locales.indexOf("en") == -1)
        result.locales.push("en");

      // Load all locale files that exist in that list
      result.messages = {};
      for (var i = 0; i < result.locales.length; i++) {
        var locale = result.locales[i];
        var file = "_locales/" + locale + "/messages.json";
        // Doesn't call the callback if file doesn't exist
        syncFetch(file, function(text) {
          result.messages[locale] = JSON.parse(text);
        });
      }

      return result;
    },

    // Manually set the localization data.  You only need to call this
    // if using chrome.i18n.getMessage() from a content script, before
    // the first call.  You must pass the value of _getL10nData(),
    // which can only be called by the global page.
    _setL10nData: function(data) {
      l10nData = data;
    },

    getMessage: function(messageID, args) {
      if (l10nData == undefined) {
        // Assume that we're not in a content script, because content 
        // scripts are supposed to have set l10nData already
        chrome.i18n._setL10nData(chrome.i18n._getL10nData());
      }
      if (typeof args == "string")
        args = [args];
      for (var i = 0; i < l10nData.locales.length; i++) {
        var map = l10nData.messages[l10nData.locales[i]];
        // We must have the locale, and the locale must have the message
        if (map && messageID in map)
          return parseString(map[messageID], args);
      }
      return "";
    },
    
    //Returns the list of locales that are actually present in the locale directory
    getExistingLocales: function (){
     var existingLocales = [];
  	 for (var i = 0; i < supportedLocales.length; i++) {
        var locale = supportedLocales[i].code;
        var file = "_locales/" + locale + "/messages.json";

        var xhr = new XMLHttpRequest();
		xhr.open("GET", chrome.extension.getURL(file), false);
		xhr.onreadystatechange = function() {
		};
		try {
		  xhr.send();
		  existingLocales.push(supportedLocales[i]);
		}
		catch (e) {
		}
  	  }
  	  return existingLocales;
	}
    
  };

  return theI18nObject;
})();
