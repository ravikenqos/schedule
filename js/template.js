"use strict";

class Template{

    constructor(){
        this.log = new SbLogger();
        this.creative_name = ''; 
       
    }

    /**
     * 
     * @param {object} metaData - metadata contains viewport and playlist information
     * @param {string} playlistType - (inital or new or modified)
     */
    defaultDataDeStructure(metadata, playlistType){
        try{

            $('#container').html("");

            let viewports = metadata.viewports;
            let isAdmin = false;
            viewPortCount = viewports.length;
            let playList = metadata.playlist;
            gutter = playList.gutterSize;
            let noOfColumns = playList.noOfColumns;
            let noOfRows = playList.noOfRows;
            this.creative_name =  playList.creativeName;  
            this._layoutStyle(viewports, isAdmin, viewPortCount, playList, noOfColumns, noOfRows);
            this._buildViewport(viewports, playlistType);
        }
        catch(err){
            throw err;
        }

     } // End Of deStructure

     deStructure(item, playlistType){
        try{

            $('#container').html("");
            let viewports = item.metaData.viewports;
            let isAdmin = false;
            viewPortCount = viewports.length;
            let playList = item.metaData.playlist;
            gutter = playList.gutterSize;
            let noOfColumns = playList.noOfColumns;
            let noOfRows = playList.noOfRows; 
            this.creative_name =  playList.creativeName;  
            this._layoutStyle(viewports, isAdmin, viewPortCount, playList, noOfColumns, noOfRows);
            // this.SplitScreen.initialize();
            this._buildViewport(viewports, playlistType);

        }
        catch(err){
            throw err;
        }

    } // End Of deStructure   

    /**
     * 
     * @param {object} viewports 
     * @param {string} playlist 
     */
    _buildViewport(viewports, playlist) {
        try{
            viewports.forEach( async (item) => {
                let viewportid = `#viewport_`+item.id;
                this.fontSize2 = item.fontSize2;                
                this._viewPortStyle(item);
                this._renderViewport(viewportid, item, playlist);
            });
        }catch(err){
            this.log.error(err);
        }
    } // End Of _buildViewport

    /**
     * 
     * @param {object} viewports 
     * @param {boolean} isAdmin 
     * @param {number} viewPortCount 
     * @param {object} playList 
     * @param {number} noOfColumns 
     * @param {number} noOfRows 
     */

    _layoutStyle(viewports, isAdmin, viewPortCount, playList, noOfColumns, noOfRows){
        try{
     
            let style = '';
            style +=  `
                    body,
                    html{
                        margin: 0;
                        padding: 0;
                        overflow: hidden;
                        width: 100vw;
                        height: 100vh;
                    }

                    .status-button{
                        position: fixed;
                        width: 5px;
                        height: 5px;
                        z-index: 100000;
                        bottom: 5px;
                        right: 5px;
                        border-radius: 50%;
                        display: none;
                    }

                    .status-button.green{
                        background: green;
                        display: block;
                    }

                    .status-button.red{
                        background: red;
                        display: block;
                    }

                    .status-button.yellow{
                        background: yellow;
                        display: block;
                    }
                    .status-button.orange{
                        background: orange;
                        display: block;
                    }

                    .public-display-advanced-settings.disabled{
                        opacity: 0.5;
                        cursor: default;
                    }
            
                    .embed-public-display-preview{
                        position: relative;
                        display: inline-block;`;
                        if(viewPortCount > 1){
                            
                            style += `padding: ${gutter}px;
                            background: ${playList.background};`;
                        } else {
                            style += `
                            padding: 0;
                            background: #ffffff;`;                
                        }

            style +=   `width: 100vw !important;
                        height: 100vh !important;
                    }

                .view_port_customization .viewport-preview, .creative-column{
                float: left !important;
                cursor: pointer;
                background: #fff;`;
            if(viewPortCount > 1){
                if( playList.noOfColumns  > 1 ) {
                    style += `width:calc((100% -  ${2 * noOfColumns}px - ${gutter * 2 }px - ${(gutter  * (noOfColumns - 1))}px) / ${noOfColumns});`;
                } else {
                    style += `width:calc((100% -  ${2 * noOfColumns}px - ${gutter * 2 }px)) ;`;
                }
                style += `height:calc((100% -  ${2 * noOfRows}px - ${gutter * 2 }px - ${(gutter  * (noOfRows - 1))}px)/ ${noOfRows});
                margin-right: ${gutter}px;
                margin-bottom: ${gutter}px;`;
            } else {
                style += `width:  100%;
                        height: 100%;`;               
            }    
            style +=  `}
            .creative-column.active.size_exceeded{
                -webkit-box-shadow: 0px 0px 5px 1px rgba(255,0,0,1);
                -moz-box-shadow: 0px 0px 5px 1px rgba(255,0,0,1);
                box-shadow: 0px 0px 5px 1px rgba(255,0,0,1);
                opacity: 1; }`;

            let viewPortsTillSecondLastRow = noOfColumns * (noOfRows - 1);
            let viewPortsInLastRow = viewports.length - viewPortsTillSecondLastRow;
            style += `.view_port_customization .viewport-preview:nth-child(${noOfColumns}n),
            .creative-column:nth-child(${noOfColumns}n),
            .creative-column:nth-child(${viewPortCount}),
            .embed-public-display-preview.vp_9_4 .creative-column[extra-data="7"]{
                margin-right: 0;
            }
            .viewport-preview:nth-last-child(-n+${viewPortsInLastRow}),
            .creative-column:nth-last-child(-n+${viewPortsInLastRow}){
                margin-bottom: 0;
            }
            .creative-column div.public-display-preview{
                position:relative;
                width: 100%;
                height: 100%;
                border: 0;
            }
            .poweredby-logo {
                position: absolute;
                bottom: 0px;
                right: 16px;
                z-index: 100000;
                display: block;
            }
            .viewport-preview.last-row,
            .creative-column.last-row{ `;               
            if(viewPortsInLastRow == 1){
                if(viewPortCount > 1) {
                    style += `width: calc(100% - 2px - ${gutter * 2}px);`;
                } else {
                    style += `width: calc(100% - 2px);`;
                }
            } else {
                style += `width:calc((100% - ${2*noOfColumns}px - ${gutter * 2}px - ${(gutter * (viewPortsInLastRow - 1))}px) / ${viewPortsInLastRow});`;
            } 
            style += `margin-bottom: 0; }`;
            
            if( Math.ceil(viewPortCount / noOfColumns) != noOfRows){
                let rows = noOfRows;
                let viewportRemaining = viewPortCount;
                for(let i=1; i <= noOfRows; i++){
                    if(viewportRemaining > rows){
                        if((viewportRemaining - noOfColumns) > (rows - 1)){
                            viewportRemaining -= noOfColumns;
                        } else {
                            let maxViewportColumns = viewportRemaining - (rows - 1);
                            viewPortIndex = viewPortCount - viewportRemaining;
                            width = "calc((100% - " + (2 * noOfColumns) + "px - "  + (gutter * 2) + "px - " + (gutter * (maxViewportColumns - 1)) + "px) / " + maxViewportColumns + ")";
                            for(let j = viewPortIndex; j < (viewPortIndex + maxViewportColumns); j ++){
                                style +=`.creative-column[extra-data=${j}] { width : ${width};}"
                                        .viewport-preview-container .viewport-preview[extra-data=${j}] {width:${width};}"`;
                            }
                            viewportRemaining -= maxViewportColumns;
                        }
                    } else {
                        viewPortIndex = viewPortCount - viewportRemaining;
                        viewportRemaining -= 1;
                        style += `.creative-column[extra-data=${viewPortIndex}]{ width: calc(100% - (2 * ${noOfColumns})px-(${gutter} * 2)px);}
                                .viewport-preview-container .viewport-preview[extra-data=${viewPortIndex}]{width: calc(100% - (2 * ${noOfColumns})px);}`;
                    }
                    rows -= 1;
                }
            }
            
            let complimentary_color_style = '';
            let complimentaryColor = "243,98,53";
            if(playList.background && playList.background != '#ffffff'){
                complimentaryColor = this.getComplimentaryColor(playList.background);
            }

            complimentary_color_style += `<style type="text/css" id="complimentary_color_css">
            .creative-column.active, .predefined-layout.active{
                    -webkit-box-shadow: 0px 0px 8px 3px rgba(${complimentaryColor},1);
                    -moz-box-shadow: 0px 0px 8px 3px rgba(${complimentaryColor},1);
                    box-shadow: 0px 0px 8px 3px rgba(${complimentaryColor},1);
                    opacity: 1;
                }
            </style>`;

            let viewportBorderColor_style = '';
            viewportBorderColor_style += `<style type="text/css" id="viewportBorderColor_css">
            .creative-column{
                border: ${playList.viewportBorderWidth}px solid ${playList.viewportBorderColor};
            }
            </style>`;
            let display_css = '';
            display_css += `<style type="text/css" id="display_css"></style>`;

            $('style').empty();
            $('style').append(style);
            $('#complimentary_color_css').remove();
            $('head').append(complimentary_color_style);
            $('#viewportBorderColor_css').remove();
            $('head').append(viewportBorderColor_style);
            $('#display_css').remove();
            $('head').append(display_css);


            let elements = '';
            predefinedLayout = playList.preLayoutNumber;
            let prelayout = playList.preLayoutNumber  < 0 ? 'vp_'+ viewPortCount + "_" + noOfRows : '';
            elements +=` <div class="embed-public-display-preview ${prelayout}" >`;
            let counter = 0;
            for (let row = 0; row < noOfRows; row++) {
                for (let column = 0; column < noOfColumns; column++) {
                    if (viewPortCount <= counter) {
                        break;
                    }
                    let viewportProfile = viewports[counter];
                    let viewportMetadata = "";
                    if(viewportProfile.viewportMetadata){
                        viewportMetadata = viewportProfile.viewportMetadata.replace('{GUTTER}', gutter,);
                        viewportMetadata = viewportMetadata.replace('{GUTTER}', gutter,);
                    }
                    let viewportMetadataArr = viewportMetadata.split(";");
                    elements += `<div class="creative-column ${(counter >= viewPortsTillSecondLastRow ) ? 'last-row' : ''}"  extra-data="${counter}" data-id="${viewportProfile.id}" style="${viewportMetadata}" original-style='${JSON.stringify(viewportMetadataArr)}'></div>`;
                    counter++;
                }
            } 

            elements += `</div>
                            <div class="poweredby-logo">
                            <img src="/assets/images/poweredby-billboard.png" />
                        </div>
                        
                        <div class="status-button green"></div> `;
                        
            $('#container').append(elements);
        }
        catch(err){
            throw err;
        }          
    }

    /**
     * 
     * @param {object} item - a object contains viewport style information
     */
    _viewPortStyle(item){
        try{

            let isAdmin = false;
            if(item.fontFamily !== 'default'){
            this.getFont(item.fontFamily);
            }
            let viewportid = `#viewport_`+item.id;
            let style = '';
            style += `${viewportid} .public-display-items .item, ${viewportid} .html-video-player-container {
                background: ${(item.cardBgColor.substring(0, 1) === '#') ? item.cardBgColor : '#ffffff'};
            }`;


            if(item.tickeredProfile == 1){

            style += `${viewportid} .public-display-items.tickered{
                    background: ${ (item)? ( item.cardBgColor.substring(0, 1) === '#'? item.cardBgColor : + 'url("' + item.cardBgColor + '") no-repeat center center fixed') : '#ffffff' };
                    background-size: cover;
                    color: ${(item) ? item.font_color :  '#ffffff' };
                }

                ${viewportid} .public-display-items.tickered .item{  
                    background: ${(item) ? item.overlayBgColor :  '#162228'};
                }`;
            }
            let fontColorNoImage = (item) ? item.font_color :'#ffffff' ;
            let backgroundColorNoImage = (fontColorNoImage == "#ffffff")  ? "#000000" :'#ffffff' ; 

            style += `${viewportid} .public-display-items .item > div {
                color: ${fontColorNoImage};
                background: ${backgroundColorNoImage};
                font-family:"Actor", Helvetica, Arial, sans-serif;
            }
            ${viewportid} .public-display-items .item > table + div,
            ${viewportid} .sample-post .display-text{
                background: ${(item) ? item.overlayBgColor : '#6a7f87'};
            }
            ${viewportid} .public-display-items .item > div > table, ${viewportid} .public-display-items .item > div > table a  {
                color: ${(item) ? item.font_color : '#6a7f87'};
                text-align: center !important;
                width: 98vw !important;
            }
            ${viewportid}.vertical .public-display-items .item > div > table, ${viewportid}.vertical .public-display-items .item > div > table a  {
                width: 98vh !important;
            }
            
            ${viewportid} .display-text{
                padding-top:20px;
                padding-left:10px;
            }

            ${viewportid} .sample-post .display-text .message-text, ${viewportid} .sample-post .display-text .message-text *{
                color: ${(item) ? item.font_color : '#6a7f87'};
                font-family:"Actor", Helvetica, Arial, sans-serif;
            }`;


            style += `${viewportid} .bb_error_container.socialwall{
                background-image: url('/display/icons/socialwall_logo.png?v=72_14');
            }

            ${viewportid} .delete-view-port{
                position: absolute;
                font-family: "Helvetica Neue", Helvetica, Roboto, Arial, sans-serif;
                right: 5px;
                top: 5px;
                color: #aaa;
                cursor: pointer;
                font-weight: bold;
                z-index: 100000;
                display: none;
            }
            ${viewportid}.active .delete-view-port{
                display: block;
            }
            ${viewportid} .bb_error_container .no-data{
                margin-top: 0px;
                padding-top: 40px;
            }
            ${viewportid} table.image-container{
                height: 100%;
            }
            
            ${viewportid} .public-display-items .item .user-and-network-container .user-and-network {
            color: ${(item) ? item.fontColor2 : '#6a7f87'};
            font-family:"Actor", Helvetica, Arial, sans-serif;
            }
            ${viewportid} .chromebit_message{
                text-align: center;
                font-weight: bold;
                padding-top: 44vh;
                font-size: 50px;
                background: #36363661;
                height: 100vh;
                color: #fff;
            }
            `;
                
            $('#display_css').append(style);

        let viewportStyle = '';
        viewportStyle += `
            ${viewportid} .html-video-player-container,  ${viewportid} .html-video-player {
                z-index: 99999;
                height: 100%;
                width: 100%;
                position: absolute;
                display: none;
            }  

            ${viewportid}.small .display-text table .messages{
                font-size: 2.5vw;
                overflow: hidden;
            }

            ${viewportid}.medium .display-text table .messages{
                font-size: 3vw;
                overflow: hidden;
            }

            ${viewportid}.large .display-text table .messages{
                font-size: 5vw;
            }            

            ${viewportid}.medium .public-display-items .item .ticker_author_info .message-text{
                font-size: 2vw;
                overflow: hidden;
            }            

            ${viewportid}.large .public-display-items .item .ticker_author_info .message-text{
                font-size: 3.5vw;
                overflow: hidden;
            }            
            
            ${viewportid} .public-display-items.tickered{
                position: absolute;
                width: 100% !important;
                height: 100% !important;
            }
            ${viewportid} .ticker_contents{
                width: 100% !important;
            } 
            ${viewportid} .ticker_info{
                font-size: 60% !important;
            } 

            `
            if(item.tickeredProfile == 1){
                viewportStyle += `
                    ${viewportid} .public-display-items.tickered .item{
                        top: 50%;
                        transform: translateY(-50%);
                    }                   
                `
            }

            $('#display_css').append(viewportStyle);
        } 
        catch(err){
            throw err;
        }  
    }

    _renderViewport(viewportid, item, playlist){
        try{  
            item.contributing_streams = [1111] ;
            //Actually change id to class initial-loading-element 
            let element = '';
            element += `                
            <div  id="viewport_${item.id}" class="public-display-preview viewport ${item.fontSize}" business-offset="" extra-data="${item.id}>
                    <div class="bb_container parllay" style="display: ${(item.contributing_streams.length > 0) ? 'block' : 'none'}">
                        <div class="ytplayer"></div>
                        <input type="hidden" class="muteAudio" value="${item.video_muted}"/>
                        <div class="html-video-player-container">
                            <video class="html-video-player" controls="" src="" style="display: inline;"></video>                            
                        </div>
                        <div id="initial-loading-element" style="top: 10%;left: calc(100% - 90%);height: 80%;width: 80%;position: absolute;background: url(/assets/images/billboard_logo.png) center center no-repeat white;background-size: 53%;"></div>
    
                        <div class="wrapper public-display" style="position:absolute;border:0px;border-radius:0px;left: 0;top: 0;height:100% !important;width:100% !important;">
                            <div class="business-logo position-${item.logoPosition} ${(item.showLogo == 0) ? 'hidden':''}">
                                <img src="/assets/images/default_business_logo.png">
                            </div>
                            <div class="public-display-items ${(item.tickeredProfile == 1) ? 'tickered' : ''}"profile-id="${item.id}"></div>
                    
                        </div>

                    </div>

                    <div class="bb_error_container parllay" style="position: absolute;background: url(/assets/images/billboard_logo.png) center center no-repeat white;top: 10%;left: calc(100% - 90%);height: 80%;width: 80%;background-repeat: no-repeat;background-position: center;background-size: 53%;display: ${(item.contributing_streams.length == 0) ? 'block' : 'none'};">
                        <div class="no-data">${(item.contributing_streams.length == 0) ? "No Streams added for this Billboard." : ''}</div>
                    </div>

            </div>
            `;
           // console.log(element);
        // console.log($(`${viewportid} .creative-column[data-id='${item.id}']`));
           //$(`${viewportid} .creative-column[data-id='${item.id}']`).append(element);
           $(`.creative-column[data-id='${item.id}']`).html(element);
            $('#apptitle').fadeOut();   
        }
        catch(err){
            throw err;
        }  
    }

    /**
     * 
     * @param {string} fontfamily 
     */
    getFont(fontfamily){
        // let font = fontfamily;
        // let fontname = font+'-Regular';
        // let folder = font.toLowerCase();
        // var xhr = new XMLHttpRequest();
        // xhr.open("GET", "http://localhost/fonts/fonts-master/ofl/"+folder+"/"+fontname+".ttf", true);
        // xhr.responseType = "blob";
        // xhr.onreadystatechange = function() {
        //     if (xhr.readyState == 4) {
        //         let fontblob = window.URL.createObjectURL(xhr.response);
        //         let fontface = `@font-face {
        //             font-family:${fontfamily};
        //             src: url(${fontblob});
        //         }`;
        //         $('style').prepend(fontface);
        //     }
        // };
        // xhr.send(); 
    }

    /**
     * 
     * @param {object} viewport 
     * @param {number} viewportId 
     * @param {object} item 
     */
    render(viewport, viewportId, item){
        try{
            let viewportid = `#viewport_`+viewportId;

            let element = '';
            let videoUrl, imageUrl, Url, path, dataVideo = '';

            imageUrl = (item.mediaType === "image" || item.mediaType === "photo" || item.mediaType === "carousel" || (item.mediaType === "undefined" &&  item.videoUrl === '') || (item.mediaType === "" &&  item.videoType === 'others') || (typeof item.mediaType === "undefined" &&  item.videoType === 'others') ) ? item.image : null;
            videoUrl = (item.mediaType === "video" || item.mediaType === "youtube") ? item.videoUrl : null;
            Url = imageUrl || videoUrl;

            let dataVideourl = '';
            let insClass = "cache_ready";
            let online = 0;
            viewport.item = item;
            if(viewport.tickeredProfile == 0 ){               
                if((item.hideTextOnlyPost == 1 || item.text == '') && typeof item.image == 'object' && videoUrl == null){
                //  "Skip the record since no image or (found and business set hide text only post or post has no text to display)");   
                } else {
                    element += `<div class="slider-content item ${ (item.text == '') ? 'text-less': ''} ${item.additional_class} ${this._getAnimationtype(viewport.animation_type)}" channel_type="${item.socialTypeCode}" data-online="" stream_id="${item.streamId}" data-videotype="${item.videoType}" data-index="" data-video="${item.mediaType}" data-id="${item.id}" data-originalId="${item.originalId}" data-timestamp="${item.timeStamp}" slidechange-videourl="${videoUrl}" data-videourl="${dataVideourl}" style="position:absolute;display: none;overflow: hidden;left: 0;top: 0;height:100% !important;width:100% !important;"  repeat-activity="${item.repeat_activity}" repeat-count="${item.repeat_count}"> `;
                    if( typeof item.mediaType !== 'undefined' && item.mediaType === 'video' || item.mediaType === 'link' ){
                        element += `<table class="image-container" cellspacing="0" cellpadding="0">
                            <tr>
                                <td>
                                    <img class="main-image" slidechange-src="" src="" alt="Image">
                                </td>
                            </tr>
                        </table>`;
                    } else {
                        if(item.image){
                            element += `<table class="image-container" cellspacing="0" cellpadding="0">
                            <tbody><tr>
                                <td>
                                    <img class="main-image" slidechange-src="${imageUrl}" src="${item.assetUrl}" alt="Image" style="">
                                </td>
                                </tr>
                            </tbody>
                            </table>`; 
                        }
                    }
                    if(item.text){
 
                        let streamImg = `/assets/images/social/${item.socialTypeCode}.png`                     

                        element += `<div class="display-text ${(item.image) ? '' : 'only-text'}">
                        <table class="display-text-table">
                            <tbody>
                            <tr>
                                    <td class="height-fill">
                                        <div class="line-display-text full-height">
                                            <div class="user-and-network-container">
                                                <table class="user-and-network ${viewport.fontSize2}">
                                                    <tbody>
                                                        <tr>
                                                            <td style="vertical-align: middle;" class="user-info">
                                                                <table class="user-info-span-table" cellpadding="0" cellspacing="0">
                                                                    <tbody>
                                                                        <tr>
                                                                            <td rowspan="2"><img class="user-photo" src="${item.avatar}" /></td>
                                                                            <td><span class="name">${item.from.name}</span>&nbsp;&nbsp;<img class="social-channel-pic" src="${streamImg}"></td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td style="vertical-align: top"><time class="posted-time timeago" datetime="${item.postedTime}" data-time="${item.timeStamp}" >${item.createdTime}</time></td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div class="message-text">
                                                <div class="message-area">

                                                    <div class="messages">${item.text}</div>
                                                    <div class="billboards-comments">`;

                                                    /*if(item.comments.length > 0){
                                                    let comments = item.comments;
                                                    comments.forEach((items) => {
                                                        element += `
                                                        <table class="comments">
                                                        <tr>
                                                            <td class="comment-photo">
                                                                <span><img class="comment-photo" src="${avatar}" /></a>
                                                            </td>
                                                            <td class="comment-area" style="vertical-align: middle;">
                                                                <div class="comment-message"><span class="name">${item.from.name}</span>: ${item.message}</div>        
                                                            </td>
                                                        </tr>
                                                    </table>                                                           
                                                        `;
                                                    });
                                                }*/
                                        element += ` </div>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                    </div>`;

                    }
                    element += ` </div>`;
                }
            //}
        

            } else { // Ticker records
                console.log("item", item);
                let videoUrl, imageUrl, Url, path, dataVideo = '';
                let text = '';
                let streamImg = `/assets/images/social/${item.socialTypeCode}.png`;
                viewport.item = item;
                element += `
                        <div class="slider-content item"  channel_type="${item.socialTypeCode}" stream_id="${item.streamId}" data-videotype="${item.videoType}" data-index="" data-video="" data-id="${item.id}" data-originalId="${item.originalId}" data-timestamp="${item.timeStamp}" data-videourl="${item.videoUrl}">
                                <div class="ticker_author_info" > 
                                    <div class="ticker_info"> 
                                        <table class="user-and-network ${viewport.fontSize2} ticker_slide">
                                        <tr>
                                        <td style="vertical-align: middle;" class="user-info">
                                            <table class="user-info-span-table" cellpadding="0" cellspacing="0">
                                                <tr>
                                                <td rowspan="2"><img class="user-photo" src="${item.avatar}" ${ (!item.avatar) ? 'style="display:none;"' : ''}/></td>
                                                <td><span class="name">${item.from.name}</span>&nbsp;&nbsp;<img class="social-channel-pic" src="${streamImg}"></td>                                                  
                                                </tr>
                                                <tr>
                                                <td style="vertical-align: top"><time class="posted-time timeago" datetime="${item.postedTime}" data-time="${item.timeStamp}">${item.createdTime}</time></td>
                                                </tr>
                                            </table>
                                        </td>
                                        <td class="ticker_content message-text">
                                            <div class="messages">${item.body.replace(/(https?[:]\/\/[^\s]+)(?:\s|$)/g, '')}</div>
                                        </td>
                                        </tr>
                                        </table>
                                    </div>
                                </div>
                            </div>
                            
                            `;
                            // $(`${viewportid} .public-display`).css('overflow', 'hidden'); 
            } // End of ticker condition 
            $(`${viewportid} .public-display`).css('overflow', 'hidden');
            if(viewport.tickeredProfile == 0 ){ 
                $(`${viewportid} .public-display-items`).html(element);
            } else if(viewport.tickeredProfile == 1 ){ 
                $(`${viewportid} .public-display-items.tickered`).html(element);
            }   
            $('#apptitle').fadeOut();
            
            $(`${viewportid} .bb_container`).show(); 
            $(`${viewportid} #initial-loading-element`).fadeOut();

            $(`${viewportid} .bb_container`).show(); 
            $(`${viewportid} .public-display-items .item`).show();

            let self = this;
            let images = jQuery(`${viewportid} .public-display-items .slider-content.item .main-image`);
            this.handleImages(images, viewportid, viewport);            
            
        }catch(err){
            throw err;
        }        
    }

    _getAnimationtype(animationType){
        try{
            let val = null;
            switch(animationType){
                case "0":
                    val = "animated parllay-animate-in fadeIn";
                    break;
                case "1":
                    val = "animated parllay-animate-in bounceIn";
                    break;                    
                case "2":
                    val = "animated parllay-animate-in lightSpeedIn";
                    break;                    
                case "3":
                    val = "animated parllay-animate-in rotateIn";
                    break;
                case "4":
                    val = "animated parllay-animate-in rollIn";
                    break;
                case "5":
                    val = "animated parllay-animate-in zoomIn";
                    break;
                case "6":
                    val = "animated parllay-animate-in flipInX";
                    break;
                default:
                    val = "animated parllay-animate-in fadeIn";                                                                     
                    break;
            }
            return val;
            
        }catch(err){
            console.error(err);
        }
    }

    handleImages(imgs, viewportid, viewport) {
         var self = this;
        imgs.each(function(i, image) {
        image = jQuery(image);
        var img = new Image();
        img.onload = function() {
            self.handleImage(img, image, viewportid, viewport);
        }
        img.onerror = function() {
        //  self.handleImageError('Error loading image: ' + image.attr("src"));
        };
        img.src = image.attr("src");
        });
    
   }
    
        handleImage (img, image, viewportid, viewport) {
            var self = this;
            try {
                // callback = Helpers.ensureCallback(callback);
                // var windowWidth = jQuery(window).width();
                // var windowHeight = jQuery(window).height();
                //var windowWidth = jQuery(window).width();
                let windowWidth = $(`${viewportid}`).width();
                let windowHeight = $(`${viewportid}`).height();
                let imageElement = image.closest('.slider-content.item');
                /* if (false && img.width < (windowWidth / 2) && img.height >= img.width) {
                 imageElement.addClass('portrait-image');
                 } else  if (img.width > windowWidth || img.height > windowHeight) */
          //     {
                    if (viewport.stretch_image == 1) {
                        image.closest('.slider-content.item').addClass('landscape-image');
                        image.resizeToParent({
                            parent: '.slider-content.item'
                        });
                    } else {
                        var dimentions = {};
                        dimentions = Helpers.aspectRatioFit({
                            "wi": img.width,
                            "hi": img.height,
                            "wa": windowWidth,
                            "ha": windowHeight
                        });
                        if (img.height == 0 || img.width == 0) {
                            self.handleImageError('Warning: Image size width/height is 0 (not able to calculate aspect ratio) ');
                        }

                        if ("undefined" !== typeof dimentions.height) {
                            if(viewport.vertical_viewport == 1){
                                // console.log(windowHeight);
                                // console.log(dimentions.height);
                                image.width(windowHeight);
                            }
                            else{
                                image.height(dimentions.height);
                            }
                        }
    
                        if ("undefined" !== typeof dimentions.width) {
                            if(viewport.vertical_viewport == 1){
                                // console.log(windowWidth);
                                // console.log(dimentions.width);
                                image.height(windowWidth);
                            }
                            else{
                                image.width(dimentions.width);
                            }
                            
                        }
                        if(viewport.vertical_viewport == 1){
                            if(viewport.hide_all_text == 0){
                                if(viewport.item.body != ""){
                                // $('.image-container .main-image').css('margin-top','-39%');
                                // $('.main-image').css('margin-left','39%');
                                $('.main-image').addClass('vertical');
                                $('.display-text').addClass('vertical');
                                $('.line-display-text').addClass('vertical');
                                $('.message-text').addClass('vertical');
                                }
                            }
                        }
                     
    
    
                        imageElement.removeClass("width-fill").removeClass("text-bottom-align").removeClass("image-vertical-align").removeClass("height-fill").removeClass("text-right-align").removeClass("image-horizontal-align");
    
                        jQuery.each(dimentions.classes, function (i, cssClass) {
                            if (imageElement.hasClass("text-less") && cssClass == "text-bottom-align") {
                                imageElement.addClass("image-vertical-align");
                            } else if (imageElement.hasClass("text-less") && cssClass == "text-right-align") {
                                imageElement.addClass("image-horizontal-align");
                            } else {
                                imageElement.addClass(cssClass);
                            }
                        });
    
                        imageElement.find(".display-text").attr("style", "");
                        imageElement.find(".display-text .line-display-text").attr("style", "");
    
                        if ("undefined" !== typeof dimentions.availableHeight) {
                            imageElement.find(".display-text").css({
                                "height": dimentions.availableHeight + "px"
                            });
                            imageElement.find(".display-text .line-display-text").css({
                                "height": dimentions.availableHeight + "px"
                            });
                        } else if ("undefined" !== typeof dimentions.availableWidth) {
                            imageElement.find(".display-text").css({
                                "width": dimentions.availableWidth + "px"
                            });
                            var lineDisplayWidth = (windowWidth / 100) * 4;
                            lineDisplayWidth = dimentions.availableWidth - lineDisplayWidth;
                            imageElement.find(".display-text .line-display-text").css({
                                "width": lineDisplayWidth + "px"
                            });
                        }
                   }
    
              /*  }  else {
                 imageElement.addClass('landscape-image');
                 image.resizeToParent({parent : '.slider-content.item', "imageHeight" : img.height, imageWidth : img.width});
                 } */
            //    callback();
            } catch (err) {
          //      self.handleImageError('Image loading error: ' + exception);
                throw err;
            }
        }
 

} // End of SbRender