var Wiz_Browser = {
	var onRequestFunc = (chrome.extension.onMessage) ? chrome.extension.onMessage : chrome.extension.onRequest,
		sendRequestFunc = (chrome.tabs.sendMessage) ? chrome.tabs.sendMessage : chrome.tabs.sendRequest;
	return {
		sendRequest : function (tabId, params) {
			sendRequestFunc(tabId, params);
		},
		onRequest : function () {
			return onRequestFunc;
		}
	}
};