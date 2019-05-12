"use strict"

class SbCache {

  constructor(){
      this.log = new SbLogger();    
      this.sb  = new SbHelper(); 
      this.db = new SbIndexedDb();
  }

  async getAssetFilename(assetUrl){
    try {
        return await this.db.getAssetFilename(assetUrl);
    } catch (err) {
      this.log.error(err);
    }  
  }


  async saveSbPostdata(id, videoUrl, imageUrl, contentType){
    try {
        return await this.db.saveSbPostdata(id, videoUrl, imageUrl, contentType);
    } catch (err) {
      this.log.error(err);
    }  
  }
 

  async saveAssetDetails(id, Url, FileName, blob_data_size, blob_data_type) {
    try {
        return await this.db.saveAssetDetails(id, Url, FileName, blob_data_size, blob_data_type);
    } catch (err) {
      this.log.error(err);
    }     
  }

  setCount(id){
    try {
        this.db.setCount(id);
    } catch (err) {
      this.log.error(err);
    }      
  }

  async remove(fileSize, playlist){
    try {
        let socialnt = ["facebook", "instagram", "twitter"];
        let postdata = await this.db.getAllPostData();
        let socialcontent = [];  
        let parllayContent = [];
        let totalFileSize = 0;
        postdata.forEach((item) => {
          if(socialnt.indexOf(item.content_type) > -1){
            socialcontent.push(item);
          } else if(item.content_type === "parllay" || "parllayAd"){
            parllayContent.push(item);
          }
        });
        
        let socialContentQueue = await this.sortContent(socialcontent);
        let parllayContentQueue = await this.sortContent(parllayContent);

        if(socialContentQueue && socialcontentQueue.length > 0 ){

          let socialcontentres = await this.getContentDetails(fileSize, totalFileSize, socialcontentQueue);

          if(socialcontentres.status || socialcontentres){
            let rmData = socialcontentres.data; 
            playlist.removePosts(null, rmData);
            await this._removeContents(rmData);
          } else {
            if(socialcontentres){
              totalFileSize = socialcontentres.totalFileSize;
              let rmData = socialcontentres.data;
              playlist.removePosts(null, rmData);
              await this._removeContents(rmData);
            }
            // if(rmsocialContent){
              let parllayContentres = await this.getContentDetails(fileSize, totalFileSize, parllayContentQueue);
              if(parllayContentres){
                let rmData = parllayContentres.data;
                playlist.removePosts(null, rmData);
                await this._removeContents(rmData);
              }
            // }
          }
        }  else {

          let parllayContentres = await this.getContentDetails(fileSize, totalFileSize, parllayContentQueue);
          if(parllayContentres){
            let rmData = parllayContentres.data;
            playlist.removePosts(null, rmData);
            await this._removeContents(rmData);
            // if(res){
            //   playlist.removePosts(null, rmData);
            // }
            return true;
          }            

        }  
    } catch (err) {
      this.log.error(err);
    }   
  
  }

  _removeContents(rmData, playlist){
    return new Promise ((resolve, reject) => {
      try{
          let len = rmData.length;
          let i = 0;
          rmData.forEach( async (item) => {
            let rmPostData = await this.db.removePostData(item.id);
            if(!rmPostData){
              throw new Error("Unable to remove Post Data :" + item.id);
            } else {
              let rmFile = await this.db.removeFile(item.file, item.size);
              if(!rmFile){
                throw new Error("Unable to remove File  :" + item.file);
              } else {
                let rmAssetDetails = await this.db.removeAssetDetails(item.id);
                if(!rmAssetDetails){
                  throw new Error("Unable to remove Asset Details :" + item.id);
                } 
              }
            }
            i++;  
          });
          if(i === len){
            resolve(true);
          }
      } catch(err){
        reject (err);
      }
    });              
  }


  sortContent(content){
    return new Promise ((resolve, reject) => {
      try{
        let contentQueue = content.sort((a, b) => {
            let dateB = new Date(this.sb.getDate(b.last_acess_time));
            let dateA = new Date(this.sb.getDate(a.last_acess_time));
            if (dateA > dateB){
              return 1;
            } else if (dateA < dateB){
              return -1;
            } else {
              if(a.impression_count > b.impression_count) {
                return 1;
              } else if(a.impression_count < b.impression_count) {
                return -1;
              } 
              return 0;
            }
        });   
        resolve(contentQueue);          
      } catch(err){
        reject (err);
      }
    });
  }
  

  async getContentDetails(fileSize, totalFileSize, contentQueue, type){
    return new Promise ( async (resolve, reject) => {
      try{
          if(contentQueue.length === 0){
            resolve(false);
          } else {
            let data = [];
            let assetData = {};
            let len = contentQueue.length;
            for(let i = 0; i < len; i++){
                let asset = await this.db.getAssetDetails(contentQueue[i].id);
                totalFileSize += parseInt(asset.size);
                data.push({
                  id: asset.id,
                  file: asset.file,
                  size: asset.size,
                });

          //       if(i == len - 1){
          //         let res = {
          //           data:data,
          //           totalFileSize: totalFileSize,
          //           status: false
          //         }              
          //         resolve(res);
          //       } else if(totalFileSize > fileSize){
                if(totalFileSize > fileSize){
                  let res = {
                    data:data,
                    totalSize: totalFileSize,
                    status: true
                  }
                  return resolve(res);
                }            
            }
          }
        } catch(err){
          reject (err);
        }
      })
  }   

  async getAssetDetails(id){
    try {
        return await this.db.getAssetDetails(id);
    } catch (err) {
      this.log.error(err);
    }  
  }

  async clear(){
    try {
        let clrPostData = await this.db.clearPostData();
        if(!clrPostData){
          throw new Error("Unable to clear Post Data !..");
        } else {
          let assets = await this.db.getAllAssets();
          if(!assets){
            throw new Error("Unable to get Assets !.."); 
          } else {
            // let i = 0;
            assets.forEach( async (item) => {
              let rmFile = await this.db.removeFile(item.file, item.size);
              if(!rmFile){
                throw new Error("Unable to remove File  :" + item.file);
              } else {
                let rmAssetDetails = await this.db.removeAssetDetails(item.id);
                if(!rmAssetDetails){
                  throw new Error("Unable to remove Asset Details :" + item.id);
                }                
              }
              // i++;            
            });
            // if(i == assets.length ){
            //   let clrAssetdetails = await this.db.clearAssetdetails();
            //   if(!clrAssetdetails){
            //     throw new Error("Unable to clear Assets !..");
            //   }  
            // }
          }
        }

    } catch (err) {
      this.log.error(err);
    }    
  }


}