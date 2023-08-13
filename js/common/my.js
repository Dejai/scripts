/**********************************************************************************************************
Author: Derrick Fyfield
Purpose: A set of constant JS objects that I can reference on other pages easily. :)
**********************************************************************************************************/

// Auth manager;
const MyAuth = {
	AuthUrl: "https://auth.the-dancinglion.workers.dev",

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
			var isLoggedIn = await MyAuth.isLoggedIn();
			console.log(isLoggedIn);
			if(isLoggedIn){
				await MyAuth.logOut();
			}
			// Go back to the prev page
			MyUrls.navigateTo(document.referrer);
		} catch(err){
			MyDom.showContent(".showOnLogoutFail");
		}
	},

	// Checking if user is already logged in (this is on a non-login page)
	onGetLoginDetails: async (attributes={}) => {

		var sessionDetails = await MyAuth.getSessionDetails("active");
		var isLoggedIn =(sessionDetails?.active ?? false);
		var userName = sessionDetails?.user ?? "";

		// The key values to set
		var loginText = attributes?.Login?.Text ?? "LOG IN";
		var loginHref = attributes?.Login?.Href ?? "/auth/login.html";

		var logoutText = attributes?.Logout?.Text ?? "LOG OUT";
		var logoutHref = attributes?.Logout?.Href ?? "/auth/logout.html";

		// The key attributes to set
		var href = (isLoggedIn) ? logoutHref : loginHref;
		var text = (isLoggedIn) ? logoutText : loginText;

        // Set the login/logout links
		var className = attributes?.ClassName ?? "authLink";
        MyDom.setContent(`.${className}`, {
											"href": href, 
											"innerText":text,
											"data-dtk-user": userName
											});
	},

	// Show the login frame
	showLogins: () => {
		var frame = document.querySelector("#dtk-LoginFrame");
		if(frame != undefined){
			frame.src = `${MyAuth.AuthUrl}/logins`;
			MyDom.showContent("#dtk-LoginFrame");
		}
		// If showing login section, then listen for login details
		MyAuth.listenForLogin();
	},

	// Listen for post messages from the login frame;
	listenForLogin: () => {
		console.log("Adding listener for post messages");
		window.addEventListener("message", (event)=>{
			if(event.origin != MyAuth.AuthUrl){
				return;
			}
			const eventJson = JSON.parse(event.data);
			if( eventJson?.status == 200 ){
				// Set cookie first
				MyCookies.setCookie(MyCookies.getCookieName("Session"), eventJson?.token ?? "");

				// Then validate & return if successful
				var toHref = encodeURIComponent(document.referrer);
				var validateCall = `${MyAuth.AuthUrl}/validate/?to=${toHref}`;
				MyUrls.navigateTo(validateCall);
			}
		});
	},

	// Check if login was successful or failed
	isLoggedIn: async () => {
		var details = await MyAuth.getSessionDetails("active");
		var isLoggedIn = (details?.active ?? false)
		return isLoggedIn
	},

	// Logout of the app
	logOut: async () => {
		var details = await MyAuth.getSessionDetails("logout");
		var isLogOut = !(details?.acive ?? true); //opposite of active status;
		if(isLogOut){
			MyCookies.deleteCookie(MyCookies.getCookieName("Session"));
		}
		return isLogOut;
	},

	// Check cookie/session & take given action
	getSessionDetails: async(action) => {
		var results = false;
		var cookie = MyCookies.getCookie(MyCookies.getCookieName("Session"));
		if(cookie != undefined){
			var postCall = `${MyAuth.AuthUrl}/session/${action}`;
			var sessionObj = { "session":cookie };
			results = await MyFetch.call("POST", postCall, { body: JSON.stringify(sessionObj) } );
		}
		return results;
	},


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
	showContent: function(selector){
		this._toggleClass(selector, "remove", "hidden");
	},

	// Hide based on query selector
	hideContent: function(selector){
		this._toggleClass(selector, "add", "hidden");
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
			console.err(err);
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
			console.log(err);
		}
		finally
		{
			return content;
		}
	},

	addClass: function(selector, className){
		MyDom._toggleClass(selector, "add", className);
	},

	removeClass: function(selector, className){
		MyDom._toggleClass(selector, "remove", className);
	},
	
	// A public warapper for the helper function within
	toggleClass: function(selector, action, className){
		MyDom._toggleClass(selector, action, className);
	},
	
	_toggleClass: function(selector, action, className){
		try
		{
			let elements = Array.from(document.querySelectorAll(selector));
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
	_getRandomCharacter: function(){
		characters = "abcdefghijklmnopqrstuvwxyz";
		randChar = Math.floor(Math.random()*characters.length);
		return characters[randChar].toUpperCase();
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

	getCode: function(numChars=4){
		let chars = "";

		for(var idx = 0; idx < numChars; idx++)
		{
			chars += MyHelper._getRandomCharacter();
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

	ShowLogs: () => {
		MyMyLogger.LoggedMessages?.forEach( (msg) =>{
			console.log(msg);
		});
	}
}

// Custom class used to easily identify my log messages
class MyMessage {
    constructor(type, message){
        this.Type = type;
        this.Message = message;
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
        value = object;
        limit = 100; count = 0;
        while (keys.length > 0 && count < limit)
        {
            count++; //counter to prevent infinite loop;
            currKey = keys.shift();
            if(value.hasOwnProperty(currKey))
            {
                value = value[currKey];
            }
        }
        return value;
    }
}

// Used to manage things related to a URL
const MyUrls = {

	navigateTo: (url, targetTab="_top") => {
		window.open(url, target=targetTab);
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
		let query_string = (searchString != undefined) ? searchString : location.search;
		let query = query_string.replace("?", "")
		var query_map = {}
		var combos = query.split("&");
		combos.forEach(function(obj)
		{
			let splits = obj.split("=");
			query_map[splits[0]] = splits[1];
		});
		return query_map;
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

	// Get the appropraite search path for modifying window history (accounts for existing)
	createSearchString(newQueryMap)
	{

		// Get original query map/keys
		let queryMap = MyUrls.getSearchParam();
		let queryKeys = Object.keys(queryMap);

		// Get the set of new keys
		let newKeys = Object.keys(newQueryMap);

		// Get the unique ones
		let uniqueKeys = Array.from(new Set(queryKeys.concat(newKeys)));

		// Build a search based on old+new;
		let search = "";
		if(uniqueKeys.length > 0)
		{
			uniqueKeys.forEach( (key)=>{

				// Separator for the values
				let sep = (search == "") ? "?" : "&";

				let ogValue = queryMap[key] ?? "";
				let newValue = newQueryMap[key] ?? "";

				let value = (newValue != "") ? newValue : ogValue;

				search += `${sep}${key}=${value}`;
			});
		}
		return search;
	},

	// Simple thing to reload the current page; with delay in seconds
	refreshPage: (delay=0)=>{
		var wait = delay * 1000;
		setTimeout( ()=> {
			location.reload();
		}, wait);
	}
}