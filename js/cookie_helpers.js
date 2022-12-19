function buildUrl(domain, path, searchUrl) {
    // Keep same protocol as searchUrl
    // This fixes a bug when we want to unset 'secure' property in an https domain
    var secure = searchUrl.indexOf("https://") === 0;

    if (domain.substr(0, 1) === '.')
        domain = domain.substring(1);

    return "http" + ((secure) ? "s" : "") + "://" + domain + path;
}

function deleteAll(cookieList, searchUrl) {
    for (var i = 0; i < cookieList.length; i++) {
        var curr = cookieList[i];
        var url = buildUrl(curr.domain, curr.path, searchUrl);
        deleteCookie(url, curr.name, curr.storeId);
    }
}

function deleteCookie(url, name, store, callback) {
    chrome.cookies.remove({
        'url': url,
        'name': name,
        'storeId': store
    }, function (details) {
        if (typeof callback === "undefined")
            return;
        if (details === "null" || details === undefined || details === "undefined") {
            callback(false);
        } else {
            callback(true);
        }
    })
}

function Filter() {
    var filter = {};

    this.setUrl = function (url) {
        filter.url = url;
    };

    this.setDomain = function (domain) {
        filter.domain = domain;
    };
    this.setName = function (name) {
        filter.name = name;
    };
    this.setSecure = function (secure) {
        filter.secure = secure;
    };
    this.setSession = function (session) {
        filter.session = session;
    };
    this.getFilter = function (session) {
        return filter;
    };
}

function cookieForCreationFromFullCookie(fullCookie) {
    // Fix malformed domains
    // ".wikipedia.com" => "wikipedia.com"
    fullCookie.domain = fullCookie.domain
                        .replace( /^\./,"");
                        
    // If no real url is available use: "https://" : "http://" + domain + path
    var url = "http" + ((fullCookie.secure) ? "s" : "") + "://" + fullCookie.domain + fullCookie.path;

const newCookie = {
    url:            url,
    name:           fullCookie.name           || '', // Empty by default if omitted.
    value:          fullCookie.value          || '', // Empty by default if omitted.
    domain:         fullCookie.domain         || '', // If omitted, the cookie becomes a host-only cookie.
    path:           fullCookie.path           || '', // Defaults to the path portion of the url parameter.
    secure:         fullCookie.secure         || false,
    httpOnly:       fullCookie.httpOnly       || false,
    expirationDate: fullCookie.expirationDate || null,
 // Make sure we are using the right store ID. This is in case we are importing from a basic store ID and the
 // current user is using custom containers
 // storeId:        fullCookie.storeId || cookieHandler.currentTab.cookieStoreId || null,
    storeId:        fullCookie.storeId        || null, //The ID of the cookie store in which to set the cookie. By default, the cookie is set in the current execution context's cookie store.
    sameSite:       fullCookie.sameSite       || null, 
};
 
    if (fullCookie.hostOnly)
        newCookie.domain = null;
    
    if (fullCookie.session)
        newCookie.expirationDate = null;
    
    // sameSite SameSiteStatus optional Chrome 51+
    // Defaults to "unspecified", i.e., if omitted, the cookie is set without specifying a SameSite attribute.
    if (fullCookie.sameSite && fullCookie.sameSite === 'unspecified') {
        newCookie.sameSite = null;
    }
    return newCookie;
}

function compareCookies(b, a) {
    try {
        if (b.name !== a.name)
            return false;
        if (b.value !== a.value)
            return false;
        if (b.path !== a.path)
            return false;
        if (b.secure !== a.secure)
            return false;
        if (b.httpOnly !== a.httpOnly)
            return false;

        var aHostOnly = !!(a.hostOnly || a.domain === undefined);
        var bHostOnly = !!(b.hostOnly || b.domain === undefined);
        if (aHostOnly !== bHostOnly)
            return false;
        if (!aHostOnly && b.domain !== a.domain)
            return false;

        var aSession = !!(a.session || a.expirationDate === undefined);
        var bSession = !!(b.session || b.expirationDate === undefined);
        if (aSession !== bSession)
            return false;
        if (aSession === false && b.expirationDate !== a.expirationDate)
            return false;
    } catch (e) {
        console.error(e.message);
        return false;
    }
    return true;
}

var cookiesToString = {

    "get": function (cookies, url) {
        if (cookiesToString[preferences.copyCookiesType] !== undefined && cookies.length > 0)
            return cookiesToString[preferences.copyCookiesType](cookies, url);
        else
            return undefined;
    },

    "netscape": function (cookies, url) {
        var string = "";
        string += "# Netscape HTTP Cookie File\n";
        string += "# http://curl.haxx.se/rfc/cookie_spec.html\n";
        string += "# This file was generated by EditThisCookie\n";
        if (url !== undefined)
            string += "# URL: " + url + "\n";
        for (var i = 0; i < cookies.length; i++) {
            cookie = cookies[i];
            string += cookie.domain + "\t" +
                (!cookie.hostOnly).toString().toUpperCase() + "\t" +
                cookie.path + "\t" +
                cookie.secure.toString().toUpperCase() + "\t" +
                (cookie.expirationDate ? Math.round(cookie.expirationDate) : "0") + "\t" +
                cookie.name + "\t" +
                cookie.value + ((i === cookies.length - 1) ? "" : "\n");

        }
        return string;
    },

    "json": function (cookies, url) {
        var string = "";
        string += "[\n";
        for (var i = 0; i < cookies.length; i++) {
            cookie = cookies[i];
            cookie.id = i + 1;
            string += JSON.stringify(cookie, null, 4);
            if (i < cookies.length - 1)
                string += ",\n";
        }
        string += "\n]";
        return string;
    },

    "semicolonPairs": function (cookies, url) {
        var string = "";
        string += "// Semicolon separated Cookie File\n";
        string += "// This file was generated by EditThisCookie\n";
        string += "// Details: http://www.ietf.org/rfc/rfc2109.txt\n"
        string += "// Example: http://www.tutorialspoint.com/javascript/javascript_cookies.htm\n"
        if (url !== undefined)
            string += "// URL: " + url + "\n";
        for (var i = 0; i < cookies.length; i++) {
            cookie = cookies[i];
            string += cookie.name + "=" + cookie.value + ";";

        }
        return string;
    },
    "map":function(cookies,url){
            var string = "";
            for (var i = 0; i < cookies.length; i++) {
                cookie = cookies[i];
                string += "\""+cookie.name +"\""+ "," +"\""+ cookie.value + "\""+"\n";

            }
            return string;
        },

    "lpw": function (cookies, url) {
        var string = "";
        string += "// Semicolon separated Cookie File\n";
        string += "// This file was generated by EditThisCookie\n";
        string += "// Details: http://www.cookiecentral.com/faq/#3.5\n"
        string += "// Example: http://www.tutorialspoint.com/javascript/javascript_cookies.htm\n"
        if (url !== undefined)
            string += "// URL: " + url + "\n";
        for (var i = 0; i < cookies.length; i++) {
            cookie = cookies[i];
            string += 'Set-Cookie3: ' + cookie.name + '=' + cookie.value + '; path="/"; domain=' + cookie.domain + '; path_spec; expires="' + (cookie.expirationDate ? cookie.expirationDate : "0") + '"; version=0\n';
        }
        return string;
    }
};
