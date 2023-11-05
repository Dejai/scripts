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
        this.Endpoint = "https://files.the-dancinglion.workers.dev";
    }

    async Session(userKey=""){
        if(userKey != ""){
            var url = `${this.Endpoint}/session`;
            var user = {"UserKey": userKey};
            await MyFetch.call("POST", url, { body: JSON.stringify(user) });
        }
    }

    async GetContent(type, searchParams={}){
        var searchString = MyUrls.getNewSearchString(searchParams);
        var url = `${this.Endpoint}/${type}/${searchString}`;
        var resp = await MyFetch.call("GET", url);
        return resp;
    }

    async GetVideos(nameValue){
        return this.GetContent("stream", {search: nameValue});
    }

    async GetVideo(videoID){
        return this.GetContent("stream", {video: videoID})
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