$.ajaxSetup({
	dataType : 'text',
	cache : false,
});
var token = null;

var tab = null;
chrome.extension.onConnect.addListener(function(port) {
	var name = port.name;
	if (!name) {
		return;
	}
	switch(name) {
		case "login" :
			port.onMessage.addListener(function(msg) {
				portLogin(msg, port);
			});
			break;
		case "requestCategory" :
			portRequestCategory(port);
			break;
		case "saveDocument" :
			port.onMessage.addListener(function(info) {
				if (info == null || info.title == null || info.params == null || info.title.toString() == "" || info.params.toString() == "") {
					return;
				}
				wizExecuteSave(info);
			});
			break;
		case "checkLogin" :
			port.onMessage.addListener(function(msg) {
				if (token != null) {
					getTab(wizSaveToWiz);
					port.postMessage(true);
				} else {
					port.postMessage(false);
				}
			});
			break;
		case "initRequest" :
			//页面初始化请求，需要返回是否已登录、是否可获取文章、是否可获取选择信息
			//TODO 返回是否可获取文章、是否可获取选择信息
			if (token) {
				getTab(wizSaveToWiz);
				port.postMessage(token);
			} else {
				port.postMessage(false);
			}
			break;
		case "onkeydown" :
			port.onMessage.addListener(function(msg) {
				if (!token || token == null) {
					return;
				} else {
					var direction = msg.direction;
					getTab(bindKeyDownHandler, direction);
				}
			});
			break;
		case "popupClosed" :
			port.onDisconnect.addListener(function() {
				getTab(hideContentVeil);
			});
			break;
		case "preview" :
			port.onMessage.addListener(function(msg) {
				if (!msg) {
					return;
				}
				getTab(wizSaveToWiz, msg);
			});
			break;
		case "requestToken" :
			if (token) {
				port.postMessage(token);
			}
			break;
		case "logout" :
			token = null;
	}

});

function portLogin(msg, port) {
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
				if (port) {
					port.postMessage(err);
				}
				return;
			}
			token = ret.token;
			var time = 4 * 60 * 1000;
			setInterval(refreshToken, time);
			if (port) {
				port.postMessage(true);
				getTab(wizSaveToWiz);
			}
		},
		error : function(res) {
			if (port) {
				port.postMessage(false);
			}
		}
	});
}

function portRequestCategory(port) {
	var url = "http://service.wiz.cn/wizkm/xmlrpc";
	var params = {};
	params.client_type = "web3";
	params.api_version = 3;
	params.token = token;
	var sending = xmlrpc.writeCall("category.getAll", [params]);
	$.ajax({
		type : "POST",
		url : url,
		data : sending,
		success : function(res) {
			var xmldoc = xmlrpc.createXml(res);
			try {
				var ret = xmlrpc.parseResponse(xmldoc);
			} catch (err) {
				if (port) {
					port.postMessage(err);
				}
				return;
			}
			if (port) {
				port.postMessage(ret);
			}
		},
		error : function(res) {
			if (port) {
				port.postMessage(false);
			}
		}
	});
}

function getTab(callback, direction) {
	chrome.windows.getCurrent(function(win) {
		chrome.tabs.getSelected(win.id, function(tab) {
			window.tab = tab;
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
	var category = info.category;
	var comment = info.comment;
	var body = info.params;
	if (comment && comment.trim() != "") {
		body = comment + "<hr>" + body;
	}

	var requestData = "title=" + encodeURIComponent(title).replace(regexp, "+") + "&token_guid=" + encodeURIComponent(token).replace(regexp, "+") + "&body=" + encodeURIComponent(body).replace(regexp, "+");
	if (!category) {
		category = "/My Notes/";
	}
	requestData = requestData + "&category=" + encodeURIComponent(category).replace(regexp, "+")
	chrome.tabs.sendMessage(tab.id, {
		name : "sync",
		info : info
	});
	$.ajax({
		type : "POST",
		url : "http://service.wiz.cn/wizkm/a/web/post?",
		data : requestData,

		success : function(res) {
			var json = JSON.parse(res);
			if (json.return_code != 200) {
				chrome.tabs.sendMessage(tab.id, {
					name : "error",
					info : info
				});
				console.error("error :" + json.return_message);
				return;
			}
			console.log("success : saveDocument");
			chrome.tabs.sendMessage(tab.id, {
				name : "saved",
				info : info
			});
		},
		error : function(res) {
			var errorJSON = JSON.parse(res);
			console.error("error :" + errorJSON.return_message);
			chrome.tabs.sendMessage(tab.id, {
				name : "error",
				info : info
			});
		}
	});
}

function wizSaveToWiz(tab, op) {
	if (!op) {
		//默认为文章
		op = "article";
	}
	chrome.tabs.sendRequest(tab.id, {
		name : "preview",
		op : op
	}, sendTabRequestCallbackByBrowserAction);
}

/**
 *请求剪辑页面回调函数
 */
function sendTabRequestCallbackByBrowserAction(option) {
	if (!option) {
		//当前页面无法剪辑
		chrome.extension.connect({
			"name" : "PageClipFailure"
		});
	}
}

function sendTabRequestCallbackByContextMenu(option) {
	if (!option) {
		var pageClipFailure = chrome.i18n.getMessage("pageClipFailure");
		alert(pageClipFailure);
	}
}

var authenticationErrorMsg = chrome.i18n.getMessage('AuthenticationFailure');
function wizOnSaveToWizContextMenuClick(info, tab) {
	if (isLogin()) {
		wizSaveToWiz(tab);
	}
}

function isLogin() {
	if (token == null) {
		alert(authenticationErrorMsg);
		return false;
	} else {
		return true;
	}
}

/**
 *延长token时间
 */
function refreshToken() {
	var url = "http://service.wiz.cn/wizkm/xmlrpc";
	var params = new Object();
	params.client_type = "web3";
	params.api_version = 3;
	params.token = token;
	var sending = xmlrpc.writeCall("accounts.keepAlive", [params]);
	$.ajax({
		type : "POST",
		url : url,
		data : sending,
		success : function(res) {
			//自动保持，成功或者失败不需要进行处理
		},
		error : function(res) {
		}
	});
}

function wizSavePageContextMenuClick(info, tab) {
	if (isLogin()) {
		info.title = tab.title;
		chrome.tabs.sendRequest(tab.id, {
			name : "preview",
			op : "submit",
			info : info,
			type : "fullPage"
		}, sendTabRequestCallbackByContextMenu);
	}
}

function wizSaveSelectionContextMenuClick(info, tab) {
	if (isLogin()) {
		info.params = info.selectionText;
		info.title = tab.title;
		chrome.tabs.sendRequest(tab.id, {
			name : "preview",
			op : "submit",
			info : info,
			type : "selection"
		}, sendTabRequestCallbackByContextMenu);
	}
}

function wizSaveUrlContextMenuClick(info, tab) {
	if (isLogin()) {
		info.params = tab.url;
		info.title = tab.title
		chrome.tabs.sendRequest(tab.id, {
			name : "preview",
			op : "submit",
			info : info,
			type : "url"
		}, sendTabRequestCallbackByContextMenu);
	}
}

function initContextMenus() {
	var clipPageContext = chrome.i18n.getMessage("contextMenus_clipPage");
	var clipSelectionContext = chrome.i18n.getMessage("contextMenus_clipSelection");
	var clipUrlContext = chrome.i18n.getMessage("contextMenus_clipUrl");
	var allowableUrls = ["http://*/*", "https://*/*"];
	chrome.contextMenus.create({
		"title" : clipPageContext,
		"contexts" : ["page", "image"],
		"documentUrlPatterns" : allowableUrls,
		"onclick" : wizSavePageContextMenuClick
	});
	chrome.contextMenus.create({
		"title" : clipSelectionContext,
		"contexts" : ["selection"],
		"documentUrlPatterns" : allowableUrls,
		"onclick" : wizSaveSelectionContextMenuClick
	});
	chrome.contextMenus.create({
		"title" : clipUrlContext,
		"contexts" : ['all'],
		"documentUrlPatterns" : allowableUrls,
		"onclick" : wizSaveUrlContextMenuClick
	});
}

initContextMenus();
