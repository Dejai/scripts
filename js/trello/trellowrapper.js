/*********************************************************************************
	TrelloWrapper: Custom API wrapper for Trello
				Dependent on the "common.js" file being loaded as well
**********************************************************************************/ 

class TrelloWrapper {

    constructor(boardName){
        this.BoardName = boardName
        this.EndPoint = "https://trello.the-dancinglion.workers.dev"
    }
    // Get the full API call path for a given command (with optional params)
    #GetFullTrelloPath(command, params="") {
        params = (params != "") ? "?" + params : "";
        return `${this.Endpoint}/${this.BoardName}/${command.toLower()}/${params}`;
    }

    // Get a modified response text
    #GetModifiedReponse(code=404, text="[]"){
        return { status: code, responseText: JSON.stringify(text) }
    }

/*** GET Calls ***/

    // Get list of boards;
	GetBoards(successCallback, failureCallback){
		let trello_path = this.#GetFullTrelloPath("get_boards");
		myajax.GET(trello_path,successCallback, failureCallback);
	}

	// Get Custom Fields;
	GetCustomFields(successCallback, failureCallback){
		let trello_path = this.#GetFullTrelloPath("get_custom_fields");
		myajax.GET(trello_path, successCallback, failureCallback);
	}

	// Get a custom field specifically by name
	GetCustomFieldsByName(customFieldName, successCallback, failureCallback){
		this.GetCustomFields( (customFieldData)=>{
			let fieldsResp = JSON.parse(customFieldData.responseText);
			let singleField = fieldResp.filter( val => val.name == customFieldName);
			let modResp = this.#GetModifiedReponse(customFieldData.status, singleField);
			var _return = (modResp.status == 200 ) ? successCallback(modResp) : failureCallback(modResp);
		}, failureCallback)
	}

    // Get a single card (by ID)
    GetCard(cardID, successCallback, failureCallback){
		let trello_path = this.#GetFullTrelloPath("get_single_card", `cardID=${cardID}&checklists=all&attachments=true&customFieldItems=true`);
		myajax.GET(trello_path,successCallback, failureCallback);
	}

	// Get a list of Trello Cards
	GetCards(listID, successCallback, failureCallback){
		let trello_path = this.#GetFullTrelloPath("get_cards", `listID=${listID}`);
		myajax.GET(trello_path,successCallback, failureCallback);
	}

	// Get a list of Trello Cards
	GetCardsByListName(listName, successCallback, failureCallback){
		this.GetListByName(listName, (listData)=>{
			let listResp = JSON.parse(listData.responseText);
			let listID = listResp[0]?.id;
			if(listID != undefined)
			{
				let trello_path = this.#GetFullTrelloPath("get_cards", `listID=${listID}`);
				myajax.GET(trello_path,successCallback, failureCallback);
			}
			else
			{
				failureCallback(listData);
			}
		});
	}

	// Get the comments; Via call = get_actions
	GetComments(cardID, successCallback, failureCallback){
		let trello_path = this.#GetFullTrelloPath("get_actions", `cardID=${cardID}&filter=commentCard`);
		myajax.GET(trello_path,successCallback, failureCallback);
	}

	// Gets a single trello card's actions
	GetCardAttachment(cardID, attachmentID, fileName, successCallback, failureCallback){
		let trello_path = this.#GetFullTrelloPath("get_card_attachment", `cardID=${cardID}&attachmentID=${attachmentID}&fileNameID=${fileName}`);
		myajax.GET(trello_path,successCallback, failureCallback);
	}

	// Get the checklist items from a card's checklist
	GetCardChecklistItems(checklistID, successCallback, failureCallback){
		let trello_path = this.#GetFullTrelloPath("get_card_checklist_items", `checklistID=${checklistID}`);
		myajax.GET(trello_path,successCallback, failureCallback);
	}

	// Get the custom fields on a card
	GetCardCustomFields(cardID, successCallback, failureCallback){
		let trello_path = this.#GetFullTrelloPath("get_card_custom_fields", `cardID=${cardID}`);
		myajax.GET(trello_path,successCallback,failureCallback);
	}

	// Get a custom field on a card by its name
	GetCardCustomFieldByName(cardID, customFieldName, successCallback, failureCallback){
		this.GetCustomFields( (data) =>{
			let customFieldsResp = JSON.parse(data.responseText);
            let customField = customFieldsResp.filter( x => x.name == customFieldName);
			if(customField != undefined)
			{
				this.GetCardCustomFields(cardID,(data2)=>{
					let cardFieldsResp = JSON.parse(data2.responseText);
					var result = cardFieldsResp.filter( val => val.idCustomField == customField.id );
                    var modResp = this.#GetModifiedReponse(data2.status, result);
					var _return = (modResp?.status == 200) ? successCallback(modResp) : failureCallback(modResp);
				}, failureCallback);
			}
			else
			{
                var modResp = this.#GetModifiedReponse(400);
				successCallback(modResp);
			}
		}, failureCallback);
	}

	// Get Labels
	GetLabels(successCallback, failureCallback){
		let trello_path = this.#GetFullTrelloPath("get_labels");
		myajax.GET(trello_path,successCallback, failureCallback);
	}

	// Get a set of Trello Lists
	GetLists(listState, successCallback, failureCallback){
		let state = (listState.startsWith("close")) ? "closed" : (listState.startsWith("open")) ? "open" : undefined;
		let filter = (state != undefined) ? `filter=${state}` : "";
		let trello_path = this.#GetFullTrelloPath("get_lists", `${filter}`);
		myajax.GET(trello_path,successCallback, failureCallback);
	}

	// Get a specific list based on name
	GetListByName(listName, successCallback, failureCallback){
		this.GetLists("any", (data)=>{
			let listsResp = JSON.parse(data.responseText);
			let singleList = listsResp.filter(  val => (val.name == listName) );
			let modResp = this.#GetModifiedReponse(data.status, singleList);
            var _return = (data.status == 200) ? successCallback(modResp) : failureCallback(modResp);
		}, failureCallback);
	}


/*** CREATE Calls ***/

	// Create a new list
	CreateList(listName,successCallback, failureCallback) {
		let trello_path = this.#GetFullTrelloPath("create_list", `name=${listName}`);
		myajax.POST(trello_path,"",{},successCallback, failureCallback);
	}

	// Creates a new Trello Card
	CreateCard(listID, cardName, successCallback, failureCallback) {
		let trello_path = this.#GetFullTrelloPath("create_card", `name=${cardName}&idList=${listID}&pos=top`);
		myajax.POST(trello_path,"",{},successCallback, failureCallback);
	}

	// Creates a new Trello Card
	CreateCardAttachment(cardID, fileName, jsonObject, successCallback, failureCallback) {
		var jsonData = JSON.stringify(jsonObject);
		const jsonFile = new File([jsonData], fileName, {
			type: "application/json",
		});
		// Create form data
		const formData = new FormData();
		formData.append("file", jsonFile);
		// Get path and send
		let trello_path = this.#GetFullTrelloPath("create_card_attachment",`cardID=${cardID}&mimeType=application/json&name=${fileName}`)
		myajax.POST(trello_path,formData,{},successCallback, failureCallback);
	}

	// Add a comment to a card
	CreateCardComment(cardID, comment,successCallback, failureCallback) {
		let trello_path = this.#GetFullTrelloPath("create_card_comment", `cardID=${cardID}&text=${comment}`);
		myajax.POST(trello_path,"",{},successCallback, failureCallback);
	}

	// Create a new checklist
	CreateChecklist(cardID,successCallback, failureCallback) {
		let trello_path = this.#GetFullTrelloPath("create_checklist", `name=Media&idCard=${cardID}`);
		myajax.POST(trello_path,"",{},successCallback, failureCallback);
	}

	// Create an individual checklist item
	CreateChecklistItem(checklistID, checklistItemName, successCallback, failureCallback) {
		let trello_path = this.#GetFullTrelloPath("create_checklist_item", `checklistID=${checklistID}&name=${checklistItemName}`);
		myajax.POST(trello_path,"",{},successCallback, failureCallback);
	}


/*** UPDATE Calls ***/

	// Update a custom field on a card specifically by name
	UpdateCardCustomFieldByName(cardID, customFieldName, newCustomFieldvalue, successCallback, failureCallback){
		this.GetCustomFieldsByName(customFieldName, (customFieldData)=>{
			let fieldResp = JSON.parse(customFieldData.responseText);
			let customFieldID = fieldResp[0]?.id;
			// Update the given field name
			var obj = { "value":{ "text":newCustomFieldvalue } };
			var encoded = JSON.stringify(obj);
			let trello_path = this.#GetFullTrelloPath("update_card_custom_field", `cardID=${cardID}&customFieldID=${customFieldID}`);
			myajax.POST(trello_path,encoded,{},successCallback, failureCallback);
		});
	}

	// Update the description on a card
	UpdateCardDescription(cardID, newCardDesc,successCallback, failureCallback) {
		let obj = { "desc": newCardDesc };
		var encoded = JSON.stringify(obj);
		let trello_path = this.#GetFullTrelloPath("update_card", `cardID=${cardID}&desc=${newCardDesc}`);
		myajax.POST(trello_path,encoded,{},successCallback, failureCallback);
	}

	// Update the name of a card
	UpdateCardName(cardID, newCardName, successCallback, failureCallback) {
		let trello_path = this.#GetFullTrelloPath("update_card", `cardID=${cardID}&name=${newCardName}`);
		myajax.POST(trello_path,"",{},successCallback, failureCallback);
	}

	// Add a label on a card
	UpdateCardLabel(cardID, labelID, successCallback, failureCallback) {
		let trello_path = this.#GetFullTrelloPath("update_card_label", `cardID=${cardID}&value=${labelID}`);
		myajax.POST(trello_path, "", {}, successCallback, failureCallback);
	}

	// Update the Card's list
	UpdateCardList(cardID, newListID, successCallback, failureCallback) {
		let trello_path = this.#GetFullTrelloPath("update_card", `cardID=${cardID}&idList=${newListID}&pos=top`)
		myajax.POST(trello_path, "", {}, successCallback, failureCallback);
	}

	// Update the state of a checklist item (complete or incomplete)
	UpdateChecklistItemState(cardID, checklistItemID, checklistIsComplete, successCallback, failureCallback) {
		state = (checklistIsComplete) ? "complete" : "incomplete"
		let trello_path = this.#GetFullTrelloPath("update_checklist_item", `cardID=${cardID}&checklistItemID=${checklistItemID}&state=${state}`);
		myajax.POST(trello_path,"",{},successCallback, failureCallback);
	}

	// Update the value of a checklist item;
	UpdateChecklistItemValue(cardID, checklistItemID, newChecklistItemName, successCallback, failureCallback) {
		let trello_path = this.#GetFullTrelloPath("update_checklist_item", `cardID=${cardID}&checklistItemID=${checklistItemID}&name=${newChecklistItemName}`);
		myajax.POST(trello_path,"",{},successCallback, failureCallback);
	}

	// Update the state of a list (open or closed)
	UpdateListState(listID, newListState, newListName, successCallback, failureCallback) {
		let state = (newListState == "closed") ? "true" : "false"
		let trello_path = this.#GetFullTrelloPath("update_list", `listID=${listID}&name=${newListName}&closed=${state}`);
		myajax.POST(trello_path,"",{},successCallback, failureCallback);
	}


/*** DELETE Calls ***/

	// Delete a card attachment
	DeleteCardAttachment(cardID, attachmentID, successCallback, failureCallback){
		let trello_path = this.#GetFullTrelloPath("delete_card_attachment", `cardID=${cardID}&attachmentID=${attachmentID}`);
		myajax.POST(trello_path,"",{},successCallback,failureCallback);
	}

	// Remove a card label
	DeleteCardLabel(cardID, labelID, successCallback, failureCallback){
		let trello_path = MyTrello.GetFullTrelloPath("delete_card_label", `cardID=${cardID}&labelID=${labelID}`);
		myajax.POST(trello_path, "", {}, successCallback, failureCallback);
	}

}