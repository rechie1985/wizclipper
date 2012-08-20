/**
 * @author rechie
 */

function ClipPageControl() {

	$("#note_submit").click(noteSubmit);
	$("body").bind("keydown", keyDownHandler);
	// $("#submit-type").change(changeTypehandler);

	$('#wiz_note_category').bind('keydown', categoryChangeHandler);

	$("#submit-type").keydown(function() {
	});
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

	/**
	 *监听change事件，完成自动提示并填充
	 * @param {Object} evt
	 */
	function categoryChangeHandler(evt) {
		var inputCategory = this.value;
		console.log(inputCategory);
		if (!inputCategory || inputCategory.length < 1 || inputCategory == '/' || inputCategory == '*') {
			$("#auto_category").hide().html('');
			return;
		}
		console.log("last:" + inputCategory);
		var categoryCollection = categoryMap.fuzzySearch(inputCategory);
		if (categoryCollection.length < 1) {
			$("#auto_category").hide();
			return;
		}
		var innerHTML = '';
		$.each(categoryCollection, function(index, value) {
			var categoryStr;
			if ( value instanceof Category) {
				categoryStr = value.getLocation();
			} else {
				console.log("wrong category location" + value);
				return;
			}
			if (index % 2 == 0) {
				innerHTML += '<div id="auto_complete" class="auto-complete-category">' + categoryStr + '</div>';
			} else {
				innerHTML += '<div id="auto_complete" class="auto-complete-category striped">' + categoryStr + '</div>';
			}
			console.log(index + ': ' + value.getLocation());
		});
		$("#auto_category").show().html(innerHTML);

		//绑定自动完成事件
		$("#auto_complete").live("click", autoCompleteHandler);
	}

	function autoCompleteHandler(evt) {
		var autoText = $(this).html();
		$("#wiz_note_category").val(autoText);
		$("#auto_category").hide().html("");
	}

}
