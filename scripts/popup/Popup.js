var mainUrl = "http://service.wiz.cn/web";
window.onload = function() {
	initPopupPage();

	var loginControl = new LoginControl();
	loginControl.getCookies(mainUrl, "wiz-clip-auth", showByCookies);

	//保证popup页面和preview页面同时关闭
	chrome.extension.connect({
		name : "popupClosed"
	});

	function showByCookies(cookies) {
		if (cookies) {
			var port = chrome.extension.connect({
				name : "initRequest"
			});
			port.onMessage.addListener(function(msg) {
				if (msg == false) {
					//第一次打开浏览器未登录
					loginControl.autoLogin(cookies);
				} else {
					//打开浏览器后已经登陆过
					$("#waiting").hide();
					//cookie中未保存或已过期
					$("#wiz_login").hide();
					$("#wiz_clip_detail").show();
				}
				var token = loginControl.requestToken();
			});

		} else {
			$("#waiting").hide();
			//cookie中未保存或已过期
			$("#wiz_login").show();
			$("#wiz_clip_detail").hide();
			loginControl.initLogoffLink();
		}
	}

	function initPopupPage() {
		$("#waiting-label").html(chrome.i18n.getMessage("popup_wating"));

		//login page
		$("#user_id_tip").html(chrome.i18n.getMessage("user_id_tip"));
		$("#password_tip").html(chrome.i18n.getMessage("password_tip"));
		$("#keep_password_tip").html(chrome.i18n.getMessage("keep_password_tip"));
		$("#login_button").html("&nbsp;" + chrome.i18n.getMessage("login_msg") + "&nbsp;");

		//note info page
		$("#note_title_tip").html(chrome.i18n.getMessage("note_title_tip"));
		$("#category_tip").html(chrome.i18n.getMessage("category_tip"));
		$("#tag_tip").html(chrome.i18n.getMessage("tag_tip"));
		$("#tag_input").html(chrome.i18n.getMessage("tag_input"));
		$("#article").html(chrome.i18n.getMessage("article_save"));
		$("#fullPage").html(chrome.i18n.getMessage("fullpage_save"));
		$("#selection").html(chrome.i18n.getMessage("select_save"));
		$("#url").html(chrome.i18n.getMessage("url_save"));
		$("#comment_tip").html(chrome.i18n.getMessage("comment_tip"));
		$("#comment-info").attr("placeholder", chrome.i18n.getMessage("add_comment"));

		//默认文件夹
		$("#category_info").html("/" + chrome.i18n.getMessage("MyNotes") + "/").attr("location", "/My Notes/");
	}

}