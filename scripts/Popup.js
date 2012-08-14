var mainUrl = "http://service.wiz.cn/web";
function WIZPlugin() {
	var isAutoLogin = false;
	/**
	 *自动登陆，使用cookies
	 */
	function autoLogin(cookie) {
		isAutoLogin = true;
		// chrome.cookies.get({
		// url : mainUrl,
		// name : "wiz-clip-auth"
		// }, function(cookie) {
		// if (cookie) {
		var info = cookie.value;
		var split_count = info.indexOf("*md5");
		var loginParam = new Object();
		loginParam.client_type = "web3";
		loginParam.api_version = 3;
		loginParam.user_id = info.substring(0, split_count);
		loginParam.password = info.substring(split_count + 1);
		login(loginParam);
		// }
		// });
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
				$("#wiz_login").css("display", "none");
				$("#wiz_clip_detail").css("display", "block");
				if (!isAutoLogin) {
					setCookies(url, name, value, expiredays);
				}
			}
			//返回错误
			else {
				if (msg == false) {
					$("#wiz_login").css("display", "block");
					$("#wiz_clip_detail").css("display", "none");
					document.getElementById("div_error_validator").innerText = "network is wrong"
				} else {
					$("#wiz_login").css("display", "block");
					$("#wiz_clip_detail").css("display", "none");
					document.getElementById("div_error_validator").innerText = msg;
				}
			}
			$("#waiting").hide();
		});
	}

	function doLogin() {
		$("#waiting").fadeIn();
		$("#wiz_login").css("display", "none");
		$("#wiz_clip_detail").css("display", "none");
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
	$("#wiz_note_submit").live("keypress", noteSubmit);

	function messageHandler(request, sender, sendResponse) {
		if (request.cmd && request.cmd == "check") {
		}
	}


	chrome.extension.onRequest.addListener(messageHandler);
	$("body").bind("keydown", keyDownHandler);
	function keyDownHandler(e) {
		var port = chrome.extension.connect({
			name : "onkeydown"
		});
		var keycode = e.keyCode;
		port.postMessage(keycode);
		if (13 == keycode) {
			window.close();
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
	// var cookies = plugin.getCookies(url, "wiz-clip-auth");
	// if (cookies) {
	// $("#wiz_login").css("display", "none");
	// $("#wiz_clip_detail").css("display", "block");
	// } else {
	// $("#wiz_login").css("display", "block");
	// $("#wiz_clip_detail").css("display", "none");
	// }
	// $("#waiting").hide();
	// We need this so the extension knows when this window's been dismissed (by virtue of this conenction dying).
	chrome.extension.connect({
		name : "popupClosed"
	});

	function showByCookies(cookies) {
		if (cookies) {
			$("#wiz_login").css("display", "none");
			$("#wiz_clip_detail").css("display", "block");
			plugin.autoLogin(cookies);
		} else {
			$("#wiz_login").css("display", "block");
			$("#wiz_clip_detail").css("display", "none");
		}
		$("#waiting").hide();
	}

	function initPopupPage() {
		$("#waiting-label").html(chrome.i18n.getMessage("popup_wating"));

		//login page
		$("#user_id_tip").html(chrome.i18n.getMessage("user_id_tip"));
		$("#user_id_help").html(chrome.i18n.getMessage("user_id_help"));
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
