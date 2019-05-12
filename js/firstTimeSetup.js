"use strict";
$(function(){
let sbApp = new FirstTimeSetup();
    sbApp.appInitiate();  
    $('#clickwebview').html(config[region].activateDevice)
                    .attr('href', config[region].activateDevice);
});


class FirstTimeSetup extends SbHelper{
    
    constructor(){
        super();
        this.sbp  = new Playlist();
        this.sbd = new Download();
        this.intervalMetadata = null;
    }

    _showMessage () {
        $('#screen').hide();
        $('.warning').show().html(
            `<i class="fa fa-exclamation-circle fa-2x"></i>
            <strong> Warning! </strong>No Internet Connection`
        );
    } 

    /**
     * method to pass layout and playlist metadata 
     * to render and socialbillboards class
     * 
     * 'initial' - while app start or restart
     * 'new' - after every 30 seconds rea from get info api
     * 
     * @param {object} metaData - metadata contains viewport and playlist information
     * @param {string} playlistType - (inital or new or modified)
     * 
     */
    displayBillboards(metaData, playlistType){
        try{
            $('#screen').hide();
            $('#apptitle').fadeIn();
            chrome.storage.local.set({'download': false});
            //clearTimeout(this.intervalMetadata);
            this.sbp.selectPlaylist(metaData, playlistType);
            // this.sbd.download();         
        }
        catch(err){
            this.log.error(err);
        }
    }// End Of displayBillboards

    async appInitiate() {
        let self = this; 
        let code = await this._getActivationCode();
        let requrl = `https://api.parllay.com/delivery/screen/playlistInfo/${code}`
        this.doAjax("GET", requrl).done( ( res ) => {
            chrome.storage.local.set({'metadata': res});
           this.displayBillboards(res, 'initialRequest');
           this._getInfo();
        }).fail(function (XHR, textStatus, errorThrown) {
            let metadata = self.getMetaData();
            metadata.then(function(res){
                if (res.length === 0){
                    self._appFirstTimeSetup();
                } else {
                    self.displayBillboards(res, 'initialRequest');
                    self._getInfo();
                }  
            }).catch(function(err){
                self.log.error(err);    
            });
            self.log.error(errorThrown);
        })
    }
    /**
     * 
     * Method to get viewport and playlist details after every 30 seconds
     */
    async _getInfo() {
        try{  
            let self = this;
            self.intervalMetadata = setInterval( async () => {
                let code = await this._getActivationCode();
                let requrl = `https://api.parllay.com/delivery/screen/playlistInfo/${code}`
                this.doAjax("GET", requrl).done( ( res ) => {
                   chrome.storage.local.set({'metadata': res});
                   this.sbp.selectPlaylist(res, 'intervalRequest');
                   console.log('d');
                   this.sbd.download(); 
                }).fail(function (xhr, textStatus, error) {
                    let metadata = self.getMetaData();
                    metadata.then(function(res){
                        if (res.length === 0){
                            self._appFirstTimeSetup();
                        } else {
                            self.displayBillboards(res, 'initialRequest');
                            self._getInfo();
                        }  
                    }).catch(function(err){
                        self.log.error(err);    
                    });
                    self.log.error(error);
                })  
            }, 10000); // Every 30 seconds            
        } catch(err){
            this.log.error(err);
        }
    }

    _appFirstTimeSetup() {
        try{
            let first, second, third;
            first = setTimeout(()=>{
                $('.firstscreen').show();
                $('.screenone').addClass('slide'); 
                clearTimeout(first);
                second = setTimeout(()=>{
                    $('.firstscreen').hide();
                    $('.secscreen').fadeIn('500'); 
                    $('.seccontent').addClass('slide');
                    third = clearTimeout(second);
                    setTimeout(()=>{
                        this.displayThirdscreen();
                        clearTimeout(third);   
                    }, 4500)
                }, 2500)
            }, 500);
        }catch(err){
            throw err;
        }
    }

    async displayThirdscreen() {
        try{  
            let code = await this._getActivationCode();
            if(code){
                this._displayThirdContent(code);
                await this._getMetaData(code);  
            } else {
                let code = super.randHex(6).toUpperCase();
                chrome.storage.local.set({'activationcode': code});
                this._displayThirdContent(code);
                this._saveNewActivationCode(code);                
            }
        } catch(err){
            this.log.error('DisplayThirdscreen', err);   
        }
    } 

    _displayThirdContent(code){
        $('.seccontent').hide();
        $('.thrdcontent').addClass('slide');
        $('.randomCode').html(code);
    }


    _getActivationCode(){
        return new Promise((resolve,reject) => {
            try{
                chrome.storage.local.get('activationcode', (res) => {
                    resolve (res.activationcode || null );
                });       
            }catch(err){
                resolve (err);
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
                resolve (err);
            }
        });    
    }    

    async  _saveNewActivationCode(code) {
            let deviceId = '';
            deviceId = await super.getSerialNumber();
            if(!deviceId){
                deviceId = super.randHex(6).toUpperCase();
            }
            let reqUrl = config[region].saveNewActivationCodeUrl;
            let reqData = { code: code, device_id: deviceId };
            super.doAjax("GET", reqUrl, reqData).done( ( res ) => {
                if(res.success){  
                    chrome.storage.local.set({'deviceId': deviceId});                     
                    chrome.storage.local.set({'activationcodestatus': res.success}); 
                    this._getMetaData(code);
                } else {
                    chrome.storage.local.set({'activationcodestatus': res.success});   
                }
            }).fail((textStatus, errorThrown ) => {
                chrome.storage.local.set({'activationcodestatus': false});    
            })
    }

    
    _getMetaData(code){
        return new Promise((resolve, reject) => {
            let reqUrl = config[region].metadataUrl;
            let reqData = { code: code};
            super.doAjax("GET", reqUrl, reqData).done(( res ) => {
                res = JSON.parse(res);
                if(res.success){
                    chrome.storage.local.set({'metadata': res});
                    this.displayBillboards(res, "initialRequest");
                    // this.checkMetaData();
                 } else if(!res.success){
                    setTimeout( async () => {
                       await this._getMetaData(code);
                    }, 30000);

                 }
                resolve(res);

            }).fail((textStatus, errorThrown ) => {
                reject(errorThrown);                    
            })
        });
    }




}


