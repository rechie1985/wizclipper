var Base64 = {
	// private property
	_keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
	// public method for encoding
	encode : function(input) {
		var output = "";
		var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
		var i = 0;

		input = Base64._utf8_encode(input);

		while (i < input.length) {

			chr1 = input.charCodeAt(i++);
			chr2 = input.charCodeAt(i++);
			chr3 = input.charCodeAt(i++);

			enc1 = chr1 >> 2;
			enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
			enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
			enc4 = chr3 & 63;

			if (isNaN(chr2)) {
				enc3 = enc4 = 64;
			} else if (isNaN(chr3)) {
				enc4 = 64;
			}

			output = output + this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) + this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

		}

		return output;
	},
	// private method for UTF-8 encoding
	_utf8_encode : function(string) {
		string = string.replace(/\r\n/g, "\n");
		var utftext = "";
		for (var n = 0; n < string.length; n++) {
			var c = string.charCodeAt(n);

			if (c < 128) {
				utftext += String.fromCharCode(c);
			} else if ((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			} else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}

		}

		return utftext;
	}
}

function wiz_base64Encode(str) {
	var base64str = Base64.encode(str);
	return base64str;
}

function wiz_getFrameNodes(win) {
	var doc = win.document;
	if (doc == null)
		return null;
	//
	var frameNodes = doc.getElementsByTagName("iframe");
	if (frameNodes == null || frameNodes.length == 0) {
		frameNodes = doc.getElementsByTagName("frame");
		if (frameNodes == null || frameNodes.length == 0) {
			return null;
		}
	}
	//
	return frameNodes;
}

var wiz_g_frameNameIndex = 0;

function wiz_prepareFrameNodes(win) {
	var frameNodes = wiz_getFrameNodes(win);
	if (frameNodes == null)
		return;
	for (var i = 0; i < frameNodes.length; i++) {
		var node = frameNodes[i];
		node.setAttribute("wiz_ext_name", "Frame_" + wiz_g_frameNameIndex);
		wiz_g_frameNameIndex++;
	}
}

function wiz_prepareFrames(win) {
	if (win == null)
		return;
	//
	var doc = win.document;
	if (doc == null) {
		return;
	}
	//
	wiz_prepareFrameNodes(win);
	//
	var frames = win.frames;
	if (frames == null)
		return;
	//
	for (var i = 0; i < frames.length; i++) {
		var frame = frames[i];
		//
		wiz_prepareFrames(frame);
	}
}

function wiz_prepareAllFrames(win) {
	wiz_g_frameNameIndex = 0;
	wiz_prepareFrames(win);
}

var wiz_g_frameFilesIndex = 0;
function wiz_collectFrames(win) {
	var params = "";
	//
	if (win == null) {
		return "";
	}
	var doc = win.document;
	if (doc == null) {
		return "";
	}

	var frameNodes = wiz_getFrameNodes(win);

	if (frameNodes == null)
		return "";

	for (var i = 0; i < frameNodes.length; i++) {
		var frameNode = frameNodes[i];
		//
		if (frameNode != null) {
			var id = frameNode.getAttribute("id");
			var name = frameNode.getAttribute("name");

			var extName = frameNode.getAttribute("wiz_ext_name");
			//
			if (id == null)
				id = "";
			if (name == null)
				name = "";
			if (extName == null)
				extName = "";
			//
			var frameDoc = frameNode.contentDocument;

			if (frameDoc != null) {
				params += wiz_g_frameFilesIndex + "_FrameURL='" + wiz_base64Encode(frameDoc.URL) + "' ";
				params += wiz_g_frameFilesIndex + "_FrameName='" + name + "' ";
				params += wiz_g_frameFilesIndex + "_FrameID='" + id + "' ";
				params += wiz_g_frameFilesIndex + "_FrameExtName='" + extName + "' ";
				var source_html = wiz_base64Encode(frameDoc.documentElement.innerHTML);
				params += wiz_g_frameFilesIndex + "_FrameHtml='" + source_html + "' ";
				wiz_g_frameFilesIndex++;
			}
		}
	}

	var frames = win.frames;
	for (var i = 0; i < frames.length; i++) {
		var frame = frames[i];
		params += wiz_collectFrames(frame);
	}
	return params;
}

function wiz_collectAllFrames(win) {//
	var params = "";
	if ( typeof (win) == "object") {
		var source_url = wiz_base64Encode(win.location.href);
		var source_title = wiz_base64Encode(win.document.title);
		var source_html = "";

		wiz_prepareAllFrames(win);
		//
		var source_html = wiz_base64Encode(win.document.documentElement.innerHTML);
		params = "param-location='" + source_url + "' ";
		params += "param-title='" + source_title + "' ";

		wiz_g_frameFilesIndex = 0;

		params += wiz_g_frameFilesIndex + "_FrameURL='" + source_url + "' ";
		params += wiz_g_frameFilesIndex + "_FrameHtml='" + source_html + "' ";

		wiz_g_frameFilesIndex++;
		params += wiz_collectFrames(win);
		var frame_fcount = wiz_g_frameFilesIndex;
		params = "param-fcount='" + frame_fcount + "' " + params;
	}
	return params;
}

function wiz_getActiveFrame(win) {
	if (win == null)
		return null;
	var activeFrame = null;
	var frames = win.frames;
	for (var i = 0; i < frames.length; i++) {
		var frame = frames[i];
		if (frame != null && frame.document != null) {
			var seltxt = frame.getSelection();
			if (seltxt != null && seltxt.toString() != "") {
				activeFrame = frame;
				//
			}
		}
		if (activeFrame != null)
			return activeFrame;
		activeFrame = wiz_getActiveFrame(frame);
		//
		if (activeFrame != null)
			return activeFrame;
	}
	return null;
}

function wiz_getSelected(win) {
	var params = "";
	if ( typeof (win) == "object") {
		var source_url = wiz_base64Encode(win.location.href);
		var source_html = "";
		var frame_url = source_url;
		//var winsel = win.getSelection();
		var winsel = contentPreview.getArticleElement();
		if (winsel == null || winsel.toString() == "") {
			var activeFrame = wiz_getActiveFrame(win);
			if (activeFrame != null) {
				winsel = activeFrame.getSelection();
				frame_url = wiz_base64Encode(activeFrame.location.href);
			}
		}
		if (winsel == null || winsel == "") {
			params = "";
			return params;
		} else {
			//var docFragment = winsel.getRangeAt(0).cloneContents();
			//var docFragment = winsel.innerHTML;
			//var myp = window.document.createElement("<div>" + docFragment + "</Div>");
			var source_html = winsel.innerHTML;
			if (source_html == null)
				source_html = "";
			//source_html = wiz_base64Encode(source_html); ;
			//params += "param-surl='" + frame_url + "' ";
			//params += "param-shtml='" + source_html + "' ";
			params = source_html;
		}
	}
	return params;
}

function launchClientClipper(info) {
	var params = wiz_collectAllFrames(window);
	//params = params + wiz_getSelected(window);

	params = wiz_getSelected(window);
	info.params = params;
	postClipInfo(info);
}

function launchClientClipperFullPage(info) {
	info.params = getFullpageHTML();
	postClipInfo(info);
}

function launchClientClipperSelection(info) {
	var params = getSelectedHTML();
	info.params = params;
	postClipInfo(info);
}

function launchClientClipperUrl(info) {
	var url = '<a href="' + window.location.href + '">' + window.location.href + '</a>';
	var params = url;
	info.params = params;
	postClipInfo(info);
}

function getFullpageHTML() {
	var base = "<base href='" + window.location.protocol + "//" + window.location.host + "'/>";
	var page_content = document.getElementsByTagName("html")[0];
	page_content = $(page_content).clone().find("script").remove().end().html();
	var index = page_content.indexOf("<head>");
	var fullpage = page_content.substring(0, index + 6) + base + page_content.substring(index + 6);
	return fullpage;
}

function getSelectedHTML() {
	var selection = document.getSelection();
	if (selection.rangeCount > 0) {
		var range = selection.getRangeAt(0);
		var html = range.commonAncestorContainer.ownerDocument.createElement("div");
		html.appendChild(range.cloneContents());
		return $(html).html();
	} else
		return "";
}

function postClipInfo(info) {
	clipResult.startClip();
	setTimeout(function(){
		chrome.extension.connect({"name" : "saveDocument"}).postMessage(info);
	}, 200);

}

