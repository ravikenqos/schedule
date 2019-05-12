"use strict";

class Download extends SbHelper{

    constructor(){
        super();
        this.db = new SbIndexedDb();
        this.sbCache = new SbCache();
        this.fs = new FileSystem();
        this.init = false;
        this.playlistIds = [];
    }
    async download(){
        try{
            let notToViewport = false;
            let downloadStatus = await super.getDownloadStatus();
            console.log("downloadStatus", downloadStatus);
            if(downloadStatus){
                let metadata = await super.getMetaData();
                let schedule = metadata.data.schedule;
                if( schedule && Array.isArray(schedule) && schedule.length > 0){ 
                    let i = 0;
                    for(let item of schedule){
                        if(!item.isAd){
                            let playlisId = item.metaData.playlist.id;
                            let playlistIds =  await super.getPlaylistIds();
                            if(playlistIds.indexOf(playlisId) < 0){
                                this.playlistIds.push(item.metaData.playlist.id);
                                let viewports = item.metaData.viewports;
                                this.getViewportStreamsData(viewports, notToViewport);
                            }
                        } else {
                            let viewport = adData.data.metaData.viewports;
                            await this.getViewportAdData(viewport, item, notToViewport);
                        }
                        i++;
                    }
                    if(i === schedule.length){
                        console.log("metadata", metadata);
                        let metadataItem = metadatas.data.metaData;    
                        let viewports = metadataItem.viewports;
                        this.getViewportStreamsData(viewports, notToViewport);                                         
                    }                            
                } else {
                    let metadataItem = metadatas.data.metaData;    
                    let viewports = metadataItem.viewports; 
                    this.getViewportStreamsData(viewports, notToViewport); 
                }
            }
        } catch(err){
            throw err;
        }
    }

    async getViewportStreamsData(viewports, notToViewport){
        try{
            let records;
            viewports.forEach( async (item) => {
                let viewportId = item.id;
                records = await this.db.getViewportRecords(viewportId)
                if(records && records.length < 1){
                    records = await this.getRecords(item);
                } 
                this._records(records, item, notToViewport, "regular")
            });
        }catch(err){
            throw err;
        }            
    }    

    async getRecords(viewport){
        try{
            let streamsRecords = await this._getRecordsByStreaming(viewport.id);
            let records = await this._formatRecords(streamsRecords.data, viewport);
            await this.saveRecords(records, viewport.id);
            return records
        }catch(err){
            throw err;
        }
    }

    _getRecordsByStreaming(viewportId, message = 'billBoard.widget.connect'){
        return new Promise((resolve, reject) => {
            let xhrFields = {};
            try{    
                let dataParams = {
                    "deviceId": '88c01f50-6c96-4841-957e-b4215378ad01',
                    "method": 'billBoard.widget.get',
                }
                dataParams.params = JSON.stringify({"id":viewportId, "numInitialResults":100, "deviceName":null,"dataFrequency":30,"message": message,"start":0,"count":100});
                super.doAjax("GET", config[region].streamUrl, dataParams, xhrFields).done(( res ) => {
                    resolve(res);
                }).fail((textStatus, errorThrown ) => {
                  resolve(false);
                })
            }catch(err){
                reject(err);
            }
        });
    }

    getAdsData(item){
        try{
            let getAdsData = await this.downloadAdsRecords(item);
            await this.saveRecords(records, item.id);
            return records
        }catch(err){
            throw err;
        }
    }

    downloadAdsRecords(){
        return new Promise( async (resolve, reject) => {
            try{
                let url = `https://api.parllay.com/delivery/ads?adNumber=${item.adNumber}&spotsPerLoop=${item.spotsPerLoop}`;
                super.doAjax("GET", url, {}, {}).done(( res ) => {
                    resolve(res);
                }).fail((textStatus, errorThrown ) => {
                    resolve(false);
                })                                
            } catch (err) {
                reject(err);
            }                           
        });
    }

 
    async _formatRecords(streamsData, viewport){
        try{
            let options = {
                "hideTextOnlyPost" : viewport.hideTextOnlyPost,
                "hideAllText" : viewport.hideAllText,
                "hideUrls" : viewport.hideUrls,
                "hideHashtags" : viewport.hideHashtags,
                "commentsRestriction" : 2
            };            
            let businessOffset = 0;
            StreamsHelpers.context = this
            this.contributingStreams = viewport.contributingStreams;  
            let records = StreamsHelpers.formatStoryResponse(streamsData, '', businessOffset, undefined, undefined, options);
            return records
        }catch(err){
            throw err;
        } 
    }

    async saveRecords(records, viewportId){
        try{
            let viewportId = viewport.id;
            let viewportPosts = await this.db.getViewportRecordsId(viewportId);
            let i = 0;
            for(let item of records){
                if(viewportPosts.indexOf(item.id) < 0){
                    let data = {};
                    data.viewport_id = viewportId;
                    data.record = item;
                    await this.db.saveViewportPost(data);
                }
                i++;
            }
            if(i = records.length){
                return true;
            }
        } catch(err){
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
                    } 
                    r++;
                })
                if(r == contents.length){
                    if(recordsToDownload.length > 0) {  
                        if(recordsToDownload.length <= 10){
                            let recordswithbloburl = await this.downloadContents(recordsToDownload);
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
    
    _processRecords(records, viewportItem){
        return new Promise( async (resolve, reject) => {
            try{
                let i = 0;
                let data = []
                for( let item of records) {
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
   

   /**
     * 
     * @param {objects} contents 
     */
    downloadContents(contents, protocol = 'https:'){
        return new Promise( async (resolve, reject) => {
            try{
                console.log("contents", contents);
                let promiseTask = [];
                let i = 0;
                contents.forEach((item) => {
                    let Url = (item.imageUrl || item.videoUrl);
                    let urlarr = Url.split(':');
                    let urlprotocol = urlarr.shift();                
                    let fetchUrl = (urlprotocol == 'https' || urlprotocol == 'http' ) ? Url : protocol + Url;
                    promiseTask.push(this._downloadBlob(item));
                    i++;
                });
                if(i == contents.length){
                    let results = await Promise.all(promiseTask.map(this._reflect));
                    if(Array.isArray(results) && results.length > 0){
                       let data = [];
                       let j = 0;
                        results.map( async (item) => {
                            if(item.status){
                                let rec = item.v
                                let blob_data = rec.assetUrl;
                                let postid;
                                let contentType;
                                let id;
                                if(rec.contentType != 'parllayAd'){
                                    id = rec.id
                                    let itemId = id.split(':');
                                    postid = itemId.pop();
                                    contentType = rec.contentType = this._getContentType(rec.originalId);
                                } else if(rec.contentType === 'parllayAd'){

                                    id = postid = rec.id;
                                    contentType = rec.contentType;
                                }
                                let imageUrl = rec.imageUrl;
                                let videoUrl = rec.videoUrl;
                                let Url = imageUrl || videoUrl;
                                let type = "main";
                                let FileName = (type !== 'avatar') ? this._getFileName(Url, postid) : imageUrl;
                                let saveFile = await this._savefile(FileName, blob_data);
                                console.log("saveFile", saveFile);
                                if(!saveFile) {
                                    throw "Error to save " + FileName + "of" + (videoUrl || imageUrl);
                                } else {
                                    if(type != 'avatar'){
                                        console.log("saveSbPostdata", id, videoUrl, imageUrl, contentType)
                                        let postData = await this.sbCache.saveSbPostdata(id, videoUrl, imageUrl, contentType);
                                        if(!postData){
                                            throw "Error to save post data" + (videoUrl || imageUrl);    
                                        } else {    
                                            let saveAssetDetails = await this.sbCache.saveAssetDetails(id, Url, FileName, blob_data.size, blob_data.type);
                                            if(!saveAssetDetails){ 
                                                throw "Error to save asset details" + (videoUrl || imageUrl);                    
                                            } else {    
                                                rec.assetUrl = await this.fs.getFile(FileName);
                                                data.push(rec);
                                            }
                                        }
    
                                    }  else {  
    
                                        let saveAssetDetails = await this.sbCache.saveAssetDetails(id, Url, FileName, blob_data.size, blob_data.type);
                                        if(!saveAssetDetails){ 
                                            throw "Error to save asset details" + (videoUrl || imageUrl);                    
                                        } else {    
                                            // let assetData = await this._getFile(viewportid, FileName, postid, imageUrl, videoUrl, type, mode);
                                            // return resolve(assetData);
                                            rec.assetUrl = await this.fs.getFile(FileName);
                                            data.push(rec);                                            
                                        }  
    
                                    }
                                }                                  

                            }
                            j++;
                        }); // End Of iteration
                       if(j = results.length){
                            return resolve(data);
                       } 
                    }
                    
                }
                
            }    
            catch(err){
                reject(err);
            }    
        }); 
    }

    _reflect(promise) {
        return promise.then(function (v) { return { v: v, status: true } },
        function (e) { return { e: e, status: null } });
    };


    _downloadBlob(item, protocol = 'https:'){
        return new Promise( async (resolve, reject) => {
            try{
                let self = this; 
                let Url = (item.imageUrl || item.videoUrl);
                let urlarr = Url.split(':');
                let urlprotocol = urlarr.shift();                
                let fetchUrl = (urlprotocol == 'https' || urlprotocol == 'http' ) ? Url : protocol + Url;
                if(item.videoUrl){
                    let blob = await self._downloadVideoStream(fetchUrl);
                    item.assetUrl = (blob) ? blob : false
                    resolve(item);
                    return;             
                } else {
                    let xhr = new XMLHttpRequest();
                    xhr.open('GET', fetchUrl, true);
                    xhr.responseType = 'blob';
                    xhr.onload = async function() {
                    try{    
                            if (this.status == 200) {
                                let blob = this.response;
                                item.assetUrl = (blob) ? blob : false
                                resolve(item);
                                return;
                            } else if (this.status == 206) {
                                let blob = await self._downloadVideoStream(fetchUrl);
                                item.assetUrl = (blob) ? blob : false
                                resolve(item);
                                return;
                            } else if (this.status == 403) {
                                // let res = await self._downloadSecureAsset(fetchUrl, postId)
                                // resolve((res.success) ? res : false);
                                resolve(false);                        
                                return;
                            }  else if (this.status == 404) {
                                resolve(false);
                                return;
                            } else {
                                reject("Fail to download");
                            }
                        } catch(err){
                            throw err;
                        }    
                    };
                    xhr.onerror = function () {
                        reject('Fail to download');
                    };
                    xhr.send();
                }
            } catch(err){
                this.log.error(err);
            }
        });
    }

    async _downloadVideoStream(url, FileName, postId) {
        let self = this;
        return new Promise( async (resolve, reject) => {
            try{
                let xhr = new XMLHttpRequest();
                xhr.open('GET', url, true);
                xhr.responseType = 'blob';
                xhr.onload = async function() {
                try{    
                    if (this.status == 200) {
                        let blob = xhr.response;
                        resolve((blob) ? blob : false);
                    } else if (response.status === 403) {
                        let res = await self._downloadSecureAsset(url, postId);
                        resolve((res.success) ? res : false);
                    }
                } catch(err){
                    throw err;
                }    
                };
                xhr.onerror = function () {
                    reject('Fail to download');
                };
                xhr.send();
            }

            catch(err){
                console.log(err);
            }
        });
    }        

    _downloadSecureAsset(fetchUrl, postId) {
        return new Promise( async (resolve, reject) => {
            let businessId = '';
            let deviceId = null;
            let ids = [];
            let params = {};
            let url = config[region].streamUrl;
            ids[0] = postId;
            let accdetails = await this.sb._getAccountDetails();
            businessId = accdetails.data.businessId;
            let data = new FormData();
            data.append('businessId', businessId);
            data.append('deviceId', deviceId);
            data.append('ids', JSON.stringify(ids));
            data.append('params', params);
            let param = {businessId: businessId, deviceId: deviceId, ids: JSON.stringify(ids), method: "activities.refresh", params: params};
            let xhrFields = {};
                this.sb.doAjax("GET", url, param, xhrFields).done((res) => {
                if(res.success){    
                    // if(Object.keys(res).length === 0){
                    //     resolve(false);
                    // } else {
                        resolve(res);
                    // }
                } else {
                    resolve(res);
                }     
            }).fail(function( xhr, status, errorThrown ) {
                reject("Fail to Download secure Asset");
            });  
        })
        
    }


    _getContentType(originalid){
        try{         
            let split = originalid.split(':');
            return split.shift();
        }catch(err){
            throw err;            
        } 
    }


    _getFileName(key, id){
        try{           
            let getFile = key.split('/');
            let getFileName = getFile.pop();
            let splitFileName = getFileName.split('.');
            let ext = splitFileName.pop();   
            return id+'.'+ext;
        }catch(err){
            throw err;            
        }         
    }

 
  

    async _savefile(FileName, blob_data, playlist){
        let self = this;
        let isLimit = await this._checkStorageLimit(blob_data.size);
        if(isLimit){
            let res = await this.fs.save(FileName, blob_data);
            return res;
        } else {
            let data = this.sbCache.remove(blob_data.size, playlist);
            if(data){
                let res = await this.fs.save(FileName, blob_data)
                resolve(res);
            }
        }
    } 

    async _checkStorageLimit(blobDataSize){
        try{
            let stoLimit = config.storageLimit;
            let balanceSize = stoLimit - await this.fs.getStroageSize();
            if(balanceSize > blobDataSize){
                return true;
            } else {
                return false;
            }
        }catch(err){
            throw err;
        }

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
                    records = await this.getAdsData(item);
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