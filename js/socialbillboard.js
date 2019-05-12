"use strict";
class SocialBillboard extends SbHelper{
    constructor(){
        super();
        this.sbCache = new SbCache();
        this.db = new SbIndexedDb();
        this.sbd = new Download();
        this.fs = new FileSystem();
        this.viewport = new Viewport();
        this.playlistIds = [];
        this.playlist = {};
    }

    /** 
     * 
     * @param {string} first 
     * @param {string} playlistType 
     */
    async playlistToGetStreamsData(type, item,  playlistType){
        try{
            let playlistIds = [];
            let notToViewport = true;
            chrome.storage.local.set({'download': true});
            if(type === 'default'){
                notToViewport = true;
                this.playlistIds.push(item.playlist.id);

                chrome.storage.local.set({'download': true});
                let viewports = item.viewports;
                this.getViewportStreamsData(viewports, notToViewport);
            }
            else if(type === 'schedule'){
                notToViewport = true;
                if(!item.isAd){
                    this.playlistIds.push(item.metaData.playlist.id);
                    playlistIds.push(item.metaData.playlist.id);
                    chrome.storage.local.set({'playlistIds': playlistIds});
                    chrome.storage.local.set({'download': true});
                    let viewports = item.metaData.viewports;
                    this.getViewportStreamsData(viewports, notToViewport);
                } else {
                    let viewport = adData.data.metaData.viewports;
                    await this.getViewportAdData(viewport, item, notToViewport);
                }
            }
        }catch(err){
            throw err;
        }        
    }

    async getViewportStreamsData(viewports, notToViewport){
        try{
            let records;
            viewports.forEach( async (item) => {
                let viewportId = item.id;
                this.viewport[viewportId] = new Viewport();
                this.viewport[viewportId].viewportid =  item.id;
                this.viewport[viewportId].viewport = item;                
                records = await this.db.getViewportRecords(viewportId)
                if(records && records.length < 1){
                    records = await this.spd.getRecords(viewport);
                } 
                console.log("records", records);
                this._records(records, item, this.viewport[viewportId], notToViewport, "regular")
            });
        }catch(err){
            throw err;
        }            
    }

    async _records(records, viewportItem, viewport, notToViewport, mode, isAd = false){
        try{
            let recordstoViewPort = [];
            let recordsToDownload = [];
            let contents = (isAd) ? records : await this._processRecords(records, viewportItem, viewport);
            if(contents.length > 0){
                let r = 0;
                contents.forEach((item) => {
                    if(!item.assetUrl){
                        recordsToDownload.push(item);                             
                    } else {
                        recordstoViewPort.push(item); 
                    }
                    r++;
                })
                console.log("recordstoViewPort", recordstoViewPort)
                this._recordstoViewPort(recordstoViewPort, viewport, mode);
                if(r == contents.length){

                    if(recordsToDownload.length > 0) {  
                        if(recordsToDownload.length <= 10){
                            let recordswithbloburl = await this.sbd.downloadContents(recordsToDownload);
                            console.log("recordswithbloburl", recordswithbloburl)
                            if(!notToViewport){
                                this._recordstoViewPort(recordswithbloburl, viewport, mode);
                            }
                        } else {
                            let sortedRecords = await this._categorizeRecords(recordsToDownload);
                            let batchRecords = await this._chunkArray(sortedRecords, 10);
                            for(let batch of  batchRecords){
                                let recordswithbloburl = await this.sbd.downloadContents(batch);
                                if(!notToViewport){
                                    this._recordstoViewPort(recordswithbloburl, viewport, mode);
                                }    
                            }
                        }    

                    }
                }                  
            }

        }catch(err){
            throw err;             
        }  
    }    

    _processRecords(records, viewportItem, viewport){
        return new Promise( async (resolve, reject) => {
            try{
                let i = 0;
                let data = []
                for( let item of records) {
                    if(viewport.postIds.indexOf(item.originalId) < 0){                    
                        item.postMode = (item.repeat_activity) ? "repeat" : "new";
                        let videoUrl, imageUrl, Url, path, dataVideo = '';
                        let text = '';
                        let contentType = item.contentType = this._getContentType(item.originalId);                
                        imageUrl = (item.mediaType === "image" || item.mediaType === "photo" || item.mediaType === "carousel" || (item.mediaType === "undefined" &&  item.videoUrl === '') || (item.mediaType === "" &&  item.videoType === 'others') || (typeof item.mediaType === "undefined" &&  item.videoType === 'others') ) ? item.image : null;
                        videoUrl = (item.mediaType === "video" || item.mediaType === "youtube") ? item.videoUrl : null;
                        Url = imageUrl || videoUrl; 
                        let asset =  await this._getAssetUrl(imageUrl, videoUrl, Url, item.id, contentType);
                        item.assetUrl = asset.assetUrl;
                        item.assetSize = asset.assetSize;                         
                        item.imageUrl= imageUrl 
                        item.videoUrl= videoUrl 
                        item.avatar = null;
                        item.online = 1;
                        data.push(item);
                    }  
                    i++;
                };
                if(i === records.length){
                    resolve(data);
                } 
                
            } catch (err) {
                reject(err);
            }
        }); 
    }

    _getContentType(originalid){
        try{         
            let split = originalid.split(':');
            return split.shift();
        }catch(err){
            throw err;            
        } 
    }
    

    _getAssetUrl(imageUrl, videoUrl, Url, id, contentType){
        return new Promise( async (resolve, reject) => {
            try{
                if(contentType === 'youtube'){
                    return resolve(null);
                }
                if(id && Url){
                    let filename = await this.sbCache.getAssetFilename(imageUrl || videoUrl); 
                    if(!filename){
                        resolve({assetUrl: null, assetSize:null});
                    } else {
                        let assetData =  await this.fs.getFile(filename);
                        resolve(assetData);                   
                    }
                }
            } catch (err) {
                reject(err);
            }
        });   
    } 
    
    async _recordstoViewPort(records, viewport, mode){
        try{
            window.addEventListener("contentready", function(event) {
                viewport.getContent(event.detail.datastructure);
            }, false);
              
                records.forEach(async (item) => {
                    if(viewport.postIds.indexOf(item.originalId) < 0){
                        viewport.postIds.push(item.originalId);
                    }

                    viewport.categorizePost(item, mode);
                })
           
        }catch(err){
            throw err;
        }
    }
    
    async _categorizeRecords(records){
        let contentQueue = records.sort((a, b) => {
            let b_hasVideo = b.hasVideo;
            let a_hasVideo = a.hasVideo;
            if (a_hasVideo > b_hasVideo){
                return 1;
            } else if (a_hasVideo < b_hasVideo){
                return -1;
            } else {
                return 0;
            }
        });   
        return contentQueue; 
    } 

    _chunkArray(myArray, chunk_size){
        return new Promise( async (resolve, reject) => {
            try{
                let arrayLength = myArray.length;
                let tempArray = [];
                for (let i = 0; i < arrayLength; i += chunk_size) {
                    let myChunk = myArray.slice(i, i+chunk_size);
                    tempArray.push(myChunk);
                }
                return resolve(tempArray);
            } catch (err) {
                reject(err);
            }
        });
    }    
    
    async getViewportAdData(viewports, item, notToViewport){
        try{
            let records;            
            viewports.forEach( async (viewport) => {
                this.playlist[viewport.id] = new Playlist();
                this.playlist[viewport.id].viewportid =  viewport.id;
                this.playlist[viewport.id].viewport = viewport;
                records = await this.db.getViewportRecords(item.id)
                if(records && records.length < 1){
                    records = await this.sbd.getAdsData(item);
                } 
                contents = await this.getFormatAdsRecords(records);
                this._records(contents, viewport, this.playlist[viewport.id], notToViewport, "regular", true);
            });
 
        } catch (err) {
            throw err;
        }          
    }
    async getFormatAdsRecords(contents){
        try{
            let i = 0;
            let data = []            
            if(contents && Array.isArray(contents) && contents.length > 0){
                for( let item of contents) {
                    let videoUrl, imageUrl, Url, path, dataVideo = '';
                    let text = '';
                    let id = true;                
                    Url = (item.fileExtention === 'image') ? item.imageUrl : item.hrefUrl;
                    item.imageUrl = imageUrl = (item.fileExtention === 'image') ? item.imageUrl : null; 
                    item.videoUrl = videoUrl = (item.fileExtention != 'image') ? item.hrefUrl : null;
                    let asset = await this._getAssetUrl(imageUrl, videoUrl, Url, id, item.fileExtention) ;                   
                    item.assetUrl = asset.assetUrl;
                    item.assetSize = asset.assetSize;   
                    item.avatar = null;
                    item.online = 1;
                    item.additional_class = null;
                    item.animationClass = null;
                    item.body = null;
                    item.businessUser = null;
                    item.caption = null;
                    item.cardType = null;
                    item.contentType = "parllayAd";
                    item.createdTime = null;
                    item.description = null;
                    item.from = null;
                    item.hasVideo = null;
                    item.hideTextOnlyPost = 1;
                    item.id = btoa(Url);
                    item.image = item.imageUrl; 
                    item.isAdmin = false;
                    item.isWidget = false;
                    item.mediaType = null;
                    item.name = null;
                    item.online = 1;
                    item.originalId = null;
                    item.planId = null;
                    item.postMode = "regular";
                    item.postedTime = null; 
                    item.repeatCount =  0 ;
                    item.repeat_activity = false;
                    item.repeat_count = 0;
                    item.social_type_code = 1110;
                    item.streamId = null;
                    item.text = null; 
                    item.timeStamp = null;
                    item.videoId = null;    
                    item.videoType = "others";
                    item.widgetType = null;                   
                    data.push(item);

                    i++;
                }; 
                if(i === contents.length){
                    return data;
                }
            } 
 
        } catch (err) {
            throw err;
        }  
    }

}