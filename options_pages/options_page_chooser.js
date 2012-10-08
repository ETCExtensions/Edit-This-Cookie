jQuery(document).ready(function(){
    setPageCooserEvents();
});

//Set Events
function setPageCooserEvents() {
	$(".chooser").click(function() {
		var panel = $(this).attr("id");
		if($(this).hasClass("selected"))
			return;
		ls.set("option_panel", panel);
		location.href = "/options_pages/"+$(this).attr("id")+".html";
	});
}
