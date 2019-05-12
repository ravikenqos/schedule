let PlaylistTemp = ['new', 'modified'];
//     window.ajaxCallWaiting = false;
//     var businessServer = '//brands.parllay.com';
//     var userServer = '//me.parllay.com';
//     var namespace = 'enqosllc';
//     var businessId = 24;
//     var profileData = {"id":"173","business_id":"24","selected_ugc_id":null,"profile_name":"","is_single_card":"10000","carousel_type":"0","arrow_left":"<","arrow_right":">","overlay_bg_color":"#ffffff","card_bg_color":"#6a7f87","font_color":"#576063","font_family":"default","font_size_2":"medium","font_family_2":null,"font_size":"medium","display_type":"slider","post_display_order":"mixed","hide_text_only_post":"1","hide_all_text":"1","hide_urls":"1","hide_hashtags":"1","logo_position":"1","show_logo":"0","stretch_image":"0","max_post_count":"10","video_error_time":"10","created_date":"2018-04-13 13:22:32","last_updated_date":"2018-04-20 14:47:33","creative_id":"115","viewport_metadata":"width:50%;height:50%;margin-bottom:{GUTTER}px;margin-right:{GUTTER}px;","video_muted":"1","hide_timestamps":"0","hide_author_info":"0","tickered_profile":"0","font_color_2":"#6a7f87","ticker_position":"center","vertical_viewport":"0","ticker_direction":"ticker_marquee_r_l"};
//     var embedType = 'public_display';
//     var embedId = 173;
//     var outerSpace = 3;
     let gutter = 0;
//     var creativeId = 115;
     let predefinedLayout = 0;
     let isMute = 0;
//     var creativeBackground = '#ffffff';
//     var creativeName = 'Ravi Test';
//     var viewportBorderColor = '#CCC';
//     var isAdmin = 'false';
     var viewPortCount = 0;
//     var columns = 1;
//     var no_of_rows = 3;
//   //  if(parent == window){
//         var deviceId = "BE002C";
//  //   }

//     window.ajaxCallWaiting = false;
//     var businessServer = '//brands.parllay.com';
//     var userServer = '//me.parllay.com';
//     var namespace = '';
//     var businessId = 48;
//     var profileData = {"id":"187","business_id":"48","selected_ugc_id":null,"profile_name":"","is_single_card":"30000","carousel_type":"0","arrow_left":"<","arrow_right":">","overlay_bg_color":"#000000","card_bg_color":"#000000","font_color":"#576063","font_family":"Abel::font-family: 'Abel', sans-serif;","font_size_2":"small","font_family_2":"Abel::font-family: 'Abel', sans-serif;","font_size":"small","display_type":"slider","post_display_order":"mixed","hide_text_only_post":"1","hide_all_text":"0","hide_urls":"1","hide_hashtags":"0","logo_position":"1","show_logo":"0","stretch_image":"1","max_post_count":"10","video_error_time":"10","created_date":"2018-05-02 09:32:29","last_updated_date":"2018-05-04 01:37:21","creative_id":"121","viewport_metadata":"","video_muted":"1","hide_timestamps":"0","hide_author_info":"0","tickered_profile":"0","font_color_2":"#6a7f87","ticker_position":"center","vertical_viewport":"0","ticker_direction":"ticker_marquee_r_l"};
//     var embedType = 'public_display';
//     var embedId = 187;
//     var outerSpace = 3;
//     var gutter = 1;
//     var creativeId = 121;
//     var predefinedLayout = 0;
//     var creativeBackground = '#ffffff';
//     var creativeName = 'Test Playlist';
//     var viewportBorderColor = '#CCC';
     var isAdmin = false;
//     var viewPortCount = 1;
//     var columns = 1;
//     var no_of_rows = 1;
//     if(parent == window){
//         var deviceId = Helpers.getDeviceId();
//         console.log(deviceId);
//     }

// $(function() {
//   window.ParllayDisplayObject = new ParllayDisplay(profileData);
// });


// var entityType = "public_display";
// (function(i, s, o, g, r, a, m) {
//     i['GoogleAnalyticsObject'] = r;
//     i[r] = i[r] || function() {
//         (i[r].q = i[r].q || []).push(arguments)
//     }, i[r].l = 1 * new Date();
//     a = s.createElement(o),
//             m = s.getElementsByTagName(o)[0];
//     a.async = 1;
//     a.src = g;
//     m.parentNode.insertBefore(a, m)
// })(window, document, 'script', '/js/analytics.js', 'ga');

// ga('create', 'UA-75944757-1', 'auto');

// function gaPageView(entityId) {
//     ga('send', 'pageview', {
//         dimension1: entityType,
//         dimension2: entityId
//     });
// }

// function gaPostAction(entityId, actionType, postType, postId) {
//     ga('send', 'event', 'click', actionType, {
//         dimension1: entityType,
//         dimension2: entityId,
//         dimension3: postType + "+" + postId
//     });
// }

// gaPageView(entityId);

let playlistId = [];
let init = true;

let adData = {
    "success": true,
    "data": {
        "businessId": 24,
        "status": "activated",
        "displayUrl": "",
        "playlistId": 0,
        "metaData": {
                    "playlist": {
                    "id": 0,
                    "businessId": 24,
                    "creativeName": "chk ravitest",
                    "noOfRows": 1,
                    "noOfColumns": 1,
                    "gutterSize": 20,
                    "background": "#ffffff",
                    "outerSpace": 3,
                    "preLayoutNumber": 0,
                    "viewportBorderWidth": 1,
                    "viewportBorderColor": "#CCC",
                    "defaultProfile": 1,
                    "createdDate": "2019-03-28T07:38:01.000Z",
                    "lastUpdatedDate": "2019-04-14T11:29:27.000Z"
                    },
        "viewports": [
                    {
                    "id": 424,
                    "businessId": 24,
                    "overlayBgColor": "#ffffff",
                    "cardBgColor": "#6a7f87",
                    "fontColor": "#576063",
                    "fontFamily": "default",
                    "fontSize2": "medium",
                    "fontFamily2": null,
                    "fontSize": "medium",
                    "displayType": "slider",
                    "postDisplayOrder": "mixed",
                    "hideTextOnlyPost": 1,
                    "hideAllText": 1,
                    "hideUrls": 1,
                    "hideHashtags": 1,
                    "logoPosition": 1,
                    "showLogo": 0,
                    "stretchImage": 0,
                    "maxPostCount": 10,
                    "videoErrorTime": 10,
                    "createdDate": "2019-03-28T07:38:01.000Z",
                    "lastUpdatedDate": "2019-03-29T06:47:13.000Z",
                    "viewportMetadata": "",
                    "videoMuted": 1,
                    "hideTimestamps": 0,
                    "hideAuthorInfo": 0,
                    "tickeredProfile": 0,
                    "fontColor2": "#6a7f87",
                    "tickerPosition": "center",
                    "verticalViewport": 0,
                    "tickerDirection": "ticker_marquee_r_l",
                    "transitionSpeed": 10000,
                    "animationType": 0,
                    "contributingStreams": [826]
                    }
        ]
        },
        "schedule": []
        } 
    }


    ///records response
// {
// additional_class: ""
// animationClass: ""
// assetUrl: "blob:chrome-extension://jjijgdgjnbmicdikfejbkbjmiibdemde/0b93cb12-91f6-4552-aba4-bcb788da081e"
// avatar: null
// body: ""
// businessUser: null
// caption: undefined
// cardType: undefined
// contentType: "parllay"
// createdTime: "Fri, Apr 5th 2019, 5:52 am"
// description: undefined
// from: {id: "id:parllay:53", name: "Ravi Kumar", handle: "Ravi Kumar", url: undefined, image: "/uploads/images/20180531/377f73c6f6a1476c4d8be8bae512da65.jpg"}
// hasVideo: 0
// hideTextOnlyPost: 1
// id: "1615"
// image: "//qacdn-west.s3.amazonaws.com/uploads/images/20190404/c284fd727a2e469ef905f0e4ac74a4d9.jpg"
// imageUrl: "//qacdn-west.s3.amazonaws.com/uploads/images/20190404/c284fd727a2e469ef905f0e4ac74a4d9.jpg"
// isAdmin: false
// isWidget: false
// mediaType: ""
// name: undefined
// online: 1
// originalId: "parllay:campaign:1615"
// planId: undefined
// postMode: "regular"
// postedTime: "2019-04-05T05:52:02+00:00"
// repeatCount: 0
// repeat_activity: false
// repeat_count: 0
// social_type_code: 1110
// streamId: 826
// text: ""
// timeStamp: 1554443522
// url: undefined
// videoId: null
// videoType: "others"
// videoUrl: null
// widgetType: undefined

// }
