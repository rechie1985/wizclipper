var mainUrl = "http://service.wiz.cn/web";
function WIZPlugin() {
	var isAutoLogin = false;
	/**
	 *自动登陆，使用cookies
	 */
	function autoLogin(cookie) {
		isAutoLogin = true;
		$("#waiting").fadeIn();

		var info = cookie.value;
		var split_count = info.indexOf("*md5");
		var loginParam = new Object();
		loginParam.client_type = "web3";
		loginParam.api_version = 3;
		loginParam.user_id = info.substring(0, split_count);
		loginParam.password = info.substring(split_count + 1);
		login(loginParam);
	}

	function login(loginParam) {
		// var url = "http://127.0.0.1:8800/wizkm/xmlrpc";
		var url = "http://service.wiz.cn/wizkm/xmlrpc";
		var sending = xmlrpc.writeCall("accounts.clientLogin", [loginParam]);
		var port = chrome.extension.connect({
			name : "login"
		});
		port.postMessage(sending);
		port.onMessage.addListener(function(msg) {
			if (msg == true) {
				var name = "wiz-clip-auth";
				var value = user_id.value + "*md5." + hex_md5(password.value);
				//cookie保存时间  (秒)
				var url = mainUrl;
				var expiredays;
				if (keep_passoword.checked) {
					expiredays = 14 * 24 * 60 * 60;
				}
				//登陆成功后隐藏登陆页面，并显示等待页面
				// $("#wiz_login").hide();
				// $("#waiting").fadeIn();
				// $("#waiting-label").html(chrome.i18n.getMessage("popup_wating"));
				//css("display", "none");
				if (!isAutoLogin) {
					setCookies(url, name, value, expiredays);
				}
			}
			//返回错误
			else {
				$("#waiting").hide();
				if (msg == false) {
					$("#wiz_login").fadeIn();
					$("#wiz_clip_detail").hide();
					document.getElementById("div_error_validator").innerText = "network is wrong"
				} else {
					$("#wiz_login").fadeIn();
					$("#wiz_clip_detail").hide();
					document.getElementById("div_error_validator").innerText = msg;
				}
			}
		});
	}

	function doLogin() {
		$("#waiting").fadeIn();
		$("#waiting-label").html(chrome.i18n.getMessage("logining"));
		$("#wiz_login").hide();
		//css("display", "none");
		$("#wiz_clip_detail").hide();
		//css("display", "none");
		var loginParam = new Object();
		loginParam.client_type = "web3";
		loginParam.api_version = 3;
		loginParam.user_id = user_id.value;
		loginParam.password = "md5." + hex_md5(password.value);
		login(loginParam);
	}

	/**
	 * 保存文档处理
	 * @param {Event} e
	 */
	function noteSubmit(e) {
		var port = chrome.extension.connect({
			name : "onkeydown"
		});
		var opCmd = "enter";
		port.postMessage(opCmd);
	}

	/**
	 *设置cookies
	 * @param {Object} name
	 * @param {Object} value
	 */
	function setCookies(url, name, value, expireSecond) {
		var exdate = new Date();
		var param = {
			url : url,
			name : name,
			value : value
		}
		if (expireSecond) {
			var expire = new Date().getTime() / 1000 + expireSecond;
			param.expirationDate = expire;
		}
		chrome.cookies.set(param, function(cookie) {
		});
	}

	function getCookies(url, key, callback) {
		chrome.cookies.get({
			url : url,
			name : key
		}, callback);
	}

	//add click listener to login button
	$("#login").bind("click", doLogin);
	$("#note_submit").live("click", noteSubmit);

	$("body").bind("keydown", keyDownHandler);
	function keyDownHandler(e) {
		var port = chrome.extension.connect({
			name : "onkeydown"
		});

		var keycode = e.keyCode;
		var opCmd = getNudgeOp(keycode, e);
		console.log(opCmd);
		if (opCmd && opCmd !== null) {
			port.postMessage(opCmd);
		}
		if (13 == keycode) {
			window.close();
		}
	}

	function getNudgeOp(key, evt) {
		var returnValue = null;
		var KEY_ALT = 18, KEY_CTRL = 17;
		var keyMap = {
			13 : "enter",
			27 : "cancle",
			38 : "expand", // up
			40 : "shrink", // down
			37 : "left",
			39 : "right",

			56 : "topexpand", // alt + up
			58 : "topshrink", // alt + down

			57 : "bottomexpand", // ctrl + down
			55 : "bottomshrink", // ctrl + up
		}

		if (keyMap[key]) {
			if (evt && evt.altKey == true) {// 18
				returnValue = keyMap[key + KEY_ALT];
			} else if (evt && evt.ctrlKey == true) {// 17
				returnValue = keyMap[key + KEY_CTRL];
			} else {
				returnValue = keyMap[key];
			}
			return returnValue;
		}
	}


	chrome.extension.onConnect.addListener(messageListener);
	function messageListener(port) {
		var name = port.name;
		if (name && name == "contentVeilShow") {
			$("#waiting").hide();
			$("#wiz_clip_detail").fadeIn();
		}
	}


	this.getCookies = getCookies;
	this.autoLogin = autoLogin;
}

window.onload = function() {
	initPopupPage();
	var plugin = new WIZPlugin();
	var url = mainUrl;
	plugin.getCookies(url, "wiz-clip-auth", showByCookies);
	// We need this so the extension knows when this window's been dismissed (by virtue of this conenction dying).
	chrome.extension.connect({
		name : "popupClosed"
	});

	function showByCookies(cookies) {

		if (cookies) {
			plugin.autoLogin(cookies);
		} else {
			$("#waiting").hide();
			//cookie中未保存或已过期
			$("#wiz_login").show();
			$("#wiz_clip_detail").hide();
		}
	}

	function initPopupPage() {
		$("#waiting-label").html(chrome.i18n.getMessage("popup_wating"));

		//login page
		$("#user_id_tip").html(chrome.i18n.getMessage("user_id_tip"));
		$("#password_tip").html(chrome.i18n.getMessage("password_tip"));
		$("#keep_password_tip").html(chrome.i18n.getMessage("keep_password_tip"));
		$("#login").val(chrome.i18n.getMessage("login_msg"));

		//note info page
		$("#note_title_tip").html(chrome.i18n.getMessage("note_title_tip"));
		$("#category_tip").html(chrome.i18n.getMessage("category_tip"));
		$("#tag_tip").html(chrome.i18n.getMessage("tag_tip"));
		$("#tag_input").html(chrome.i18n.getMessage("tag_input"));
		$("#note_submit").val(chrome.i18n.getMessage("note_submit"));

	}

}
