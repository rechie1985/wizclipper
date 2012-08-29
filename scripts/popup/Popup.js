var mainUrl = "http://service.wiz.cn/web";
window.onload = function() {
	initPopupPage();

	var clipPageControl = new ClipPageControl();
	var loginControl = new LoginControl();
	Cookie.getCookies(cookieUrl, cookieName, showByCookies, true);

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
					loginControl.autoLogin(cookies);
				} else {
					$("#wiz_login").hide();
				}
			});

		} else {
			PopupView.showLogin();
			
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
		// $("#tag_tip").html(chrome.i18n.getMessage("tag_tip"));
		// $("#tag_input").html(chrome.i18n.getMessage("tag_input"));
		//submit type
		$("#article").html(chrome.i18n.getMessage("article_save"));
		$("#fullPage").html(chrome.i18n.getMessage("fullpage_save"));
		$("#selection").html(chrome.i18n.getMessage("select_save"));
		$("#url").html(chrome.i18n.getMessage("url_save"));
		//comment area
		$("#comment_tip").html(chrome.i18n.getMessage("comment_tip"));
		$("#comment-info").attr("placeholder", chrome.i18n.getMessage("add_comment"));

		//默认文件夹
		$("#category_info").html("/" + chrome.i18n.getMessage("MyNotes") + "/").attr("location", "/My Notes/");
	}

}