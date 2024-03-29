
/*********************************************************************************
	MyTrello: Custom API wrapper for Trello
				Dependent on the "common.js" file being loaded as well
**********************************************************************************/ 

const MyTrello = {

	boardName: "boardname",
	endpoint: "https://trello.the-dancinglion.workers.dev",

/*** Helper Functions ***/
	SetBoardName: (boardName) => {
		MyTrello.boardName = boardName;
	},

	GetFullTrelloPath: (command, params="") => {
		if(MyTrello.board == "")
		{
			console.error("Board name not set. Use MyTrello.SetBoardName() to set board name");
			return;
		}
		
		let api_path = `${MyTrello.endpoint}/${MyTrello.boardName}/${command}/?${params}`
		return api_path;
	},

/*** GET Calls ***/
	
	// Get list of boards;
	get_boards: (successCallback, failureCallback) => {
		let trello_path = MyTrello.GetFullTrelloPath("get_boards");
		myajax.GET(trello_path,successCallback, failureCallback);
	},

	// Get Custom Fields;
	get_custom_fields: (successCallback, failureCallback) => {
		let trello_path = MyTrello.GetFullTrelloPath("get_custom_fields");
		myajax.GET(trello_path,successCallback, failureCallback);
	},

	get_custom_field_by_name: (customFieldName, successCallback, failureCallback)=>{

		MyTrello.get_custom_fields( (customFieldData)=>{
			
			let fieldsResp = JSON.parse(customFieldData.responseText);
			let singleField = fieldsResp.filter( (val)=>{
				return (val.name == customFieldName);
			});
			let newRequestResp = { status: customFieldData.status, responseText: JSON.stringify(singleField) }

			// Pass data back to original functions
			if(customFieldData.status == 200)
			{
				successCallback(newRequestResp);
			}
			else
			{
				failureCallback(newRequestResp)
			}
		}, failureCallback)


	},

	// Get a list of Trello Cards
	get_cards: (listID, successCallback, failureCallback) => {
		let trello_path = MyTrello.GetFullTrelloPath("get_cards", `listID=${listID}`);
		myajax.GET(trello_path,successCallback, failureCallback);
	},

	// Get a list of Trello Cards
	get_cards_by_list_name: (listName, successCallback, failureCallback) => {

		MyTrello.get_list_by_name(listName, (listData)=>{

			let listResp = JSON.parse(listData.responseText);
			let listID = listResp[0]?.id;

			if(listID != undefined)
			{
				let trello_path = MyTrello.GetFullTrelloPath("get_cards", `listID=${listID}`);
				myajax.GET(trello_path,successCallback, failureCallback);
			}
			else
			{
				failureCallback(listData);
			}
		});
	},

	// Get the comments; Via call = get_actions
	get_comments: (cardID, successCallback, failureCallback) => {
		let trello_path = MyTrello.GetFullTrelloPath("get_actions", `cardID=${cardID}&filter=commentCard`);
		myajax.GET(trello_path,successCallback, failureCallback);
	},

	// Gets a single trello card's actions
	get_card_attachment: (cardID, attachmentID, fileName, successCallback, failureCallback) => {
		let trello_path = MyTrello.GetFullTrelloPath("get_card_attachment", `cardID=${cardID}&attachmentID=${attachmentID}&fileNameID=${fileName}`);
		myajax.GET(trello_path,successCallback, failureCallback);
	},

	// Get the checklist items from a card's checklist
	get_card_checklist_items: (checklistID, successCallback, failureCallback) => {
		let trello_path = MyTrello.GetFullTrelloPath("get_card_checklist_items", `checklistID=${checklistID}`);
		myajax.GET(trello_path,successCallback, failureCallback);
	},

	// Get the custom fields on a card
	get_card_custom_fields: (cardID, successCallback, failureCallback) => {
		let trello_path = MyTrello.GetFullTrelloPath("get_card_custom_fields", `cardID=${cardID}`);
		myajax.GET(trello_path,successCallback,failureCallback);
	},

	// Get a custom field on a card by its name
	get_card_custom_field_by_name: (cardID, customFieldName, successCallback, failureCallback) => {

		MyTrello.get_custom_fields( (data) =>{

			let customFieldsResp = JSON.parse(data.responseText);
			let customFieldID = undefined;
			customFieldsResp.forEach( (field) =>{

				if(field.name == customFieldName)
				{
					customFieldID = field.id;
				}
			});

			if(customFieldID != undefined)
			{
				// Get the custom fields and filter by ID
				MyTrello.get_card_custom_fields(cardID,(data2)=>{
					
					let cardFieldsResp = JSON.parse(data2.responseText);
					let result = "";
					result = cardFieldsResp.filter( (val)=>{
						return val.idCustomField == customFieldID;
					});

					let newRequestResp = { status: data2.status, responseText: JSON.stringify(result) }
					// Pass data back to original successCallback
					successCallback(newRequestResp);
				}, failureCallback);
			}
			else
			{
				let newRequestResp = { status:400, responseText:`[]` }
				successCallback(newRequestResp);
			}
			
		}, failureCallback);
	},

	// Get Labels
	get_labels: (successCallback, failureCallback) => {
		let trello_path = MyTrello.GetFullTrelloPath("get_labels");
		myajax.GET(trello_path,successCallback, failureCallback);
	},

	// Get a set of Trello Lists
	get_lists: (listState, successCallback, failureCallback) => {
		let state = (listState.startsWith("close")) ? "closed" :  (listState.startsWith("open")) ? "open" : undefined;
		let filter = (state != undefined) ? `filter=${state}` : "";
		let trello_path = MyTrello.GetFullTrelloPath("get_lists", `${filter}`);
		myajax.GET(trello_path,successCallback, failureCallback);
	},

	get_list_by_name: (listName, successCallback, failureCallback) => {

		MyTrello.get_lists("any", (data)=>{
			let listsResp = JSON.parse(data.responseText);
			let singleList = listsResp.filter( (val)=>{
				return (val.name == listName);
			});
			let newRequestResp = { status: data.status, responseText: JSON.stringify(singleList) }
			
			// Pass data back to original functions
			if(data.status == 200)
			{
				successCallback(newRequestResp);
			}
			else
			{
				failureCallback(newRequestResp)
			}
		}, failureCallback);
	},
	
	// Gets a single trello cards
	get_single_card: (cardID, successCallback, failureCallback) => {
		let trello_path = MyTrello.GetFullTrelloPath("get_single_card", `cardID=${cardID}&checklists=all&attachments=true&customFieldItems=true`);
		myajax.GET(trello_path,successCallback, failureCallback);
	},


/*** CREATE Calls ***/

	// Create a new list
	create_list: (listName,successCallback, failureCallback) => {
		let trello_path = MyTrello.GetFullTrelloPath("create_list", `name=${listName}`);
		myajax.POST(trello_path,"",{},successCallback, failureCallback);
	},

	// Creates a new Trello Card
	create_card: (listID, cardName, successCallback, failureCallback) => {
		let trello_path = MyTrello.GetFullTrelloPath("create_card", `name=${cardName}&idList=${listID}&pos=top`);
		myajax.POST(trello_path,"",{},successCallback, failureCallback);
	},

	// Creates a new Trello Card
	create_card_attachment: (cardID, fileName, jsonObject, successCallback, failureCallback) => {

		var jsonData = JSON.stringify(jsonObject);
		const jsonFile = new File([jsonData], fileName, {
			type: "application/json",
		  });
		
		// Create form data
		const formData = new FormData();
		formData.append("file", jsonFile);

		// Get path and send
		let trello_path = MyTrello.GetFullTrelloPath("create_card_attachment",`cardID=${cardID}&mimeType=application/json&name=${fileName}`)
		myajax.POST(trello_path,formData,{},successCallback, failureCallback);
	},

	// Add a comment to a card
	create_card_comment: (cardID, comment,successCallback, failureCallback) => {
		let trello_path = MyTrello.GetFullTrelloPath("create_card_comment", `cardID=${cardID}&text=${comment}`);
		myajax.POST(trello_path,"",{},successCallback, failureCallback);
	},

	// Create a new checklist
	create_checklist: (cardID,successCallback, failureCallback) => {
		let trello_path = MyTrello.GetFullTrelloPath("create_checklist", `name=Media&idCard=${cardID}`);
		myajax.POST(trello_path,"",{},successCallback, failureCallback);
	},

	// Create an individual checklist item
	create_checklist_item: (checklistID, checklistItemName, successCallback, failureCallback) => {
		let trello_path = MyTrello.GetFullTrelloPath("create_checklist_item", `checklistID=${checklistID}&name=${checklistItemName}`);
		myajax.POST(trello_path,"",{},successCallback, failureCallback);
	},

	

/*** UPDATE Calls -- Note: Using POST verb to avoid Cloudflare CORS ***/

	update_card_description: (cardID, newCardDesc,successCallback, failureCallback) => {
		let obj = { "desc": newCardDesc };
		var encoded = JSON.stringify(obj);
		let trello_path = MyTrello.GetFullTrelloPath("update_card", `cardID=${cardID}&desc=${newCardDesc}`);
		myajax.POST(trello_path,encoded,{},successCallback, failureCallback);
	},

	update_card_name: (cardID, newCardName, successCallback, failureCallback) => {
		let trello_path = MyTrello.GetFullTrelloPath("update_card", `cardID=${cardID}&name=${newCardName}`);
		myajax.POST(trello_path,"",{},successCallback, failureCallback);
	},

	// Add a label on a card
	update_card_label: (cardID, labelID, successCallback, failureCallback) => {
		let trello_path = MyTrello.GetFullTrelloPath("update_card_label", `cardID=${cardID}&value=${labelID}`);
		myajax.POST(trello_path, "", {}, successCallback, failureCallback);
	},

	// Update the Card's list
	update_card_list: (cardID, newListID, successCallback, failureCallback) => {
		let trello_path = MyTrello.GetFullTrelloPath("update_card", `cardID=${cardID}&idList=${newListID}&pos=top`)
		myajax.POST(trello_path, "", {}, successCallback, failureCallback);
	},

	update_card_custom_field_by_name: (cardID, customFieldName, newCustomFieldvalue, successCallback, failureCallback)=>{
		
		MyTrello.get_custom_field_by_name(customFieldName, (customFieldData)=>{

			let fieldResp = JSON.parse(customFieldData.responseText);
			let customFieldID = fieldResp[0]?.id;

			// Update the given field name
			var obj = { "value":{ "text":newCustomFieldvalue } };
			var encoded = JSON.stringify(obj);
			let trello_path = MyTrello.GetFullTrelloPath("update_card_custom_field", `cardID=${cardID}&customFieldID=${customFieldID}`);
			myajax.POST(trello_path,encoded,{},successCallback, failureCallback);
		});
	},

	update_list_state: (listID, newListState, newListName, successCallback, failureCallback) => {
		let state = (newListState == "closed") ? "true" : "false"
		let trello_path = MyTrello.GetFullTrelloPath("update_list", `listID=${listID}&name=${newListName}&closed=${state}`);
		myajax.POST(trello_path,"",{},successCallback, failureCallback);
	},

	update_checklist_item_state: (cardID, checklistItemID, checklistIsComplete, successCallback, failureCallback) => {
		state = (checklistIsComplete) ? "complete" : "incomplete"
		let trello_path = MyTrello.GetFullTrelloPath("update_checklist_item", `cardID=${cardID}&checklistItemID=${checklistItemID}&state=${state}`);
		myajax.POST(trello_path,"",{},successCallback, failureCallback);
	},

	// Updat the value of a checklist item;
	update_checklist_item_value: (cardID, checklistItemID, newChecklistItemName, successCallback, failureCallback) => {
		let trello_path = MyTrello.GetFullTrelloPath("update_checklist_item", `cardID=${cardID}&checklistItemID=${checklistItemID}&name=${newChecklistItemName}`);
		myajax.POST(trello_path,"",{},successCallback, failureCallback);
	},

/*** DELETE Calls ***/
	// Delete a card attachment
	delete_card_attachment: (cardID, attachmentID, successCallback, failureCallback) =>{
		let trello_path = MyTrello.GetFullTrelloPath("delete_card_attachment", `cardID=${cardID}&attachmentID=${attachmentID}`);
		myajax.POST(trello_path,"",{},successCallback,failureCallback);
	},

	// Remove a card label
	delete_card_label: (cardID, labelID, successCallback, failureCallback) => {
		let trello_path = MyTrello.GetFullTrelloPath("delete_card_label", `cardID=${cardID}&labelID=${labelID}`);
		myajax.POST(trello_path, "", {}, successCallback, failureCallback);
	}
}