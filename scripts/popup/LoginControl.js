/**
 * @author rechie
 */
var mainUrl = "http://service.wiz.cn/web";

function LoginControl() {
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
	$("#login_button").bind("click", doLogin);

	chrome.extension.onConnect.addListener(messageListener);
	function messageListener(port) {
		var name = port.name;
		if (name && name == "contentVeilShow") {
			$("#waiting").hide();
			$("#wiz_clip_detail").show(requestTitle);
		}
	}

	function requestTitle() {
		chrome.windows.getCurrent(function(win) {
			chrome.tabs.getSelected(win.id, function(tab) {
				var title = tab.title;
				if(!title) {
					return;
				}
				setTitle(title);
			});
		});
		// var port = chrome.extension.connect({
		// name : "requestTitle"
		// });
		// port.onMessage.addListener(function(msg) {
		// setTitle(msg);
		// });
	}

	function setTitle(title) {
		$("#wiz_note_title").val(title);
	}


	this.getCookies = getCookies;
	this.autoLogin = autoLogin;

}