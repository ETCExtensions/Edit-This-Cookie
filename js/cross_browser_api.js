/**
 * If we're not running in Chrome/Chromium, try to use the WebExtensions API instead.
 */

var isBrowserChrome = true;

if(chrome == undefined) {
	isBrowserChrome = false;
	chrome = browser;
}