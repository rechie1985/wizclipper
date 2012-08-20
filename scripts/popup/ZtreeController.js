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
				enable : true,
				idKey : "id",
				pIdKey : "pId",
				rootPId : ""
			}
		}
	};

	var zNodesObj;

	/**
	 * 将获取到的json object处理成ztree需要的格式
	 * @param {Object} obj
	 */
	function parseDate(obj) {
		console.log(obj);
		//用来存放 category-name的map
		var categoryMap = new HashMap();
		var array = obj.split('*');
		//数组下标
		var index = 0;
		// console.log(array);
		var ztreeData = [];
		$.each(array, function(pid, location) {
			var tempLocation = '/';
			var length = location.length;
			//把头尾的空串去掉
			var nameArr = location.substr(1, length - 2).split('/');
			$.each(nameArr, function(id, name) {
				//记录路径
				tempLocation += name + '/';
				var nodeData = {};
				var mapId = categoryMap.get(tempLocation);
				if (!mapId) {
					categoryMap.put(tempLocation, name);
					nodeData.id = pid * 100 + id + 1;
					nodeData.pId = pid;
					nodeData.name = name;
					nodeData.location = tempLocation;
					ztreeData[index] = nodeData;
					index++;
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
		$.fn.zTree.init($("#ztree_container"), setting, zNodesObj);
	};
	this.show = show;
	this.setNodes = setNodes;
	this.parseDate = parseDate;
}
