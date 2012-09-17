var url = 'http://service.wiz.cn/wizkm/xmlrpc';
var token = null;
var tab = null;

function onConnectListener(port) {
	var name = port.name;
	if (!name) {
		return;
	}
	switch (name) {
	case 'login':
		port.onMessage.addListener(portLogin);
		break;
	case 'retryClip':
		retryClip(port);
		break;
	case 'requestCategory':
		portRequestCategoryAjax(port);
		break;
	case 'saveDocument':
		port.onMessage.addListener(function(info) {
			if (info == null || info.title == null || info.params == null || info.title.toString() === '' || info.params.toString() === '') {
				return;
			}
			if (info.isNative === true) {
				saveToNative(info);
			} else {
				wizPostDocument(info);
			}
		});
		break;
	case 'saveNative': 
		port.onMessage.addListener(function(info) {
			if (info && info.params && info.params.length > 0) {
				saveToNative(info);
			} else {
				console.log('saveNative Error');
			}
		});
	case 'checkLogin':
		port.onMessage.addListener(function(msg) {
			if (token != null) {
				getTab(wizRequestPreview);
				port.postMessage(true);
			} else {
				port.postMessage(false);
			}
		});
		break;
	case 'initRequest':
		//页面初始化请求，需要返回是否已登录、是否可获取文章、是否可获取选择信息
		//TODO 返回是否可获取文章、是否可获取选择信息
		if (token) {
			getTab(wizRequestPreview);
			port.postMessage(token);
		} else {
			port.postMessage(false);
		}
		break;
	case 'onkeydown':
		port.onMessage.addListener(function (msg) {
			if (!token) {
				return;
			} else {
				var direction = msg.direction;
				getTab(bindKeyDownHandler, direction);
			}
		});
		break;
	case 'popupClosed':
		port.onDisconnect.addListener(function() {
			getTab(hideContentVeil);
		});
		break;
	case 'preview':
		port.onMessage.addListener(function(msg) {
			if (!msg) {
				return;
			}
			getTab(wizRequestPreview, msg);
		});
		break;
	case 'requestToken':
		if (token) {
			port.postMessage(token);
		}
		break;
	case 'logout':
		token = null;
		break;
	}
}

function portLogin(loginParam, port) {
	portLoginAjax(loginParam, port);

}


function retryClip(port) {
	//不自动增加cookie时间
	Cookie.getCookies(url, 'wiz-clip-auth', loginByCookies, false);
	port.onMessage.addListener(function(msg) {
		if (msg && msg.title && msg.params) {
			wizPostDocument(msg);
		}
	});
}

function loginByCookies(cookie) {
	var info = cookie.value;
	var split_count = info.indexOf('*md5');
	var loginParam = {};
	loginParam.client_type = 'web3';
	loginParam.api_version = 3;
	loginParam.user_id = info.substring(0, split_count);
	loginParam.password = info.substring(split_count + 1);
	portLogin(loginParam);
}

function portLoginAjax(loginParam, port) {
	var loginError = function(err) {
		port.postMessage(err.message);
	}
	var loginSuccess = function(responseJSON) {
		token = responseJSON.token;
		if (port) {
			port.postMessage(true);
			getTab(wizRequestPreview);
			var time = 4 * 60 * 1000;
			setInterval(refreshToken, time);
		}
	}
	console.log('login');
	xmlrpc(url, 'accounts.clientLogin', [loginParam], loginSuccess, loginError);
}

function portRequestCategoryAjax(port) {
	var params = {
		client_type : 'web3',
		api_version : 3,
		token : token
	};
	var callbackSuccess = function(responseJSON) {
		if (port) {
			port.postMessage(responseJSON);
		}
	}
	var callbackError = function(response) {
		if (port) {
			port.postMessage(false);
		}
	}
	xmlrpc(url, 'category.getAll', [params], callbackSuccess, callbackError);
}

/**
 *获取当前页面的tab信息 
 */
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
		name : 'preview',
		op : 'clear'
	});
}

function bindKeyDownHandler(tab, direction) {
	chrome.tabs.sendRequest(tab.id, {
		name : 'preview',
		op : 'keydown',
		opCmd : direction
	});
}

function wizPostDocument(docInfo) {

	//整理数据
	var regexp = /%20/g, 
		  title = docInfo.title, 
		  category = docInfo.category, 
		  comment = docInfo.comment, 
		  body = docInfo.params;
		  
	if (comment && comment.trim() != '') {
		body = comment + '<hr>' + body;
	}
	
	if (!category) {
		category = '/My Notes/';
	}
	
	var requestData = 'title=' + encodeURIComponent(title).replace(regexp,  '+') + '&token_guid=' + encodeURIComponent(token).replace(regexp,  '+') 
						+ '&body=' + encodeURIComponent(body).replace(regexp,  '+') + '&category=' + encodeURIComponent(category).replace(regexp,  '+');

	//发送给当前tab消息，显示剪辑结果					
	chrome.tabs.sendMessage(tab.id, {name: 'sync', info: docInfo});
	
	var callbackSuccess = function(response) {
		var json = JSON.parse(response);
		if (json.return_code != 200) {
			console.error('sendError : ' + json.return_message);
			docInfo.errorMsg = json.return_message;
			
			chrome.tabs.sendMessage(tab.id, {name: 'error' , info: docInfo});
			return;
		}
		console.log('success : saveDocument');
		
		chrome.tabs.sendMessage(tab.id, {name: 'saved' , info: docInfo});
	}
	
	var callbackError = function(response) {
			var errorJSON = JSON.parse(response);
			docInfo.errorMsg = json.return_message;

			chrome.tabs.sendMessage(tab.id, {name: 'error' , info: docInfo});

			console.error('callback error : ' + json.return_message);
	}
	console.log('post document info');
	$.ajax({
		type : 'POST',
		url : 'http://service.wiz.cn/wizkm/a/web/post?',
		data : requestData,
		success : callbackSuccess,
		error : callbackError
	});
}

function wizRequestPreview(tab, op) {
	if (!op) {
		//默认为文章
		op = 'article';
	}
	chrome.tabs.sendRequest(tab.id, {
		name : 'preview',
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
			'name' : 'PageClipFailure'
		});
	}
}

function sendTabRequestCallbackByContextMenu(option) {
	if (!option) {
		var pageClipFailure = chrome.i18n.getMessage('pageClipFailure');
		alert(pageClipFailure);
	}
}

var authenticationErrorMsg = chrome.i18n.getMessage('AuthenticationFailure');
function isLogin() {
	if (token == null) {
		alert(authenticationErrorMsg);
		return false;
	} else {
		return true;
	}
}

/**
 * 获取本地客户端信息
 * @return {[本地客户端]} []
 */
function getNativeClient () {
	var nativeClient = document.getElementById('wiz-local-app'),
		version = nativeClient.Version;
	if (typeof version === 'undefined') {
		return null;
	}
	return nativeClient;
}

function saveToNative(info) {
	var wizClient = this.getNativeClient(),
		params = info.params;
	try {
		alert(params);
		wizClient.Execute(params);
	} catch (err) {
		console.warn('background saveToNative Error : ' + err);
	}
	console.log('Saved To Native Client');
}



/**
 *延长token时间
 */
function refreshToken() {
	var url = 'http://service.wiz.cn/wizkm/xmlrpc';
	var params = {
		client_type : 'web3',
		api_version : 3,
		token : token
	};
	//暂时不对成功、失败做处理
	var callbackSuccess = function(responseJSON) {}
	var callbackError = function(response) {}
	console.log('refresh token start')
	xmlrpc(url, 'accounts.keepAlive', [params], callbackSuccess, callbackError)
}

function wizSaveNativeContextMenuClick(info, tab) {
	var wizClient = this.getNativeClient();
	// console.log(info);
	// console.log(tab);
	saveToNative(tab.title);
}

function wizSavePageContextMenuClick(info, tab) {
	if (isLogin()) {
		info.title = tab.title;
		chrome.tabs.sendRequest(tab.id, {
			name : 'preview',
			op : 'submit',
			info : info,
			type : 'fullPage'
		}, sendTabRequestCallbackByContextMenu);
	}
}

function wizSaveSelectionContextMenuClick(info, tab) {
	if (isLogin()) {
		info.params = info.selectionText;
		info.title = tab.title;
		chrome.tabs.sendRequest(tab.id, {
			name : 'preview',
			op : 'submit',
			info : info,
			type : 'selection'
		}, sendTabRequestCallbackByContextMenu);
	}
}

function wizSaveUrlContextMenuClick(info, tab) {
	if (isLogin()) {
		info.params = tab.url;
		info.title = tab.title
		chrome.tabs.sendRequest(tab.id, {
			name : 'preview',
			op : 'submit',
			info : info,
			type : 'url'
		}, sendTabRequestCallbackByContextMenu);
	}
}

function initContextMenus() {
	var clipPageContext = chrome.i18n.getMessage('contextMenus_clipPage'),
		clipSelectionContext = chrome.i18n.getMessage('contextMenus_clipSelection'),
		clipUrlContext = chrome.i18n.getMessage('contextMenus_clipUrl'),
		allowableUrls = ['http://*/*', 'https://*/*'],
		hasNative = this.getNativeClient();
	chrome.contextMenus.create({
		'title' : clipPageContext,
		'contexts' : ['page', 'image'],
		'documentUrlPatterns' : allowableUrls,
		'onclick' : wizSavePageContextMenuClick
	});
	chrome.contextMenus.create({
		'title' : clipSelectionContext,
		'contexts' : ['selection'],
		'documentUrlPatterns' : allowableUrls,
		'onclick' : wizSaveSelectionContextMenuClick
	});
	chrome.contextMenus.create({
		'title' : clipUrlContext,
		'contexts' : ['all'],
		'documentUrlPatterns' : allowableUrls,
		'onclick' : wizSaveUrlContextMenuClick
	});
	// if (hasNative !== null) {
	// 	chrome.contextMenus.create({
	// 		'title': '保存到本地',
	// 		'onclick': wizSaveNativeContextMenuClick
	// 	});
	// }
}
chrome.extension.onConnect.addListener(onConnectListener);
initContextMenus();
