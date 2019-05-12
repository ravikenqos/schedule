"use strict";

class Playlist extends SbHelper{
    constructor(){
        super();
        this.template = new Template();
        this.sb = new SocialBillboard();
        this.scheduleToStart = null;
        this.scheduleInterval = null;
        this.scheduleData = null;
        this.nxtScheduleToStart = null;
        this.nxtScheduleInterval = null;
        this.nxtScheduleData = null;
        this.metadata = null;
        this.schedulelist = [];
        this.defaultData = [];
        this.type = false;
        this.scheduleToStartFunTimer = null;
        this.scheduleToPlay = null;
    }

    /**
     * 
     * 
     * @param {Object} metadata 
     * @param {string} playlistType 
     * 
     */
    async selectPlaylist(metadata, playlistType = null){
        try{
            let schedule = metadata.data.schedule; 
            if( schedule && Array.isArray(schedule) && schedule.length > 0){ 
                let i = 0;
                for(let item of schedule){
                    let currentDateTime = new Date(); 
                    let startDateTime = new Date(item.start);
                    startDateTime.setMinutes(startDateTime.getMinutes() + new Date().getTimezoneOffset());
                    let endDateTime = new Date(item.end);
                    endDateTime.setMinutes(endDateTime.getMinutes() + new Date().getTimezoneOffset());
                    if(!this.scheduleToStart && !this.scheduleInterval && !super.isNegative(startDateTime, currentDateTime) && startDateTime >= currentDateTime){
                        this.type = (!this.type || this.type) ? 'schedule' : false;
                        this.scheduleToStart = super.diff_time_seconds(startDateTime, currentDateTime);
                        this.scheduleInterval = super.diff_time_seconds(endDateTime, startDateTime);
                        if(!item.isAd){
                            this.scheduleToStartFun(metadata, item, playlistType);    
                        } else {
                            this.scheduleToStartFun(metadata, adData.data, playlistType);
                        }
                        this.sb.playlistToGetStreamsData(this.type, item, playlistType);
                        break;                          
                    } 
                    else if(!this.scheduleToStart && !this.scheduleInterval && (startDateTime <= currentDateTime && currentDateTime <= endDateTime)){
                        this.type = (!this.type || this.type) ? 'schedule' : false;
                        this.scheduleToStart = 0;
                        this.scheduleInterval = super.diff_time_seconds(endDateTime, currentDateTime);
                        if(!item.isAd){
                            this.scheduleToStartFun(metadata, item, playlistType);    
                        } else {
                            this.scheduleToStartFun(metadata, adData.data, playlistType);
                        }
                        this.sb.playlistToGetStreamsData(this.type, item, playlistType);
                        break;                                                  
                    } 
                    else if(this.scheduleToStart && this.scheduleInterval && (startDateTime <= currentDateTime && currentDateTime <= endDateTime)){
                        this.type = (!this.type || this.type) ? 'schedule' : false;
                        let localmetadata = await super.getMetaData();
                        let localSchedulePlaylist = localmetadata.data.schedule[i].metaData.playlist;
                        let reqSchedulePlaylist = item.metaData.playlist;
                        if(localSchedulePlaylist.id != reqSchedulePlaylist.id){
                            chrome.storage.local.set({'metadata': metadata });
                            this.scheduleToStart = 0;
                            this.scheduleInterval = super.diff_time_seconds(endDateTime, currentDateTime);
                            if(!item.isAd){
                                this.scheduleToStartFun(metadata, item, playlistType);    
                            } else {
                                this.scheduleToStartFun(metadata, adData.data, playlistType);
                            }
                            this.sb.playlistToGetStreamsData(this.type, item, playlistType);                            
                            break;                               
                        }
                    }
                    i++;
                }
                if(i === schedule.length){
                    if(!this.scheduleInterval){
                        this.type = (!this.type || this.type) ? 'default' : false;
                        this._defaultPlaylist(this.type, metadata, playlistType);
                    }                   
                }
            } else {
                console.log("fourth");
                if(!this.scheduleInterval){
                    this.type = (!this.type || this.type) ? 'default' : false;                  
                    this._defaultPlaylist(this.type, metadata, playlistType);
                }
            }
        }catch(err){
            throw err;
        }
    }
 
    scheduleToStartFun(metadata, item, playlistType){
        try{
            if(this.scheduleToStart === 0){
                this.scheduleToStartFunTimer = setTimeout(() => {
                   this.playSchedule(item,  playlistType);
                }, this.scheduleToStart)               
            } else {
                this._defaultPlaylist("default", metadata, playlistType)
                this.scheduleToStartFunTimer = setTimeout(() => {
                   this.playSchedule(item,  playlistType);
                }, this.scheduleToStart)
            }
        } catch(err){
            throw err;
        }
    }
    playSchedule(item,  playlistType){
        try{
            this.template.deStructure(item, playlistType);
            this.scheduleToPlay = setTimeout(() => {
                this.scheduleToStart = null;
                this.scheduleInterval = null;                
                this.getMetaData();
            }, this.scheduleInterval)

        } catch(err){
            throw err;
        }
    }

    async getMetaData(){
        try{
            clearTimeout(this.scheduleToStartFunTimer);
            clearTimeout(this.scheduleToPlay);
            let metaDataDetails = await super.getMetaData();
            this.checkPlaylist(metaDataDetails, "initialRequest");
        } catch(err){
            throw err;
        }
    }

    /**
     * 
     * @param {object} metadatas 
     * @param {string} playlistType 
     */
    async _defaultPlaylist(type, metadatas, playlistType){
        try{
            let metadataItem = metadatas.data.metaData;    
            let viewports = metadataItem.viewports;        
            if(playlistType === 'initialRequest'){
             //   this.sb.viewportMetadata(viewports, playlistType);
                this.sb.playlistToGetStreamsData(type, metadataItem, playlistType);                
                this.template.defaultDataDeStructure(metadataItem, playlistType);
            } else{
                let metaDataDetails = await super.getMetaData();
                let local = metaDataDetails.data.metaData;
                let req = metadatas.data.metaData;
                if(metaDataDetails.data.displayUrl != metadatas.data.displayUrl ){
                    chrome.storage.local.set({'metadata': metadatas });
                    this.template.defaultDataDeStructure(metadataItem, "modifiedRequest");
                    this.sb.viewportMetadata(viewports, playlistType); 
                } else {
                    let localPlaylistLastUpdatedDate = new Date(local.playlist.lastUpdatedDate);
                    let reqPlaylistLastUpdatedDate = new Date(req.playlist.lastUpdatedDate);
                    if(localPlaylistLastUpdatedDate < reqPlaylistLastUpdatedDate){
                        this.log.debug("AccPlaylist LastDate Change Happend");
                        chrome.storage.local.set({'metadata': metadatas });
                        this.template.defaultDataDeStructure(metadataItem, "modifiedRequest");
                      //  this.sb.viewportMetadata(viewports, playlistType); 
                    } else {
                        let localViewports = local.viewports;
                        let reqViewports = req.viewports;
                        let i = 0;
                        reqViewports.forEach((item) => {
                            let localViewportDate = new Date(item.last_updated_date);
                            let reqViewportDate = new Date(reqViewports[i].last_updated_date) ;
                            if(localViewportDate < reqViewportDate){
                                this.log.debug("AccViewport LastDate Change Happend");
                                chrome.storage.local.set({'metadata': metadatas });
                                chrome.storage.local.set({'viewportDate': 1});
                                // window.dispatchEvent(new CustomEvent("accountdetails", {
                                //     detail: { data: res }
                                // }));  
                                this.template.defaultDataDeStructure(metadataItem, "modifiedRequest");
                            //    this.sb.viewportMetadata(viewports, playlistType); 
                            } else {
                              //  this.template.defaultDataDeStructure(metadataItem, "modifiedRequest");  // remove this line because interval request
                            //    this.sb.viewportMetadata(viewports, playlistType);                              
                                this.log.debug("No deafult Change");
                            }
                        });
                    }
                }                
            }
        } catch(err){
            throw err;
        }       
    } // End of _defaultPlaylist


}