
class SbHelper {

    constructor(){
        this.log = new SbLogger(); 
        this.playlist = [];
        this.init = false;  
    }

    randHex (len) {
        let maxlen = 8,
            min = Math.pow(16,Math.min(len,maxlen)-1), 
            max = Math.pow(16,Math.min(len,maxlen)) - 1,
            n   = Math.floor( Math.random() * (max-min+1) ) + min,
            r   = n.toString(16);
        while ( r.length < len ) {
           r = r + randHex( len - maxlen );
        } 
        return r;
    }

    getDeviceId(){
        return new Promise((resolve,reject) => {
            try{
                chrome.enterprise.deviceAttributes.getDirectoryDeviceId(deviceId => {
                    resolve (deviceId);
                });
            }catch(err){
                resolve (null);
            }
        });          
    }

    getSerialNumber(){
        return new Promise((resolve) => {
            try{
                chrome.enterprise.deviceAttributes.getDeviceSerialNumber(serialNumber => {
                    resolve (serialNumber);
                }); 
            }catch(err){
                resolve (null);
            }
        });          
    }    

    _getActivationCode(){
        return new Promise((resolve,reject) => {
            try{
                chrome.storage.local.get('activationcode', (res) => {
                    resolve (res.activationcode || null );
                });       
            }catch(err){
                reject (err);
            }
        });    
    }
    
    _getStreamCacheData(){
        return new Promise((resolve,reject) => {
            try{
                chrome.storage.local.get('streamCacheData', (res) => {
                    resolve (res.streamCacheData || []);
                });       
            }catch(err){
                reject (err);
            }
        });    
    }
    getPlaylistIds(){
        return new Promise((resolve,reject) => {
            try{
                chrome.storage.local.get('playlistIds', (res) => {
                    resolve (res.playlistIds || []);
                });       
            }catch(err){
                reject (err);
            }
        });    
    }

    getDownloadStatus(){
        return new Promise((resolve,reject) => {
            try{
                chrome.storage.local.get('download', (res) => {
                    resolve (res.download || false);
                });       
            }catch(err){
                reject (err);
            }
        });    
    }

    getMetaData(){
        return new Promise((resolve,reject) => {
            try{
                chrome.storage.local.get('metadata', (res) => {
                    resolve (res.metadata || []);
                });       
            }catch(err){
                reject (err);
            }
        });    
    }

    _getViewportDate(){
        return new Promise((resolve,reject) => {
            try{
                chrome.storage.local.get('viewportDate', (res) => {
                    resolve (res.viewportDate);
                });       
            }catch(err){
                reject (err);
            }
        });    
    }    

    getBusinessId(){
        return new Promise((resolve,reject) => {
            try{
                chrome.storage.local.get('accountdetails', (res) => {
                    resolve (res.accountdetails.data.businessId || null);
                });       
            }catch(err){
                reject (err);
            }
        });    
    }

    _getActivationCodeStatus(){
        return new Promise((resolve,reject) => {
            try{
                chrome.storage.local.get('activationcodestatus', (res) => {
                    resolve (res.activationcodestatus || null );
                });                
      
            }catch(err){
                reject (err);
            }
        });    
    } 
    getTimeStamp(){
        let now = new Date();
        let day = now.getDate();
        let month = now.getMonth() + 1;
        let year = now.getFullYear();
        let hours = now.getHours();
        let minutes = now.getMinutes();
        let seconds = now.getSeconds();
        let milliseconds = now.getMilliseconds();
        return day+'/'+month+'/'+year+' '+ hours+':'+minutes+':'+seconds+':'+milliseconds;
    }  

    getCurrentTime(){
        let now = new Date();
        let day = now.getDate();
        let month = now.getMonth() + 1;
        let year = now.getFullYear();
        let hours = now.getHours();
        let minutes = now.getMinutes();
        let seconds = now.getSeconds();
        return day+'-'+month+'-'+year+' '+ hours+':'+minutes+':'+seconds;
    }  

    convertUTCDateToLocalDate(date) {
        var newDate = new Date(date.getTime()+date.getTimezoneOffset()*60*1000);
        var offset = date.getTimezoneOffset() / 60;
        var hours = date.getHours();
        newDate.setHours(hours - offset);
        return newDate;   
    }  


    getDate(timestamp){
        let now = new Date(timestamp);
        let day = now.getDate();
        let month = now.getMonth() + 1;
        let year = now.getFullYear();
        return day+'/'+month+'/'+year
    }
     //startDateTime-currentDateTime as dataTime2 - dataTime1
     // futuredatetime - currentdatetime or olddatetime
    
    isNegative(dataTime1, dataTime2){
        let val = dataTime1 - dataTime2;
        return val < 0 ? true : false; 
    } 
     
    diff_hours(dataTime2, dataTime1) 
    {
        //  let diff =(dt2.getTime() - dt1.getTime()) / 1000;
        //  diff /= (60 * 60);
        //  return Math.abs(Math.round(diff));
        let res = Math.abs(dataTime2 - dataTime1) / 1000;
         return Math.floor(res / 3600) % 24;      
    }

    diff_minutes(dataTime2, dataTime1) 
    {
        // let diff =(dt2.getTime() - dt1.getTime()) / 1000;
        // diff /= 60;
        // return Math.abs(Math.round(diff));
        let res = Math.abs(dataTime2 - dataTime1) / 1000;
        return Math.floor(res / 60) % 60;
     
    }

    diff_seconds(dataTime2, dataTime1) 
    {
        let res = Math.abs(dataTime2 - dataTime1) / 1000;
        return res % 60;;
    }

    diff_time_seconds(dataTime1, dataTime2) 
    {
        //return Math.floor(Math.abs(dataTime2 - dataTime1) / 1000);
        return Math.floor(Math.abs(dataTime2 - dataTime1));
    }    



    doAjax(reqMethod, reqUrl, reqData){
        return $.ajax({
            method: reqMethod,
            url: reqUrl,
            data: reqData,
            crossDomain: true
        })
    }

   getNetworkSpeed(){
        return new Promise((resolve, reject) => {
            try{           
                let start = new Date().getTime();
                let bandwidth;
                let i = 0;
                let cnt = 10;
                (function rec() {
                    var xmlHttp = new XMLHttpRequest();
                    xmlHttp.open('GET', 'http://upload.wikimedia.org/wikipedia/commons/5/51/Google.png', true);
            
                    xmlHttp.onreadystatechange = function () {
                        try{
                            if (xmlHttp.readyState == 4) {
                                let size = xmlHttp.getResponseHeader('Content-Length');
                                let x = new Date().getTime() - start;
                                let bw = Number(((238 / (x / 1000))));
                                bandwidth = ((bandwidth || bw) + bw) / 2;
                            
                                i++;
                            if (i < cnt) {
                                start = new Date().getTime();
                                rec();
                            }else{
                                let speed = bandwidth.toFixed(0);
                                resolve((speed / 1024).toFixed(2)) 
                            } ;
                            }
                        } catch(err){
                            reject(err);
                        }                            
                    };
                    xmlHttp.send(null);
                })();


            } catch(err){
                reject(err);
            }

        })   
   }

   getSourceSize(url){
    return new Promise((resolve, reject) => {
        try{
            let xmlHttp = new XMLHttpRequest();
            xmlHttp.open('GET', url, true);
            xmlHttp.onreadystatechange = function () {
            try{  
                // if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {                 
                    if (xmlHttp.status == 200) {
                        let size = parseInt(xmlHttp.getResponseHeader('Content-Length'));
                        resolve(size);
                        xmlHttp.abort();
                    } else  if (xmlHttp.status == 206) {
                        let range = xmlHttp.getResponseHeader('Content-Range');
                        let data = range.split('/');
                        let size = data.pop();
                        resolve(size);
                        xmlHttp.abort();
                    }
                } catch(err){
                    reject(err);
                }
            };
            // if (xmlHttp.status == 206) {

            //     console.log("size");
            // }
            xmlHttp.send();


        } catch(err){
            reject(err);
        }

    })         
   }

   getVideoIDFromURL (ytUrl) {
        try{
            let youTubeUrlRegex = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
            let ytUrlId = (ytUrl.match(youTubeUrlRegex)) ? RegExp.$1 : false;
            return ytUrlId;
        } catch(err){
            console.error(err);
        }
    }
    
    /**
     * usage reflects  how many bytes a given origin is effectively using for same-origin data
     * quota reflects the amount of space currently reserved for an origin. 
     */
    async bytesToGb(value){
        return Math.round(value / (1024 * 1024))
    }

};

