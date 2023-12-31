/*********************************************************************************
Name: CloudflareWrapper: 
Description: Custom API wrapper for Cloudflare
Author: Derrick Fyfield
Version: v3
Dependencies:
    - /scripts/js/v2/my.js
    - https://embed.videodelivery.net/embed/sdk.latest.js
        > a SDK provided by Cloudflare
Notes:
    - Stream API Documentation: https://developers.cloudflare.com/stream/viewing-videos/using-the-stream-player/using-the-player-api/
**********************************************************************************/ 

// Wrapper for calls to the Cloudflare worker
class CloudflareWrapper {

    constructor(){
        this.Scope = location.pathname; 
    }

    async _Fetch(method, subdomain, path, fetchObj){
        path = (path.startsWith("/")) ? path.replace("/", "") : path;
        var fullUrl = `https://${subdomain}.dejaithekid.com/${path}`;
        if(method == "POST"){
            return MyFetch.call(method, fullUrl, fetchObj);
        }
        return MyFetch.call(method, fullUrl);
    }

    // Manage R2  based on path
    async Files(method, path, fetchObj={}){
        return this._Fetch(method, "files", path, fetchObj);
    }

    // Manage KV based on path
    async KeyValues(method, path, fetchObj){
        return this._Fetch(method, "kv", path, fetchObj);
    }
}


// Class for managing a stream video player object
class StreamManager 
{
    constructor(){
        this.stream = undefined;
    }

    // Set the current element
    setStreamElement(selector) {
        var htmlElement = document.querySelector(selector);
        if(htmlElement != undefined){
            this.stream = Stream(htmlElement);
        }
    }

    // Add event listener for sream video
    onVideoEvent(event, callback) {
        this.stream?.addEventListener(event, callback);
    }

    // Pause the video
    pauseVideo(callback) {
        this.stream?.pause();
        if(callback != undefined){
            callback();
        }
    }

    // Play the video
    playVideo(callback){
        this.stream?.play();
        if(callback != undefined){
            callback();
        }
    }
}