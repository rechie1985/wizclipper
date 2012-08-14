function WIZPlugin() {
	/**
	 *自动登陆，使用cookies
	 */
	function autoLogin() {
		chrome.cookies.get({
			url : "http://service.wiz.cn/web",
			name : "note_auth"
		}, function(cookie) {
			if (cookie) {
				var info = cookie.value;
				var split_count = info.indexOf("*md5");
				var loginParam = new Object();
				loginParam.client_type = "web3";
				loginParam.api_version = 3;
				loginParam.user_id = info.substring(0, split_count);
				loginParam.password = info.substring(split_count + 1);
				login(loginParam);
			}
		});
	}

	function login(loginParam) {
		var url = "http://service.wiz.cn/wizkm/xmlrpc";
		var sending = xmlrpc.writeCall("accounts.clientLogin", [loginParam]);
		var port = chrome.extension.connect({
			name : "login"
		});
		port.postMessage(sending);
		port.onMessage.addListener(function(msg) {
			if (msg == true) {
				if (keep_passoword.checked) {
					var key = "wiz-clip-auth";
					var value = user_id.value + "*md5." + hex_md5(password.value);
					var expires = 14 * 24 * 60 * 60;
					//cookie保存时间  (秒)
					var url = "http://service.wiz.cn/web";
					setCookies(url, key, value, expires);
				}
				$("#wiz_login").css("display", "none");
				$("#wiz_clip_detail").css("display", "block");
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
		});
	}

	function doLogin() {
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
	 * @param {Object} key
	 * @param {Object} value
	 */
	function setCookies(url, key, value, expires) {
		chrome.cookies.set({
			url : url,
			name : key,
			value : value,
			expirationDate : expires
		});
	}

	function getCookies(url, key) {
		chrome.cookies.get(key, function(param) {
			alert(param);
			console.log(param);
		});
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
		if(13 == keycode) {
			window.close();
		}
	}

}

window.onload = function() {
	var plugin = new WIZPlugin();
	var port = chrome.extension.connect({
		name : "checkLogin"
	});
	port.postMessage("");
	port.onMessage.addListener(function(msg) {
		if (msg == true) {
			// window.close();
			$("#wiz_login").css("display", "none");
			$("#wiz_clip_detail").css("display", "block");
		} else {
			$("#wiz_login").css("display", "block");
			$("#wiz_clip_detail").css("display", "none");
		}
		$("#waiting").hide();
	});
	
  // We need this so the extension knows when this window's been dismissed (by virtue of this conenction dying).
  chrome.extension.connect({name: "popupClosed"});
}
