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

var clippingMsg = chrome.i18n.getMessage("clipResult_clipping");
var syncMsg = chrome.i18n.getMessage("clipResult_sync");
var successMsg = chrome.i18n.getMessage("clipResult_success");
var errorMsg = chrome.i18n.getMessage("clipResult_error");

function clear() {
	$(notificationHeadline).empty();
	$(notificationDetails).empty();
	$(successActions).hide();
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
	var msg = successMsg + info.title;
	$(notificationDetails).html(msg);
	showSuccessIcon();
}

function showError(info) {
	var msg = errorMsg + info.title;
	$(notificationDetails).html(msg);
	showErrorIcon();
}

function showSyncing(info) {
	var msg = syncMsg + info.title;
	$(notificationDetails).html(msg);
	showActiveIcon();
}

function showClipping(info) {
	var msg = clippingMsg+ info.title;
	$(notificationDetails).html(msg);
	showClippingIcon();

}

chrome.extension.onMessage.addListener(function(data, sender, sendResponse) {
	var cmd = data.name;
	switch(cmd) {
		case "clip" :
			showClipping(data.info);
			break;
		case "sync" :
			showSyncing(data.info);
			break;
		case "error" :
			showError(data.info);
			break;
		case "saved" :
			showSuccess(data.info);
			break;
	}

});
