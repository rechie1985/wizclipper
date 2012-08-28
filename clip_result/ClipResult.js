/**
 * @author rechie
 */
var notificationHeadline = "#notificationHeadline";
var notificationDetails = "#notificationDetails";
var successActions = "#successActions";
var errorActions = "#errorActions";
var successIcon = "#successIcon";
var errorIcon = "#errorIcon";
var activeIcon = "#activeIcon";
var retryClipSpan = "#retryClip";

var clippingMsg = chrome.i18n.getMessage("clipResult_clipping");
var syncMsg = chrome.i18n.getMessage("clipResult_sync");
var successMsg = chrome.i18n.getMessage("clipResult_success");
var errorMsg = chrome.i18n.getMessage("clipResult_error");
var retryClipMsg = chrome.i18n.getMessage("retry_clip_button");

var info = null;

function clear() {
	$(notificationHeadline).empty();
	$(notificationDetails).empty();
	$(successActions).hide();
	$(errorActions).hide();
}

function bindErrorAction() {
	$(errorActions).show();
	$(retryClipSpan).html(retryClipMsg);
	$(retryClipSpan).bind("click", retryButtonHandler);
}

function retryButtonHandler() {
	chrome.extension.connect({"name" : "retryClip"}).postMessage(info);
	$(notificationDetails).hide();
	$(errorActions).hide();
}

function showSuccessIcon() {
	$(errorIcon).hide();
	$(activeIcon).hide();
	$(clippingIcon).hide();
	$(successIcon).show();
}

function showErrorIcon() {
	$(successIcon).hide();
	$(activeIcon).hide();
	$(clippingIcon).hide();
	$(errorIcon).show();
}

function showActiveIcon() {
	$(errorIcon).hide();
	$(successIcon).hide();
	$(clippingIcon).hide();
	$(activeIcon).show();
}

function showClippingIcon() {
	$(errorIcon).hide();
	$(successIcon).hide();
	$(activeIcon).hide();
	$(clippingIcon).show();
}

function showSuccess(info) {
	var msg = successMsg + " : " + info.title;
	$(notificationHeadline).html(msg);
	showSuccessIcon();
}

function showError(info) {
	this.info = info;
	var msg = errorMsg + " : " + info.title;
	$(notificationHeadline).html(msg);
	$(notificationDetails).html(info.errorMsg);
	showErrorIcon();
	bindErrorAction(info);
}

function showSyncing(info) {
	var msg = syncMsg + " : " + info.title;
	$(notificationHeadline).html(msg);
	showActiveIcon();
}

function showClipping(info) {
	var msg = clippingMsg + " : " + info.title;
	$(notificationHeadline).html(msg);
	showClippingIcon();

}

chrome.extension.onMessage.addListener(function(data, sender, sendResponse) {
	var cmd = data.name;
	switchNotificationMessageByCmd(cmd, data.info);
});

var switchNotificationMessageByCmd = function(cmd, info) {
	console.log(info);
	switch(cmd) {
		case "clip" :
			showClipping(info);
			break;
		case "sync" :
			showSyncing(info);
			break;
		case "error" :
			showError(info);
			break;
		case "saved" :
			showSuccess(info);
			break;
	}
}

