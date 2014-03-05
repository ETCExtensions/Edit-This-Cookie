var tabURL;
var cookieList = new Array();

var backgroundPageConnection = chrome.runtime.connect({
	name : "devtools-page"
});

backgroundPageConnection.onMessage.addListener(function(message) {
	if(message.action == "getall") {
		createTable(message);
	} else if(message.action == "refresh") {
		location.reload(true);
	}
});

jQuery(document).ready(function() {++data.nPanelClicked;

	start();
	/*
	$("#sidebar").resizable({
		handles : "e",
		minWidth : 100,
		maxWidth : 500,
	});
	*/
});

function start() {
	var arguments = getUrlVars();
	if (arguments.url != undefined) {//TESTING PURPOSES
		createList("https://google.com");
		return;
	}
	var tabId = chrome.devtools.inspectedWindow.tabId;
	backgroundPageConnection.postMessage({
		action : "getall",
		tabId : tabId
	});

}

function createList(url) {
	tabURL = url;
	chrome.cookies.getAll({
		url : tabURL
	}, function(cks) {
		createTable({
			url : tabURL,
			cks : cks
		});
	});
}

function createTable(message) {
	tabURL = message.url;
	cookieList = message.cks;

	$tableBody = $("#cookieTable > tbody");
	$tableBody.empty();

	for (var i = 0; i < cookieList.length; i++) {
		currentC = cookieList[i];
		
		var domainDisabled = (currentC.hostOnly) ? "disabled" : "";
		var expirationDisabled = (currentC.session) ? "disabled" : "";
		
		$row = $("<tr/>");
		$row.append($("<td/>").addClass("hiddenColumn").text(i));
		$row.append($("<td/>").addClass("editable").text(currentC.name));
		$row.append($("<td/>").addClass("editable").text(currentC.value));
		$row.append($("<td/>").addClass("editable domain " + domainDisabled).text(currentC.domain));
		$row.append($("<td/>").addClass("editable").text(currentC.path));
		
		if(currentC.session) {
			expDate = new Date();
			expDate.setFullYear(expDate.getFullYear() + 1);
		} else {
			expDate = new Date(currentC.expirationDate * 1000.0);
		}
		$row.append($("<td/>").addClass("editable expiration " + expirationDisabled).text(expDate));
		
		$row.append($("<td/>").append($("<input/>").attr("type", "checkbox").addClass("sessionCB").prop("checked", currentC.session)));
		$row.append($("<td/>").append($("<input/>").attr("type", "checkbox").addClass("hostOnlyCB").prop("checked", currentC.hostOnly)));
		$row.append($("<td/>").append($("<input/>").attr("type", "checkbox").prop("checked", currentC.secure)));
		$row.append($("<td/>").append($("<input/>").attr("type", "checkbox").prop("checked", currentC.httpOnly)));
		$row.append($("<td/>").addClass("hiddenColumn").text(currentC.name));
		$row.append($("<td/>").addClass("hiddenColumn").text(currentC.storeId));
		$tableBody.append($row);
		
	}

	setEvents();
}

function setEvents() {
	$(".sessionCB").click(function() {
		var checked = $(this).prop("checked");
		var $domain = $(".expiration", $(this).parent().parent()).first();
		if(!!checked)
			$domain.addClass("disabled");
		else
			$domain.removeClass("disabled");
	});
	
	$(".hostOnlyCB").click(function() {
		var checked = $(this).prop("checked");
		var $domain = $(".domain", $(this).parent().parent()).first();
		if(!!checked)
			$domain.addClass("disabled");
		else
			$domain.removeClass("disabled");
	});
	
	$(":checkbox").click(function() {
		updateCookie.call($(this).parent().first());
	});
	
	$("#cookieTable").tablesorter({
		// sort on the first column and third column in ascending order
		sortList : [[1, 0]],
		widgets : ["resizable"],
		widgetOptions : {
			resizable : false
		}
	});

	$('.editable').editable(function(newValue, settings){
		updateCookie.call(this);
		return newValue;
	}, {
		type : 'textarea',
		onblur : "submit"
	});
}

function updateCookie() {
	$row = $(this).parent();
	$cols = $row.children();

	var isForm = function(element) {
		return $("textarea", element).length;
	};
	var isCheckbox = function(element) {
		return $("input", element).length;
	};
	var getValue = function(column, container) {
		element = container[column];
		if (isCheckbox(element)) {
			return $(element).children(0).prop("checked");
		} else if (isForm(element)) {
			return $("textarea", element).first().val();
		} else {
			return $(element).text();
		}
	};

	var id 			= getValue(0, $cols);
	var name 		= getValue(1, $cols);
	var value 		= getValue(2, $cols);
	var domain 		= getValue(3, $cols);
	var path 		= getValue(4, $cols);
	var expiration 	= getValue(5, $cols);
	var session 	= getValue(6, $cols);
	var hostOnly 	= getValue(7, $cols);
	var secure 		= getValue(8, $cols);
	var httpOnly 	= getValue(9, $cols);
	var origName 	= getValue(10, $cols);
	var storeId 	= getValue(11, $cols);
	
	newCookie = {};
	newCookie.url = tabURL;
	newCookie.name = name.replace(";", "").replace(",", "");
	value = value.replace(";", "");
	newCookie.value = value;
	newCookie.path = path;
	newCookie.storeId = storeId;
	if (!hostOnly)
		newCookie.domain = domain;
	if (!session) {
		var expirationDate = new Date(expiration).getTime() / 1000.0;
		console.log(expirationDate);
		//var expirationDate = (expiration != null) ? parseFloat(expiration) / 1000.0 : new Date().getTime() / 1000.0;
		newCookie.expirationDate = expirationDate;
	}
	newCookie.secure = secure;
	newCookie.httpOnly = httpOnly;
	
	backgroundPageConnection.postMessage({
		action : "submitCookie",
		cookie : newCookie,
		origName : origName
	});
}

