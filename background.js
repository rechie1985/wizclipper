$.ajaxSetup({
	dataType : 'text',
	cache : false,
});
var token = null;
chrome.extension.onConnect.addListener(function(port) {
	if ("login" == port.name) {
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
					var time = 10 * 1000;
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
			if (token != null) {
				getTab(wizSaveToWiz);
				port.postMessage(true);
			} else {
				port.postMessage(false);
			}
		});
	} else if ("onkeydown" == port.name) {
		port.onMessage.addListener(function(msg) {
			if (!token || token == null) {
				return;
			} else {
				var direction = msg.direction;
				// if ("enter" == direction && "article" != type) {
				// getTab(submitNoteByType, msg);
				// }
				getTab(bindKeyDownHandler, direction);
			}
		});
	} else if ("popupClosed" == port.name) {
		port.onDisconnect.addListener(function() {
			getTab(hideContentVeil);
		});
	} else if ("preview" == port.name) {
		port.onMessage.addListener(function(msg) {
			if (!msg) {
				//TODO
				return;
			}
			getTab(wizSaveToWiz, msg);
		});
	} else if ("requestCategory" == port.name) {
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
				port.postMessage(ret);
			},
			error : function(res) {
				port.postMessage(false);
			}
		});
	} else if ("requestTag" == port.name) {
		// var url = "http://127.0.0.1:8800/wizkm/xmlrpc";
		var url = "http://service.wiz.cn/wizkm/xmlrpc";
		var params = new Object();
		params.client_type = "web3";
		params.api_version = 3;
		params.token = token;
		params.version = 0;
		params.count = 2000;
		var sending = xmlrpc.writeCall("tag.getList", [params]);
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
				port.postMessage(ret);
			},
			error : function(res) {
				port.postMessage(false);
			}
		});
	} else if ("save" == port.name) {
		port.onMessage.addListener(function(info) {
			if (info == null || info.title == null || info.params == null || info.title.toString() == "" || info.params.toString() == "") {
				return;
			}
			wizExecuteSave(info);
		});
	}
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
			var json = JSON.parse(res);
			if (json.return_code != 200) {
				alert(json.return_message);
				return;
			}
		},
		error : function(res) {
		}
	});
}

function wizSaveToWiz(tab, op) {
	if (!op) {
		//默认为整夜
		op = "fullPage";
	}
	chrome.tabs.sendRequest(tab.id, {
		name : "preview",
		op : op
	});
}

function wizOnSaveToWizContextMenuClick(info, tab) {
	if (token == null) {
		alert("在你剪辑该页面之前，请先点击\"保存到wiz\"工具栏按钮登陆");
	} else {
		wizSaveToWiz(tab);
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
			var xmldoc = xmlrpc.createXml(res);
			try {
				var ret = xmlrpc.parseResponse(xmldoc);
			} catch (err) {
				return;
			}
		},
		error : function(res) {
		}
	});
}

var menuTitle = chrome.i18n.getMessage("actionName");
var contexts = ["page", "selection", "link", "editable", "image", "video", "audio"];
chrome.contextMenus.create({
	"title" : menuTitle,
	"contexts" : contexts,
	"onclick" : wizOnSaveToWizContextMenuClick
});
