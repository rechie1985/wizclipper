$.ajaxSetup({
	dataType : 'text',
	cache : false,
});
var token = null;
chrome.extension.onConnect.addListener(function(port) {
	var tab = port.sender.tab;
	if (port.name && port.name == "login") {
		port.onMessage.addListener(function(msg) {
			// var url = "http://127.0.0.1:8800/wizkm/xmlrpc";
			var url = "http://service.wiz.cn/wizkm/xmlrpc";
			$.ajax({
				type : "POST",
				url : url,
				data : msg,
				success : function(res) {
					var xmldoc = xmlrpc.createXml(res);
					try {
						var ret = xmlrpc.parseResponse(xmldoc);
					} catch (err) {
						port.postMessage(err);
						return;
					}
					token = ret.token;
					port.postMessage(true);
					getTab(wizSaveToWiz);
				},
				error : function(res) {
					port.postMessage(false);
				}
			});
		});
	} else if (port.name && port.name == "checkLogin") {
		port.onMessage.addListener(function(msg) {
			if (token != null) {
				getTab(wizSaveToWiz);
				port.postMessage(true);
			} else {
				port.postMessage(false);
			}
		});
	} else if (port.name && port.name == "onkeydown") {
		port.onMessage.addListener(function(msg) {
			if (!token || token == null) {
				return;
			} else {
				getTab(bindKeyDownHandler, msg);
			}
		});
	} else if (port.name === "popupClosed") {
		port.onDisconnect.addListener(function() {
			getTab(hideContentVeil);
		});
	}

	// This will get called by the content script we execute in
	// the tab as a result of the user pressing the browser action.
	port.onMessage.addListener(function(info) {
		if (info == null || info.title == null || info.params == null || info.title.toString() == "" || info.params.toString() == "") {
			return;
		}
		wizExecuteSave(info);
	});
});

function getTab(callback, direction) {
	chrome.windows.getCurrent(function(win) {
		chrome.tabs.getSelected(win.id, function(tab) {
			callback(tab, direction);
		});
	});
}

function hideContentVeil(tab) {
	chrome.tabs.sendRequest(tab.id, {
		name : "preview",
		op : "clear"
	});
}

function bindKeyDownHandler(tab, direction) {
	chrome.tabs.sendRequest(tab.id, {
		name : "preview",
		op : "keydown",
		opCmd : direction
	});
}

function wizExecuteSave(info) {
	var regexp = /%20/g;
	var title = info.title;
	var body = info.params;
	var requestData = "title=" + encodeURIComponent(title).replace(regexp, "+") + "&token_guid=" + encodeURIComponent(token).replace(regexp, "+") + "&body=" + encodeURIComponent(body).replace(regexp, "+");
	$.ajax({
		type : "POST",
		// url : "http://127.0.0.1:8800/wizkm/a/web/post?",
		url : "http://service.wiz.cn/wizkm/a/web/post?",
		data : requestData,

		success : function(res) {
			var json = eval('(' + res + ')');
			if (json.return_code != 200) {
				alert(json.return_message);
				return;
			}
		},
		error : function(res) {
		}
	});
}

function wizSaveToWiz(tab) {
	chrome.tabs.sendRequest(tab.id, {
		name : "preview",
		op : "article"
	});
	//chrome.tabs.executeScript(null, { file: "content_script.js" });
}

function wizOnSaveToWizContextMenuClick(info, tab) {
	if (token == null) {
		alert("在你剪辑该页面之前，请先点击\"保存到wiz\"工具栏按钮登陆");
	} else {
		wizSaveToWiz(tab);
	}
}

var menuTitle = chrome.i18n.getMessage("actionName");
var contexts = ["page", "selection", "link", "editable", "image", "video", "audio"];
chrome.contextMenus.create({
	"title" : menuTitle,
	"contexts" : contexts,
	"onclick" : wizOnSaveToWizContextMenuClick
});
