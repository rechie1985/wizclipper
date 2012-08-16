window.onload = function() {
	initPopupPage();
	var clipPageControl = new ClipPageControl();
	var plugin = new LoginControl();
	
	plugin.getCookies(mainUrl, "wiz-clip-auth", showByCookies);
	
	
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
		$("#login_button").html("&nbsp;" + chrome.i18n.getMessage("login_msg") + "&nbsp;");

		//note info page
		$("#note_title_tip").html(chrome.i18n.getMessage("note_title_tip"));
		$("#category_tip").html(chrome.i18n.getMessage("category_tip"));
		$("#tag_tip").html(chrome.i18n.getMessage("tag_tip"));
		$("#tag_input").html(chrome.i18n.getMessage("tag_input"));
		$("#note_submit").html("&nbsp;" + chrome.i18n.getMessage("note_submit") + "&nbsp;");
		$("#article_save").html(chrome.i18n.getMessage("article_save"));
		$("#fullpage_save").html(chrome.i18n.getMessage("fullpage_save"));
		$("#select_save").html(chrome.i18n.getMessage("select_save"));
		$("#url_save").html(chrome.i18n.getMessage("url_save"));
	}
}
