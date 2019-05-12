let config = {
    prod: true,
    speed:10,
    videoFileSize:'',
    storageLimit:8589934592,
    india:{
        domain:"parllay.com",
        brands:"brands.parllay.com",
        me:"me.parllay.com",
        memailid:"me@parllay.com",
        activateDevice: "https://brands.parllay.com/activate-device",
        metadataUrl : "https://brands.parllay.com/device/activationcode/get-info",
        streamUrl : "https://streams-ws.parllay.com:8251/rest/dev/v2",
        saveNewActivationCodeUrl : "https://brands.parllay.com/device/activationcode/new",
        getRemovedPostsUrl: "https://me.parllay.com/portal/getRemovedPosts?r=",
        updateServerCacheUrl: "https://me.parllay.com/embed/updateServerCache",
        saveCastSnapshotUrl: "https://brands.parllay.com/display/save-cast-snapshot",
    },    
    emea:{
        domain:"parllayme.com",
        brands:"brands.parllayme.com",
        me:"me.parllayme.com",
        memailid:"me@parllayme.com",
        activateDevice: "https://brands.parllayme.com/activate-device",
        metadataUrl : "https://brands.parllayme.com/device/activationcode/get-info",
        streamUrl : "https://streams.parllayme.com/rest/dev/v2",
        saveNewActivationCodeUrl : "https://brands.parllayme.com/device/activationcode/new",
        getRemovedPostsUrl: "https://me.parllayme.com/portal/getRemovedPosts?r=",
        updateServerCacheUrl: "https://me.parllayme.com/embed/updateServerCache",
        saveCastSnapshotUrl: "https://brands.parllayme.com/display/save-cast-snapshot",
    }

}

let region = "india";
