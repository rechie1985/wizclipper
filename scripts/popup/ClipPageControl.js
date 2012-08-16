/**
 * @author rechie
 */

function ClipPageControl() {
	$("#note_submit").live("click", noteSubmit);

	/**
	 *修改保存的类型
	 * @param {Object} model
	 */
	function changeClipModel(model) {

	}


	$("body").bind("keydown", keyDownHandler);
	function keyDownHandler(e) {
		var port = chrome.extension.connect({
			name : "onkeydown"
		});

		var keycode = e.keyCode;
		var opCmd = getNudgeOp(keycode, e);
		console.log(opCmd);
		if (opCmd && opCmd !== null) {
			port.postMessage(opCmd);
		}
		if (13 == keycode) {
			window.close();
		}
	}

	function getNudgeOp(key, evt) {
		var returnValue = null;
		var KEY_ALT = 18, KEY_CTRL = 17;
		var keyMap = {
			13 : "enter",
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
		var port = chrome.extension.connect({
			name : "onkeydown"
		});
		var opCmd = "enter";
		port.postMessage(opCmd);
		//save and close
		window.close();
	}
}