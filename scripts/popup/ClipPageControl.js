/**
 * @author rechie
 */

function ClipPageControl() {

	$("#note_submit").click(noteSubmit);
	$("body").bind("keydown", keyDownHandler);
	$("#wiz_note_tag").bind("keydown", renderTag).bind("blur", renderTag)
	this.initTagHandler = function() {
		$("#wiz_note_tag").bind('input', autoFillTag);
	}
	/**
	 *输入框内回车或者选择的时候
	 */
	function renderTag() {
		
	}

	function fillTagInput(evt) {
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
		if ('INPUT' == target.tagName) {
			$(target).trigger('focusout');
			return;
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
		return false;
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

	function autoFillTag(evt) {
		console.log(evt);
		var tagList = JSON.parse(localStorage["tag"]);
		var inputStr = this.value;
		var reg = new RegExp("^" + inputStr);
		var filterArray = tagList.filter(function(obj) {
			return reg.test(obj.tag_name);
		});
		console.log(filterArray);
		autoComplete("tag-tip-container", filterArray, "tag_name");
	}

	/**
	 *自动匹配
	 * @param {Object} id
	 * @param {Object} dataArray
	 * @param {Object} name
	 */
	function autoComplete(id, dataArray, name) {
		var innerHTML = '';
		$.each(dataArray, function(index, value) {
			var categoryStr;
			if (!value) {
				return;
			}
			if (index % 2 == 0) {
				innerHTML += '<div id="auto_complete" class="' + id + '_tip">' + value[name] + '</div>';
			} else {
				innerHTML += '<div id="auto_complete" class="' + id + '_tip striped">' + value[name] + '</div>';
			}
		});
		$("#" + id).html(innerHTML).show();

		//绑定自动完成事件
		$('#auto_complete').live("click", renderTag);
	}

}
