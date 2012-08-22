/**
 * @author rechie
 */

function ClipPageControl() {

	$("#note_submit").click(noteSubmit);
	$("#submit-type").change(changeTypehandler);
	$("body").bind("keyup", keyDownHandler);
	$("#comment-info").focus(resizeComment);
	
	function resizeComment() {
		$("#comment-info").animate({height : "80px"}, 500);
	}
	/**
	 *修改保存的类型
	 * @param {Object} model
	 */
	function changeTypehandler(evt) {
		var selectedOption = $('option:selected', '#submit-type');
		var cmd = selectedOption.attr("id");
		var port = chrome.extension.connect({
			name : "preview"
		});
		port.postMessage(cmd);

		//改变页面显示
		var type = $("#submit-type").val();
		changeType(type);
	}

	function changeType(type) {
		$("#note_submit").html(type);
	}

	function keyDownHandler(e) {
		var target = e.target;
		var skipTypes = ["input", "select", "textarea"];
		for (var i = 0; i < skipTypes.length; i++) {
			if (e.srcElement.nodeName.toLowerCase() == skipTypes[i]) {
				return;
			}
		}
		var keycode = e.keyCode;
		if (13 == keycode) {
			doSubmit();
			return;
		}
		//其他按键处理
		var port = chrome.extension.connect({
			name : "onkeydown"
		});

		var opCmd = getNudgeOp(keycode, e);
		var info = {
			direction : opCmd
		};
		port.postMessage(info);
	}

	function getNudgeOp(key, evt) {
		var returnValue = null;
		var KEY_ALT = 18, KEY_CTRL = 17;
		var keyMap = {
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

	/**
	 * 保存文档处理
	 * @param {Event} e
	 */
	function noteSubmit(e) {
		doSubmit();
	}

	function doSubmit() {
		var type = $('option:selected', '#submit-type').attr("id");
		var title = $("#wiz_note_title").val();
		chrome.windows.getCurrent(function(win) {
			chrome.tabs.getSelected(win.id, function(tab) {
				chrome.tabs.sendRequest(tab.id, {
					name : "preview",
					op : "submit",
					title : title,
					type : type
				}, function(params) {
					window.close();
				});
			});
		});
	}

}
