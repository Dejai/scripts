/*********************************************************************************
CloudflareWrapper: Custom API wrapper for Cloudflare
NOTES:
	- This is dependent on the "my.js" file being loaded prior to this one
**********************************************************************************/ 

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
        var url = `${CloudflareWrapper.Endpoint}/stream/${videoID}`;
        var resp = await MyFetch.call("GET", url);
        return resp;
    }
}