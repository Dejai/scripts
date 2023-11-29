/*********************************************************************************
Name: TrelloWrapper
Author: Derrick Fyfield
Version: 3
Description: Custom API wrapper for Trello; In this version, each call returns a MyFetch promise
Dependencies:
	- /scripts/js/v2/my.js
**********************************************************************************/ 

class TrelloWrapper {

    constructor(boardName){
        this.BoardName = boardName
        this.Endpoint = "https://trello.dejaithekid.com"

		// Key Elements for the call
		this.Method = "GET";
		this.Command = "";
		this.Params = "";
		this.FetchObject = {};

		// Setup new headers object for Fetch calls;
		this.Headers = new Headers();
    }

    // Get the full API call path for a given command (with optional params)
    GetFullTrelloPath(command, params="") {
        params = (params != "") ? "?" + params : "";
        return `${this.Endpoint}/${this.BoardName}/${command.toLowerCase()}/${params}`;
    }

	// Add the session cookie to the header (if found)
	AddSessionHeader()
	{
		var cookieName = MyCookies.getCookieName("Session");
		var cookieValue = MyCookies.getCookie(cookieName) ?? "";
		if(cookieValue != ""){
			this.Headers.append(cookieName, cookieValue);
		}
		this.AddToFetchObj("headers", this.Headers);
	}

	// Add an attribute to the fetch object
	AddToFetchObj(key, value){
		this.FetchObject[key] = value;
	}

	// Main call - Get full Trello API path and return a fetch call
	TrelloCall(){
		var url = this.GetFullTrelloPath(this.Command, this.Params);
		this.AddSessionHeader(); // Always add the session header if applicable
		return MyFetch.call(this.Method, url, this.FetchObject);
	}

/*** GET Calls ***/

    // Get list of boards;
	GetBoards(){
		this.Method = "GET";
		this.Command = "get_boards";
		this.Params = "";
		return this.TrelloCall();
	}

    // Get a single card (by ID)
    GetCard(cardID){
		this.Method = "GET";
		this.Command = "get_single_card";
		this.Params = `cardID=${cardID}&checklists=all&attachments=true&customFieldItems=true`;
		return this.TrelloCall();
	}

	// Gets a single trello card's actions
	GetCardAttachment(cardID, attachmentID, fileName){
		this.Method = "GET";
		this.Command = "get_card_attachment";
		this.Params = `cardID=${cardID}&attachmentID=${attachmentID}&fileNameID=${fileName}`;
		return this.TrelloCall();
	}

	// Get the custom fields on a card
	GetCardCustomFields(cardID){
		this.Method = "GET";
		this.Command = "get_card_custom_fields";
		this.Params = `cardID=${cardID}`;
		return this.TrelloCall();
	}

	// Get a custom field on a card by its name
	async GetCardCustomFieldByName(cardID, customFieldName){
		var customFields = await this.GetCustomFields();
		var singleField = customFields.filter(x => x.name == customFieldName);
		var cardCustomField = undefined;
		if(singleField != undefined){
			var cardCustomFields = await this.GetCardCustomFields(cardID);
			cardCustomField = cardCustomFields.filter(x => x.idCustomField == singleField.id)?.[0];
		}
		return cardCustomField;
	}

	// Get a list of Trello Cards
	GetCards(listID){
		this.Method = "GET";
		this.Command = "get_cards";
		this.Params = `listID=${listID}`;
		return this.TrelloCall();
	}

	// Get a list of Trello Cards
	async GetCardsByListName(listName) {
		var list = await this.GetListByName(listName);
		var listID = list?.id ?? "";
		var cards = await this.GetCards(listID);
		return cards;
	}

	// Get the details of a checklist
	GetChecklist(checklistID){
		this.Method = "GET";
		this.Command = "get_checklist";
		this.Params = `checklistID=${checklistID}`;
		return this.TrelloCall();
	}

	// Get the comments; Via call = get_actions
	GetComments(cardID){
		this.Method = "GET";
		this.Command = "get_actions";
		this.Params = `cardID=${cardID}&filter=commentCard`;
		return this.TrelloCall();
	}

	// Get Custom Fields;
	GetCustomFields(){
		this.Method = "GET";
		this.Command = "get_custom_fields";
		this.Params = "";
		return this.TrelloCall();
	}

	// Get a custom field specifically by name
	async GetCustomFieldByName(customFieldName){
		var customFields = await this.GetCustomFields();
		var singleField = customFields?.filter(x => x.name == customFieldName);
		return singleField;
	}

	// Get Labels
	GetLabels(){
		this.Method = "GET";
		this.Command = "get_labels";
		this.Params = "";
		return this.TrelloCall();
	}

	// Get a set of Trello Lists
	GetLists(listState="any"){
		this.Method = "GET";
		this.Command = "get_lists";
		var state = (listState.startsWith("close")) ? "closed" : (listState.startsWith("open")) ? "open" : undefined;
		var filter = (state != undefined) ? `filter=${state}` : "";
		this.Params = filter;
		return this.TrelloCall();
	}

	// Get a specific list based on name
	async GetListByName(listName){
		var lists = await this.GetLists();
		var singleList = lists?.filter(x => (x?.name ?? "") == listName)?.[0];
		return singleList;
	}


/*** CREATE Calls ***/

	// Creates a new Trello Card
	CreateCard(listID, cardName) {
		this.Method = "POST";
		this.Command = `create_card`;
		this.Params = `name=${cardName}&idList=${listID}&pos=top`;
		return this.TrelloCall();
	}

	// Creates a new Trello Card
	CreateCardAttachment(cardID, fileName, mimeType, fileObject) {
		// Get path and send
		this.Method = "POST";
		this.Command = "create_card_attachment";
		this.Params = `cardID=${cardID}&mimeType=${mimeType}&name=${fileName}`;
		this.AddToFetchObj("body", fileObject);
		return this.TrelloCall();
	}

	// Add a comment to a card
	CreateCardComment(cardID, comment) {
		this.Method = "POST";
		this.Command = "create_card_comment";
		this.Params = `cardID=${cardID}&text=${comment}`;
		return this.TrelloCall();
	}

	// Create a new checklist
	CreateChecklist(cardID) {
		this.Method = "POST";
		this.Command = "create_checklist";
		this.Params = `name=Media&idCard=${cardID}`;
		return this.TrelloCall();
	}

	// Create an individual checklist item
	CreateChecklistItem(checklistID, checklistItemName) {
		this.Method = "POST";
		this.Command = "create_checklist_item";
		this.Params = `checklistID=${checklistID}&name=${checklistItemName}`;
		return this.TrelloCall();
	}

	// Create a new list
	CreateList(listName) {
		this.Method = "POST";
		this.Command = "create_list";
		this.Params = `name=${listName}`;
		return this.TrelloCall();
	}

/*** UPDATE Calls ***/

	// Update a custom field on a card specifically by name
	async UpdateCardCustomFieldByName(cardID, customFieldName, newCustomFieldvalue){
		var customField = await this.GetCustomFieldByName(customFieldName);
		var customFieldID = customField?.id; 
		// Update the given field name
		var obj = { "value":{ "text":newCustomFieldvalue } };
		var encoded = JSON.stringify(obj);
		// Send off call
		this.Method = "POST";
		this.Command = "update_card_custom_field";
		this.Params = `cardID=${cardID}&customFieldID=${customFieldID}`;
		this.AddToFetchObj("body", encoded);
		return this.TrelloCall();
	}

	// Update the description on a card
	UpdateCardDescription(cardID, newCardDesc) {
		let obj = { "desc": newCardDesc };
		var encoded = JSON.stringify(obj);
		this.Method = "POST";
		this.Command = "update_card";
		this.Params = `cardID=${cardID}&desc=${newCardDesc}`;
		this.AddToFetchObj("body", encoded);
		return this.TrelloCall();
	}

	// Add a label on a card
	UpdateCardLabel(cardID, labelID) {
		this.Method = "POST";
		this.Command = "update_card_label";
		this.Params = `cardID=${cardID}&value=${labelID}`;
		return this.TrelloCall();
	}

	// Update the Card's list
	UpdateCardList(cardID, newListID) {
		this.Method = "POST";
		this.Command = "update_card";
		this.Params = `cardID=${cardID}&idList=${newListID}&pos=top`;
		return this.TrelloCall();
	}

	// Update the name of a card
	UpdateCardName(cardID, newCardName) {
		this.Method = "POST";
		this.Command = "update_card";
		this.Params = `cardID=${cardID}&name=${newCardName}`;
		return this.TrelloCall();
	}

	// Update the state of a checklist item (complete or incomplete)
	UpdateChecklistItemState(cardID, checklistItemID, checklistIsComplete) {
		let state = (checklistIsComplete) ? "complete" : "incomplete";
		this.Method = "POST";
		this.Command = "update_checklist_item";
		this.Params = `cardID=${cardID}&checklistItemID=${checklistItemID}&state=${state}`;
		return this.TrelloCall();
	}

	// Update the value of a checklist item;
	UpdateChecklistItemValue(cardID, checklistItemID, newChecklistItemName) {
		this.Method = "POST";
		this.Command = "update_checklist_item";
		this.Params = `cardID=${cardID}&checklistItemID=${checklistItemID}&name=${newChecklistItemName}`;
		return this.TrelloCall();
	}

	// Update the state of a list (open or closed)
	UpdateListState(listID, newListState, newListName) {
		let state = (newListState == "closed") ? "true" : "false";
		this.Method = "POST";
		this.Command = "update_list";
		this.Params = `listID=${listID}&name=${newListName}&closed=${state}`;
		return this.TrelloCall();
	}


/*** DELETE Calls ***/

	// Delete a card attachment
	DeleteCardAttachment(cardID, attachmentID){
		this.Method = "POST";
		this.Command = "delete_card_attachment";
		this.Params = `cardID=${cardID}&attachmentID=${attachmentID}`;
		return this.TrelloCall();
	}

	// Remove a comment from a card
	DeleteCardComment(cardID, commentID){
		this.Method = "POST";
		this.Command = "delete_card_comment";
		this.Params = `cardID=${cardID}&commentID=${commentID}`;
		return this.TrelloCall();
	}

	// Remove a card label
	DeleteCardLabel(cardID, labelID){
		this.Method = "POST";
		this.Command = "delete_card_label";
		this.Params = `cardID=${cardID}&labelID=${labelID}`;
		return this.TrelloCall();
	}

}