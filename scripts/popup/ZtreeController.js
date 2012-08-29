/**
 * @author rechie
 */
function ZtreeController() {
	var setting = {
		view : {
			dblClickExpand : false,
			showLine : true,
			selectedMulti : false,
			showIcon : true
		},
		data : {
			simpleData : {
				enable : false
			}
		},
		callback : {
			onClick : zTreeOnClick
		}

	};

	var zNodesObj;

	function zTreeOnClick(event, treeId, treeNode) {
		var nodeLocation = treeNode.location;
		var displayLocation = treeNode.displayLocation;
		$("#category_info").attr("location", nodeLocation);
		
		PopupView.hideCategoryTreeAfterSelect(displayLocation, 500);

		//把最后一次选择的文件夹保存起来，下次使用
		localStorage["last-category"] = displayLocation + "*" + nodeLocation;
	};

	/**
	 * 将获取到的json object处理成ztree需要的格式
	 * @param {Object} obj
	 */
	function parseDate(obj) {
		//用来存放 category-name的map
		var categoryMap = new HashMap();
		var array = obj.split('*');
		//数组下标
		var index = 0;
		var ztreeData = [];

		$.each(array, function(firstIndex, location) {
			var tempLocation = '/';
			var length = location.length;
			//把头尾的空串去掉
			var nameArr = location.substr(1, length - 2).split('/');
			$.each(nameArr, function(levelIndex, name) {
				//记录路径
				var parentLocation = tempLocation;
				tempLocation += name + '/';
				var nodeData = {};
				var mapNodeObj = categoryMap.get(tempLocation);
				if (!mapNodeObj) {
					//根节点特殊处理
					var nodeObj = {
						children : [] ,
						name : changeSpecilaLoction(name) ,
						displayLocation : changeSpecilaLoction(tempLocation) ,
						location : tempLocation,
						level : levelIndex
					};
					categoryMap.put(tempLocation, nodeObj);
					//非根节点
					if (levelIndex == 0) {
						ztreeData[index] = nodeObj;
						index++;
					}
					var parentNode = categoryMap.get(parentLocation);
					if (parentNode) {
						var length = parentNode.children.length;
						parentNode.children[length] = nodeObj;
					}
				}
			});
		});
		return ztreeData;
	}

	function setNodes(data) {
		zNodesObj = data;
	}

	function initTree(id) {
		$.fn.zTree.init($("#" + id), setting, zNodesObj);
	};
	this.initTree = initTree;
	this.setNodes = setNodes;
	this.parseDate = parseDate;
}

var specialLocation = {
	"My Notes" : chrome.i18n.getMessage("MyNotes"),
	"My Mobiles" : chrome.i18n.getMessage("MyMobiles"),
	"My Drafts" : chrome.i18n.getMessage("MyDrafts"),
	"My Journals" : chrome.i18n.getMessage("MyJournals"),
	"My Events" : chrome.i18n.getMessage("MyEvents"),
	"My Contacts" : chrome.i18n.getMessage("MyContacts"),
	"My Tasks" : chrome.i18n.getMessage("MyTasks"),
	"Deleted Items" : chrome.i18n.getMessage("DeletedItems"),
	"My Sticky Notes" : chrome.i18n.getMessage("MyStickyNotes"),
	"Inbox" : chrome.i18n.getMessage("Inbox"),
	"Completed" : chrome.i18n.getMessage("Completed"),
	"My Photos" : chrome.i18n.getMessage("MyPhotos"),
	"My Emails" : chrome.i18n.getMessage("MyEmails")
}

function changeSpecilaLoction(location) {
	$.each(specialLocation, function(key, value) {
		var index = location.indexOf(key);

		if(index === 0 && location == key) {
			location = value;
			return false;			
		}
		if(index === 1 && location.indexOf("/") === 0) {
			location = "/" + value + location.substr(key.length + 1);
			return false;
		}
	});
	return location;
}
