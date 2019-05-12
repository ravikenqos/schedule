"use strict"
class SbSlideLog {

  constructor(){
      this.businessId = '';
      this.postid = '';        
      this.log = new SbLogger();    
      this.sb  = new SbHelper();
      this.db = new SbIndexedDb();        
  }

  async save(data){

      try{
        if(this.postid != data.postId){ 
          let postData = '';
          this.postid =  data.postId;
          let slidePostdata = await this.db.getSlidePostdata(data.postId);
          
          if(!slidePostdata) {
            postData = {
              id: data.postId,
              data: data,
              impression_count: 1,
              last_acess_time: this.sb.getTimeStamp(),
              created_at: this.sb.getTimeStamp(),
              isVertical: data.isVertical,
            }
          } else {
            slidePostdata.data.videoUrl= data.videoUrl;
            slidePostdata.data.isVideo= data.isVideo;
            slidePostdata.impression_count = slidePostdata.impression_count + 1;
            slidePostdata.last_acess_time = this.sb.getTimeStamp();
            slidePostdata.isVertical = data.isVertical;
            postData = slidePostdata;
          }  
          let saveSlideLog = await this.db.saveSlideLog(postData); 
          if(!saveSlideLog){
            throw new Error("Unable to save "+ data.postId + "details ");  
          }
          let logres = await this.sendSlideLog(postData);
          if(logres === 1){
          
             await this.db.deleteSlideLogData(data.postId);
          }
        }
  
      } catch (err) {
       this.log.error(err)
      }       
  }  
  
  sendSlideLog(logData){
    let self = this;
    return new Promise(async (resolve, reject) => {
      let postData = logData.data;
      postData.currentTimeStamp = moment().valueOf(),
      postData.impression_count = logData.impression_count;
      postData.last_acess_time = logData.last_acess_time;
//      postData.chromecastId = await self.sb.getDeviceId(); 
      postData.chromecastId = await self.sb.getSerialNumber(); 
      postData.chromecastName = await self.sb.getSerialNumber(); 
      postData.businessId = await self.sb.getBusinessId();
      postData.isVertical = logData.isVertical;
      let url = config[region].saveCastSnapshotUrl;
      let param = postData;
      
       this.renderVertical(param);
      
      
         //   $("#CheckErrInfo").data("myKey", param);
      //$('#CheckErrInfo').html( $("#CheckErrInfo").data("myKey"));
      // $('#CheckErrInfo').html(JSON.stringify(param));
      $.ajax({
        url: url,
        type: 'POST',
        data: param,
      }).done((res) => {
        resolve(parseInt(res));
      }).fail((XMLHttpRequest, textStatus, errorThrown) => {
        if(XMLHttpRequest.readyState == 0){
           this.log.debug("no network");
        }
        reject(errorThrown);
      }); 

    });
  }

  renderVertical(param){
    if(param.isVideo == true){
      $('.main-image').css('display','none');
    }
    if(param.isVertical == '1'){
      $('.poweredby-logo').css('bottom','11%');
      $('.poweredby-logo').css('right','92%');
      $('.display-text').css('transform','rotate(90deg)');
      $('.display-text').css('right','42%');
      $('.poweredby-logo').css('transform','rotate(90deg)');
      $('.html-video-player-container').css('transform','rotate(90deg)');
      $('.status-button').css('left','5px');
      $('.status-button').css('bottom','5px');
     // $('#viewport_'+this.viewport.id).css('display','none');
      $('.main-image').css('transform','rotate(90deg)');
      $('.main-image').css('width',screen.height+'px');
      $('.main-image').css('height',screen.width+'px');
      $('.main-image').css('margin-top','-22%');
      console.log('vertical');
  }
  else{
      console.log('horizontal');
      $('.poweredby-logo').css('bottom','0%');
      $('.poweredby-logo').css('right','1%');
      $('.poweredby-logo').css('transform','rotate(0deg)');
      // $('.status-button').css('top', '');
  }
  }
  async clearSlideLog(){
    try{
      let logdata = await this.db.getAllSlideLogData();
      logdata.forEach( async (item) => {
        let logres = await this.db.sendSlideLog(item);
        if(logres == 1){
          await this.db.deleteSlideLogData(item.id);
        }
      })
    } catch (err) {
      this.log.error(err)
    }      
  }




}