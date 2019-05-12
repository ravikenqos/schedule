
class SbIndexedDb {

  constructor(){
    this.log = new SbLogger();    
    this.sb  = new SbHelper();
    this.conn = '';
  }

  dbConnect() {
      return new Promise((resolve, reject) => {
        let request = indexedDB.open("sbcache", 1);
  
        request.addEventListener('error', (event) => {
          this.log.error("Db Connect", request.error);
        });
  
        request.onupgradeneeded = function (event) {
          let db = event.target.result;
          let objectStore = '';
          if (!db.objectStoreNames.contains("sbpostdata")) {
            objectStore = db.createObjectStore("sbpostdata", {keyPath: "id"});
          }
          objectStore.createIndex("image_url", "image_url", {unique: false});
          objectStore.createIndex("video_url", "video_url", {unique: false});
          objectStore.createIndex("content_type", "content_type", {unique: false});
          objectStore.createIndex("impression_count", "impression_count", {unique: false});
          objectStore.createIndex("created_at", "created_at", {unique:false});
          objectStore.createIndex("last_acess_time", "last_acess_time", {unique: false});
  
          let assetObjectStore = '';
          if (!db.objectStoreNames.contains("sb_assets")) {
            assetObjectStore = db.createObjectStore("sb_assets", {keyPath: "id"});
          }
          assetObjectStore.createIndex("asset_url", "asset_url", {unique: false});
          assetObjectStore.createIndex("file", "file", {unique: false});
          assetObjectStore.createIndex("size", "size", {unique: false});
          assetObjectStore.createIndex("type", "type", {unique: false});
          assetObjectStore.createIndex("created_at", "created_at", {unique:false});

          let slideLogObjectStore = '';
          if (!db.objectStoreNames.contains("slide_logs")) {
            slideLogObjectStore = db.createObjectStore("slide_logs", {keyPath: "id"});
          }
  
          slideLogObjectStore.createIndex("data", "data", {unique: true});
          slideLogObjectStore.createIndex("impression_count", "impression_count", {unique: false});
          slideLogObjectStore.createIndex("last_acess_time", "last_acess_time", {unique: false});
          // slideLogObjectStore.createIndex("is_sync", "is_sync", {unique: false});
          slideLogObjectStore.createIndex("created_at", "created_at", {unique:false});     
       

          let viewportPostsObjectStore = '';
          if (!db.objectStoreNames.contains("viewport_posts")) {
            viewportPostsObjectStore = db.createObjectStore("viewport_posts", {keyPath: 'id', autoIncrement: true});
          }
          viewportPostsObjectStore.createIndex("viewport_id", "viewport_id", {unique: false});
          viewportPostsObjectStore.createIndex("record", "record", {unique: false});
    
        }        

        request.onerror = function (event) {
          reject(false)
        };
  
        request.onsuccess = function (event) {
          resolve(event.target.result);
        };
  
      });
    } //End of dbconnect

  async getDbConnect(){
    try{
        this.conn = await this.dbConnect();
        if(!this.conn){
          throw new Error("Not connect to Database");
      } 
    } catch(err){
        this.log.error(err);
    }
  }  

  getAssetFilename(assetUrl) {
    return new Promise( async (resolve, reject) => {
      try{
          if(!assetUrl){
            resolve(false);
          }
          await this.getDbConnect();          
          let transaction = this.conn.transaction(["sb_assets"])
          let asset = transaction.objectStore("sb_assets");
          let index = asset.index("asset_url");
          let request = index.get(assetUrl);
          request.onerror = function (event) {
            resolve(false);
          };
          request.onsuccess = function () {
          if (request.result) {
            resolve(request.result.file); 
          } else {
            resolve(false);
          }
          };
      } catch(err){
        reject(err);
      }        
    });
  }

  saveSbPostdata(id, videoUrl, imageUrl, contentType, created_at = null, last_acess_time = null, impression_count = null){
    return new Promise( async (resolve, reject) => {
      try{  
          await this.getDbConnect();
          let postData = {
            id: id,
            image_url: imageUrl || null,
            video_url: videoUrl || null,
            content_type: contentType || null,
            created_at: created_at || this.sb.getTimeStamp(),
            last_acess_time: last_acess_time || null,
            impression_count: impression_count || 0            
          } 
          let transaction = this.conn.transaction(["sbpostdata"], 'readwrite');
          let objectStore = transaction.objectStore("sbpostdata");
          let request = objectStore.put(postData);
          request.onsuccess = function() {
            resolve(request.result);
          }
        
          request.onerror = function (event) {
            resolve(false);
          };
        } catch(err){
            reject(err);
        }
    });
  }

getAllPostData(){
  return new Promise(async (resolve, reject) => {
    try{ 
        await this.getDbConnect();
        let transaction = this.conn.transaction("sbpostdata");
        let objectStore = transaction.objectStore("sbpostdata");
        let postdata = [];
        objectStore.openCursor().onsuccess =  (event) => {
          let cursor = event.target.result;
          if (cursor) {
            let postData = {
              id: cursor.value.id,
              image_url: cursor.value.image_url,
              video_url: cursor.value.video_url,
              content_type: cursor.value.content_type,
              impression_count: cursor.value.impression_count,
              created_at: cursor.value.created_at,
              last_acess_time: cursor.value.last_acess_time,
            }
            postdata.push(postData);
            cursor.continue();
          } 
        }

        transaction.oncomplete =  (evt) => {
          resolve(postdata);
        }
        transaction.onerror = function (event) {
          resolve(false);
        };

    } catch(err){
        reject(err);
    }    
  });   
}  


  saveAssetDetails(id, assetUrl, file, size, type) {
    return new Promise((resolve, reject) => {
      try{ 
          let transaction = this.conn.transaction(["sb_assets"], "readwrite")
          let asset = transaction.objectStore("sb_assets");
          let request = asset.put({
            id: id,
            asset_url: assetUrl,
            file: file,
            size: size,
            type: type,
            created_at: this.sb.getTimeStamp(),
          });

          request.onsuccess = function (event) {
            resolve(true);
          };
          request.onerror = function (event) {
            resolve(false);
          };

      } catch (err){
        reject(err);
      }         
    });
  }  
  
  async setCount(id){
    try {
          let data = await this._getPostData(id);
          if(data){
            let last_acess_time = this.sb.getTimeStamp();
            let impression_count = data.impression_count + 1;
            let savePost = await this.saveSbPostdata(data.id, data.video_url, data.image_url, data.content_type, data.created_at, last_acess_time, impression_count);      
            if(!savePost){
              throw new Error("Unable to update "+ data.id + "count");  
            }            
          } else {
              throw new Error("Unable to get data for "+ id); 
          }
    } catch (err) {
      throw  err;
    }      
  }  

  _getPostData(id){
    return new Promise( (resolve) => {
      try{
          let transaction = this.conn.transaction(["sbpostdata"], 'readonly');
          let objectStore = transaction.objectStore("sbpostdata");
          let request = objectStore.get(id);
          request.onsuccess = function() {
            resolve(request.result);
          }
          request.onerror = function (event) {
            reject(event);
          }
        } catch(err){
            reject(err);
        }
    }); 
  }

  getAllAssets(){
    return new Promise( async (resolve, reject) => {
      try{  
          await this.getDbConnect();
          let transaction = this.conn.transaction(["sb_assets"], 'readonly');
          let objectStore = transaction.objectStore("sb_assets");
          let assets = [];
          objectStore.openCursor().onsuccess =  (event) => {
            let cursor = event.target.result;
            if (cursor) {
              let assetsData = {
                id: cursor.value.id,
                asset_url: cursor.value.asset_url,
                file: cursor.value.file,
                size: cursor.value.size,
                type: cursor.value.type,
                created_at: cursor.value.created_at               
              }
              assets.push(assetsData);
              cursor.continue();
            } 
          }

          transaction.oncomplete =  (evt) => {
            resolve(assets);
          }
      } catch(err){
        reject(err);
      }
    });      
  }

  getAssetDetails(id){
    return new Promise( (resolve, reject) => {
      try{
          let transaction = this.conn.transaction(["sb_assets"], 'readonly');
          let objectStore = transaction.objectStore("sb_assets");
          let request = objectStore.get(id);
          request.onsuccess = function() {
            resolve(request.result);
          }
          request.onerror = function (event) {
            resolve(false);
          }
        } catch(err){
            reject(err);
        }
    }); 
  }

  removePostData(id){
    return new Promise((resolve, reject) => {
      try{
          let transaction = this.conn.transaction(["sbpostdata"], "readwrite");
          let objectStore = transaction.objectStore("sbpostdata");
          let request = objectStore.delete(id);
          request.onsuccess = function (event) {
            console.log("removepostdata"+id);
            resolve(true);
          };
          request.onerror = function (event) {
            resolve(false);
          };
      } catch(err){
        reject(err);
      }           
    });
  }

  removeAssetDetails(id){
    return new Promise((resolve, reject) => {
      try{
          let transaction = this.conn.transaction(["sb_assets"], "readwrite");
          let objectStore = transaction.objectStore("sb_assets");
          let request = objectStore.delete(id);
          request.onsuccess = function (event) {
            console.log("removeAssetDetails"+id);            
            resolve(true);
          };
          request.onerror = function (event) {
            resolve(false);
          };
      } catch(err){
        reject(err);
      }           
    });
  }

  removeFile(fileName, fileSize){
    return new Promise((resolve) => {
      try{  
          window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
          window.requestFileSystem(window.PERSISTENT,  fileSize, function(fs) {
            fs.root.getFile(fileName, {}, function(fileEntry) {
                fileEntry.remove(function() {
                  console.log("removeFile"+fileName);                    
                  resolve(true);
                }, e => resolve(false));
            }, e => resolve(false));
          }, e => resolve(false)) 
      } catch(err){
        reject(err);
      }           
    });

  }
  
  clearPostData(){
    return new Promise( async (resolve, reject) => {
      try{
          await this.getDbConnect();
          let transaction = this.conn.transaction(["sbpostdata"], "readwrite");
          let objectStore = transaction.objectStore("sbpostdata");
          let request = objectStore.clear();
          request.onsuccess = function (event) {
            resolve(true);
          };
          request.onerror = function (event) {
            resolve(false);
          };
      } catch(err){
        reject(err);
      }           
    });
  }  

  clearAssetdetails(){
    return new Promise((resolve, reject) => {
      try{
          let transaction = this.conn.transaction(["sb_assets"], "readwrite");
          let objectStore = transaction.objectStore("sb_assets");
          let request = objectStore.clear();
          request.onsuccess = function (event) {
            resolve(true);
          };
          request.onerror = function (event) {
            resolve(false);
          };
      } catch(err){
        reject(err);
      }           
    });
  } 

  getSlidePostdata(id){
    return new Promise( async (resolve, reject) => {
      try{   
          await this.getDbConnect();            
          let transaction = this.conn.transaction(["slide_logs"], 'readonly');
          let slidelog = transaction.objectStore("slide_logs");
          let request = slidelog.get(id);
          request.onsuccess = function() {
            resolve(request.result);
          }
          request.onerror = function (event) {
            resolve(false);
          };
      } catch(err){
        reject(err);
      }   
    });     
  }

  saveSlideLog(postData){
    return new Promise( async (resolve, reject) => {
      try{  
        await this.getDbConnect();             
          let transaction = this.conn.transaction(["slide_logs"], "readwrite")
          let slidelog = transaction.objectStore("slide_logs");
          let request = slidelog.put(postData);
          request.onsuccess = function (event) {
            resolve(true);
          };
    
          request.onerror = function (event) {
            resolve(false);
          }; 
      } catch(err){
        reject(err);
      }   
    });    
  }

  deleteSlideLogData(id){
    return new Promise( async(resolve, reject) => {
      try{ 
          await this.getDbConnect();              
          let transaction = this.conn.transaction(["slide_logs"], "readwrite")
          let slidelog = transaction.objectStore("slide_logs");
          let request = slidelog.delete(id);
          request.onsuccess = function (event) {
            resolve(true);
          };
    
          request.onerror = function (event) {
            resolve(false);
          };  
      } catch(err){
        reject(err);
      }   
    }); 
  }
  
  
  saveViewportPost(postData){
    return new Promise( async (resolve, reject) => {
      try{  
          await this.getDbConnect();
          let transaction = this.conn.transaction(["viewport_posts"], "readwrite");
          let viewportPost = transaction.objectStore("viewport_posts");
          let request = viewportPost.put(postData);
          request.onsuccess = function (event) {
            resolve(true);
          };
    
          request.onerror = function (event) {
            resolve(false);
          }; 
      } catch(err){
        reject(err);
      }   
    });    
  } 
  
  
  getViewportRecordsId(viewportId){
    return new Promise( async (resolve, reject) => {
      try{
          await this.getDbConnect();
          let transaction = this.conn.transaction(["viewport_posts"], 'readonly');
          let objectStore = transaction.objectStore("viewport_posts");
          let posts = [];
          objectStore.openCursor().onsuccess =  (event) => {
            let cursor = event.target.result;
            if (cursor) {
              if(cursor.value.viewport_id == viewportId){
                //posts.push(cursor.value.record);
                posts.push(cursor.value.record.id);
              }
              cursor.continue();
            } 
          }
          transaction.oncomplete =  (evt) => {
            resolve(posts);
          }

        } catch(err){
            reject(err);
        }
    });     
  }

  getViewportRecords(viewportId){
    return new Promise( async (resolve, reject) => {
      try{
          await this.getDbConnect();
          let transaction = this.conn.transaction(["viewport_posts"], 'readonly');
          let objectStore = transaction.objectStore("viewport_posts");
          let posts = [];
          objectStore.openCursor().onsuccess =  (event) => {
            let cursor = event.target.result;
            if (cursor) {
              if(cursor.value.viewport_id == viewportId){
                posts.push(cursor.value.record);
             //   posts.push(cursor.value.record.id);
              }
              cursor.continue();
            } 
          }
          transaction.oncomplete =  (evt) => {
            resolve(posts);
          }

        } catch(err){
            reject(err);
        }
    });     
  }  

}      
