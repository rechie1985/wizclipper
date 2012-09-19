var Wiz_Context = {
	xmlUrl : 'http://service.wiz.cn/wizkm/xmlrpc',
	cookieUrl : 'http://service.wiz.cn/web',
	cookieName : 'wiz-clip-auth',
	cookie_category: 'wiz-all-category',
	category_expireSec: 10 * 60,
	token : null,
	tab : null,
	user_id : null
}

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
		requestCategory(port);
		break;
	case 'saveDocument':
		port.onMessage.addListener(function(info) {
			if (!info) {
				return;
			}
			if (info.isNative === true) {
				saveToNative(info);
			} else {
				if (info.title == null || info.params == null || info.title.toString() === '' || info.params.toString() === '') {
					return;
				}
				wizPostDocument(info);
			}
		});
		break;
	case 'checkLogin':
		port.onMessage.addListener(function(msg) {
			if (Wiz_Context.token != null) {
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
		var hasNative = hasNativeClient(),
			info = {
				token : Wiz_Context.token,
				hasNative : hasNative
			};
		if (Wiz_Context.token) {
			getTab(wizRequestPreview);
			info.login = true;
			port.postMessage(info);
		} else {
			info.login = false;
			port.postMessage(info);
		}
		break;
	case 'onkeydown':
		port.onMessage.addListener(function (msg) {
			if (!Wiz_Context.token) {
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
		if (Wiz_Context.token) {
			port.postMessage(Wiz_Context.token);
		}
		break;
	case 'logout':
		Wiz_Context.token = null;
		break;
 	}
}

function portLogin(loginParam, port) {
	portLoginAjax(loginParam, port);

}


function retryClip(port) {
	//不自动增加cookie时间
	Cookie.getCookies(Wiz_Context.cookieUrl, Wiz_Context.cookieName, loginByCookies, false);
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
		Wiz_Context.token = responseJSON.token;
		if (port) {
			port.postMessage(true);
			getTab(wizRequestPreview);
			var time = 4 * 60 * 1000;
			setInterval(refreshToken, time);
		}
	}
	//缓存userid
	Wiz_Context.user_id = loginParam.user_id;
	console.log('login');
	xmlrpc(Wiz_Context.xmlUrl, 'accounts.clientLogin', [loginParam], loginSuccess, loginError);
}

function requestCategory(port) {
	var categoryStr = getNativeCagetory(Wiz_Context.user_id);
	//本地如果为获取到文件夹信息，则获取服务端的文件夹信息
	if (categoryStr && categoryStr.length > 0 && port) {
		port.postMessage(categoryStr);
	} else {
		Cookie.getCookies(Wiz_Context.cookieUrl, Wiz_Context.cookie_category, requestCategoryByCookie, false, {port: port});
	}
}

function requestCategoryByCookie(cookie, params) {
	var port = params.port;
	if (cookie && cookie.value) {
		port.postMessage(cookie.value);
	} else {
		portRequestCategoryAjax(port);
	}
}

function getNativeCagetory(userid) {
	var client = getNativeClient(),
		categoryStr = null;
	if (client) {
		try {
			categoryStr = client.GetAllFolders(userid);
		} catch (err) {
		}
	}
	return categoryStr;
}

function portRequestCategoryAjax(port) {
	var params = {
		client_type : 'web3',
		api_version : 3,
		token : Wiz_Context.token
	};
	var callbackSuccess = function(responseJSON) {
		var categoryStr = responseJSON.categories;
		Cookie.setCookies(Wiz_Context.cookieUrl, Wiz_Context.cookie_category, categoryStr, Wiz_Context.category_expire);
		if (port) {
			port.postMessage(categoryStr);
		}
	}
	var callbackError = function(response) {
		if (port) {
			port.postMessage(false);
		}
	}
	xmlrpc(Wiz_Context.xmlUrl, 'category.getAll', [params], callbackSuccess, callbackError);
}

/**
 *获取当前页面的tab信息 
 */
function getTab(callback, direction) {
	chrome.windows.getCurrent(function(win) {
		chrome.tabs.getSelected(win.id, function(tab) {
			Wiz_Context.tab = tab;
			callback(tab, direction);
		});
	});
}

function hideContentVeil(tab) {
	Wiz_Browser.sendRequest(tab.id, {
		name : 'preview',
		op : 'clear'
	});
}

function bindKeyDownHandler(tab, direction) {
	Wiz_Browser.sendRequest(tab.id, {
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
	
	var requestData = 'title=' + encodeURIComponent(title).replace(regexp,  '+') + '&token_guid=' + encodeURIComponent(Wiz_Context.token).replace(regexp,  '+') 
						+ '&body=' + encodeURIComponent(body).replace(regexp,  '+') + '&category=' + encodeURIComponent(category).replace(regexp,  '+');

	//发送给当前tab消息，显示剪辑结果					
	Wiz_Browser.sendRequest(Wiz_Context.tab.id, {name: 'sync', info: docInfo});
	
	var callbackSuccess = function(response) {
		var json = JSON.parse(response);
		if (json.return_code != 200) {
			console.error('sendError : ' + json.return_message);
			docInfo.errorMsg = json.return_message;
			
			Wiz_Browser.sendRequest(Wiz_Context.tab.id, {name: 'error' , info: docInfo});
			return;
		}
		console.log('success : saveDocument');
		
		Wiz_Browser.sendRequest(Wiz_Context.tab.id, {name: 'saved' , info: docInfo});
	}
	
	var callbackError = function(response) {
		var errorJSON = JSON.parse(response);
		docInfo.errorMsg = json.return_message;

		Wiz_Browser.sendRequest(Wiz_Context.tab.id, {name: 'error' , info: docInfo});

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
	Wiz_Browser.sendRequest(tab.id, {
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
	if (Wiz_Context.token === null) {
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
	try {
		var nativeClient = document.getElementById('wiz-local-app'),
			version = nativeClient.Version;
		if (typeof version === 'undefined') {
			return null;
		}
		return nativeClient;
	} catch(err) {
		console.log('background.getNativeClient() Error : ' + err);
		return null;
	}
}

function hasNativeClient() {
	var nativeClient = getNativeClient();
	return (nativeClient === null) ? false : true;
}

function saveToNative(info) {
	var wizClient = this.getNativeClient();
	try {
		wizClient.Execute(info.params);
	} catch (err) {
		console.warn('background saveToNative Error : ' + err);
	}
	console.log('Saved To Native Client');
}


/**
 *延长token时间
 */
function refreshToken() {
	var params = {
		client_type : 'web3',
		api_version : 3,
		token : Wiz_Context.token
	};
	var callbackSuccess = function(responseJSON) {
		//刷新时失败时，需要自动重新登陆
		wiz_background_autoLogin();
	}
	var callbackError = function(response) {}
	console.log('refresh token start')
	xmlrpc(Wiz_Context.xmlUrl, 'accounts.keepAlive', [params], callbackSuccess, callbackError);
}

function wizSaveNativeContextMenuClick(info, tab) {
	Wiz_Context.tab = tab;
	var wizClient = this.getNativeClient();
	Wiz_Browser.sendRequest(tab.id, {
		name: 'preview',
		op: 'submit',
		info : {},
		type: 'native'
	});
}

function wizSavePageContextMenuClick(info, tab) {
	Wiz_Context.tab = tab;
	if (isLogin()) {
		info.title = tab.title;
		Wiz_Browser.sendRequest(tab.id, {
			name : 'preview',
			op : 'submit',
			info : info,
			type : 'fullPage'
		}, sendTabRequestCallbackByContextMenu);
	}
}

function initContextMenus() {
	var clipPageContext = chrome.i18n.getMessage('contextMenus_clipPage'),
		allowableUrls = ['http://*/*', 'https://*/*'];
	var	hasNative = this.getNativeClient();
	
	if (hasNativeClient()) {
		chrome.contextMenus.create({
			'title': clipPageContext,
			'contexts' : ['all'],
			'documentUrlPatterns' : allowableUrls,
			'onclick': wizSaveNativeContextMenuClick
		});
	} else {
		chrome.contextMenus.create({
			'title' : clipPageContext,
			'contexts' : ['all'],
			'documentUrlPatterns' : allowableUrls,
			'onclick' : wizSavePageContextMenuClick
		});
	}
}

function wiz_background_autoLogin() {
	Cookie.getCookies(Wiz_Context.cookieUrl, Wiz_Context.cookieName, loginByCookies, true);
}

chrome.extension.onConnect.addListener(onConnectListener);
initContextMenus();
wiz_background_autoLogin();
