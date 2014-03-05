$(document).ready(function(){
	resizeIframe();
	
	// for the window resize
	$(window).resize(function() {
		resizeIframe();
	});
});

function resizeIframe() {
	var bodyWidth = $("body").width();
	$("#iframe").attr("width", (bodyWidth - 160));
}
