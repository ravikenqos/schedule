"use strict"
class Viewport {
    constructor(){
        this.sb  = new SbHelper();
        this.circularlist = new CircularList();
        this.repeatlist = new RepeatList();
        this.sbslidelog = new SbSlideLog();
        this.template = new Template();
        this.cachedList = [];
        this.newPostStack = [];
        this.displayList = [];
        this.postDatas = [];
        this.postIds = [];
        this.postList = [];
        this.postOriginalId = [];
        // this.newStackTemp = [];
        this.timer = null; 
        this.temp = [];
        this.newStackTemp = [];
        this.removed_posts = [];
        this.viewportid = null;
        this.viewport = null;
        this.repeatPostId = null;
        this.lastViewId = null;
    }
    async categorizePost(post, mode){
        try{
            switch(mode){
                case "regular":
                    await this.circularlist.add(post);
                    break;
                case "new":
                    await this.newPostStack.push(post);
                    break;
                case "repeat":
                    // this.isCircularListPost(post.originalId);
                    await this.repeatlist.push(post);
                    break;
            }
        }catch(err){
            console.error(err);
        }
    }
    
    async getContent(event = null){
        try{
             if(this.repeatPostId){
                if(this.temp.length > 0){  // condition will true after id 2nd cylcle
                if(this.repeatPostId != this.temp[0]){                       // if continuous repeat post 
                    if(this.temp.indexOf(this.repeatPostId) < 0){
                        this.repeatlist.postIdsTemp.push(this.repeatPostId);
                        this.temp.push(this.repeatPostId)
                    }
                }
                this._removeNode(this.temp[0]);                
                this.temp.pop();
                } else {
                    if(this.temp.indexOf(this.repeatPostId) < 0){
                        this.repeatlist.postIdsTemp.push(this.repeatPostId);
                        this.temp.push(this.repeatPostId)
                    }
                }
            }

            if(event){    // if event is rised.
                if(event === "circularlist"){
                    if(!this.circularlist.isEmpty()){
                        this._renderContent(this.circularlist.listFirstNode());
                    }
                    //  this._checkStack();
                } 
            } else {
                let post ;
                if(!this.circularlist.isEmpty()){
      
                    post = await this.circularlist.getNext();
                     if(post){
                        this._renderContent(post);
                         
                     } else {
                        console.log("No Post");
                    }
                }    
            } 
        }catch(err){
            console.error(err);
        }   
    }


    
    _play(){
        try{ 
            
            this.timer = setTimeout(() => {
                this.getContent();
         //   }, this.viewport.transition_speed);
            }, 10000);
        }catch(err){
            console.error(err);
        }        
 
    }

    clearTimer(){
        try{
            clearTimeout(window.timer);    
        }catch(err){
            console.error(err);
        }
    }
    
    clear(){
        try{
            this.circularlist.clearList();
            this.cachedList = [];
            this.newPostStack = [];
            this.displayList = [];
            this.postDatas = [];
            this.postIds = [];
            this.postList = [];
            this.newStackTemp = []; 
            this.temp = [];
            this.newStackTemp = [];
            this.removed_posts = [];

        }catch(err){
            console.error(err);
        }        
    }
    removePosts(viewportid, deleteRecord){
        try{
            deleteRecord.forEach((item)=>{
                let postId = item.postId
                if(this.removed_posts.indexOf(postId) < 0){
                    this.removed_posts.push(postId);
                    this.circularlist.removeNode(postId);
                    this._removeNewPost(postId);
                    this.repeatlist.remove(postId);
                }
            })

        }catch(err){
            console.error(err);
        }
    }

    _removeNewPost(postId){
        try{
            if(this.newPostStack.length > 0){
                this.newPostStack.forEach((item, i) => {
                    if(item.originalId == postId){
                        this.newPostStack.splice(i, 1);  
                    }
                })
            }
        }catch(err){
            console.error(err);
        }  
    }


    _renderContent(item){
        try{
            //  console.log("item", item);
            let viewport = this.viewport;
            let viewportId = this.viewportid;
            this.currentContent = item;
            let viewportid = `#viewport_`+viewportId;
            
            clearTimeout(this.timer);

            if(this.circularlist.size < 3){
                this._checkStack();
            }
            item.performanceData = window.performance.memory;

            let videoUrl, imageUrl, Url, path, dataVideo = '';
            imageUrl = (item.mediaType === "image" || item.mediaType === "photo" || item.mediaType === "carousel" || (item.mediaType === "undefined" &&  item.videoUrl === '') || (item.mediaType === "" &&  item.videoType === 'others') || (typeof item.mediaType === "undefined" &&  item.videoType === 'others') ) ? item.image : null;
            videoUrl = (item.mediaType === "video" || item.mediaType === "youtube") ? item.videoUrl : null;
            Url = imageUrl || videoUrl;

            // if(item.hasVideo == 1)
            //     item.assetUrl = 'https:'+item.image

            let dataVideourl = '';

            if(item.postMode === 'new'){
                this.newPostId = item.originalId;
                this.currentContent.postMode = "regular";
            }

            if(item.postMode === 'repeat'){
                this.repeatPostId = item.originalId;
                this.repeatlist.update(this.repeatPostId);
            }

            // this.repeatlist.updatePostRunningCount();            

            if(this.circularlist.isLastNode){
                this._mergeCircularlist_displaylist();
            } else {
                if(this.circularlist.size > 2){
                    this._checkStack();
                }                  
            }

            if(videoUrl && item.videoType === 'youtube'){
                this.ytContent(viewport, viewportid, videoUrl)
            } else if(videoUrl && item.videoType != 'youtube'){
                dataVideourl = item.assetUrl;
                this.videoContent(viewport, viewportid, dataVideourl, item);
            } else if(!videoUrl && item.mediaType != 'video'){
                if(viewport.tickered_profile != 1){
                     this._play();
                }
            }

            this.template.render(viewport, viewportId, item); 

            this._adjustTextFontSize(viewportid);

            this.changeViewportSettings(viewport, viewportid);
            
            this.listenAccEvent();
            
            this.chkNtStatus(item);
            
            if(viewport.tickered_profile == 0 ){
                this.sendPostLog(item, Url);
            }
        }catch(err){
            console.error(err);           
        }
        
    }
    
    _checkStack(){
        try{
            //RepeatPostStack 
            if(!this.repeatlist.isEmpty()){
                let post = this.repeatlist.get();
                if(post && post.runningCount == 0  && post.show == 0){
                    let currentNode = this.circularlist.getcurrent();
                    this.circularlist.insertAfter(currentNode, post);
                }
            } 

            //NewPostStack 
            if(this.newPostStack.length != 0){  
                let post = this.newPostStack.pop();
                let currentRenderedNode = this.circularlist.getcurrent();
                this.circularlist.insertAfter(currentRenderedNode, post); 
            }
        } catch(err){
            console.error(err);
        }        
    }

    _removeNode(newPostId){
        this.circularlist.removeNode(newPostId);
        this.newPostId = null;
        this.temp.pop(); 
    } 
    
    async _mergeCircularlist_displaylist(){
        try{
                if(this.postList.length > 0){
                    this.postList = [];
                } else {
                    this.postList = [];
                }   

                let circularlistPost = await this.circularlist.getAllPost();

                await this._addPost(circularlistPost);
                let postlist = await this._sortFun();
                this.circularlist.clearList();
                let i = 0;
                postlist.forEach((item)=>{
                    this.circularlist.add(item);
                    i++;
                });
                if(i === this.postList.length){
                    this.circularlist.currentNode = this.circularlist.head.data;
                }

        }catch(err){
            console.error(err);
        }
    }

    _sortFun(){
        return new Promise((resolve, reject) => {
            try{
                let postlist = this.postList.sort((a, b) => {
                     let dateB = new Date(b.timeStamp);
                     let dateA = new Date(a.timeStamp);
                  //  let dateB = b.timeStamp;
                   // let dateA = a.timeStamp;                    
                    if (dateA < dateB){
                        return 1;
                      } else if (dateA > dateB){
                        return -1;
                      } else {
                        return 0;
                      }                
                });
                
                resolve(postlist);
            }catch(err){
                reject(err);
            }
        });        
    }
    
    async _addPost(posts){
        return new Promise((resolve, reject) => {
            try{
                posts.forEach((item) => {
                    this.postList.push(item)  
                });
                resolve(true);
            }catch(err){
                reject(err);
            }
        });
    } 
    
  
    videoContent(viewport, viewportid, dataVideourl, item){
        try{
            let vidId = `${viewportid} video`;
            let vid = document.querySelector(vidId);
            $(viewportid+" video").attr('src', dataVideourl)
            $(viewportid+" video").css('display', 'inline');
            $(viewportid+" .html-video-player-container").show();
            
            vid.play();

            vid.onended = () => {
                this.OnEnded(viewportid, vid);
            };

            vid.onerror = (e) => {
                item.videoError = e.target.error.code+':'+e.target.error.message
                this.sbslidelog.sendLog(item)
                // this.OnEnded(viewportid, vid);                
              //  console.log("Error " + vid.error.code + "; details: " + vid.error.message);
                if(e.target.error.message == 'DEMUXER_ERROR_COULD_NOT_OPEN: FFmpegDemuxer: open context failed'){
                    this.OnEnded(viewportid, vid);
                }
            };

            vid.onpause = () => {
                item.videoPausedError = "Video is Paused";
                this.sbslidelog.sendLog(item);
                vid.play();
                // this.OnEnded(viewportid, vid);
            };  

        }catch(err){
            console.error(err);
        }        
    } 

    
    OnEnded(viewportid, vid){
        try{
            $(`${viewportid} video`).removeAttr('src');
            //vid.src = "";
            $(`${viewportid} .html-video-player-container`).hide();
            $(`${viewportid} video`).hide();
            this.getContent();
        }catch(err){
            console.error(err);
        }       
    } 



    ytContent(viewport, viewportid, videoUrl){
        try{
            chrome.runtime.onConnect.removeListener();
            let videoId = this.sb.getVideoIDFromURL(videoUrl);
            if (videoId !== false) {
                let ytplayer = `<webview src="http://54.153.95.221/ytube/ytube.html" style="display: block;width:100%;height:100%;"></webview>`;                                
                $('body').prepend(ytplayer);
                const webview = document.querySelector('webview');
                webview.addContentScripts([{
                    name: 'sbCacheClient',
                    matches: ['http://*/*'],
                    js: { files: ['js/lib/jquery.js', '/js/sbwebview.js'] },
                    run_at: 'document_end'
                }]);
                let i = 0;
                chrome.runtime.onConnect.addListener( (port) => {
                    port.onMessage.addListener( async (msg) => {
                        if(msg.conn && i === 0){
                            port.postMessage({
                                videoid: videoId,
                                isMute: viewport.video_muted
                            }); 
                        }
                        if (msg.playerState === 0 && i === 1) {
                            this.getContent();            
                            $('webview').remove();
                        }
                        i++;
                    })
                });                 
                
            }    
        }catch(err){
            console.error(err);
        }
    }

    sendPostLog(item, Url){
        try{
            let data = {
                'viewport_id' : this.viewportid,
                'command' : 'slide_changing',
                'socialChannelType' : item.social_type_code,
                'embedType' : 'public_display',
                'embedId' : this.viewportid,
                'embedName': self.creative_name,
                'autoPublish' : '-',
                'streamId' : item.streamId,
                'postId' : item.originalId,
                'isVertical' : this.viewport.vertical_viewport,
                'imageUrl' : Url,
                'videoUrl' : Url,
                'postText' : $.trim(item.text),
                'slide_timeout' : '',
                'simulation' : '',
                'post_count_in_dom': 1
            };
            
            if(item.mediaType == 'video'){
                data.isVideo = true;
            }
            else{
                data.isVideo = false;
            }
            this.sbslidelog.save(data);
        }catch(err){
            console.log(err);
        }     
    }
    

    chkNtStatus(item){
        try{
            if (!navigator.onLine) {
                SplitScreen.setStatusButtonClass('red');
            } else {
                if(item.online == 1){
                    SplitScreen.setStatusButtonClass('green');    
                } else if(item.online == 0){
                    SplitScreen.setStatusButtonClass('orange');
                }
            }            
        }catch(err) {
            console.error(err);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
        }
    }
    
    _adjustTextFontSize(viewportid) {
        try {
            let element = $(`${viewportid} .slider-content.item .display-text`);
            var messageElement = element.find(".message-text");
            
            if (!(messageElement.find(".message-area").hasClass("marquee"))) {
                let message = $.trim(messageElement.text());
                let displayTextElement = element.find(".display-text");
                let displayElementHeight = displayTextElement.height();
                let messageElementHeight = messageElement.height();
                displayElementHeight = displayElementHeight - 25;
                if (element.hasClass("text-right-align")) {
                    displayElementHeight = displayElementHeight - 60;
                }
                if (displayElementHeight < messageElementHeight) {
                    let messageTextElement = messageElement.find(".message-area");
                    messageTextElement.addClass("marquee");
                    messageElement.addClass("full-height");
                    element.find(".line-display-text").addClass("full-height");
                }
            }
        } catch (error) {
            console.error(error);
        }
    } 
    
    listenAccEvent(){
        try{
            window.addEventListener("accountdetails", (event) => {
                event.preventDefault();
                let accData = event.detail.data;  
                let viewports = accData.data.metaData.viewPorts;
                viewports.forEach((viewport) => {
                    let viewportid = `#viewport_`+viewport.id;
                    this.viewport = viewport;
                    this.changeViewportSettings(viewport, viewportid, event = true);
                })

            }, false);
        } catch(err){
            console.error(err);
        }
    }

    changeViewportSettings(viewport, viewportid, event = null){
        try{
            
            if (viewport.video_muted == 1) {
                if(this.currentContent.videoType !== "youtube"){
                    $(`${viewportid} video`).prop('muted', true);
                } else if(event && this.currentContent.videoType === "youtube"){ 
                    chrome.runtime.onConnect.addListener( (port) => {
                        port.onMessage.addListener( async (msg) => {
                                port.postMessage({
                                    isEventMute: viewport.video_muted
                                }); 
                        })
                    });  
                }
                
            } else {
                if(this.currentContent.videoType !== "youtube"){
                    $(`${viewportid} video`).prop('muted', false);
                } else if(event && this.currentContent.videoType === "youtube"){ 
                    chrome.runtime.onConnect.addListener( (port) => {
                        port.onMessage.addListener( async (msg) => {
                                port.postMessage({
                                    isEventMute: viewport.video_muted
                                }); 
                        })
                    });  
                }                
            }

            
            if(viewport.hide_author_info == 1){
                $(`${viewportid} .user-info`).addClass('hide');
                $(`${viewportid} .user-and-network-container`).addClass('hide');
            } else  if(viewport.hide_author_info == 0){
                $(`${viewportid} .user-info`).removeClass('hide');
                $(`${viewportid} .user-and-network-container`).removeClass('hide');
            } 
            if(viewport.hide_timestamps == 1){
                $(`${viewportid} .posted-time`).addClass('hide');
            } else  if(viewport.hide_timestamps == 0){
                $(`${viewportid} .posted-time`).removeClass('hide');
            } 



            if(viewport.tickered_profile == 1){
                let self = this;
               
                if(viewport.ticker_direction === 'ticker_marquee_r_l' ){
                    $(`${viewportid} .ticker_info`).css('text-align', 'right');    
                    $(`${viewportid} .ticker_slide`).animate({left: -$(`${viewportid} .ticker_slide`).width()},  { duration:8500, easing: 'linear',
                    complete: function() {
                        self._checkStack();
                        self.getContent();
                    }});     
                } else {
                    $(`${viewportid} .ticker_info`).css('text-align', 'left');
                    $(`${viewportid} .ticker_slide`).css('left', -$(`${viewportid} .ticker_slide`).width());
                    $(`${viewportid} .ticker_slide`).animate({left: $(`${viewportid} .ticker_info`).width()},  { duration:8500, easing: 'linear',
                    complete: function() {
                        self._checkStack();
                        self.getContent();
                    }});   
                }
                if(viewport.ticker_position == "center"){
                    $(`${viewportid} .public-display-items.tickered .item`).css({'top': '50%', 'transform': 'translateY(-50%)' })
                } else if(viewport.ticker_position == "top"){
                    $(`${viewportid} .public-display-items.tickered .item`).css({'top': '0', 'transform': 'translateY(-0)' })
                } else  if(viewport.ticker_position == "bottom"){
                    $(`${viewportid} .public-display-items.tickered .item`).css({'top': '100%', 'transform': 'translateY(-100%)' })
                }
            } 
            // console.log(`${viewportid} .public-display-items.tickered .item .marquee`)
            // $(`${viewportid} .public-display-items.tickered .item  .marquee`).marquee();   

        } catch(err){
            console.error(err);
        }
    }

}