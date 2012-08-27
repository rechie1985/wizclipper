$.ajaxSetup({
	dataType : 'text',
	cache : false,
});
var token = null;

var tab = null;
chrome.extension.onConnect.addListener(function(port) {
	if ("login" == port.name) {
		port.onMessage.addListener(function(msg) {
			console.log(port.name + " : " + msg);
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
					var time = 4 * 60 * 1000;
					setInterval(refreshToken, time);
					port.postMessage(true);
					getTab(wizSaveToWiz);
				},
				error : function(res) {
					port.postMessage(false);
				}
			});
		});
	} else if ("checkLogin" == port.name) {
		port.onMessage.addListener(function(msg) {
			console.log(port.name + " : " + msg);
			if (token != null) {
				getTab(wizSaveToWiz);
				port.postMessage(true);
			} else {
				port.postMessage(false);
			}
		});
	} else if ("onkeydown" == port.name) {
		port.onMessage.addListener(function(msg) {
			console.log(port.name + " : " + msg);
			if (!token || token == null) {
				return;
			} else {
				var direction = msg.direction;
				getTab(bindKeyDownHandler, direction);
			}
		});
	} else if ("popupClosed" == port.name) {
		port.onDisconnect.addListener(function() {
			getTab(hideContentVeil);
		});
	} else if ("preview" == port.name) {
		port.onMessage.addListener(function(msg) {
			console.log(port.name + " : " + msg);
			if (!msg) {
				return;
			}
			getTab(wizSaveToWiz, msg);
		});
	} else if ("requestCategory" == port.name) {
		console.log("start : " + port.name);
		var url = "http://service.wiz.cn/wizkm/xmlrpc";
		var params = new Object();
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
					port.postMessage(err);
					return;
				}
				console.log("success : " + port.name);
				port.postMessage(ret);
			},
			error : function(res) {
				console.log("error : " + port.name);
				port.postMessage(false);
			}
		});
	} else if ("initRequest" == port.name) {
		//页面初始化请求，需要返回是否已登录、是否可获取文章、是否可获取选择信息
		//TODO 返回是否可获取文章、是否可获取选择信息
		if (token) {
			getTab(wizSaveToWiz);
			port.postMessage(token);
		} else {
			port.postMessage(false);
		}
	} else if ("logout" == port.name) {
		token = null;
	} else if ("requestToken" == port.name) {
		if (token) {
			port.postMessage(token);
		}
	} else if ("saveDocument" == port.name) {
		port.onMessage.addListener(function(info) {
			console.log("start : " + port.name);
			if (info == null || info.title == null || info.params == null || info.title.toString() == "" || info.params.toString() == "") {
				console.error(port.name + "error : " + info);
				return;
			}
			wizExecuteSave(info);
		});
	}

});

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
	});
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
			console.error("refreshToken error : " + res);
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
		});
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
		});
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
		});
	}
}

function initContextMenus() {
	var clipPageContext = chrome.i18n.getMessage("contextMenus_clipPage");
	var clipSelectionContext = chrome.i18n.getMessage("contextMenus_clipSelection");
	var clipUrlContext = chrome.i18n.getMessage("contextMenus_clipUrl");
	chrome.contextMenus.create({
		"title" : clipPageContext,
		"contexts" : ["page", "image"],
		"onclick" : wizSavePageContextMenuClick
	});
	chrome.contextMenus.create({
		"title" : clipSelectionContext,
		"contexts" : ["selection"],
		"onclick" : wizSaveSelectionContextMenuClick
	});
	chrome.contextMenus.create({
		"title" : clipUrlContext,
		"contexts" : ['all'],
		"onclick" : wizSaveUrlContextMenuClick
	});
}

initContextMenus();
