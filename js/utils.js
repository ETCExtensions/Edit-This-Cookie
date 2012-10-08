var alterWeb = chrome.extension.getBackgroundPage().back_alterweb;

var escapeVar=$("<i></i>");
function escapeJQ(string){
    return escapeVar.text(string).html()
}
function getHost(url){
    return(url.match(/:\/\/(.[^/]+)/)[1]).replace("www.","")
}
function addBlockRule(rule){
    var dfilters=data.filters;
    for(var x=0;x<dfilters.length;x++){
        var currFilter=dfilters[x];
        if((currFilter.domain!=null)==(rule.domain!=null)){
            if(currFilter.domain!=rule.domain){
                continue
            }
        }else{
            continue
        }
        if((currFilter.name!=null)==(rule.name!=null)){
            if(currFilter.name!=rule.name){
                continue;
            }
        }else{
            continue;
        }
        if((currFilter.value!=null)==(rule.value!=null)){
            if(currFilter.value!=rule.value){
                continue;
            }
        }else{
            continue;
        }
        return x;
    }
    dfilters[dfilters.length]=rule;
    data.filters = dfilters;
    filterURL={};

    if(rule.name!=undefined){
        filterURL.name=rule.name
    }
    if(rule.value!=undefined){
        filterURL.value=rule.value
    }
    if(rule.domain!=undefined){
        filterURL.domain=rule.domain
    }
    chrome.cookies.getAll({},function(cookieL){
        for(var x=0;x<cookieL.length;x++){
            var cCookie=cookieL[x];
            if(filterMatchesCookie(filterURL,cCookie.name,cCookie.domain,cCookie.value)){
                var cUrl = (cCookie.secure)?"https://":"http://"+cCookie.domain+cCookie.path;
                deleteCookie(cUrl,cCookie.name,cCookie.storeId,cCookie)
            }
        }
    });
//    rulesChanged()
}
function switchReadOnlyRule(rule){
    var added=true;
    var readOnlyList=data.readOnly;
    for(var x=0;x<readOnlyList.length;x++){
    	try{
		    var cRule=readOnlyList[x];
		    if(cRule.domain==rule.domain && cRule.name==rule.name && cRule.path==rule.path){
		        added=false;
		        readOnlyList.splice(x,1)
		    }
	   	} catch(e) {
	   		console.error(e.message);
	   	}
    }
    if(added){
        readOnlyList[readOnlyList.length]=rule
    }
    data.readOnly = readOnlyList;
    return !!added;
}
function deleteReadOnlyRule(toDelete){
	readOnlyList = data.readOnly;
    readOnlyList.splice(toDelete,1);
    data.readOnly = readOnlyList;
}
function deleteBlockRule(toDelete){
    filtersList = data.filters;
    filtersList.splice(toDelete,1);
    data.filters = filtersList;
}

Array.prototype.toTop=function(a){
    var c;
    if(a<=0||a>=this.length){
        return false
    }
    c=this[a];
    for(var b=a;b>0;b--){
        this[b]=this[b-1]
    }
    this[0]=c;
    return true
};
    
function _writeMessage(string, args){
    document.write(_getMessage(string, args));
}
function _getMessage(string, args){
    return(chrome.i18n.getMessage("editThis_"+string, args))
}

function filterMatchesCookie(rule, name, domain, value){
	var ruleDomainReg = new RegExp(rule.domain);
    if(rule.domain!=undefined && domain.match(ruleDomainReg) == null){
        return false
    }
    if(rule.name!=undefined && name!=rule.name){
        return false
    }
    if(rule.value!=undefined && value!=rule.value){
        return false
    }
    return true
}
function filterMatchesCookieOLD(c,g,a,e){
    var d=new RegExp(c.domain);
    if(c.domain!=null&&a.match(d)==null){
        return false
    }
    var f=new RegExp(c.name);
    if(c.name!=null && g != c){
        return false
    }
    var b=new RegExp(c.value);
    if(c.value!=null&&e.match(b)==null){
        return false
    }
    return true
}
function getUrlVars(){
    var d=[],c;
    var a=window.location.href.slice(window.location.href.indexOf("?")+1).split("&");
    for(var b=0;b<a.length;b++){
        c=a[b].split("=");
        d.push(c[0]);
        d[c[0]]=c[1]
    }
    return d
}
function showPopup(info,tab){
    var tabUrl=encodeURI(tab.url);
    var tabID=encodeURI(tab.id);
    
    var urlToOpen=chrome.extension.getURL("popup.html")+"?url="+tabUrl+"&id="+tabID;
    
    chrome.tabs.query({'windowId':chrome.windows.WINDOW_ID_CURRENT}, function(tabList){
//    chrome.tabs.getAllInWindow(null,function(tabList){
        for(var x=0;x<tabList.length;x++){
            var cTab=tabList[x];
            if(cTab.url.indexOf(urlToOpen)==0){
                chrome.tabs.update(cTab.id,{
                    'selected':true
                });
                return
            }
        }
        chrome.tabs.create({
            'url':urlToOpen
        })
    })
}

function copyToClipboard(text){
	if(text == undefined)
		return;

	var scrollsave = $('body').scrollTop();	//Appending an element causes the window to scroll...so we save the scroll position and restore it later

	var copyDiv = document.createElement('textarea');
	copyDiv.style.height="0.5px";
	document.body.appendChild(copyDiv, document.body.firstChild);
	$(copyDiv).text(text);
	copyDiv.focus();
	document.execCommand('SelectAll');
	document.execCommand("Copy", false, null);
	document.body.removeChild(copyDiv);
	
	$('body').scrollTop(scrollsave);
}

function getDomain(url) {
  server = url.match(/:\/\/(.[^/:#?]+)/)[1];
  parts = server.split(".");
  domain = parts[parts.length - 2] + "." + parts[parts.length -1];
  return domain;
}
