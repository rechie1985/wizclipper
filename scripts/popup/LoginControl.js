/**
 * @author rechie
 */
var mainUrl = "http://service.wiz.cn/web";
var ztreeControl = new ZtreeController();
function LoginControl() {

	//add click listener to login button
	$("#login_button").bind("click", doLogin);
	/**
	 *自动登陆，使用cookies
	 */
	function autoLogin(cookie) {
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
				//每次自动登录都把cookie时间延长
				setCookies(url, name, value, expiredays);
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


	chrome.extension.onConnect.addListener(messageListener);
	function messageListener(port) {
		var name = port.name;
		if (name && name == "contentVeilShow") {
			$("#waiting").hide();
			$("#wiz_clip_detail").show(showClipHandler);
		}
	}

	function showClipHandler(evt) {
		requestTitle();
		var categoryStr = localStorage["category"];
		//如果本地未保存文件夹信息，需要发送请求加载
		if (categoryStr) {
			parseWizCategory(categoryStr);
		} else {
			requestCategory();
		}
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
		$("#category_tree_button").click(showCategoryTree);
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
			$("#ztree_container").hide();
		} else {
			$("#ztree_container").show();
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


	this.getCookies = getCookies;
	this.autoLogin = autoLogin;
}
