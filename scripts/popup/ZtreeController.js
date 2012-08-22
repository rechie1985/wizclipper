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
		$("#category_info").html(nodeLocation);
		$("#category_info").attr("location", nodeLocation);
		$("#ztree_container").hide(500);
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
		// console.log(array);
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
					var nodeObj = {};
					nodeObj.children = [];
					nodeObj.name = name;
					nodeObj.location = tempLocation;
					nodeObj.level = levelIndex;
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
		console.log(ztreeData);
		return ztreeData;
	}

	function setNodes(data) {
		zNodesObj = data;
	}

	function show() {
		$.fn.zTree.init($("#ztree"), setting, zNodesObj);
	};
	this.show = show;
	this.setNodes = setNodes;
	this.parseDate = parseDate;
}
