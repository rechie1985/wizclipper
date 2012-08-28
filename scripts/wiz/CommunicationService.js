/**
 * @author rechie
 */
window.WizService = window.WizService || {};
WizService = {
	ajaxUrl : 'http://service.wiz.cn/wizkm/xmlrpc',
	ajaxDoCmd : function(cmd, requestData, callSuccess, callError, callFinally, isAsync) {
		$.ajax({
			type : 'POST',
			url : ajaxUrl,
			data : requestData,
			success : function(response){
			},
			error : function(response){
			}
		});
	},
}
