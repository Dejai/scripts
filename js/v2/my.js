/**********************************************************************************************************
Name: My
Description: A set of constant JS objects that I can reference on other pages easily. Formerly "common.js"
Author: Derrick Fyfield
Version: 2
Dependencies:
	n/a
**********************************************************************************************************/

// Auth manager;
const MyAuth = {
	AuthUrl: "https://auth.dejaithekid.com",

	onAuthAction: async (action="logout") => {
		action = (action == undefined) ? "logout" : action;
		// Get the path to return to
		var returnPath = encodeURIComponent(location.href);
		var actionPath = `${MyAuth.AuthUrl}/${action}/?return=${returnPath}`;
		MyUrls.navigateTo(actionPath);
	},

	// Handle the login page loading
	onLogin: async () => {
		try {
			var isLoggedIn = await MyAuth.isLoggedIn();
			if(isLoggedIn){
				MyUrls.navigateTo(document.referrer);
			} else { 
				MyAuth.showLogins();
			}
		} catch (err) {
			MyDom.showContent(".showOnLoginFail");
		}
	},

	// Handle th logout page loading
	onLogout: async () => {
		try{
			await MyAuth.getSessionDetails("logout");
			// Go back to the prev page
			MyUrls.navigateTo(document.referrer);
		} catch(err){
			MyDom.showContent(".showOnLogoutFail");
		}
	},

	// Get login details about the current user
	onGetLoginDetails: async () => {
		var sessionDetails = await MyAuth.getSessionDetails("active");
		var isLoggedIn =(sessionDetails?.active ?? false);
		var userDetails = sessionDetails?.user ?? {};
		var userKey = userDetails?.Key ?? "";
		return {
			"IsLoggedIn": isLoggedIn,
			"FirstName": userDetails?.FirstName ?? "",
			"LastName": userDetails?.LastName ?? "",
			"UserKey": userKey
		};
	},

	// Show the login frame
	showLogins: (message="") => {
		var frame = document.querySelector("#dtk-LoginFrame");
		if(frame != undefined){
			var messageParam = (message != "") ? `?message=${message}`: "";
			frame.src = `${MyAuth.AuthUrl}/logins/` + messageParam;
			MyDom.showContent("#dtk-LoginFrame");
		}
		// If showing login section, then listen for login details
		MyAuth.listenForLogin();
	},

	// Listen for post messages from the login frame;
	listenForLogin: () => {
		var authUrl = new URL(MyAuth.AuthUrl);
		var authOrigin = authUrl.origin;
		MyLogger.LogInfo("Adding listener for post messages via: " + authOrigin);
		window.addEventListener("message", (event)=>{
			if(event.origin != authOrigin){
				return;
			}
			const eventJson = JSON.parse(event.data);
			// If successful, return to referrer; 
			if( eventJson?.status == 200 ){
				MyUrls.navigateTo(document.referrer);
			}
		});
	},

	// Check if login was successful or failed
	isLoggedIn: async () => {
		var details = await MyAuth.getSessionDetails("active");
		var isLoggedIn = (details?.active ?? false)
		return isLoggedIn
	},

	// Check cookie/session & take given action
	getSessionDetails: async(action) => {
		var results = {};
		var postCall = `${MyAuth.AuthUrl}/session/${action}`;
		results = await MyFetch.call("POST", postCall);

		// Set the status of the session state; Also set the UserKey (if provided)
		var isActive = (results?.active ?? false);
		var userKey = results?.user?.Key ?? "";
		var sessionCookieName = MyCookies.getCookieName("Session");
		var userKeyCookieName = MyCookies.getCookieName("UserKey");
		var _session = (isActive) ? MyCookies.setCookie(sessionCookieName, isActive) : MyCookies.deleteCookie(sessionCookieName);
		var _userKey = (isActive) ? MyCookies.setCookie(userKeyCookieName, userKey) : MyCookies.deleteCookie(userKeyCookieName);
		return results;
	}

}

// Manage cookies
const MyCookies = {

	// Get a cookie by name
	getCookie: (cookieName) => {
		
		// Set default return value
		returnValue = undefined;

		// Get all the cookies; Split up into list
		let decodedCookies = decodeURIComponent(document.cookie);
		let cookieList = decodedCookies.split(";");

		// Loop through cookies
		for(let idx = 0; idx < cookieList.length; idx++)
		{
			cookie = cookieList[idx];
			cookiePair = cookie.split("=");

			cName = (cookiePair[0] ?? "").trim();
			cValue = (cookiePair[1] ?? "").trim();

			if (cName != cookieName) continue; 

			// Set the return value to the value of the cookie;
			returnValue = cValue; 
		}

		return returnValue;
	},

	// Set a cookie; Expiration provided in minutes;
	setCookie: (cookieName, cookieValue, attributes={}) => { // expirationMins=undefined, cookiePath=undefined){

		// Base cookie;
		var cookie = `${cookieName}=${cookieValue}`;

		// If no path is specified, default to /
		if(!attributes.hasOwnProperty("path")){
			attributes["path"] = "/"
		}

		// Loop through any attributes and set them as well;
		Object.keys(attributes)?.forEach( (key)=> {
			var val = attributes[key];
			var attr = ` ; ${key}=${val}`;
			cookie += attr;
		});

		// Set the cookie
		document.cookie = cookie;
	},

	// "Delete" a cookie by expiring it
	deleteCookie: (cookieName) => {
		MyCookies.setCookie(cookieName, "-", {"Max-Age":0} );
	},

	// Get a structured cookie name
	getCookieName: (suffix) => {
		var suffixUpper = suffix.toUpperCase();
		return `DTK-${suffixUpper}`;
	},

	// Get an expiration date based on mins
	getExpirationDate: (mins) => { 
		var expDate = "";
		if(mins != undefined){
			var expirationDate = new Date();
			expirationDate.setTime(expirationDate.getTime() + (mins*60000)); // 60,000 milliseconds seconds a minute;
			var utcDate = expirationDate.toUTCString();
			expDate = `${utcDate};`;
		}
		return expDate;
	},

	// Get a cookie as a header
	getCookieAsHeader(cookieName, existingHeaders=undefined){
		var headers = existingHeaders ?? new Headers();
		var dtkCookieName = MyCookies.getCookieName(cookieName);
		var cookieValue = MyCookies.getCookie(dtkCookieName) ?? "";
		if(cookieValue != ""){
			headers.append(dtkCookieName, cookieValue);
		}
		return headers;
	}
}

// Used for general DOM things
const MyDom = {

	// What to do once the doc is loaded. 
	ready: (callback) =>{
		document.addEventListener("DOMContentLoaded", callback);
	},

	// Add a test banner to indicate this is a test run;
	addTestBanner: function(content=undefined){

		let default_content = `TEST`

		let banner = document.createElement("div");
		banner.setAttribute("style", "text-align:center;background-color:red; color:white;font-size:200%;");
		banner.textContent = (content != undefined) ? content : default_content;

		let body = document.querySelector("body");
		body.insertBefore(banner, body.firstChild);
	},

	// Show content based on query selector
	showContent: function(selector, parent=undefined){
		this._toggleClass(selector, "remove", "hidden", parent);
	},

	// Hide based on query selector
	hideContent: function(selector, parent=undefined){
		this._toggleClass(selector, "add", "hidden", parent);
	},

	// Set the content of an HTML element
	setContent: function(selector,contentObj,append=false){
		try
		{
			let elements = document.querySelectorAll(selector);

			let contentKeys = Object.keys(contentObj);

			elements.forEach( (ele)=>{

				// Loop through the keys passed in, and set those if the element has that as a property
				contentKeys.forEach( (key)=>{
					let existingProperty = ele[key];
					if(existingProperty != undefined) {
						let newValue = contentObj[key] 
						ele[key] = (append) ? existingProperty + newValue : newValue;
					}
					// If it is a data attribute, just set it
					if(key.startsWith("data-")){
						ele.setAttribute(key, contentObj[key]);
					}
				});
			});
			
		} 
		catch (err)
		{
			MyLogger.LogError(err);
		}
	},

	// Get the content of an HTML element
	getContent: function(selector) {

		let content = {"innerText":undefined, "innerHTML":undefined, "value":undefined }
		try 
		{
			let ele = document.querySelector(selector);
			if(ele != undefined)
			{
				content["innerText"] = ele.innerText;
				content["innerHTML"] = ele.innerHTML;
				content["value"] = ele.value ?? undefined;
			}	
		} 
		catch (err)
		{
			MyLogger.LogError(err);
		}
		finally
		{
			return content;
		}
	},

	// Given the ID of a form section, get all the fields that have a [name]
	getFormDetails: (formID) => {
		var formSelector = formID?.replace("#", "");
		var formFields = document.querySelectorAll(`#${formSelector} [name]`);
		var details = { "fields": {}, "errors": [] };
		for(var field of formFields) {
			var key = field?.name ?? "";
			var val = field?.value ?? "";
			var req = field?.hasAttribute("required");
			if(req && val == ""){
				details.errors.push(`${key} is required`);
			}
			if (key != ""){
				details.fields[key] = val;
			}
		}
		return details;
	},

	// Fill out a form with values from a given object
	fillForm: (formID, formObj) => {
		var formSelector = formID?.replace("#", "");
		var formFields = document.querySelectorAll(`#${formSelector} [name]`);
		var objectKeys = Object.keys(formObj);
		for(var field of formFields){
			var fieldKey = field.getAttribute("name");
			var pascalKey = fieldKey.substring(0,1).toUpperCase() + fieldKey.substring(1);
			if(objectKeys.includes(pascalKey)){
				field.value = formObj[pascalKey];
				if(field.tagName == "TEXTAREA"){
					field.innerText = formObj[pascalKey];
				}
			}
		}
		// for(var key of Object.keys(formObj)) {
		// 	var camelKey = key.substring(0,1).toLowerCase() + key.substring(1);
		// 	var fieldValue = formObj[key];
		// 	var field = document.querySelector(`#${formSelector} [name="${camelKey}"]`);
		// 	if(field != undefined){
		// 		field.value = fieldValue;
		// 		if(field.tagName == "TEXTAREA") {
		// 			field.innerText = fieldValue;
		// 		} 
		// 	}
		// }
	},

	addClass: function(selector, className, parent=undefined){
		MyDom._toggleClass(selector, "add", className, parent);
	},

	removeClass: function(selector, className, parent=undefined){
		MyDom._toggleClass(selector, "remove", className, parent);
	},

	replaceClass: (selector, oldClass, newClass, parent=undefined) => {
		MyDom.addClass(selector, newClass, parent);
		MyDom.removeClass(selector, oldClass, parent);
	},
	
	// A public warapper for the helper function within
	toggleClass: function(selector, action, className){
		MyDom._toggleClass(selector, action, className);
	},
	
	_toggleClass: function(selector, action, className, parent=undefined){
		try
		{
			let elements = (parent != undefined) ? parent.querySelectorAll(selector) : document.querySelectorAll(selector);
			elements = Array.from(elements);
			if(elements != undefined)
			{
				elements.forEach(function(obj){
					if(action == "add")
					{
						obj.classList.add(className);
					}
					else if(action == "remove")
					{
						obj.classList.remove(className);
					}
				});
			}
		} 
		catch(error)
		{
			MyLogger.LogError(error);
		}
	}

};

// Using the Fetch API to handle web requests;
const MyFetch = {

	// Make the fetch call;
	call: async(method, url, fetchObj={}) => {
		var responseType = MyFetch._getResponseType(fetchObj);
		var fetchObject = MyFetch._getFetchObject(method, fetchObj);
		var resp = await fetch(url, fetchObject);
		var data = await MyFetch._getResponseData(resp, responseType);
		return data;
	},

	// Get response type 
	_getResponseType: (fetchObj) => {
		var responseType = "json"
		if(fetchObj.hasOwnProperty("responseType")){
			responseType = fetchObj["responseType"]
		}
		return responseType;
	},

	// Get the full fetch object (removing response type if it has it)
	_getFetchObject: (method, fetchObj) => {
		fetchObj["method"] = method;
		fetchObj["credentials"] = "include";
		if(fetchObj.hasOwnProperty("responseType")){
			delete fetchObj["responseType"]
		}
		return fetchObj;
	},

	// Get the response in a certain format
	_getResponseData: async (response, responseType) => {
		var data = undefined;
		switch(responseType)
		{
			case "text":
				data = await response.text();
				break;
			default:
				data = await response.json();
		}
		return data;
	},
}

// Misc. helper things
const MyHelper = {
	_getRandomLetter: () => {
		var characters = "abcdefghijklmnopqrstuvwxyz";
		var randChar = Math.floor(Math.random()*characters.length);
		return characters[randChar].toUpperCase();
	},

	_getRandomDigit: () => {
		var digits = "0123456789";
		var randChar = Math.floor(Math.random()*digits.length);
		return digits[randChar];
	},

	_getRandomCharacter: () => {
		var coin = Math.floor(Math.random()*2);
		return (coin == 1) ? MyHelper._getRandomDigit() : MyHelper._getRandomLetter();
	},

	_isReservedCode: function(code){
		var reserved = ["DEMO", "TEST"];
		return reserved.includes(code.toUpperCase());
	},

	// Determines if the given value is a valid type
	isValidValue : function(type, value)
	{
		let isValid = false;
		let typedValue = undefined; 
		let expectedType = type.toLowerCase();

		switch(expectedType)
		{
			case "number":
				isValid = ( !isNaN(Number(value)) );
				typedValue = (isValid) ? Number(value) : value;
				break;
			case "string":
				isValid = (value != undefined && value != "");
				typedValue = (isValid) ? value.toString() : value;
				break;
			case "function":
				isValid = (typeof(value) == "function")
				typedValue = value;
				break;
			default:
				isValid = false;
		}
		return {"success": isValid, "value":typedValue }
	},

	getCode: function(numChars=4, use="letters"){
		let chars = "";

		for(var idx = 0; idx < numChars; idx++)
		{
			chars += (use == "mix") ? MyHelper._getRandomCharacter() : (use == "digits") ? MyHelper._getRandomDigit() : MyHelper._getRandomLetter();
		}

		var code = ( MyHelper._isReservedCode(chars) ) ? MyHelper.getCode() : chars;
		return code;
	},

	getDate: function(format=undefined){
		let dd = new Date();

		// Get the year; Replaces "yyyy" or "YYYY" in the format;
		let year = dd.getFullYear().toString();
		
		// Get the month; Replaces "MM" in the format
		let monthIdx = dd.getMonth()+1;
		let month = (monthIdx < 10) ? "0"+monthIdx : monthIdx;
		
		// Get the day of the month; Replaces "dd" in the format
		let dayIdx = dd.getDate();
		let day = (dayIdx < 10) ? "0"+dayIdx : dayIdx;
		
		// Get the hour; Replaces "H" in the format;
		let hour24 = dd.getHours();
		let hour = hour24 > 12 ? hour24 - 12 : hour24;
		hour = (hour < 10) ? "0"+hour : hour;

		// Get the minute; Replaces "m" in the format;
		let minute = dd.getMinutes();
		minute = (minute < 10) ? "0"+minute : minute;

		// Get the seconds; Replaces "s" in the format;
		let seconds = dd.getSeconds();
		seconds = (seconds < 10) ? "0"+seconds : seconds;
		
		// Get the state of the day (AM vs PM); Replaces "K" in the format
		let state = (hour24 >= 12) ? "PM" : "AM";

		// What to return;
		var result = undefined; 
		if(format != undefined)
		{
			let dt = format.replace("YYYY",year)
					.replace("yyyy",year)
					.replace("MM",month)
					.replace("dd",year)
					.replace("H",hour)
					.replace("m",minute)
					.replace("s",seconds)
					.replace("K",state);
			
			result = dt;
		}
		else
		{
			var dateObj = { 
							"year":year,
							"month":month,
							 "day":day,
							"hour":hour,
							"minute":minute,
							"seconds":seconds,
							"state":state
						};
			result = dateObj;
		}

		return result;
	},

	getDateFormatted: function(format=undefined){
		let date = Helper.getDate();
		let year = date["year"];
		let month = date["month"];
		let day = date["day"];

		let dateFormatted = `${year}-${month}-${day}`;
		switch(format)
		{
			case "yyyy/mm/dd":
				dateFormatted = `${year}/${month}/${day}`;
				break;
			default:
				dateFormatted = `${year}-${month}-${day}`;
				break;
		}
		return dateFormatted
	},

	// Helper for the "getValueFromJson" function below
	getKeyOrIndex: (value) => {
		let keyVal = value;
		if( value.startsWith("[") && value.endsWith("]")){
			let indexVal = value.replaceAll("[", "").replaceAll("]", "");
			let indexNum = Number(indexVal);
			// Only set index if it is a number;
			if(!isNaN(indexNum)){ keyVal = indexNum; } 
		}
		return keyVal;
	},

	// Traverse down a JSON object to get a value (recursive)
	getValueFromJson: (parentObject, selector, filterValues=[]) => {
		
		// Default response 
		if(parentObject == undefined){ return undefined; }
		if( (selector?.length ?? 0) == 0){ return parentObject; }

		// Try to be recursive
		try {
			// Get the key(s) to search on
			var keys = selector.split(".");
			var key = MyHelper.getKeyOrIndex(keys.shift());

			// The recursive checking .......................................................
			var child = undefined;
			
			// If a parent is a list, then use colon syntax to filter; or default filter to the first one
			if(key.includes(":")) {
				var keyAttrSplit = key.split(":");
				key = keyAttrSplit[0];
				var col = keyAttrSplit[1] ?? "";
				var filterVal = filterValues?.shift();
				child = parentObject[key]?.filter(x => x[col] == filterVal )?.[0] ?? undefined;
			} else if(parentObject[key]?.filter != undefined) {
				child = parentObject[key][0];
			} else {
				child = parentObject[key] ?? undefined;
			}
			return MyHelper.getValueFromJson(child, keys.join("."), (filterValues ?? []) );

		} catch (err) {
			MyLogger.LogError(err);
			return "ERROR";
		}
	}
}

// Used for logging
const MyLogger = { 

	LoggedMessages: [],

	_LogMessage: (message, type, silent=false) => {
		var logMessage = new MyMessage(type, message);
		MyLogger.LoggedMessages.push(logMessage);
		if(silent){  return; }
        console.log(logMessage);
	},

	LogInfo: (message, silent=false) => {
		MyLogger._LogMessage(message, "Info", silent);
	},

	LogError: (message, silent=false) => {
		MyLogger._LogMessage(message, "Error", silent);
	},

	// Print all the logs
	PrintLogs: () => {
		MyLogger.LoggedMessages?.forEach( (msg) =>{
			console.log(msg);
		});
	},

	// Add a message to the page to notify user of something
	Notify: (selector, message, append=false) => {
		MyDom.setContent(selector, {"innerHTML": message}, append);
	}

}

// Custom class used to easily identify my log messages
class MyMessage {
    constructor(type, message){
        this.Type = type;
        this.Message = message;
    }
}

// A way to add a quick/simple search bar in a designated container on a page
const MySearcher = { 

	// / Add a search bar to a designated
	addSearchBar: (contentName, contentContainerID, searchContainerID) => {
        try {
            searchContainerID = "#" + (searchContainerID?.replaceAll("#", "") ?? "");
            var searchContainer = document.querySelector(searchContainerID);
            if(searchContainer != undefined){
                searchContainer.innerHTML = `<div class="searchBarSection">
                                                <input class="searchBarInput" type="text" data-search-content-id="${contentContainerID}" placeholder="Search ${contentName} ... ">
                                                <i id="" class="fa-solid fa-xmark hidden searchClearIcon searchIcons pointer" aria-hidden="true" onclick="onClearSearch()"></i>
                                            </div>`;
            
                // Add a listener to the search bar
                var input = searchContainer.querySelector(".searchBarInput");
                if(input != undefined){
                    input.addEventListener("keyup", MySearcher.onSearchInput);
                }
            }
        } catch (err) {
            console.error(err);
        }
    },

	// In this context, the "this" becomes the input element
    onSearchInput(){
        var contentID = this.getAttribute("data-search-content-id") ?? "";
		contentID = "#" + contentID?.replaceAll("#", "");

		// Get the key pieces of the search puzzle.
        var content = document.querySelectorAll(contentID + " .searchable");
        var inputVal = this.value ?? "";
		
		//  Loop through all ".searchable" content & show/hide according to input; 
        for(var row of content){
            if(inputVal == ""){
                row.classList.remove("searchableHidden");
            } else { 
                var rowContent = row.innerText?.toLowerCase() ?? "";
                var search = inputVal.toLowerCase();
                if(rowContent.includes(search)){
                    row.classList.remove("searchableHidden");
                } else { 
                    row.classList.add("searchableHidden");
                }
            }
        }
    }
}

// If voice things are needed
const MySpeaker = {

	voicesMap: {"One":"Two"},
	selectedVoice: undefined,

	getListOfVoices: function(){
		let synth = window.speechSynthesis;
		var voices = synth.getVoices();

 		for(i = 0; i < voices.length ; i++) {
			var current_voice = voices[i];
			if (current_voice.lang.includes("en") && !current_voice.name.includes("Google"))
			{
				if(Speaker.selectedVoice == undefined)
				{
					Speaker.selectedVoice = current_voice;
				}
			  	Speaker.voicesMap[current_voice.name] = voices[i];
			}
		}
	},

	loadVoiceOptions: function(){
		// this.getListOfVoices();
		if (speechSynthesis.onvoiceschanged !== undefined) {
		  speechSynthesis.onvoiceschanged = Speaker.getListOfVoices;
		}
	},

	generateSelectListOfVoices: function(selector){
		var voiceSelect = document.querySelector(selector);
	},

	getSelectedVoice: function(){
		return Speaker.selectedVoice;
	},

	setSelectedVoice: function(name){
		
		let voice = Speaker.voicesMap[name];
		if(voice != undefined)
		{
			Speaker.selectedVoice = voice;
		}
	},

	//  Generic value for speaking text value
	speakText: function(text, subtext=undefined, rate=0.9, subrate=0.6, pause=2000){
		let synth = window.speechSynthesis;
		
		// https://dev.to/asaoluelijah/text-to-speech-in-3-lines-of-javascript-b8h
		var msg = new SpeechSynthesisUtterance();
		msg.rate = rate;
		msg.text = text;
		selectedVoice = this.getSelectedVoice()
		if(selectedVoice != undefined)
		{
			msg.voice = selectedVoice;
		}
		synth.speak(msg);

		if (subtext != undefined)
		{
			stillSpeaking = setInterval(function(){
				if(!synth.speaking)
				{
					MyLogger.LogInfo("Done Speaking");
					clearInterval(stillSpeaking);
					
					//  Do the sub description 
					setTimeout(function(){
						msg.text = subtext;
						msg.rate = subrate;
						synth.speak(msg);
					}, pause);
				}
			}, 500);
		}
	},
}

// A way to load templates into documents
const MyTemplates = {

	// Get templates the async way
	getTemplateAsync: async (filePath, object) => {

		var results = "";
		var template = await MyFetch.call("GET", filePath, {"responseType": "text"});
		var placeholders = MyTemplates.getTemplatePlaceholders(template);

		if(object != undefined){
			var listOfObjects = (object.length == undefined) ? [object] : object;
			listOfObjects.forEach( (obj)=> {
				results += MyTemplates.replacePlaceholders(template, placeholders, obj);
			});
		}
		return results;
	},

	// Given a template, just fill it in with the given object
	fillTemplateAsync: async(template, object) => {
		var results = "";
		var placeholders = MyTemplates.getTemplatePlaceholders(template);
		if(object != undefined) {
			var listOfObjects = (object.length == undefined) ? [object] : object;
			listOfObjects.forEach( (obj)=> {
				results += MyTemplates.replacePlaceholders(template, placeholders, obj);
			});
		}
		return results;
	},

    // Main function to get a specific template (based on file path)
    getTemplate: async (filePath, object, callback) =>   {

		// Use Fetch API to get the template
		MyFetch.call("GET", filePath, {"responseType":"text"} )
			.then( (template) => {
				// The content after template is updated
				var content = "";
							
				// Ensure the object is a list (even if just one);
				var objectList = (object != undefined && object.length == undefined) ? [object] : object;
				objectList = (objectList == undefined)? [{}] : objectList;
				var objectLength = (objectList.length > 0) ? Object.keys(objectList[0]).length : 0;

				// Get the placeholders in this template
				var placeholders = MyTemplates.getTemplatePlaceholders(template);

				// console.log(objectList);
				if(objectLength > 0)
				{
					objectList.forEach( (obj)=>{
						objContent = template;
						placeholders.forEach( (placeholder)=>{
							let keyVal = placeholder.replaceAll("{","").replaceAll("}","");
							let newVal = MyTemplates.getObjectValue(keyVal,obj) ?? "";
							objContent = objContent.replaceAll(placeholder, newVal);
						});
						content += objContent
					});
				}
				else
				{
					// Return empty content if the placeholders can't be replaced;
					content = (placeholders.length == 0) ? template : "";
				}

				// Run the callback function on the content
				callback(content);
			});
    },

	// Scan the template & return all placeholders
    getTemplatePlaceholders:(template)=>{
        let placeholders = [];

        let splits = template.split("{{");
        splits.forEach( (item)=>{
            if(item.includes("}}"))
            {
                let value = item.split("}}")[0];
                let temp = `{{${value}}}`;
                if(!placeholders.includes(temp))
                {
                    placeholders.push(temp);
                }

            }
        });
        return placeholders;
    },

	// Given a key to get & an object, get the value
    getObjectValue: (selector,object)=>{
        
		var keys = selector.split(".");
        value = "";
		var currentObject = object;
        limit = 100; count = 0;
        while (keys.length > 0 && count < limit)
        {
            count++; //counter to prevent infinite loop;
            currKey = keys.shift();
            if(object?.hasOwnProperty(currKey))
            {
                value = object[currKey];
            }
        }
        return value;
    },

	// Replace placeholders in a given template
	replacePlaceholders: (template, placeholders, obj) => {
		var content = template; 
		placeholders.forEach( (placeholder)=>{
			let keyVal = placeholder.replaceAll("{","").replaceAll("}","");
			let newVal = MyHelper.getValueFromJson(obj, keyVal);
			content = content.replaceAll(placeholder, newVal);
		});
		return content;
	}
}

// Used to manage things related to a URL
const MyUrls = {

	navigateTo: (url, targetTab="_top") => {
		window.open(url, target=targetTab);
	},

	// Get the code for the current path
	getCodeFromPath: async () => {
		var fullPath = location.pathname + location.search;
		var encodedPath = encodeURIComponent(fullPath);
		var requestUri = `https://paths.dejaithekid.com/translate/?path=${encodedPath}`;

		// Attempt without a code
		var results1 = await  MyFetch.call("GET",requestUri);
		var code = results1?.code ?? "";
		// Attempt with a new code
		if(code == ""){
			var newCode = MyHelper.getCode(5);
			var results2 = await MyFetch.call("GET", requestUri+`&code=${newCode}`);
			code = results2?.code ?? "";
		}
		return location.origin+"?code="+code;
	},

	// Get path from a given code
	getPathFromCode: async (code="") => {
		var requestUri = `https://paths.dejaithekid.com/translate/?code=${code}`;
		var results = await MyFetch.call("GET", requestUri);
		var path = results?.path ?? "/";
		return path;
	},

	// Auto redirect from code
	redirectFromCode: async () => {
		var code = MyUrls.getSearchParam("code") ?? "";
		var newPath = "/";
		if(code != "") {
			var newPath = await MyUrls.getPathFromCode(code);
			MyUrls.navigateTo(newPath);
		}
	},

	getSearchParam: function(key){
		let map = MyUrls.getSearchValues();
		let value = undefined;
		if(map.hasOwnProperty(key))
		{
			value = map[key]
		}
		return value;
	},

	getSearchValues: function(searchString = undefined){
		var queryMap = {};
		// Get the query string
		var queryString = searchString ?? location.search;
		queryString = queryString.replace("?", "");
		// If empty, just return empty query map
		if(queryString == ""){
			return queryMap;
		}
		// Map all the pairs
		var pairs = queryString.split("&");
		pairs.forEach( (obj) => {
			let splits = obj.split("=");
			queryMap[splits[0]] = splits[1];
		});
		return queryMap;
	},

	// Modify the URL search
	modifySearch(keyValuePairs, replaceWindowHistory=false) {
		var newSearch = MyUrls.getModifiedSearchString(keyValuePairs);
		let newPath = location.pathname + newSearch;
		MyUrls.addWindowHistory({"path":newPath}, true);
	},

	// Replace the URL search with a whole new one
	replaceSearch(keyValuePairs, replaceWindowHistory=false) {
		var newSearch = MyUrls.getModifiedSearchString(keyValuePairs, false);
		let newPath = location.pathname + newSearch;
		MyUrls.addWindowHistory({"path":newPath}, true);
	},

	// Add history to window history (with option to replace or not)
	addWindowHistory(jsonObj, replace=false)
	{
		let state = jsonObj?.state ?? "";
		let path = jsonObj?.path ?? "";
		
		// Replace or add
		if(replace)
		{
			window.history.replaceState(state, "", path);
		}
		else
		{
			window.history.pushState(state, "", path);
		}
	},

	// Given a set of KeyValue pairs, return a new search string
	getNewSearchString(newValues={}){
		var newSearch = "";
		var newKeys = Object.keys(newValues);

		// If no new values, return empty string.
		if(newKeys.length == 0){
			return newSearch;
		}
		// Loop through and set new search
		newKeys.forEach( (key) => {
			let separator = (newSearch == "") ? "?" : "&"
			let val = newValues[key];
			newSearch += `${separator}${key}=${val}`;
		});
		return newSearch;
	},

	// Modify the existing search string
	getModifiedSearchString(keyValuePairs={}, keepExisting=true) {

		// If no key pairs, return empty string;
		if(Object.keys(keyValuePairs).length == 0){
			return "";
		}

		// Get existing search map if flagged to keep; Else, start scratch;
		var searchMap = (keepExisting) ? MyUrls.getSearchValues() : {};

		// Adjust the key value pairs that are already in the search (if necessary)
		Object.keys(keyValuePairs).forEach( (key) => {
			let val = keyValuePairs[key];
			if(val == "" && searchMap.hasOwnProperty(key)){
				delete searchMap[key];
			} else if(val != "") {
				searchMap[key] = val;
			}
		});
		var newSearch = MyUrls.getNewSearchString(searchMap);
		return newSearch;
	},

	// Simple thing to reload the current page; with delay in seconds
	refreshPage: (delay=0)=>{
		var wait = delay * 1000;
		setTimeout( ()=> {
			location.reload();
		}, wait);
	}
}