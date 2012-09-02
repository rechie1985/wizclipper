/**
 * @author rechie
 */
var cookieUrl = 'http://service.wiz.cn/web',
	cookieName = 'wiz-clip-auth',
	cookieExpiredays = 14 * 24 * 60 * 60;

function ClipPageControl() {
	'use strict';

	function initClipPageListener() {
		PopupView.hideCreateDiv();
		$('body').bind('keyup', keyDownHandler);
		$('#submit-type').change(changeSubmitTypehandler);
		$('#note_submit').click(noteSubmit);
		$('#comment-info').focus(resizeCommentHeight);
		$('#wiz_clip_detail').show(initClipPageInfo);
	}

	function resizeCommentHeight(evt) {
		$('#comment-info').animate({
			height: '80px'
		}, 500);
	}

	//监听截取信息事件
	chrome.extension.onConnect.addListener(messageListener);

	function messageListener(port) {
		var name = port.name;
		switch (name) {
		case 'contentVeilShow':
			$('#waiting').hide();
			if ($('#wiz_clip_detail').is(':hidden')) {
				initClipPageListener();
			}
			break;
		case 'PageClipFailure':
			var pageClipFailure = chrome.i18n.getMessage('pageClipFailure');
			PopupView.showClipFailure(pageClipFailure);
			break;
		}
	}



	/**
	 *修改保存的类型
	 * @param {Object} model
	 */

	function changeSubmitTypehandler(evt) {
		var selectedOption = $('option:selected', '#submit-type'),
			cmd = selectedOption.attr('id'),
			port = chrome.extension.connect({
				name: 'preview'
			});
		port.postMessage(cmd);

		//改变页面显示
		PopupView.changeSubmitDisplayByType();
	}


	function initSubmitGroup(clipPageResponse) {
		var clipArticle = clipPageResponse.article,
			clipSelection = clipPageResponse.selection;
		if (clipSelection == true) {
			$('#submit-type')[0].options[1].selected = true;
		} else if (clipArticle == true) {
			$('#submit-type')[0].options[0].selected = true;
		} else {
			$('#submit-type')[0].options[2].selected = true;
		}

		//用户没有选择时，禁止选择该'保存选择'
		if (clipSelection == false) {
			$('#submit-type option[id="selection"]').attr('disabled', '');
		}

		//用户有选择或者不可以智能提取时，禁止选择'保存文章'
		if (clipArticle == false || clipSelection == true) {
			$('#submit-type option[id="article"]').attr('disabled', '');
		}
		var type = $('#submit-type').val();
		$('#note_submit').html(type);
	}

	/**
	 * 加载当前页面的是否能智能截取、是否有选择的信息，并根据该信息显示
	 */

	function requestPageStatus() {
		chrome.windows.getCurrent(function (win) {
			chrome.tabs.getSelected(win.id, function (tab) {
				chrome.tabs.sendMessage(tab.id, {
					name: 'getInfo'
				}, function (params) {
					initSubmitGroup(params);
				});
			});
		});
	}

	//初始化剪辑页面信息


	function initClipPageInfo(evt) {
		initLogoutLink();
		requestPageStatus();
		requestTitle();
		initDefaultCategory();
		requestToken();
		var categoryStr = localStorage['category'];
		//如果本地未保存文件夹信息，需要发送请求加载
		if (categoryStr) {
			parseWizCategory();
		} else {
			requestCategory();
		}
	}


	function initLogoutLink() {
		var logoutText = chrome.i18n.getMessage('logout');
		$('#header_user').show();
		$('#logout_control').html(logoutText).bind('click', cmdLogout);
	}

	function cmdLogout() {
		Cookie.removeCookies(cookieUrl, cookieName, function () {
			chrome.extension.connect({
				name: 'logout'
			});
		});
		window.close();
	}

	/**
	 *加载标题
	 */

	function requestTitle() {
		chrome.windows.getCurrent(function (win) {
			chrome.tabs.getSelected(win.id, function (tab) {
				var title = tab.title;
				if (!title) {
					return;
				}
				setTitle(title);
			});
		});
	}

	function setTitle(title) {
		$('#wiz_note_title').val(title);
	}



	/**
	 * 加载并显示默认文件夹---上次选择的文件夹
	 */

	function initDefaultCategory() {
		var lastCategory = localStorage['last-category'];
		if (lastCategory) {
			var array = lastCategory.split('*'),
				displayName = array[0],
				location = array[1];
			$('#category_info').html(displayName).attr('location', location);
		}
	}

	/**
	 *加载中
	 */

	function changeCategoryLoadingStatus() {
		var visible = isCategoryLoading();
		if (visible) {
			PopupView.hideCategoryLoading();
		} else {
			var categoryLoadingMsg = chrome.i18n.getMessage('category_loading');
			PopupView.showCategoryLoading(categoryLoadingMsg);
		}
	}

	function isCategoryLoading() {
		var visible = $('#category_loading').is(':visible');
		return visible;
	}
	/**
	 *对目录信息进行处理
	 * @param {Object} categoryStr
	 */

	function parseWizCategory(categoryStr) {

		initZtree();
		var visible = isCategoryLoading();
		if (visible) {
			//用户已经点击展开文件夹树，此时，需要直接显示文件夹树即可
			PopupView.showCategoryTreeFromLoading(500);
		}
		$('#category_info').unbind('click');
		$('#category_info').click(switchCategoryTreeVisible);
	}

	function initZtree() {
		var categoryString = localStorage['category'];
		var ztreeJson = ztreeControl.parseDate(categoryString);
		ztreeControl.setNodes(ztreeJson);
		ztreeControl.initTree('ztree');
	}

	/**
	 *显示树
	 */

	function switchCategoryTreeVisible() {
		var visible = $('#ztree_container').is(':visible');
		if (visible) {
			$('#ztree_container').hide(500);
		} else {
			$('#ztree_container').show(500);
		}
	}

	/**
	 *加载文件夹信息
	 */

	function requestCategory() {
		$('#category_info').bind('click', changeCategoryLoadingStatus);
		var port = chrome.extension.connect({
			name: 'requestCategory'
		});
		port.onMessage.addListener(function (msg) {
			//错误处理
			var value = $('#wiz_note_category').val();
			localStorage['category'] = msg.categories;
			parseWizCategory(msg.categories);
		});
	}


	function requestToken() {
		var port = chrome.extension.connect({
			name: 'requestToken'
		});
		port.onMessage.addListener(function (token) {
			initUserLink(token);
		});
	}


	function keyDownHandler(evt) {
		var target = evt.target,
			skipTypes = ['input', 'select', 'textarea'],
			skipIndex;

		for (skipIndex = 0; skipIndex < skipTypes.length; skipIndex++) {
			if (evt.srcElement.nodeName.toLowerCase() == skipTypes[skipIndex]) {
				return;
			}
		}
		var keycode = evt.keyCode;
		if (13 == keycode) {
			requestSubmit();
			return;
		}

		var opCmd = getNudgeOp(keycode, evt);
		var info = {
			direction: opCmd
		};
		chrome.extension.connect({
			name: 'onkeydown'
		}).postMessage(info);
	}

	function getNudgeOp(key, evt) {
		var returnValue = null,
			KEY_ALT = 18,
			KEY_CTRL = 17,
			keyMap = {
			27: 'cancle',
			38: 'expand',
			// up
			40: 'shrink',
			// down
			37: 'left',
			39: 'right',

			56: 'topexpand',
			// alt + up
			58: 'topshrink',
			// alt + down
			57: 'bottomexpand',
			// ctrl + down
			55: 'bottomshrink'
			// ctrl + up
		};

		if (keyMap[key]) {
			if (evt && evt.altKey == true) { // 18
				returnValue = keyMap[key + KEY_ALT];
			} else if (evt && evt.ctrlKey == true) { // 17
				returnValue = keyMap[key + KEY_CTRL];
			} else {
				returnValue = keyMap[key];
			}
			return returnValue;
		}
	}

	/**
	 * 保存文档处理
	 * @param {Event} e
	 */

	function noteSubmit(evt) {
		requestSubmit();
	}

	function requestSubmit() {
		var type = $('option:selected', '#submit-type').attr('id'),
			title = $('#wiz_note_title').val(),
			category = $('#category_info').attr('location'),
			comment = $('#comment-info').val(),
			docInfo = {
				title: title,
				category: category,
				comment: comment
			};
		chrome.windows.getCurrent(function (win) {
			chrome.tabs.getSelected(win.id, function (tab) {
				chrome.tabs.sendRequest(tab.id, {
					name: 'preview',
					op: 'submit',
					info: docInfo,
					type: type
				}, function (params) {
					window.close();
				});
			});
		});
	}

	function initUserLink(token) {
		var user_id = localStorage['wiz-clip-auth'];
		$('#header_username').html('(' + user_id + ')').bind('click', function (evt) {
			window.open(mainUrl + '/?t=' + token);
		});
	}
}