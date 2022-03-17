
/*
    A few helper functions for making it easier to get needed IDs from Trello calls and using in subsequent calls
*/
const TrelloHelper = {

    // Get the ADMIN_LIST ID 
	getAdminListID: (callback)=> {
		MyTrello.get_lists("open", (data)=>{

			let listResp = JSON.parse(data.responseText);
			let singleList = listResp.filter( (val)=>{
				return (val.name == "ADMIN_LIST");
			});
			let listID = singleList[0]["id"];

			callback(listID);
		});
	},

    // Get a custom field ID based on name
	getCustomFieldID: (customFieldName, callback)=>	{
		MyTrello.get_custom_fields( (customFieldData)=>{

			let fieldsResp = JSON.parse(customFieldData.responseText);
			let singleField = fieldsResp.filter( (val)=>{
				return (val.name == customFieldName);
			});
			let customFieldID = singleField[0]?.id;

			if(customFieldID != undefined)
			{
				callback(customFieldID);
			}
		});
	}
}