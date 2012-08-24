/**
 * @author rechie
 */
var ztreeControl = new ZtreeController();
function LoginControl() {

	var isAutoLogin = false;
	//add click listener to login button
	$("#login_button").bind("click", loginSubmit);

	$("#user_id").blur(checkEmail);
	$("#password").blur(checkPassword);

	/**
	 *自动登陆，使用cookies
	 */
	function autoLogin(cookie) {
		isAutoLogin = true;
		$("#waiting").show();

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
				var value = loginParam.user_id + "*" + loginParam.password;
				//cookie保存时间  (秒)
				var url = mainUrl;
				var expiredays;
				if (keep_passoword.checked) {
					expiredays = 14 * 24 * 60 * 60;
				}
				if (!isAutoLogin) {
					//自动登陆不需要再次设置token
					setCookies(url, name, value, expiredays);
				}
				$("#loginoff_div").hide();
				localStorage["wiz-clip-auth"] = loginParam.user_id;
			}
			//返回错误
			else {
				if (msg == false) {
					$("#wiz_login").show();
					$("#wiz_clip_detail").hide();
					$("#div_error_validator").html(chrome.i18n.getMessage("network_wrong"));
				} else {
					$("#wiz_login").show();
					$("#wiz_clip_detail").hide();
					$("#div_error_validator").html(msg);
				}
				$("#waiting").hide();
			}
		});
	}

	function doLogin() {
		$("#waiting").show();
		$("#waiting-label").html(chrome.i18n.getMessage("logining"));
		$("#wiz_login").hide();
		$("#wiz_clip_detail").hide();
		var loginParam = new Object();
		loginParam.client_type = "web3";
		loginParam.api_version = 3;
		loginParam.user_id = user_id.value;
		loginParam.password = "md5." + hex_md5(password.value);
		login(loginParam);
	}

	/**
	 * 点击登陆按钮触发事件
	 */
	function loginSubmit() {
		if (checkEmail() && checkPassword()) {
			doLogin();
		}
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
		}, function(cookies) {
			if (cookies && cookies.value) {
				//自动延长cookie时间
				expiredays = 14 * 24 * 60 * 60;
				setCookies(url, key, cookies.value, expiredays);
			}
			callback(cookies);
		});
	}

	function removeCookies(url, key, callback) {
		chrome.cookies.remove({
			url : url,
			name : key
		}, callback);
	}


	chrome.extension.onConnect.addListener(messageListener);
	function messageListener(port) {
		var name = port.name;
		if (name && name == "contentVeilShow") {
			$("#waiting").hide();
			$("#wiz_clip_detail").show(showClipHandler);
		}
	}

	/**
	 *初始化选择保存类型的方法，通过当前页面的返回情况
	 */
	function initClipSelect() {
		chrome.windows.getCurrent(function(win) {
			chrome.tabs.getSelected(win.id, function(tab) {
				chrome.tabs.sendMessage(tab.id, {
					name : 'getInfo'
				}, function(params) {
					var clipArticle = params.article;
					var clipSelection = params.selection;
					if (clipSelection == true) {
						$("#submit-type")[0].options[1].selected = true;
					} else if (clipArticle == true) {
						$("#submit-type")[0].options[0].selected = true;
					} else {
						$("#submit-type")[0].options[2].selected = true;
					}

					if (clipSelection == false) {
						$('#submit-type option[id="selection"]').attr("disabled", "");
					}
					if (clipArticle == false) {
						$('#submit-type option[id="article"]').attr("disabled", "");
					}
					var type = $("#submit-type").val();
					$("#note_submit").html(type);
				});
			});
		});
	}

	function showClipHandler(evt) {
		initLogoutLink();
		initClipSelect();
		requestToken();
		requestTitle();
		initDefaultCategory();
		var categoryStr = localStorage["category"];
		//如果本地未保存文件夹信息，需要发送请求加载
		if (categoryStr && !isAutoLogin) {
			parseWizCategory(categoryStr);
		} else {
			requestCategory();
		}
	}

	function initDefaultCategory() {
		var param = {
			url : "http://service.wiz.cn/web",
			name : "last-category"
		}
		chrome.cookies.get(param, function(cookies) {
			if (cookies) {
				var value = cookies.value, array = value.split("*"), displayName = array[0], location = array[1];
				$("#category_info").html(displayName).attr("location", location);

			}
		});
	}

	function initLogoutLink() {
		var logoutText = chrome.i18n.getMessage("logout");
		$("#header_user").show();
		$("#logout_control").html(logoutText).bind("click", logout);
	}

	function logout() {
		removeCookies(mainUrl, "wiz-clip-auth", function() {
			chrome.extension.connect({
				name : "logout"
			});
		});
		window.close();
	}

	/**
	 *加载标题
	 */
	function requestTitle() {
		chrome.windows.getCurrent(function(win) {
			chrome.tabs.getSelected(win.id, function(tab) {
				var title = tab.title;
				if (!title) {
					return;
				}
				setTitle(title);
			});
		});
	}

	function setTitle(title) {
		$("#wiz_note_title").val(title);
	}

	/**
	 *加载文件夹信息
	 */
	function requestCategory() {
		$('#wiz_note_category').attr("placeholder", "loading category...");
		var port = chrome.extension.connect({
			name : "requestCategory"
		});
		port.onMessage.addListener(function(msg) {
			$('#wiz_note_category').attr("placeholder", "input category");
			var value = $('#wiz_note_category').val();
			parseWizCategory(msg.categories);
		});
	}

	/**
	 *对目录信息进行处理
	 * @param {Object} categoryStr
	 */
	function parseWizCategory(categoryStr) {
		categoryString = categoryStr;
		initZtree();
		$("#category_info").click(showCategoryTree);
	}

	function initZtree() {
		var zData = ztreeControl.parseDate(categoryString);
		ztreeControl.setNodes(zData);
		ztreeControl.show();
		$("#category_tree_button").show();
	}

	/**
	 *显示树
	 */
	function showCategoryTree() {
		var visible = $("#ztree_container").is(":visible");
		if (visible) {
			$("#ztree_container").hide(500);
		} else {
			$("#ztree_container").show(500);
		}

		var treeObj = $.fn.zTree.getZTreeObj("ztree");
		return false;
	}

	/**
	 *加载文件夹信息
	 */
	function requestCategory() {
		$('#wiz_note_category').attr("placeholder", "loading category...");
		var port = chrome.extension.connect({
			name : "requestCategory"
		});
		port.onMessage.addListener(function(msg) {
			$('#wiz_note_category').attr("placeholder", "input category");
			var value = $('#wiz_note_category').val();
			parseWizCategory(msg.categories);
			localStorage["category"] = msg.categories;
		});
	}

	function checkEmail() {
		$("#userid_error_tip").hide();
		var email = $("#user_id").val();
		var valid = verifyEmail(email);
		if (!valid) {
			$("#userid_error_tip").html(chrome.i18n.getMessage("userid_error")).show(100);
		}
		return valid;

	}

	function verifyEmail(str_email) {
		var myreg = /^([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+\.[a-zA-Z]{2,3}$/;
		if (myreg.test(str_email)) {
			return true;
		}
		return false;
	}

	function checkPassword() {
		$("#password_error_tip").hide();
		var password = $("#password").val();
		if (password.trim().length < 1) {
			$("#password_error_tip").html(chrome.i18n.getMessage("password_error")).show(100);
			return false;
		}
		return true;

	}

	function initLogoffLink() {
		$("#create_aacount").html(chrome.i18n.getMessage("create_account_link")).bind("click", function(evt) {
			window.open("http://service.wiz.cn/wizkm/a/signup");
		});
	}

	function requestToken() {
		var port = chrome.extension.connect({
			name : "requestToken"
		});
		port.onMessage.addListener(function(token) {
			clipPageControl.initUserLink(token);
		});
	}


	this.requestToken = requestToken;
	this.initLogoffLink = initLogoffLink;
	this.getCookies = getCookies;
	this.autoLogin = autoLogin;
}