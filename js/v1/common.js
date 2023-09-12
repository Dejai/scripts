/**********************************************************************************************************
Name: Common
Description: A set of constant JS objects that I can reference on other pages easily. 
Author: Derrick Fyfield
Version: 1
Dependencies:
	n/a
**********************************************************************************************************/

// Used for general DOM things
const mydoc = {

	ready: function(callback){
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
	
	// DEPRACATED: Originally used to get content into an element; Replaced with "setContent(...)"
	loadContent: function(content, identifier)
	{
		element = document.getElementById(identifier);
		if(element != undefined)
		{
			element.innerHTML = content;
		}
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
					if(existingProperty != undefined)
					{
						let newValue = contentObj[key] 
						ele[key] = (append) ? existingProperty + newValue : newValue;
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

	// Set a cookie; Expiration provided in minutes;
	setCookie: function(cookieName, cookieValue, expirationMins=undefined, cookiePath=undefined){

		expires = "";
		if(expirationMins != undefined)
		{
			expirationDate = new Date();
			expirationDate.setTime(expirationDate.getTime() + (expirationMins*60000)); // 60,000 milliseconds seconds a minute;
			utcDate = expirationDate.toUTCString();
			expires = `expires=${utcDate};`
		}

		// Setup path;
		path = "path=";
		path += (cookiePath != undefined) ? `${cookiePath};` : "/;";

		// Set full cookie 
		fullCookie = `${cookieName}=${cookieValue}; ${expires} ${path}`;

		document.cookie = fullCookie;
	},

	// Get a cookie by name
	getCookie: function(cookieName){

		// Set default return value
		returnValue = "";

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

	deleteCookie: function(name){

	},

	addClass: function(selector, className){
		mydoc._toggleClass(selector, "add", className);
	},

	removeClass: function(selector, className){
		Logger.log(selector + " " + className);
		mydoc._toggleClass(selector, "remove", className);
	},
	
	// A public warapper for the helper function within
	toggleClass: function(selector, action, className){
		mydoc._toggleClass(selector, action, className);
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

	get_query_param: function(key){
		let map = this.get_query_map();
		let value = undefined;
		if(map.hasOwnProperty(key))
		{
			value = map[key]
		}
		return value;
	},

	get_query_map: function(){
		let query_string = location.search;
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

	get_query_map_from_url: function(urlObject){
		let query_string = urlObject.search;
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
			Logger.log(error, true);
		}
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
	getNewSearch(newQueryMap)
	{

		// Get original query map/keys
		let queryMap = mydoc.get_query_map();
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
	}

};

// Used for general AJAX things
const myajax = { 
	
	GetContentType: function(type){
		var content_type = "";
		switch(type){
			case "JSON":
			case "json":
				content_type = "application/json";
				break;
			case "Multipart Form Data":
			case "Multipart":
				content_type = "multipart/form-data";
				break;
			case "Text":
			case "Plain Text":
				content_type = "text/plain";
			default:
				break;
		}
		return content_type;
	},

	GetProperties: function(){
		let properties = [
			["method", "string", "The method of the call (GET, POST, PUT, DELTE)"],
			["path", "string", "The path of the API call"],
			["success", "function", "Custom function to call on successful call"],
			["failure", "function", "Custom function to call on FAILED call"],
			["data", "varied", "Custom data to send in PUT or POST"],
			["contentType", "string", "A string to indicate what Content-type header should be set"],
			["cacheControl", "string", "A string to determine the Cache-Control header"]
		];
		properties.forEach(function(obj){
			name = obj[0];
			type = obj[1];
			desc = obj[2];
			let message = `Property:\t${name}\nType:\t${type}\nDescription\t${desc}\n\n`;
		});
	},

	GetJSON: function(jsonString){
		try
		{
			let jsonObject = JSON.parse(jsonString);
			return jsonObject
		}
		catch(error)
		{
			Logger.log(error, true);
			return undefined;
		}
	},

	isValidAjaxObject: function(object){
		let state = {isValid: true, message:"All set"};

		if ( !object.hasOwnProperty("method") )
		{
			state.isValid = false;
			state.message = "Missing TYPE of call (GET vs. POST)";
			return state;
		}

		if (object["method"] == "POST" && !object.hasOwnProperty("data"))
		{
			state.isValid = false;
			state.message = "Doing a POST - but with no data";
		}

		return state;
	},

	isValidFunction(obj, key){
		return (obj.hasOwnProperty(key) && typeof(obj[key]) == "function");
	},

	AJAX: function(object){
		let checkObject = myajax.isValidAjaxObject(object);
		if (!checkObject.isValid){
			throw new Error(checkObject.message);
		}

		// Getting/Setting the parts of the call
		let method 	= object["method"];
		let path 	= object["path"];

		let success = this.isValidFunction(object, "success") ? object["success"] : function(request){Logger.log(request);};
		let failure = this.isValidFunction(object, "failure") ? object["failure"] : function(request){Logger.log(request);};

		// Setting up the request object
		var xhttp = new XMLHttpRequest();
		xhttp.open(method, path, true);

		// What to do after the call is made
		xhttp.onreadystatechange = function() {
			request = this;
			if (request.readyState == 4 && request.status == 200)
			{
				success(request);
			}
			else if (request.readyState == 4 && request.status != 200)
			{
				failure(request);
			}
		};

		// Set the headers (if any are passed)
		if(object.hasOwnProperty("headers") && object["headers"] != undefined)
		{
			let keys = Object.keys(object["headers"]);
			keys.forEach( (key)=>{
				
				let val = object["headers"][key];

				// set the request header:
				xhttp.setRequestHeader(key, val);
			});
		}
		// if(object.hasOwnProperty("cacheControl"))
		// {
		// 	xhttp.setRequestHeader('Cache-Control', object["cacheControl"]);
		// }

		// Send/proces the request
		if ( object.hasOwnProperty("data") )
		{
			let data = object["data"];

			// // Check if content type is set
			// if(object.hasOwnProperty("contentType"))
			// {
			// 	let content_type = this.GetContentType( object["contentType"] );
			// 	if(content_type != "")
			// 	{
			// 		xhttp.setRequestHeader('Content-type', content_type);
			// 	}
			// }
			xhttp.send(data);
		}
		else
		{
			xhttp.send();
		}
	}, 

	GET: function(url, successCallback=undefined, failureCallback=undefined){

		let requestObject = {
			method: "GET",
			path : url,
			success: successCallback,
			failure : failureCallback ?? Logger.errorMessage
		};

		// Submit the ajax request;
		myajax.AJAX(requestObject);
		
	},

	POST: function(url, dataObj, headerObject, successCallback=undefined, failureCallback=undefined){
		
		let requestObject = {
			method: "POST",
			path : url,
			data: dataObj,
			headers: headerObject,
			success: successCallback,
			failure : failureCallback ?? Logger.errorMessage
		};

		// Submit the ajax request;
		myajax.AJAX(requestObject);
	},

	PUT: function(url, dataObj, successCallback=undefined, failureCallback=undefined){
		
		let requestObject = {
			method: "PUT",
			path : url,
			data: dataObj,
			success: successCallback,
			failure : failureCallback ?? Logger.errorMessage
		};

		console.log(requestObject);

		// Submit the ajax request;
		myajax.AJAX(requestObject);
	}
}

// Used for logging
const Logger = { 

	logged_data: [],

	log: function(content, printLog=false){ 
		Logger.logged_data.push(content);
		if(printLog){ this.print_logged_data(content)}
	},

	show_log: function(){
		Logger.logged_data.forEach(function(obj){
			console.log(obj);
		});
	},

	print_logged_data: function(content){
		console.log(content);
	},

	errorMessage: function(err){
					console.error("ERROR");
					console.error(err);
				},

		
	
}

const MyNotification = {

	// Toggles the given classname on an existing object; If "forceAdd" - it will be no matter what
	toggle: function(identifier, className, force=undefined){

		let ele = document.querySelector(identifier) ?? undefined
		if(ele == undefined) return; 

		hasClass = ele.classList.contains(className);
		forceAction = '"'
		if(force != undefined)
		{
			forceAction = (force) ? "add" : "remove";
		}
		action = (forceAction != "") ? forceAction : hasClass ? "remove" : "add";

		mydoc.toggleClass(identifier, action, className);
	},

	// Adds content to an HTML block; Can include a custom class to add to the HTML block
	notify: function(identifier, content, className=undefined){

		ele = document.querySelector(identifier) ?? undefined;
		if(ele == undefined) return; 

		// Set the content
		ele.innerHTML = content;

		// If Class name included, ensure it is set;
		if(className != undefined)
		{
			mydoc.toggleClass(identifier, "add", className);
		}
	},

	// Remove content from an HTML block
	clear: function(identifier, className=undefined){
		MyNotification.notify(identifier, "");
		if(className)
		{
			mydoc.toggleClass(identifier, "remove", className);
		}
	}
}

// Misc. helper things
const Helper = {
	_getRandomCharacter: function(){
		characters = "abcdefghijklmnopqrstuvwxyz";
		randChar = Math.floor(Math.random()*characters.length);
		return characters[randChar].toUpperCase();
	},

	_isReservedCode: function(code){
		var reserved = ["DEMO", "TEST"];
		return reserved.includes(code.toUpperCase());
	},

	getCode: function(numChars=4){
		let chars = "";

		for(var idx = 0; idx < numChars; idx++)
		{
			chars += Helper._getRandomCharacter();
		}

		var code = ( Helper._isReservedCode(chars) ) ? Helper.getCode() : chars;
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

// If voice things are needed
const Speaker = {

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
					Logger.log("Done Speaking");
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
    getTemplate:(filePath, object, callback) =>   {

		// Get the file at file path
        myajax.GET(filePath, (data)=>{

            // The template from the file
            var template = data.responseText;

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