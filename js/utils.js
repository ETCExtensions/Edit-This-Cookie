var canvasLoader;

Array.prototype.toTop = function (a) {
    var c;
    if (a <= 0 || a >= this.length) {
        return false
    }
    c = this[a];
    for (var b = a; b > 0; b--) {
        this[b] = this[b - 1]
    }
    this[0] = c;
    return true
};

function getHost(url) {
    return (url.match(/:\/\/(.[^:/]+)/)[1]).replace("www.", "")
}

function addBlockRule(rule) {
    var dfilters = data.filters;
    for (var x = 0; x < dfilters.length; x++) {
        var currFilter = dfilters[x];
        if ((currFilter.domain !== null) === (rule.domain !== null)) {
            if (currFilter.domain !== rule.domain) {
                continue
            }
        } else {
            continue
        }
        if ((currFilter.name !== null) === (rule.name !== null)) {
            if (currFilter.name !== rule.name) {
                continue;
            }
        } else {
            continue;
        }
        if ((currFilter.value !== null) === (rule.value !== null)) {
            if (currFilter.value !== rule.value) {
                continue;
            }
        } else {
            continue;
        }
        return x;
    }
    dfilters[dfilters.length] = rule;
    data.filters = dfilters;
    filterURL = {};

    if (rule.name !== undefined) {
        filterURL.name = rule.name
    }
    if (rule.value !== undefined) {
        filterURL.value = rule.value
    }
    if (rule.domain !== undefined) {
        filterURL.domain = rule.domain
    }
    chrome.cookies.getAll({}, function (cookieL) {
        for (var x = 0; x < cookieL.length; x++) {
            var cCookie = cookieL[x];
            if (filterMatchesCookie(filterURL, cCookie.name, cCookie.domain, cCookie.value)) {
                var cUrl = (cCookie.secure) ? "https://" : "http://" + cCookie.domain + cCookie.path;
                deleteCookie(cUrl, cCookie.name, cCookie.storeId, cCookie)
            }
        }
    });
}

function switchReadOnlyRule(rule) {
    var added = true;
    var readOnlyList = data.readOnly;
    for (var x = 0; x < readOnlyList.length; x++) {
        try {
            var cRule = readOnlyList[x];
            if (cRule.domain === rule.domain && cRule.name === rule.name && cRule.path === rule.path) {
                added = false;
                readOnlyList.splice(x, 1)
            }
        } catch (e) {
            console.error(e.message);
        }
    }
    if (added) {
        readOnlyList[readOnlyList.length] = rule
    }
    data.readOnly = readOnlyList;
    return !!added;
}

function deleteReadOnlyRule(toDelete) {
    readOnlyList = data.readOnly;
    readOnlyList.splice(toDelete, 1);
    data.readOnly = readOnlyList;
}

function deleteBlockRule(toDelete) {
    filtersList = data.filters;
    filtersList.splice(toDelete, 1);
    data.filters = filtersList;
}

function _getMessage(string, args) {
    return (chrome.i18n.getMessage("editThis_" + string, args))
}

function filterMatchesCookie(rule, name, domain, value) {
    var ruleDomainReg = new RegExp(rule.domain);
    var ruleNameReg = new RegExp(rule.name);
    var ruleValueReg = new RegExp(rule.value);
    if (rule.domain !== undefined && domain.match(ruleDomainReg) === null) {
        return false;
    }
    if (rule.name !== undefined && name.match(ruleNameReg) === null) {
        return false;
    }
    if (rule.value !== undefined && value.match(ruleValueReg) === null) {
        return false;
    }
    return true;
}

function getUrlVars() {
    var d = [], c;
    var a = window.location.href.slice(window.location.href.indexOf("?") + 1).split("&");
    for (var b = 0; b < a.length; b++) {
        c = a[b].split("=");
        d.push(c[0]);
        d[c[0]] = c[1]
    }
    return d
}

function showPopup(info, tab) {
    var tabUrl = encodeURI(tab.url);
    var tabID = encodeURI(tab.id);
    var tabIncognito = encodeURI(tab.incognito);

    var urlToOpen = chrome.extension.getURL("popup.html") + "?url=" + tabUrl + "&id=" + tabID + "&incognito=" + tabIncognito;

    chrome.tabs.query({ 'windowId': chrome.windows.WINDOW_ID_CURRENT }, function (tabList) {
        for (var x = 0; x < tabList.length; x++) {
            var cTab = tabList[x];
            if (cTab.url.indexOf(urlToOpen) === 0) {
                chrome.tabs.update(cTab.id, {
                    'selected': true
                });
                return
            }
        }
        chrome.tabs.create({
            'url': urlToOpen
        })
    })
}

function copyToClipboard(text) {
    if (text === undefined)
        return;

    //Appending an element causes the window to scroll...so we save the scroll position and restore it later
    var scrollsave = $('body').scrollTop();

    var copyDiv = document.createElement('textarea');
    copyDiv.style.height = "0.5px";
    document.body.appendChild(copyDiv, document.body.firstChild);
    $(copyDiv).text(text);
    copyDiv.focus();
    copyDiv.select();
    document.execCommand("copy");
    document.body.removeChild(copyDiv);

    $('body').scrollTop(scrollsave);
}

function isChristmasPeriod() {
    var nowDate = new Date();
    var isMidDecember = (nowDate.getMonth() === 11 && nowDate.getDate() > 5);
    var isStartJanuary = (nowDate.getMonth() === 0 && nowDate.getDate() <= 6);
    return isMidDecember || isStartJanuary;
}

function setLoaderVisible(visible) {
    if (visible) {
        $("#loader-container").show();
    } else {
        $("#loader-container").hide();
    }
}
