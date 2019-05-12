"use strict";
$.xhrPool = [ ];
var abortAll = function() {
    Helpers.logDebug('Aborting all AJAX calls');
    $(this).each(function(idx, jqXHR) {
        jqXHR.abort();
    });
    $.xhrPool = [];
    $.xhrPool.abortAll = abortAll;
}
$.xhrPool.abortAll = abortAll;

$.ajaxSetup({
   beforeSend : function(jqXHR) {
      $.xhrPool.push(jqXHR);
   },
   complete : function(jqXHR) {
      var index = $.xhrPool.indexOf(jqXHR);
      if (index > -1) {
	 $.xhrPool.splice(index, 1);
      }
   }
});

function ParllayDisplay(profileData) {
   this.profileData = profileData;
   this.initialize();
}

ParllayDisplay.prototype = {
   animation : [ 'fadeIn', 'bounceIn', 'lightSpeedIn', 'rotateIn', 'rollIn', 'zoomIn', 'flipInX' ],
   socket : null,
   socketClientId : null,
   serviceCallId : null,
   numResultOnLoad : 100,
   numMaxOnDOM: 100,
   numResultForNew : 30,
   numRecordsForConnect : 100,
   streamingHelper : null,
   sliderTemplate : null,
   displayCounter : 1,
   maxCharToDisplay : 256,
   initialFontSizeChars : 150,
   mediumFontSizeChars : 200,
   contributingStreams : [ ],
   tmo : null,
   lastServerCacheUpdatedTime: null,
   billboardRestartTime: 5000,
   initialize : function() {
      var self = this;
      self.initFullScreenMode();
      self.initChromecastEventsListener();
      self.initializeSlides();
//      self.initHealthCheck();
      self.registerBodyClick();
      self.registerDeleteViewPort();
      self.registerTickerViewPort();
      this.contributingStreams = contributingStreams;

      var resizeId;
      $(window).resize(function() {
	 clearTimeout(resizeId);
	 resizeId = setTimeout(function() {
	    var images = jQuery('.public-display-items .slider-content.item .main-image');
	    images.each(function(i, image) {
	       image = jQuery(image);
	       var img = new Image();
	       img.onerror = function() {
		  self.handleImageError('Error loading image: ' + image.attr("src"));
	       };
	       img.onload = function() {
		  self.handleImage(img, image);
	       };
	       img.src = image.attr("src");
	    });
	 }, 500);
      });
      
      setTimeout(function(){
          /**
           * if the number of posts in DOMafter 10 minutes is less than numMaxOnDOM, 
           * then load previous posts to make it 100.
           */
          if($(".public-display-items .item").length < self.numMaxOnDOM){
              Helpers.logDebug('Looking for old posts');
              var countRequired = self.numMaxOnDOM - $(".public-display-items .item").length;
          //    window.streamingHelper.sendRequest('billBoard.widget.get', {id: self.serviceCallId, numInitialResults: countRequired, start: $(".public-display-items .item").length});
          }
      }, 600000);
   },
   setStatusButtonClass : function(className) {
//      jQuery(".status-button")
//              .removeClass('red')
//              .removeClass('green')
//              .removeClass('yellow')
//              .addClass(className);
      parent.postMessage({command : 'updateStatusButton', class : className}, '*');
   },
   registerBodyClick : function() {
      if (isAdmin) {
	 Helpers.logDebug('registerBodyClick');
	 $(document).on('click', function() {
	    var viewPortId = $('body').attr('extra-data');
	    parent.postMessage({command : 'viewPortSelection', viewPortId : viewPortId}, "*");
	 });
	 $(document).on('mouseover', function() {
	    $('body').addClass('active');
	 });
	 $(document).on('mouseout', function() {
	    $('body').removeClass('active');
	 });
      }
   },
   registerDeleteViewPort : function() {
      $(".delete-view-port").click(function(e) {
	 e.stopPropagation();
	 Helpers.logDebug('delete clicked');
	 var viewPortId = $('body').attr('extra-data');
	 parent.postMessage({command : 'deleteViewPort', viewPortId : viewPortId}, "*");
      });
   },
   registerTickerViewPort : function() {
      $(".ticker-view-port").click(function(e) {
	 e.stopPropagation();
	 Helpers.logDebug('ticker-view-port clicked');
	 var viewPortId = $('body').attr('extra-data');
         var tickered = profileData.tickered_profile;
	 parent.postMessage({command : 'tickerViewPort', viewPortId : viewPortId, 'tickered': tickered}, "*");
      });
   },
   forceRefresh : function() {
      var self = this;
      if (self.streamingHelper) {
	 var params = {
	    id : ('undefined' == typeof self.profileData ? embedId : self.profileData.id),
	    count : self.numResultOnLoad,
	    numInitialResults : self.numResultOnLoad,
	    start : 0,
	    from : 0
	 };
	 //send tracking info
	 parent.postMessage({
	    'postText' : 'Sending force rebuild call with params ' + JSON.stringify(params),
	    'currentTimeStamp' : new Date().getTime()
	 }, '*');
	 self.streamingHelper.sendRequest('billBoard.widget.get', params);
      }
   },
   initHealthCheck : function() {
      var self = this;
      setInterval(function() {
	 $.get('https://me.parllay.com/images/categories.png?r=' + new Date().getTime(), function() {
	    if (!jQuery(".status-button").hasClass('yellow')) {
	       var forceRefresh = jQuery(".status-button").hasClass('red');
	       self.setStatusButtonClass('green');
	       if (forceRefresh) {
		  self.forceRefresh();
	       }
	    }
	 }).fail(function() {
	    Helpers.logDebug('no internet');
	    self.setStatusButtonClass('red');
	 });
      }, 5000);
   },
   readFromServerCacheSuccess : function(data) {
      var self = this;
      if ('object' === typeof data && data.count > 0) {
	 if (window != window.parent) {
	    parent.postMessage({
	       userAction : 'billBoard.widget.connect.response.received'
	    }, '*');
	 }
	 self.setStatusButtonClass('yellow');
	 self.responseHandler(data, "refresh");
      }
   },
   readFromServerCache : function() {
      var self = this;
      jQuery.ajax({
	 url : '/embed/readFromServerCache',
	 data : {
	    embedType : 'public_display',
	    profileId : ('undefined' == typeof self.profileData ? embedId : self.profileData.id)
	 },
	 dataType : 'jsonp',
	 jsonp : 'callback',
	 jsonpCallback : 'window.ParllayDisplayObject.readFromServerCacheSuccess',
	 success : function(data) {
	    Helpers.logDebug(data);
	 },
	 error : function() {

	 }
      });
   },
   updateServerCache : function(response) {
      var self = this;
      if(isAdmin){
          // do not make this call in admin preview mode.
          return false;
      }
      if('undefined' == typeof window.ajaxCallWaiting){
          window.ajaxCallWaiting = false;
      }
      if(window.ajaxCallWaiting == true){
          return;
      }
      if (response.count > self.numResultOnLoad) {
	 var responseData = response.data;
	 responseData = responseData.slice(0, self.numResultOnLoad);
	 response.data = responseData;
	 response.count = self.numResultOnLoad;
      }
      if (response.count === 0) {
	 return;
      }
      if(self.lastServerCacheUpdatedTime !== null){
          var now = Math.floor(Date.now()/1000);
          if(now - parseInt(self.lastServerCacheUpdatedTime) < 300){
              //less than 5 minutes, so abort call
              Helpers.logDebug('Last server cache updated time is less than 5 minutes. So abort call');
              return;
          }
      }
      var downTimeChecker = setTimeout(function(){
          downTimeChecker = null;
//          document.location.reload();
      }, self.billboardRestartTime);
      self.lastServerCacheUpdatedTime = Math.floor(Date.now()/1000);
      window.ajaxCallWaiting = true;
      $.ajax({
	 url : 'https://me.parllay.com/embed/updateServerCache',
	 type : 'POST',
	 data : {
	    embedType : 'public_display',
	    response : JSON.stringify(response),
	    profileId : ('undefined' == typeof self.profileData ? embedId : self.profileData.id),
	    count : response.count
	 },
	 success : function(data) {
             window.ajaxCallWaiting = false; 
             if(downTimeChecker != null){
                 clearTimeout(downTimeChecker);
             }
             Helpers.garbageCleaner(response);
         },
	 error : function() {
             window.ajaxCallWaiting = false;
             Helpers.garbageCleaner(response);
         }
      });
   },
   cleanupFeaturedArea : function() {
   },
   cleanupContentArea : function() {
      $(".public-display-items").empty();
   },
   initializeSlides : function() {
	  var self = this;
	  self.serviceCallId = ('undefined' == typeof self.profileData ? embedId : self.profileData.id);
      self.streamingHelper = new streamingHelper("billBoard.widget", this);
      window.streamingHelper = self.streamingHelper;
      self.streamingHelper.getConnection();
      Helpers.registerHandlebarsHelpers();
      var source = jQuery("#billboards-template").html();
      self.sliderTemplate = Handlebars.compile(source);
      Handlebars.registerHelper('displayIndex', function() {
	 return self.displayCounter++;
      });
      if (isAdmin && typeof parllayDisplayAdminFeatures != 'undefined') {
	 window.parllayDisplayAdminFeatures = new parllayDisplayAdminFeatures();
      }
   },
   makeDeleteAjaxCall : function(tmp) {
      var $currentItem = $(window.publicDisplaySlider.$items.eq(window.publicDisplaySlider.currentSlide));
      var messageData = {
	 'socialChannelType' : $currentItem.attr('channel_type'),
	 'embedType' : 'public_display',
	 'embedId' : jQuery('.public-display-items').attr('profile-id'),
	 'autoPublish' : $currentItem.attr('auto-publish'),
	 'streamId' : $currentItem.attr('stream_id'),
	 'postId' : $currentItem.attr('data-originalId'),
	 'isVideo' : false,
	 'imageUrl' : '',
	 'postText' : $.trim($currentItem.find('.message-text .messages').html()),
	 'currentTimeStamp' : new Date().getTime()
      };
      messageData.userAction = 'Remove';
      messageData.businessId = profileData.business_id;
      $.ajax({
	 url : businessServer + '/content/publishUGC',
	 data : messageData,
	 method : 'POST',
//           dataType : 'jsonp',
	 crossDomain : true,
	 jsonp : true,
	 success : function(data) {
	    Helpers.logDebug(data);
	 },
	 error : function() {

	 }
      });
   },
   applyPreviewInline : function(messageData) {
      Helpers.logDebug(messageData);
      switch (messageData.context) {
          case "ticker_direction":
              var animation = $(".ticker_contents")
                      .css('animation')
                      .replace('ticker_marquee_r_l','')
                      .replace('ticker_marquee_l_r','');
              $(".ticker_contents").css('animation', messageData.value + animation);
              profileData.ticker_direction = messageData.value;
          break;
          case "vertical_viewport":
              switch(messageData.value){
                  case 1:
                  case "1":
                      $('body').addClass('vertical');
                      break;
                  default:
                      $('body').removeClass('vertical');
                      break;
              }
          break;
	 case "hide_timestamps":
            profileData.hide_timestamps = messageData.value;
            if(profileData.hide_timestamps == '1'){
                $('time.posted-time').addClass('hide');
            } else {
                $('time.posted-time').removeClass('hide');
            }
            break;
	 case "hide_author_info":
            profileData.hide_author_info = messageData.value;
            if(profileData.hide_author_info == '1'){
                $('.user-and-network-container').addClass('hide');
            } else {
                $('.user-and-network-container').removeClass('hide');
            }
            break;
         case "overlay_bg_color":
	    var rgb = messageData.value.rgb;
	    $('.public-display-items:not(.tickered).item > table + div, .sample-post .display-text').css('background', 'rgba(' + rgb['r'] + ',' + rgb['g'] + ',' + rgb['b'] + ',0.6)');
	    $('.stream-explorer-view').css('background', messageData.value.hex);
            $('.public-display-items.tickered .item').css('background', messageData.value.hex);
	    break;
	 case "card_bg_color":
	    $(".public-display-items:not(.tickered) .item,.public-display-items.tickered, .stream-explorer-view .message-post, .text-content-preview-area .sample-post").css('background', messageData.value);
            if(messageData.value.indexOf('#') < 0){
                $(".public-display-items:not(.tickered) .item,.public-display-items.tickered, .stream-explorer-view .message-post, .text-content-preview-area .sample-post").css('background-size', 'cover');
            }
	    break;
	 case "font_family":
	    var fontFamily = "'Actor', sans-serif";
	    if (messageData.value !== 'default') {
	       fontFamily = messageData.value.split('::')[1].split(':')[1].replace(';', '');
	    }
	    $('.public-display-items .item > div').css('font-family', fontFamily);
	    $('body, .parllay-pullout-menu .parllay-settings-pullout-menu .user-style, .parllay-pullout-menu .parllay-settings-pullout-menu .user-style *, .sample-post .display-text, .sample-post .display-text *').css('font-family', fontFamily);
	    break;
	 case "font_size":
	    $('body')
		    .removeClass('small')
		    .removeClass('medium')
		    .removeClass('large')
		    .addClass(messageData.value);
	    if (window.qaClient && window.qaClient._streamsObj) {
	       window.qaClient._streamsObj._setFreeWallSize();
	       setTimeout(function() {
		  window.qaClient._streamsObj._setFreeWallSize();
	       }, 500);
	    }
	    break;
	 case "font_color":
	    $('body *, .public-display-items .item > div, .public-display-items .item > div table, .public-display-items .item > div table a, .sample-post .display-text, .sample-post .display-text *, .popup-profile').css('color', messageData.value);
	    break;
	 case "show_logo":
	    if (messageData.value == 1) {
	       $(".business-logo").removeClass("hidden");
	    } else {
	       $(".business-logo").addClass('hidden');
	    }
	    break;
	 case "logo_position":
	    $(".business-logo").removeClass("position-1").removeClass("position-2").removeClass("position-3").removeClass("position-4");
	    $(".business-logo").addClass("position-" + messageData.value);
	    break;
	 case "font_family":
	    var fontFamily = "'Actor', sans-serif";
	    if (messageData.value !== 'default') {
	       fontFamily = messageData.value.split('::')[1].split(':')[1].replace(';', '');
	    }
	    $('.public-display-items .item > div').css('font-family', fontFamily);
	    $('body, .parllay-pullout-menu .parllay-settings-pullout-menu .user-style, .parllay-pullout-menu .parllay-settings-pullout-menu .user-style *, .sample-post .display-text, .sample-post .display-text *').css('font-family', fontFamily);
	    break;
      }
   },
   initChromecastEventsListener : function() {
      var self = this;
      var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
      var eventer = window[eventMethod];
      var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";
      // Listen to message from child window
      eventer(messageEvent, function(e) {
	 //           Helpers.logDebug(e.data);
	 try {
	    var messageData = e.data;
	    if (typeof messageData == 'string') {
	       messageData = JSON.parse(messageData);
	    }
	    Helpers.logDebug(messageData.command);
	    switch (messageData.command) {
	       /*case "viewPortTickered":
                  var title = 'Remove Ticker';
                  if($(".ticker-view-port").hasClass('active')){
                      title = 'Add Ticker';
                  }
                  $(".ticker-view-port").toggleClass('active').trigger('mouseout').attr('title', title);
                  break;*/
	       case "kill-all-ajax-calls":
		  //not for chromecast. It is for admin use
		  $.xhrPool.abortAll();
		  break;
	       case "applyPreviewInline":
		  //not for chromecast. It is for admin use
		  self.applyPreviewInline(messageData);
		  break;
	       case "forceRefresh":
		  //not for chromecast. It is for admin use
		  self.forceRefresh();
		  break;
	       case "removeActiveClass":
		  //not for chromecast. It is for admin use
		  $("body").removeClass('active');
		  break;
	       case "prev_slide":
		  window.publicDisplaySlider._showPrevSlide();
		  break;
	       case "next_slide":
		  window.publicDisplaySlider._showNextSlide();
		  break;
	       case "delete_slide":
		  var deletedRecord = {
		     count : 1,
		     data : [ messageData ]
		  };
		  self.handleDeleteDisplayHandler(deletedRecord);
		  self.makeDeleteAjaxCall(messageData);
		  break;
	       case "pause":
		  var currentItem = window.publicDisplaySlider.currentItem;
		  if (currentItem.attr("data-video") == "video") {
		     window.publicDisplaySlider._pauseVideo();
		  } else {
		     window.publicDisplaySlider._stopShow();
		  }
		  break;
	       case "resume":
		  var currentItem = window.publicDisplaySlider.currentItem;
		  if (currentItem.data("video") == "video") {
		     window.publicDisplaySlider._resumeVideo();
		  } else {
		     window.publicDisplaySlider._startShow();
		  }
		  break;
	       case "pause_video":
		  window.publicDisplaySlider._pauseVideo();
		  break;
	       case "resume_video":
		  window.publicDisplaySlider._resumeVideo();
		  break;
	       case "pause_slide":
		  window.publicDisplaySlider._pauseVideo();
		  window.publicDisplaySlider._stopShow();
		  break;
	       case "resume_slide":
		  window.publicDisplaySlider._startShow();
		  window.publicDisplaySlider._resumeVideo();
		  break;
	       case 'slide_status':
		  var isPaused = window.publicDisplaySlider._isPaused();
		  parent.postMessage({
		     query : 'slide_status',
		     answer : isPaused ? 'paused' : 'running'
		  }, '*');
		  break;
	       case "volume_minus":
		  window.publicDisplaySlider._volumeMinus();
		  break;
	       case "volume_mute":
		  window.publicDisplaySlider._volumeMute();
		  break;
	       case "volume_unmute":
		  window.publicDisplaySlider._volumeUnmute();
		  break;
	       case "volume_plus":
		  window.publicDisplaySlider._volumePlus();
		  break;
	       case "volume_set":
		  window.publicDisplaySlider._volumeSet(messageData.toVolume);
		  break;
	       case "seek_slide":
	       default:
		  break;
	    }
	 } catch (exception) {
	    Helpers.logDebug('Exception occured:' + exception);
	 }
      }, false);
   },
   initFullScreenMode : function() {
      jQuery(".business-logo").click(function() {
	 if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
	    var element = document.documentElement;
	    var requestMethod = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || element.msRequestFullScreen;
	    if (requestMethod) {
	       requestMethod.call(element);
	    } else if (typeof window.ActiveXObject !== "undefined") {
	       var wscript = new ActiveXObject("WScript.Shell");
	       if (wscript !== null) {
		  wscript.SendKeys("{F11}");
	       }
	    }
	 } else {
	    var exitFullScreenMethod = document.exitFullscreen || document.msExitFullscreen || document.mozCancelFullScreen || document.webkitExitFullscreen;
	    if (exitFullScreenMethod) {
	       exitFullScreenMethod.call(document);
	    }
	 }
      });
   },
   handleImageError : function(errorText) {
      if (window != window.parent) {
	 parent.postMessage({postText : errorText}, "*");
      }
   },
   handleImage : function(img, image, callback) {
      var self = this;
      try {
	 callback = Helpers.ensureCallback(callback);
	 var windowWidth = jQuery(window).width();
	 var windowHeight = jQuery(window).height();
	 var imageElement = image.closest('.slider-content.item')
	 /* if (false && img.width < (windowWidth / 2) && img.height >= img.width) {
	  imageElement.addClass('portrait-image');
	  } else  if (img.width > windowWidth || img.height > windowHeight) */
	 {
	    if (profileData["stretch_image"] == 1) {
	       image.closest('.slider-content.item').addClass('landscape-image');
	       image.resizeToParent({
		  parent : '.slider-content.item'
	       });
	    } else {
	       var dimentions = {};
	       dimentions = Helpers.aspectRatioFit({
		  "wi" : img.width,
		  "hi" : img.height,
		  "wa" : windowWidth,
		  "ha" : windowHeight
	       });

	       if (img.height == 0 || img.width == 0) {
		  self.handleImageError('Warning: Image size width/height is 0 (not able to calculate aspect ratio) ');
	       }

	       if ("undefined" !== typeof dimentions.height) {
		  image.height(dimentions.height);
	       }

	       if ("undefined" !== typeof dimentions.width) {
		  image.width(dimentions.width);
	       }


	       imageElement.removeClass("width-fill").removeClass("text-bottom-align").removeClass("image-vertical-align").removeClass("height-fill").removeClass("text-right-align").removeClass("image-horizontal-align");

	       jQuery.each(dimentions.classes, function(i, cssClass) {
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
		     "height" : dimentions.availableHeight + "px"
		  });
		  imageElement.find(".display-text .line-display-text").css({
		     "height" : dimentions.availableHeight + "px"
		  });
	       } else if ("undefined" !== typeof dimentions.availableWidth) {
		  imageElement.find(".display-text").css({
		     "width" : dimentions.availableWidth + "px"
		  });
		  var lineDisplayWidth = (windowWidth / 100) * 4;
		  lineDisplayWidth = dimentions.availableWidth - lineDisplayWidth;
		  imageElement.find(".display-text .line-display-text").css({
		     "width" : lineDisplayWidth + "px"
		  });
	       }
	    }

	 } /* else {
	  imageElement.addClass('landscape-image');
	  image.resizeToParent({parent : '.slider-content.item', "imageHeight" : img.height, imageWidth : img.width});
	  } */
	 callback();
      } catch (exception) {
	 self.handleImageError('Image loading error: ' + exception);
      }
   },
   handleImages : function(images) {
      var self = this;
      images.each(function(i, image) {
	 image = jQuery(image);
	 var img = new Image();
	 img.onload = function() {
	    self.handleImage(img, image);
	 }
	 img.onerror = function() {
	    self.handleImageError('Error loading image: ' + image.attr("src"));
	 };
	 img.src = image.attr("src");
      });

   },
   handleFontSize : function(element, startFontSize) {
      var self = this;
      var messageElement = element.find(".message-text");
      var message = $.trim(messageElement.text());
      var charCount = message.length;
      var fontClass = 'max-font-size';
      if (charCount < self.initialFontSizeChars) {
	 fontClass = 'max-font-size';
      } else if (charCount < self.mediumFontSizeChars) {
	 fontClass = 'medium-font-size';
      } else if (charCount < self.maxCharToDisplay) {
	 fontClass = 'min-font-size';
      } else {
	 fontClass = 'min-font-size';
	 Helpers.logDebug("After cut the text");
	 message = Helpers.splitTextWithWordBoundary(message, self.maxCharToDisplay);
	 Helpers.logDebug(message);
	 Helpers.logDebug(charCount);
	 messageElement.text(message);
      }
      messageElement.addClass(fontClass);
   },
   responseHandler : function(response, mode, callback) {
      var self = this;
      try {
	 if (response.count > 0) {
	    //send tracking info
	    parent.postMessage({
	       'postText' : 'Service call completed with ' + response.count + ' records',
	       'currentTimeStamp' : new Date().getTime()
	    }, '*');
	    var newRecords = [ ];
	    var businessOffset = $("body").attr("business-offset");
	    StreamsHelpers.context = self;

	    var options = {
	       "hideTextOnlyPost" : profileData["hide_text_only_post"],
	       "hideAllText" : profileData["hide_all_text"],
	       "hideUrls" : profileData["hide_urls"],
	       "hideHashtags" : profileData["hide_hashtags"],
	       "commentsRestriction" : 2
	    };

	    var records = StreamsHelpers.formatStoryResponse(response.data, mode, businessOffset, undefined, undefined, options);
	    var notifyCachingService = function (newRecords) {
                    try {
                        parent.postMessage({type: 'NewContentReceived', command: 'NewContentReceived', content: newRecords, container_id: profileData.id}, '*');
                    } catch (ex) {

                    }
            }
	    var html = self.sliderTemplate({
	       "records" : records
	    });
	    
	    var numberOfPosts = jQuery(".public-display-items .slider-content.item").length;
	 
	    if(numberOfPosts == 0 && "undefined" === typeof window.publicDisplaySlider) {
	       mode = "refresh";
	    }
	    var handleSlideCount = function(){
                return false;
                if($(".slider-content.item").length > self.numMaxOnDOM){
                    var k = self.numMaxOnDOM;
                    var $currentItem = $(window.publicDisplaySlider.$items.eq(window.publicDisplaySlider.currentSlide));
                    while($(".slider-content.item").length > self.numMaxOnDOM && k > 0){
                        if($(".slider-content.item[data-index='" + k + "']").length > 0 && ($currentItem.attr('data-originalId') != $(".slider-content.item[data-index='" + k + "']").attr('data-originalId'))){
                            $(".slider-content.item[data-index='" + k + "']").remove();
                            console.log('removed item at data-index=' + k);
                        }
                    }
                }
            };
	    var handleTicker = function(){
                if(profileData.tickered_profile == 1){
                    $("#initial-loading-element").fadeOut("fast");
                    var computeWidth = function(){
                        var width = 0;
                        $(".ticker_contents .t_marquee:first .slider-content.item").each(function(){
                            width += $(this).width() + 1;
                        });
                        if(width > 0){
                            $(".ticker_contents .t_marquee").css('width', (width) + 'px');
                            $(".public-display-items").css('width', (width) + 'px');
                        }
                        var time = Math.floor(10 * (width / $(".wrapper.public-display").width()));
                        $(".ticker_contents").css('animation', profileData.ticker_direction + ' ' + time + 's linear infinite');
                    };
                    computeWidth();
                    setTimeout(function(){
                        computeWidth();
                    }, 2000);
                    $(".user-photo").unbind('load').load(function(){
                        computeWidth();
                    });
                    if($(".ticker_contents .t_marquee").length == 1){
                        $(".ticker_contents .t_marquee").clone().appendTo(".ticker_contents");
                    }
                    var setVerticalPosition = function(){
                        var margin_top = 0;
                        if(profileData.ticker_position == 'center'){
                            margin_top = ($(".public-display-items").height() - $(".ticker_contents").height())/2;
                        } else if(profileData.ticker_position == 'bottom'){
                            margin_top = ($(".public-display-items").height() - $(".ticker_contents").height());
                        }
                        $(".ticker_contents").css('padding-top', margin_top + 'px');
                    };
                    setVerticalPosition();
                    setTimeout(function(){
                        setVerticalPosition();
                    }, 2000);
                    $(window).unbind('resize').resize(function(){
                        setVerticalCenter();
                    });
                }
            }
	    if (mode == "refresh") {
                    notifyCachingService(records);
	       if ($(".bb_error_container:visible").length > 0) {
		  $(".bb_error_container").hide();
		  $(".bb_container").show();
		  if ($(".bb_container script#parllay-pullout-menu").length > 0) {

		  }
		  $(".parllay-pullout-menu").show();
	       }
	       $(html).find('img.main-image').error(function() {
		  Helpers.logDebug('* ===> Billboard Image Loading failed');
		  var postId = $(this).closest('.slider-content').attr('data-originalid');
		  var image = $(this);
		  Helpers.logDebug(postId);
		  streamingHelper.refreshActivities(businessId, [ postId ], function(data) {
		     Helpers.logDebug('Data is:');
		     Helpers.logDebug(data);
		     if (typeof data === 'object') {
			$.each(data, function(postId, postData) {
			   Helpers.logDebug(postId);
			   Helpers.logDebug(data[postId]);
			   if ('undefined' !== typeof data[postId].full_picture) {
			      var imageSrc = data[postId].full_picture;
			   } else if ('undefined' !== typeof data[postId].images) {
			      var imageSrc = data[postId].images[0].source;
			   } else {
			      var imageSrc = data[postId].picture;
			   }
			   $(".slider-content[data-originalid='" + postId + "'] img.main-image").attr('src', imageSrc);
			});
		     }
		  });
	       });
	       jQuery(".public-display-items").html(html).promise().done(function(arg1) {
                  handleTicker();
		  handleSlideCount();
		  var images = jQuery('.public-display-items .slider-content.item .main-image');
		  //handle all the images and align appropriately
		  self.handleImages(images);
		  jQuery(".public-display-items").find("time.timeago").timeago();
                  if(profileData.hide_timestamps == '1'){
                      $('time.posted-time').addClass('hide');
                  } else {
                      $('time.posted-time').removeClass('hide');
                  }
                  if(profileData.hide_author_info == '1'){
                      $('.user-and-network-container').addClass('hide');
                  } else {
                      $('.user-and-network-container').removeClass('hide');
                  }
	       });
               if(profileData.tickered_profile == 0){
                    if ('undefined' === typeof window.publicDisplaySlider) {
                       setTimeout(function() {
                          window.publicDisplaySlider = jQuery('.public-display-items').parllaySlider({
                             "animateIn" : (typeof self.profileData === "object") ? self.animation[self.profileData['carousel_type']] : 'fadeIn',
                             "interval" : (typeof self.profileData === "object") ? self.profileData['is_single_card'] : 5000,
                             "autoplay" : true,
                             "animateOut" : 'bounceOut',
                             "onSlideChange" : function($currentItem, simulation) {
                                if('undefined' == typeof window.ajaxCallWaiting){
                                    window.ajaxCallWaiting = false;
                                }
                                if(window.ajaxCallWaiting == true){
                                    return;
                                }
                                try {
                                   if (window != window.parent) {
                                      //embedded
                                      if ('undefined' === typeof simulation) {
                                         simulation = false;
                                      } else {
                                         simulation = true;
                                      }
                                      var data = {
                                         'viewport_id' : jQuery('.public-display-items').attr('profile-id'),
                                         'command' : 'slide_changing',
                                         'socialChannelType' : $currentItem.attr('channel_type'),
                                         'embedType' : 'public_display',
                                         'embedId' : ('undefined' == typeof profileData ? creativeId : profileData['creative_id']),
                                         'embedName': 'Unknown',
                                         'autoPublish' : $currentItem.attr('auto-publish'),
                                         'streamId' : $currentItem.attr('stream_id'),
                                         'postId' : $currentItem.attr('data-originalId'),
                                         'isVideo' : false,
                                         'imageUrl' : '',
                                         'postText' : $.trim($currentItem.find('.message-text .messages').html()),
                                         'currentTimeStamp' : new Date().getTime(),
                                         'slide_timeout' : profileData['is_single_card'],
                                         'simulation' : simulation,
                                         'post_count_in_dom': $(".slider-content.item").length
                                      };
                                      if ($currentItem.find('.main-image').length > 0) {
                                         data['imageUrl'] = $currentItem.find('.main-image').attr('slidechange-src');
                                      }
                                      if (self.tmo !== null) {
                                         clearTimeout(self.tmo);
                                         self.tmo = null;
                                      }
                                      if ($currentItem.data("video") === "video") {
                                         data['isVideo'] = true;
                                         data['videoMuted'] = ('undefined' !== typeof profileData ? profileData['video_muted'] : 1);
                                         data['videoUrl'] = $currentItem.attr('slidechange-videourl');

                                        if('undefined' === typeof isChromeBit || isChromeBit == false){
                                            //call tracking service at transition interval.
                                            self.tmo = setTimeout(function() {
                                               Helpers.logDebug('Simulating slide change');
                                               window.publicDisplaySlider.options.onSlideChange($currentItem, true);
                                            }, parseInt(profileData['is_single_card']));
                                        }
                                      }
                                      Helpers.logDebug(data);
                                      parent.postMessage(data, '*');
                                      Helpers.garbageCleaner(data);
                                   }
                                } catch (error) {
                                   Helpers.handleExceptions(error);
                                }
                             }
                          });
                          Handlebars.registerHelper('displayIndex', function() {
                             return window.publicDisplaySlider.currentIndex++;
                          });
                       }, 500);
                    } else {
                       //force reload from socket
                       window.publicDisplaySlider.refresh();
                    }
                }
	    } else if (mode == "append") {
                var contents = jQuery('<div class="outer-container">' + html + '</div>');
                contents = contents.find(".slider-content.item");
                var newRecordsForCachingService = [];
                    
	        contents.each(function(index, content) {
		  content = jQuery(content);
		  content.find("time.timeago").timeago();
		  var dataId = content.data("id");
		  if (jQuery('.public-display-items .item[data-id="' + dataId + '"]').length <= 0 /* || self.profileData["post_display_order"] == "sequential" */) {
		         var originalId = content.attr('data-originalid');
                            for (var ne = 0; ne < records.length; ne++) {
                                if (records[ne].originalId == originalId) {
                                    newRecordsForCachingService.push(records[ne]);
                                    break;
                                }
                            }
                        if (window.publicDisplaySlider || profileData.tickered_profile == 1) {
			var firstItem = jQuery(".slider-content.item:first-child");
			var firstTimeStamp = parseInt(firstItem.data("timestamp"), 10);
			var thisItemTimeStamp = parseInt(content.data("timestamp"), 10);
                        if(profileData.tickered_profile == 1){
                            // TO-DO
                            var index = 0;
                        } else {
                            var index = jQuery('.slider-content.item.parllay-animate-in').index();
                        }
			if (thisItemTimeStamp < firstTimeStamp) {
			   index = jQuery('.slider-content.item.parllay-animate-in:last-child').index();
			} else {
			   index = index + 1;
			}

			var newItemInsertion = self.getInsertionItem(index);
			var image = content.find(".image-container .main-image");
			var imageSource = image.attr('src');
			if (image && imageSource) {
			   var img = new Image();
			   img.onload = function() {
			      self.handleImage(img, image, function() {
				 if (newItemInsertion) {
				    content.insertAfter(newItemInsertion);
				 } else {
				    jQuery('.public-display-items').html(content);
				 }
                                 handleTicker();
                                 handleSlideCount();
                                 if(window.publicDisplaySlider){
                                    window.publicDisplaySlider.refresh();
                                 }
			      });
			   }
			   img.onerror = function() {
                              if(profileData.tickered_profile == 1){
                                  return;
                              }
			      self.handleImageError('Error loading image: ' + image.attr("src"));
			      Helpers.logDebug('* ===> Billboard Image Loading failed');
			      var postId = image.closest('.slider-content').attr('data-originalid');
			      Helpers.logDebug(postId);
			      streamingHelper.refreshActivities(businessId, [ postId ], function(data) {
				 Helpers.logDebug('Data is:');
				 Helpers.logDebug(data);
				 if (typeof data === 'object') {
				    $.each(data, function(postId, postData) {
				       Helpers.logDebug(postId);
				       Helpers.logDebug(data[postId]);
				       if ('undefined' !== typeof data[postId].full_picture) {
					  var imageSrc = data[postId].full_picture;
				       } else if ('undefined' !== typeof data[postId].images) {
					  var imageSrc = data[postId].images[0].source;
				       } else {
					  var imageSrc = data[postId].picture;
				       }
				       $(".slider-content[data-originalid='" + postId + "'] img.main-image").attr('src', imageSrc);
				       img.src = imageSrc;
				    });
				 }
			      });
			   };
			   img.src = imageSource;
			} else {
			   content.insertAfter(newItemInsertion);
                           handleTicker();
			   handleSlideCount();
                           window.publicDisplaySlider.refresh();
			}
		     } else {
			Helpers.logDebug("parllay slider is not defined");
		     }
                     if(profileData.tickered_profile == 1){
                         contents.appendTo('.ticker_contents .t_marquee');
                     }
		  } else {
		     Helpers.logDebug("post already in DOM - Post ID: " + dataId);
		  }
	       });
               if (newRecordsForCachingService.length > 0) {
                  notifyCachingService(newRecordsForCachingService);
               }
	    }
	 } else {
	    var numberOfPosts = jQuery(".public-display-items .slider-content.item").length;
	    if(numberOfPosts == 0) {
	       jQuery(".public-display-items").html("<div class='no-data'>No Data Found</div>");
	    }
	    Helpers.logDebug("No data received!");
	    //send tracking info
	    parent.postMessage({
	       'postText' : 'Service call completed with 0 records',
	       'currentTimeStamp' : new Date().getTime()
	    }, '*');
	 }
         Helpers.garbageCleaner(response);
      } catch (errors) {
	 Helpers.logDebug(errors);
	 Helpers.logDebug("Error at billboards: " + JSON.stringify(errors));
	 Helpers.logDebug("Error at billboards: " + errors.stack);
	 //send tracking info
	 parent.postMessage({
	    'postText' : 'Error at billboards: ' + JSON.stringify(errors),
	    'currentTimeStamp' : new Date().getTime()
	 }, '*');
      }
   },
   getInsertionItem : function(itemIndex) {
      var item = jQuery(".slider-content.item").eq(itemIndex);
      if (item.length < 1) {
	 if (itemIndex == 0) {
	    return false;
	 }
	 return this.getInsertionItem(itemIndex - 1);
      }
      return item;
   },
   handleMetadataChange : function(metaData) {
      Helpers.logDebug(metaData);
      if (metaData != false) {
	 var location = document.location.href;
	 if (metaData.display_type === 'slider' && location.indexOf('fullscreen') > 0) {
	    location = location.replace('fullscreen', 'display');
	    Helpers.logDebug('===> Grid to Slider');
	    Helpers.logDebug('===> new location:' + location);
	    document.location.href = location;
	 } else if (metaData.display_type === 'grid' && location.indexOf('display') > 0) {
	    location = location.replace('display', 'fullscreen');
	    Helpers.logDebug('===> Slider to Grid');
	    Helpers.logDebug('===> new location:' + location);
	    document.location.href = location;
	 } else {
	    document.location.reload();
	 }
      }
   },
   handleDeleteDisplayHandler : function(deletedRecord) {
      function deleteRecordFromDOM(dataId, postId) {
	 if (window.publicDisplaySlider) {
	    if (window.publicDisplaySlider.currentItem.attr('data-originalid') == postId || window.publicDisplaySlider.currentItem.attr('data-id') == dataId) {
	       window.publicDisplaySlider._showNextSlide();
	    }
	    window.publicDisplaySlider.refresh();
	 }
      }
      try {
	 if (deletedRecord.count > 0) {
	    var data = deletedRecord.data;
	    jQuery.each(data, function(k, obj) {
	       var dataId = obj.id;
	       var dataIdRecords = jQuery('.public-display-items .slider-content.item[data-id="' + dataId + '"]');
	       var postIdRecords = jQuery('.public-display-items .slider-content.item[data-originalid="' + obj.postId + '"]');
	       if (dataIdRecords.length > 0) {
		  dataIdRecords.remove();
		  deleteRecordFromDOM(dataId, obj.postId);
	       } else if (postIdRecords.length > 0) {
		  postIdRecords.remove();
		  deleteRecordFromDOM(dataId, obj.postId);
	       }
	    });
	    jQuery(window).trigger('resize');
	 } else {
	    Helpers.logDebug("No data retrieved!")
	 }
      } catch (error) {
	 Helpers.logDebug(error);
      }
   }
};

