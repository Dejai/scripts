
/**************** GLOBAL VARIABLES ****************/

// Listing all TestRuns
TestRuns = [];

// Variables/arguments used with the different calls
var Variables = {
	toSave: {
		"get_boards":{
			"matchKey": "name",
			"matchVal": "TO BE DELETED",
			"saveKey": "id",
			"saveTo": "deleteBoardID"
		},
		"get_open_lists": {
			"matchKey": "name",
			"matchVal": "API_TESTING",
			"saveKey": "id",
			"saveTo": "listID"
		},
		"get_custom_fields": {
			"matchKey": "id",
			"matchVal": undefined,
			"saveKey": "id",
			"saveTo": "customFieldID"
		},
		"get_cards": {
			"matchKey": "name",
			"matchVal": "API_TESTING_CARD",
			"saveKey": "id",
			"saveTo": "cardID,apiTestCard"
		},
		"get_single_card": {
			"matchKey": "id",
			"matchVal": undefined,
			"saveKey": "idChecklists[]",
			"saveTo": "checklistID"
		},
		"create_checklist_item": {
			"matchKey": "id",
			"matchVal": undefined,
			"saveKey": "id",
			"saveTo": "checklistItemID"
		}
	},
	awaiting: [],
	arguments: {
		comment: "This is a test comment from the Trello test suite",
		listName: "DELETE_ME_API_TESTING_DELETE_ME",
		listState: "closed",
		checklistItemName: "New Checklist Item Testing",
		newChecklistItemName: "Checklist Item Name - Updated",
		cardName: "Test Card Name",
		newCardDesc: "This is the description for the new card",
		newCardName: "API_TESTING_CARD - updated V2",
		newCustomFieldvalue: "Test Custom Field Value",
		checklistIsComplete: true,
	}
}

/**************** GETTING STARTED ****************/

mydoc.ready(()=>{
	let body = document.querySelector("#trello_tests");
	if (body != undefined)
	{
		loadTests(body);

	}
});

function onSetBoardName(event)
{
	let textField = document.querySelector("#boardNameTextField");
	if(textField != undefined)
	{
		let value = textField.value.toLowerCase().replaceAll(" ","");
		MyTrello.SetBoardName(value);
		mydoc.showContent("#trello_tests_table");
	}
}

function loadTests(body)
{
	let keys = Object.keys(MyTrello);

	let funcs = keys.filter( (key)=>{

		let sub = key.substring(0,key.indexOf("_"));
		let verbs = ["get", "create", "update", "delete"]
		return (verbs.includes(sub));
	});

	let rows = "";

	funcs.forEach( (name)=>{
		let row = `	<tr>
					<td>${name}</td>
					<td>
						<img id="loading_gif_${name}" data-test-name=${name}" src="../assets/img/loading1.gif" class="hidden loading">
						<span id="waiting_message_${name}" data-test-name=${name}" class="waitingMessage hidden">WAITING</span>
						<button id="test_button_${name}" data-test-name=${name}" onclick="onRunTest('${name}')" class="testButton">Test</button>
						<button id="reset_button_${name}" data-test-name=${name}" onclick="onResetTest('${name}')" class="resetButton hidden">RESET</button>
					</td>
					<td><div id="results_${name}"></div></td>
				</tr>
				`;
		rows += row
	});

	body.innerHTML = rows;
}


/**************** RUNNING TESTS ****************/

function onRunAll()
{
	mydoc.hideContent("#runAllButton");
	mydoc.showContent("#resetAllButton");

	document.querySelectorAll("button.testButton").forEach( (button)=>{
		button.click();
	});
}


// Run a test
function onRunTest(key)
{

	// If this test was already ran, don't run again;
	if(TestRuns.includes(key)){ return; }

	// The call back functions (if needed)
	let testCallBack = (data) =>{ parseResults(key,data); }

	// set the test to running
	setTestState(key, "running");

	let trelloFunc = MyTrello[key];
	let expectedArguments = getFuncArgs(trelloFunc);
	let arguments = [];

	// Set the arguments; 
	for(var idx = 0; idx < expectedArguments.length; idx++)
	{
		let key = expectedArguments[idx];
		let val = (key == "successCallback" || key == "failureCallback") ? testCallBack : Variables.arguments[key];
		if(val != undefined)
		{
			arguments.push(val);
		}
	}
	let argsAvailable = expectedArguments.length == arguments.length;

	// Run the function if right args are available
	if(trelloFunc != undefined && argsAvailable)
	{
		trelloFunc(...arguments);
		TestRuns.push(key); // Add this test to the ones that have been run;
	}
	else
	{
		LogMessage("--------------------------------------");
		LogMessage(`${key}: Does not have the right arguments yet`);
		LogMessage(expectedArguments);
		Variables.awaiting.push(`${key}==${expectedArguments}`);
		setTestResults(key, "WAITING", `${expectedArguments}`);
		setTestState(key, "waiting");
	}
}


/**************** HELPERS ****************/

	// Check for waiting functions
	function checkWaitingFunctions(argument)
	{
		Variables.awaiting.forEach((val)=>{

			if(val.includes(argument))
			{
				key = val.split("==")[0];
				LogMessage("Can now run:: " + key);
				onRunTest(key);
			}
		});
	}

	// Get the arguments expected for this function
	function getFuncArgs(func)
	{
		let funcString = func.toString();
		let arguments = funcString
							.substring(funcString.indexOf("(")+1, funcString.indexOf(")"))
							.replaceAll(" ", "")
							.replaceAll("=","")
							.replaceAll("undefined","");
		arguments = arguments.split(",");
		return arguments; 
	}

	// Parse the results of a test
	function parseResults(key,data)
	{
		try
		{
			//The results
			let status = data.status;

			let response = JSON.parse(data.responseText);
			LogMessage("--------------------------------------");
			LogMessage(key);
			LogMessage(data);
			LogMessage(response);
			
			let results = (status >= 200 && status < 300) ? "PASS" : "FAIL" ;
			setTestResults(key, results);
			
			// Should this output save something?
			if(results == "PASS" && Variables.toSave.hasOwnProperty(key))
			{
				saveVariable(key, response);
			}

			// set the test to Completed; Meaning it finished running
			setTestState(key, "completed");
		}
		catch(err)
		{
			setTestState(key, "completed");
			setTestResults(key, "FAIL: " + data.responseText);
		}
		
	}

	// Save a variable
	function saveVariable(key, response)
	{
		console.log("Attempt to save variable");
		let saveObj = Variables.toSave[key];
		let saveKey = saveObj["saveKey"];
		let saveTo = saveObj["saveTo"].split(","); // Accounting for possible multiple save locations
		let matchKey = saveObj["matchKey"];
		let matchVal = saveObj["matchVal"];

		let list = (response.length == undefined) ? [response] : response;  // always work on a list of objects;
		for(var idx = 0; idx < list.length; idx++)
		{
			let respObj = list[idx];
			LogMessage(respObj);
			let val = respObj[matchKey] ?? "";

			if(val.startsWith(matchVal ?? val) )
			{
				LogMessage(`Saving variable!`);
				let saveValue = (saveKey.includes("[]")) ? respObj[saveKey.replace("[]","")][0] : respObj[saveKey];
				Variables.arguments[saveTo] = saveValue;
				saveTo.forEach( (key)=>{
					LogMessage("Saving to: " + key);
					Variables.arguments[key] = saveValue;
					checkWaitingFunctions(key);
				});
				break;
			}
		}
	}

	// Set the test state (running, waiting, default)
	function setTestState(key,state)
	{
		switch(state)
		{
			case "running":
				// Toggle visibility of things
				mydoc.hideContent(`#test_button_${key}`);
				mydoc.showContent(`#loading_gif_${key}`);
				mydoc.hideContent(`#waiting_message_${key}`);
				mydoc.hideContent(`#reset_button_${key}`);
				break;
			case "waiting":
				mydoc.showContent(`#waiting_message_${key}`);
				mydoc.hideContent(`#loading_gif_${key}`);
				mydoc.hideContent(`#test_button_${key}`);
				mydoc.hideContent(`#reset_button_${key}`);
				break;
			case "completed":
				mydoc.hideContent(`#waiting_message_${key}`);
				mydoc.hideContent(`#loading_gif_${key}`);
				mydoc.hideContent(`#test_button_${key}`);
				mydoc.showContent(`#reset_button_${key}`);
				break;
			default:
				mydoc.showContent(`#test_button_${key}`);
				mydoc.hideContent(`#loading_gif_${key}`);
				mydoc.hideContent(`#waiting_message_${key}`);
				mydoc.hideContent(`#reset_button_${key}`);

		}
	}

	// Set the test resutls
	function setTestResults(key,results,desc="")
	{
		let resultDesc = results.toUpperCase();
		if(desc != "")
		{
			resultDesc = "Waiting on <br/>";
			let args = desc.split(",");
			args = args.filter( (arg)=>{
				return (!Variables.arguments.hasOwnProperty(arg));
			});
			resultDesc += args.join(", ");
		}
		document.querySelector(`#results_${key}`).innerHTML = `${resultDesc}`;
		if(resultDesc == "PASS" || resultDesc == "FAIL")
		{
			mydoc.addClass(`#results_${key}`, resultDesc);
			// document.querySelector(`#results_${key}`).classList.add(resultDesc);
		}
		else
		{
			mydoc.removeClass(`#results_${key}`, 'FAIL');
			mydoc.removeClass(`#results_${key}`, 'PASS');
		}
	}

	// Log something
	function LogMessage(message)
	{
		console.log(message);
	}



/**************** RESTTING TESTS ****************/

function onResetAll()
{
	mydoc.showContent("#runAllButton");
	mydoc.hideContent("#resetAllButton");

	document.querySelectorAll("button.resetButton").forEach( (button)=>{
		button.click();
	});
}

// Reset a test
function onResetTest(key)
{

	// Clear the test from TestRuns
	TestRuns = TestRuns.filter( (val) =>{
		return (val != key);
	});

	// Show it is running again
	setTestState(key, "running");

	switch(key)
	{
		case "create_list":
			LogMessage("Cleaning up the test list");
			resetLists(key);
			break;
		case "create_card":
			LogMessage("Cleaning up created cards");
			resetCreatedCards(key);
			break;
		case "create_card_comment":
			LogMessage("Cleaning up test comment");
			resetComments(key);
			break;
		case "create_checklist":
			LogMessage("Cleaning up checklist");
			resetChecklists(key);
			break;
		case "update_card_name":
			LogMessage("Resetting Card Name");
			resetCardName(key);
			break;
		default:
			setTestState(key, "reset");
			setTestResults(key, "");
			return;
	}

}

/**************** HELPERS: RESET FUNCTIONS ****************/

function resetCardName(key)
{
	if(Variables.arguments.apiTestCard  != undefined)
	{
		let cardID = Variables.arguments.apiTestCard;
		let defaultName = Variables.toSave.get_cards.matchVal;

		MyTrello.update_card_name(cardID, defaultName, (data)=>{
			setTestState(key, "reset");
			setTestResults(key, "");
		}, (data)=>{
			setTestState(key, "completed");
			setTestResults(key, "fail");
		});
	}
	else
	{
		setTestState(key, "completed");
		setTestResults(key, "The API Test Card ID is not set yet");
	}
	
}

function resetChecklists(key)
{
	if(Variables.arguments.apiTestCard  != undefined)
	{
		let cardID = Variables.arguments.apiTestCard;

		MyTrello.get_single_card(cardID, (data)=>{

			let resp = JSON.parse(data.responseText);
			let checklists = resp.idChecklists;
			// Get rid of the checklists
			checklists.forEach( (checklistID)=>{
				let path = MyTrello.GetFullTrelloPath('delete_checklist',`&checklistID=${checklistID}`);
				myajax.POST(path,"",(data)=>{
					LogMessage(data);
					setTestState(key, "reset");
					setTestResults(key, "");
				}, (data)=>{
					LogMessage(data);
					setTestState(key, "completed");
					setTestResults(key, "fail");
				});
			});
		});
	}
	else
	{
		setTestState(key, "completed");
		setTestResults(key, "The API Test Card ID is not set yet");
	}
}

function resetComments(key)
{
	if(Variables.arguments.apiTestCard  != undefined)
	{
		let cardID = Variables.arguments.apiTestCard;

		MyTrello.get_comments(cardID ,(comments)=>{

			let commentResp = JSON.parse(comments.responseText);
			commentResp.forEach( (comment)=>{
				let actionID = comment.id;
				let path = MyTrello.GetFullTrelloPath('delete_action',`&actionID=${actionID}`);
				myajax.POST(path,"",(data)=>{
					setTestState(key, "reset");
					setTestResults(key, "");
				},(data)=>{
					setTestState(key, "completed");
					setTestResults(key, "fail");
				});
			});
		});
	}
	else
	{
		setTestState(key, "completed");
		setTestResults(key, "The API Test Card ID is not set yet");
	}
	
}

function resetCreatedCards(key)
{
	if(Variables.arguments.listID  != undefined)
	{
		let listID = Variables.arguments.listID;
		MyTrello.get_cards(listID, (data)=>{
			LogMessage(data);

			let resp = JSON.parse(data.responseText);
			resp.forEach( (card)=>{
				LogMessage(card);
				if(card.name == Variables.arguments.cardName)
				{
					let cardID = card.id;
					let path = MyTrello.GetFullTrelloPath('delete_card',`&cardID=${cardID}`);
					LogMessage(path);
					myajax.POST(path,"",(data)=>{
						LogMessage(data);
						setTestState(key, "reset");
						setTestResults(key, "");
					}, (data)=>{
						LogMessage(data);
						setTestState(key, "completed");
						setTestResults(key, "fail");
					});
				}
			});
		});
	}
	else
	{
		setTestState(key, "completed");
		setTestResults(key, "The List ID is not set yet");
	}
	
}

function resetLists(key)
{
	MyTrello.get_open_lists( (data)=>{

		// Get API call for updating board list
		let resp = JSON.parse(data.responseText);
		let boardID = Variables.arguments.deleteBoardID;
		if(boardID != undefined)
		{
			LogMessage("Moving Lists to Delete Board");
			resp.forEach( (list)=>{
				if(list.name == Variables.arguments.listName)
				{
					listID = list.id;
					let path = MyTrello.GetFullTrelloPath("update_list_to_board",`&listID=${listID}&value=${boardID}`);
					LogMessage(path);
				
					myajax.POST(path,"",(data)=>{
						LogMessage(data);
					});
				}
			});
			setTestState(key, "reset");
			setTestResults(key, "");
		}
		else
		{
			setTestState(key, "completed");
			setTestResults(key, "No valid Board ID is currently set");
		}
	});
}





	

