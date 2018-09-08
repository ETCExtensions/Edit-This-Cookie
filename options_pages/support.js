jQuery(document).ready(function () {
    $("input:checkbox").uniform();
    setEvents();
});

function setEvents() {
    $(".linkify").click(function () {
        var urlToOpen = $(this).attr("lnk");
        if (urlToOpen == undefined)
            return;

        chrome.tabs.getCurrent(function (cTab) {
            chrome.tabs.create({
                "url": urlToOpen,
                "active": true,
                "index": cTab.index + 1,
                "openerTabId": cTab.id
            });
        });
    });
}
