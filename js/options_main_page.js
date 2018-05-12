var panel = JSON.parse(localStorage.getItem("option_panel"));
var arguments = getUrlVars();
var element;

if (panel === "null" || panel === null || panel === undefined) {
    element = "support";
} else {
    element = panel;
}

if (arguments.page !== undefined) {
    element = arguments.page;
}

location.href = "/options_pages/" + element + ".html";