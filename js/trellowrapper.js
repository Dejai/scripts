
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
		let trello_path = MyTrello.GetFullTrelloPath("get_custom_fields", `boardID=board_id`);
		myajax.GET(trello_path,successCallback, failureCallback);
	},

	// Get a list of Trello Cards
	get_cards: (listID, successCallback, failureCallback) => {
		let trello_path = MyTrello.GetFullTrelloPath("get_cards", `listID=${listID}`);
		myajax.GET(trello_path,successCallback, failureCallback);
	},

	// Get the comments; Via call = get_actions
	get_comments: (cardID, successCallback, failureCallback) => {
		let trello_path = MyTrello.GetFullTrelloPath("get_actions", `cardID=${cardID}&filter=commentCard`);
		myajax.GET(trello_path,successCallback, failureCallback);
	},

	// Gets a single trello card's actions
	get_card_attachments: (cardID, successCallback, failureCallback) => {
		let trello_path = MyTrello.GetFullTrelloPath("get_card_attachments", `cardID=${cardID}`);
		myajax.GET(trello_path,successCallback, failureCallback);
	},

	// Get the checklist items from a card's checklist
	get_card_checklist_items: (checklistID, successCallback, failureCallback) => {
		let trello_path = MyTrello.GetFullTrelloPath("get_card_checklist_items", `checklistID=${checklistID}`);
		myajax.GET(trello_path,successCallback, failureCallback);
	},

	// Get the custom fields on a card
	get_card_custom_fields: (cardID, customFieldID, successCallback, failureCallback) => {

		let trello_path = MyTrello.GetFullTrelloPath("get_card_custom_fields", `cardID=${cardID}`);
		myajax.GET(trello_path,(data)=>{

			let resp = JSON.parse(data.responseText);
			console.log(resp);
			let result = "";
			result = resp.filter( (val)=>{
				return val.idCustomField == customFieldID;
			});

			let newRequestResp = { status: data.status, responseText: JSON.stringify(result) }
			//Finally, run original success callback on this
			successCallback(newRequestResp);

		}, failureCallback);
	},

	// Get Labels
	get_labels: (successCallback, failureCallback) => {
		let trello_path = MyTrello.GetFullTrelloPath("get_labels", `boardID=board_id`);
		myajax.GET(trello_path,successCallback, failureCallback);
	},

	// Get a set of Trello Lists
	get_lists: (listState, successCallback, failureCallback) => {
		let filter = (listState.startsWith("close")) ? "closed" : "open";
		let trello_path = MyTrello.GetFullTrelloPath("get_lists", `boardID=board_id&filter=${filter}`);
		myajax.GET(trello_path,successCallback, failureCallback);
	},

	// // Gets the set of Trello Lists
	// get_open_lists: (successCallback, failureCallback) => {
	// 	let trello_path = MyTrello.GetFullTrelloPath("get_lists", `boardID=board_id&filter=open`);
	// 	myajax.GET(trello_path,successCallback, failureCallback);
	// },

	// // Get the archived lists
	// get_closed_lists: (successCallback, failureCallback) => {
	// 	let trello_path = MyTrello.GetFullTrelloPath("get_lists", `boardID=board_id&filter=closed`);
	// 	myajax.GET(trello_path,successCallback, failureCallback);
	// },

	// Gets a single trello cards
	get_single_card: (cardID, successCallback, failureCallback) => {
		let trello_path = MyTrello.GetFullTrelloPath("get_single_card", `cardID=${cardID}`);
		myajax.GET(trello_path,successCallback, failureCallback);
	},


/*** CREATE Calls ***/

	// Create a new list
	create_list: (listName,successCallback, failureCallback) => {
		let trello_path = MyTrello.GetFullTrelloPath("create_list", `boardID=board_id&name=${listName}`);
		myajax.POST(trello_path,"",{},successCallback, failureCallback);
	},

	// Creates a new Trello Card
	create_card: (listID, cardName, successCallback, failureCallback) => {
		let trello_path = MyTrello.GetFullTrelloPath("create_card", `name=${cardName}&idList=${listID}&pos=top`);
		myajax.POST(trello_path,"",{},successCallback, failureCallback);
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

	update_card_custom_field: (cardID, customFieldID, newCustomFieldvalue, successCallback, failureCallback) => {
		var obj = { "value":{ "text":newCustomFieldvalue } };
		var encoded = JSON.stringify(obj);
		let trello_path = MyTrello.GetFullTrelloPath("update_card_custom_field", `cardID=${cardID}&customFieldID=${customFieldID}`);
		console.log(trello_path);
		console.log(encoded);
		myajax.POST(trello_path,encoded,{},successCallback, failureCallback);
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
}