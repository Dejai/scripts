/*********************************************************************************
Name: CloudflareWrapper: 
Description: Custom API wrapper for Cloudflare
Author: Derrick Fyfield
Version: v2
Dependencies:
    - /scripts/js/v2/my.js
    - https://embed.videodelivery.net/embed/sdk.latest.js
        > a SDK provided by Cloudflare
Notes:
    - Stream API Documentation: https://developers.cloudflare.com/stream/viewing-videos/using-the-stream-player/using-the-player-api/
**********************************************************************************/ 

// Wrapper for calls to the Cloudflare worker
const CloudflareWrapper = {

    Endpoint: "https://files.the-dancinglion.workers.dev",

    // Get a list of videos based on an a given name value
    GetVideos: async (nameValue) => {
       var url = `${CloudflareWrapper.Endpoint}/stream/?search=${nameValue}`;
       var resp = await MyFetch.call("GET", url);
       return resp;
    },

    // Get single video details
    GetVideo: async (videoID) =>{
        var url = `${CloudflareWrapper.Endpoint}/stream/?video=${videoID}`;
        var resp = await MyFetch.call("GET", url);
        return resp;
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