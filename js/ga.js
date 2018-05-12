var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-33054271-5']);
_gaq.push(['_setSessionCookieTimeout', 0]);
_gaq.push(['_trackPageview']);

(function () {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = 'https://ssl.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

setInterval(function () {
    _gaq.push(['_trackEvent', 'Heartbeat', 'Heartbeat', true]);
}, 4 * 60 * 1000);
