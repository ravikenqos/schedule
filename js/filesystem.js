"use strict";

class FileSystem extends SbHelper{

    constructor(){
        super();
    }


    getStroageSize(){
        return new Promise(function(resolve, reject) {
            navigator.webkitPersistentStorage.queryUsageAndQuota ( 
                function(usedBytes, grantedBytes) {  
                    //console.log('we are using ', usedBytes, ' of ', grantedBytes, 'bytes');
                    resolve(
                        usedBytes
                    );
                }, 
                function(e) { reject(err);  }
            );
        });
    }    

    getFile(FileName){
        return new Promise((resolve, reject) => {
            try {
            let data = {};    
            window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
            window.requestFileSystem(window.PERSISTENT, 1024 * 1024, (fs) => {
                fs.root.getFile(FileName, {}, (fileEntry) => {
                fileEntry.file((file) => {
                    data.assetUrl = URL.createObjectURL(file);
                    data.assetSize = file.size;
                    resolve(data);
                });
                }, (e) => { 
                    if (e.code === 8){ // NotFoundError
                    resolve (null); 
                    } else // reject with other errors so its surfaced
                    reject(e) 
                });
            }, (e) => { reject(e) });

            } catch (error) {
            reject(error);
            }
        });
    } 


    save(FileName, blob_data){
        let self = this;
        return new Promise((resolve, reject) => {
            window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
            window.requestFileSystem(window.PERSISTENT, blob_data.size, function(fs) {
            fs.root.getFile(FileName, {create: true}, function(fileEntry) {
                fileEntry.createWriter(function(fileWriter) {
                fileWriter.onwriteend = function(e) {
                    resolve(true);
                };
                fileWriter.onerror = function(e) {
                    //let fileError = e.target.error;
                    // if(fileError.name === 'QuotaExceededError'){
                    //     // sbDelete to remove delete;
                    //     self.sbCache.remove(blob_data.size);
                    // } else {
                        reject(false);
                    // }
                };
                fileWriter.write(blob_data);
                });
            });
            });  
        }); 
    }


}