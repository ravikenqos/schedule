/**
 * parllaySlider.js v1.0
 * author <sathishs@enqos.com>
 */

;
(function ($, window, undefined) {
    "use strict";

    var parllaySliderObject = null;

    $.ParllaySlider = function (options, element) {
        this.$element = element;
        this._initialize(options);
    }

    $.ParllaySlider.defaults = {
        "interval": 5000,
        "autoplay": true,
        "animateIn": 'rotateIn',
        "animateOut": 'fadeOut',
        "onSlideChange": function ($currentItem, simulation) {
        }
    };
    $.ParllaySlider.prototype =
            {
                maxNoOfPosts: 100,
                _initialize: function (options) {
                    var self = this;
                    try {
                        this.options = $.extend(true, {}, $.ParllaySlider.defaults, options);
                        this.options.interval = parseInt(this.options.interval, 10);
                        this.currentSlide = 0;
                        this.currentItem = null;
                        this.prevSlide = -1;
                        this.youtubePlayerReady = 0;
                        this.youtubePlayer = null;
                        this.videoPlaying = false;
                        this.newEvent = null;
                        this.currentVolume = 100;
                        this._sortElements();
                        this.$items = this.$element.find(".slider-content.cache_ready");
                        this.itemsCount = this.$items.length;

                        this.lastItemIndex = this.$items.eq(this.itemsCount - 1).data("index");
                        this.currentIndex = this.lastItemIndex + 1;

                        if (this.itemsCount === 0) {
                            if('undefined' != typeof isChromeBit && isChromeBit == true){
                                $("#initial-loading-element").html('<div class="chromebit_message">Your playlist is being prepared. Please wait.</div>');
                            }
                            setTimeout(function(){
                                self._initialize(options);
                            }, 5000);
                            return false;
                        }
                        var self = this;
                        var $current = this.$items.eq(this.currentSlide);

                        //set time to prepare the images in correct position and applying css classes before start the show
                        setTimeout(function () {
                            $("#initial-loading-element").fadeOut("fast");
                            self._startShow();
                        }, 1000);
                    } catch (error) {
                        self.handleExceptions(error);
                    }
                },
                _direction: function (direction, pos) {

                    this.prevSlide = this.currentSlide;

                    if (pos !== undefined) {

                        this.current = pos;

                    } else if (direction === 'next') {
                        this.currentSlide = this.currentSlide < this.itemsCount - 1 ? this.currentSlide + 1 : 0;
                    } else if (direction === 'prev') {
                        this.currentSlide = this.currentSlide > 0 ? this.currentSlide - 1 : this.itemsCount - 1;
                    }
                    this._show();
                },
                refresh: function () {
                    var self = this;
                    try {
                        this.$items = this.$element.find(".slider-content.cache_ready");
                        this.itemsCount = this.$items.length;
                    } catch (error) {
                        self.handleExceptions(error);
                    }
                },
                _onPlayerReady: function (event) {
                    var self = this;
                    try {
                        if ('undefined' != typeof profileData && profileData['video_muted'] == 1) {
                            event.target.mute();
                        } else {
                            event.target.unMute();
                        }
                        event.target.playVideo();
                    } catch (error) {
                        self.handleExceptions(error);
                    }
                },
                _onPlayerStateChange: function (event) {
                    var self = parllaySliderObject;
                    self.newEvent = event;

                    function goToNextSlide() {
                        try {
                            $("#ytplayer").hide();
                            self.videoPlaying = false;

                            //To empty the video if any in the same youtube player// 5Cm1PoK_5n4 is blank video
                            if (self.youtubePlayer) {
                                try {
                                    // self.youtubePlayer.loadVideoById("5Cm1PoK_5n4");
                                } catch (error) {
                                    // do nothing for now --
                                }
                            }
                            //start the slideshow once video has stopped/ended
                            self._direction('next');
                            self._startShow();
                        } catch (error) {
                            self.handleExceptions(error);
                        }
                    }

                    try {

                        if (event.data == YT.PlayerState.ENDED) {
                            goToNextSlide();
                        }
                        if (event.data == -1) {
                            self.newEvent = null;
                            setTimeout(function () {
                                if (self.newEvent == null) {
                                    goToNextSlide();
                                }
                            }, 3000);
                        }
                    } catch (error) {
                        self.handleExceptions(error);
                    }
                },
                _getVideoIDFromURL: function (ytUrl) {
                    var youTubeUrlRegex = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
                    var ytUrlId = (ytUrl.match(youTubeUrlRegex)) ? RegExp.$1 : false;
                    return ytUrlId;
                },
                _playVideo: function (videoId) {
                    var self = this;
                    try {
                        if (self.youtubePlayer) {
                            if ($("#ytplayer")) {
                                $("#ytplayer").show();
                            }
                            self.youtubePlayer.loadVideoById(videoId);
                        } else {
                            console.log("player is not ready!!!:" + self.youtubePlayerReady);
                            throw new Error('Youtube Player is not ready!!s!');
                        }
                    } catch (error) {
                        self.handleExceptions(error);
                    }
                },
                _youTubeVideoHandler: function ($currentItem, viewportid) {
                    var self = this;

                    function onYouTubeIframeAPIReady() {
                        self.youtubePlayerReady = 1;
                    }
                    //stop the slideshow
                    try {
                        this._stopShow();
                        this.videoPlaying = true;
                        //get the videoid
                        var url = $currentItem.data("videourl");
                        var videoId = self._getVideoIDFromURL(url);
                        if (videoId !== false) {
                            if (self.youtubePlayerReady !== 1 && self.youtubePlayer == null) {
                                //let ytplayer = `<webview src="http://54.153.95.221/ytube/ytube.html" style="display: block;width:100%;height:100%;"></webview>`;                                
                                let ytplayer = `<webview src="http://localhost/ytube/ytube.html" style="display: block;width:100%;height:100%;"></webview>`;                                
                                $('body').prepend(ytplayer);
                                const webview = document.querySelector('webview');
                                webview.addContentScripts([{
                                        name: 'sbCacheClient',
                                        matches: ['http://*/*'],
                                        js: { files: ['js/lib/jquery.js', '/js/sbwebview.js'] },
                                        run_at: 'document_end'
                                    }]);  
                                let i = 0;
                                chrome.runtime.onConnect.addListener(function(port) {
                                    port.onMessage.addListener( async (msg) => {
                                        if(msg.conn && i === 0){
                                            port.postMessage({
                                                videoid: videoId,
                                                isMute: $(`${viewportid} .muteAudio`).val()
                                            }); 
                                        }
                                        if (msg.playerState === 0 && i === 1) {
                                            self.refresh();            
                                            $('webview').remove();
                                            self.videoPlaying = false;
                                            self.currentSlide = $currentItem.data("index") - 1;
                                            self._direction('next');
                                            self._startShow();
                                        }
                                        i++;
                                    })
                                });   

                            } else {
                                self._playVideo(videoId);
                            }
                        }
                    } catch (error) {
                        self.handleExceptions(error);
                    }
                },
                _show: function () {
                    try {
                        var self = this;
                        if (self.currentSlide == 0) {
                            self._sortElements();
                        }
                        var $currentItem = $(this.$items.eq(this.currentSlide));
                        self.currentItem = $currentItem;
                        //this.$items.eq(this.currentSlide).removeClass("parllay-animate-in").removeClass("parllay-animate-out").removeClass(this.options.animateOut).addClass("animated").addClass("parllay-animate-in").addClass(this.options.animateIn);
                        this.$items.eq(this.currentSlide).removeClass("parllay-animate-in").removeClass("parllay-animate-out").removeClass(this.options.animateOut).removeClass("animated").addClass("animated").addClass("parllay-animate-in").addClass(
                                this.options.animateIn);
                        this._adjustTextFontSize($currentItem, 4);
                        //setTimeout(function() {
                        if (self.itemsCount > 1) {
                            if (self.prevSlide !== -1) {
                                self.$items.eq(self.prevSlide).removeClass("parllay-animate-out").removeClass("parllay-animate-in").removeClass("animated").removeClass(self.options.animateIn).addClass(self.options.animateOut).addClass("parllay-animate-out");
                            }
                        }
                        //}, 1000);
                        if(self.$items.filter("." + self.options.animateIn).length > 1){
                            self.$items.filter("." + self.options.animateIn).removeClass("parllay-animate-in").removeClass("animated").removeClass(self.options.animateIn).addClass(self.options.animateOut).addClass("parllay-animate-out");
                            self._show();
                        } else {
                            self.options.onSlideChange($currentItem);
                        }
                    } catch (error) {
                        self.handleExceptions(error);
                    }
                },
                _takeCareOfOtherVideos: function (viewportid, sliderItem) {
                    var self = this;
                    try {
                        var videoPlayer = $(viewportid+" #html-video-player");
                        var videocontainer = $(viewportid+" #html-video-player-container");
                        var videoUrl = sliderItem.attr("data-videourl");
                        $(viewportid+" #html-video-player-container").show();
                        $(viewportid+" #html-video-player").show();
                        //stop the slideshow
                      //  this._stopShow(); //comment this line next slide not working
                        this.videoPlaying = true;
                        
                        videoPlayer.attr("src", videoUrl);
                       // document.getElementById("html-video-player").muted = true;
                        //videoPlayer.muted = true;
                        let isMute = $(`${viewportid} .muteAudio`).val();
                        $(viewportid+" #html-video-player").prop('muted', true);
                        videoPlayer.get(0).play();
                        setTimeout(function(){
//                            if ('undefined' !== typeof profileData && profileData['video_muted'] == 1) {
                            if (isMute == 1) {
                                //document.getElementById("html-video-player").muted = true;
                                $(viewportid+" #html-video-player").prop('muted', true);
                            } else {
                                // document.getElementById("html-video-player").muted = false;
                                $(viewportid+" #html-video-player").prop('muted', false);
                            }
                        },200);
                    } catch (error) {
                        self.handleExceptions(error);
                    }

                    if('undefined' === typeof videoErrorTimeout){
                        var videoErrorTimeout = null;
                    }
                    function clearSkipTimeout(){
                        if(videoErrorTimeout !== null){
                            try{
                                clearTimeout(videoErrorTimeout);
                                videoErrorTimeout = null;
                            } catch(e){

                            }
                        }
                    }
                    clearSkipTimeout();

                    function goToNextSlide() {
                        clearSkipTimeout();
                        try {
                            setTimeout(function () {
                                self.videoPlaying = false;
                                // $("#html-video-player-container").hide();
                                // $("#html-video-player").hide();
                                videocontainer.hide();
                                videoPlayer.hide();                                
                                self._direction('next');
                                self._startShow();
                            }, 1000);
                        } catch (error) {
                            self.handleExceptions(error);
                        }
                    }

                    function clearVideoSrc(){
                       // $("#html-video-player").attr('src', '');
                       videoPlayer.attr('src', '');
                    }
                    videoPlayer.unbind("ended").bind("ended", function () {
                        clearVideoSrc();
                        goToNextSlide();
                    });

                    videoPlayer.unbind("error").bind("error", function (e, ui) {
                        switch (e.target.error.code) {
                            case e.target.error.MEDIA_ERR_ABORTED:
                                console.log('Video aborted by user');
                                break;
                            case e.target.error.MEDIA_ERR_NETWORK:
                                console.log('NET Work Error while playing video');
                                break;
                            case e.target.error.MEDIA_ERR_DECODE:
                                console.log('corrupted video');
                                break;
                            case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                                console.log('Video source not supported');
                                break;
                            default:
                                console.log('An unknown video error occurred.');
                                break;
                        }
                        // if($("#html-video-player").attr('src') != ""){
                        if(videoPlayer.attr('src') != ""){                            
                            clearVideoSrc();
                            goToNextSlide();
                        }
                        //alert("Error Code : "+event.target.error.code);
                    });

                    
                    videoPlayer.unbind("play").bind("play", function(e, ui){
                        clearSkipTimeout();
                    });
                    videoErrorTimeout = setTimeout(function(){
                        videoPlayer.get(0).pause();
                        console.log('videoErrorTimeout reached');
                        videoErrorTimeout = null;
                        //if the video did not play in specified time, then skip to next slide
                        if($("#html-video-player").attr('src') != ""){
                            clearVideoSrc();
                        }
                        goToNextSlide();
                    }, parseInt(profileData.video_error_time) * 1000);
                },
                _adjustTextFontSize: function (element, startFontSize) {
                    var self = this;
                    try {
                        var messageElement = element.find(".message-text");
                        if (!(messageElement.find(".message-area").hasClass("marquee"))) {
                            var message = $.trim(messageElement.text());
                            var displayTextElement = element.find(".display-text");
                            var displayElementHeight = displayTextElement.height();
                            var messageElementHeight = messageElement.height();
                            displayElementHeight = displayElementHeight - 25;
                            if (element.hasClass("text-right-align")) {
                                displayElementHeight = displayElementHeight - 60;
                            }
                            if (displayElementHeight < messageElementHeight) {
                                var messageTextElement = messageElement.find(".message-area");
                                messageTextElement.addClass("marquee");
                                messageElement.addClass("full-height");
                                element.find(".line-display-text").addClass("full-height");
                            }
                        }
                    } catch (error) {
                        self.handleExceptions(error);
                    }
                },
                _startShow: function (direction) {
                    var self = this;
                    try {
                        if (typeof direction === "undefined") {
                            direction = "next";
                        }

                        window.paused = false;
                        var self = this;
                        var $currentItem = $(this.$items.eq(this.currentSlide));
                        self.currentItem = $currentItem;

                        let viewportid = $currentItem.parent().attr('profile-id'); //enqos
                        viewportid = "#viewport_"+viewportid;

                        var url = $currentItem.attr("data-videourl");
                        var videoType = $currentItem.attr("data-videotype");
                        var videoId = false;
                        if ("undefined" !== typeof url) {
                            videoId = self._getVideoIDFromURL(url);
                        }
                        if ($currentItem.attr("data-video") == "video" && videoId !== false) {
                            //self._direction(direction);
                            // console.log("youtube");
                            this._youTubeVideoHandler($currentItem, viewportid);
                            this.currentHasVideo = true;
                        } else if ($currentItem.attr("data-video") == "video" && videoType == "others") {
                            //self._direction(direction);
                          //  console.log("video");
                            this._takeCareOfOtherVideos(viewportid, $currentItem);
                            this.currentHasVideo = true;
                        } else {
                            //console.log("image");
                            var text = $currentItem.find(".display-text .message-text").find(".messages").text();
//                            console.log(text);
                            var urls = Helpers.findUrls(text);
                            var vflag = $currentItem.attr("data-vflag");

                            if (urls.length > 0 && typeof vflag === "undefined") {
                                urls.forEach(function (url) {
                                    var ajax = Helpers.makeAjax("/embed/getLongUrl", "POST");
                                    ajax.setParameters({"url": url, 'currentSlide': self.currentSlide});
                                    ajax.loadJSON(function (urlData) {
                                        try {
                                            var longurl = $.trim(urlData["url"]);
                                            var slideItem = urlData["currentSlide"];
                                            var $slideItem = $(self.$items.eq(slideItem));
//                                            console.log(longurl);
                                            var videoId = self._getVideoIDFromURL(longurl);
                                            if (videoId !== false) {
                                                $slideItem.attr("data-video", "video");
                                                $slideItem.attr("data-videourl", longurl);
                                                $slideItem.attr("data-videotype", "youtube");
                                            }
                                            $slideItem.attr("data-vflag", 1);
                                        } catch (error) {
//                                            console.log(error.stack);
                                        }
                                    }, function (errors) {
//                                        console.log("error");
                                    })
                                });
                            }
                            this.currentHasVideo = false;
                            if (self.slideshow) {
                                clearTimeout(self.slideshow);
                                self.slideshow = null;
                            }
                            if (self.prevSlide == -1 && self.currentSlide == 0) {
                                self._show();
                            }
                            self.slideshow = setTimeout(function () {
                                if (window.paused) {
                                    return;
                                }
                                self._direction('next');
                                if (self.options.autoplay) {
                                    self._startShow();
                                }
                            }, self.options.interval);
                        }
                    } catch (error) {
                        self.handleExceptions(error);
                    }
                },
                _stopShow: function () {
                    var self = this;
                    try {
                        if (this.options.autoplay && this.slideshow) {
                            clearTimeout(this.slideshow);
                            this.slideshow = null;
                        }
                        // hack: need to talk to Sathish and figure out how why multiple untracked copies of this slider object are around that keep firing setTimeouts
                        window.paused = true;
                    } catch (error) {
                        self.handleExceptions(error);
                    }
                },
                _isPaused: function () {
                    var self = this;
                    try {
                        if (this.options.autoplay) {
                            return !this.slideshow;
                        }
                        return true;
                    } catch (error) {
                        self.handleExceptions(error);
                    }
                },
                _pauseVideo: function () {
                    var self = this;
                    try {
//                        console.log(this.youtubePlayer);
                        this.youtubePlayer.pauseVideo();
                    } catch (error) {
                        // do nothing for now --
                        self.handleExceptions(error);
                        document.getElementById('html-video-player').pause();
                    }
                },
                _resumeVideo: function () {
                    var self = this;
                    try {
//                        console.log(this.youtubePlayer);
                        this.youtubePlayer.playVideo();
                    } catch (error) {
                        // do nothing for now --
                        self.handleExceptions(error);
                        document.getElementById('html-video-player').play();
                    }
                },
                _volumeChangeValue: 5,
                _volumeMinus: function () {
                    var self = this;
                    var currentVolume = this.youtubePlayer.getVolume();
//                    console.log(currentVolume);
                    if (currentVolume > 0) {
                        try{
                            var newVolume = currentVolume - self._volumeChangeValue;
                            if(newVolume< 0){
                                newVolume = 0;
                            }
                            this.currentVolume = newVolume;
                            this.youtubePlayer.setVolume(newVolume);
                        } catch(error){
                            console.log(error);
                            self.handleExceptions(error);
                            document.getElementById('html-video-player').volume = this.currentVolume/100;
                        }
                    }
                },
                _volumePlus: function () {
                    var self = this;
                    var currentVolume = this.youtubePlayer.getVolume();
                    console.log(currentVolume);
                    if (currentVolume < 100) {
                        try{
                            self.youtubePlayer.unMute();
                            var newVolume = currentVolume + self._volumeChangeValue;
                            if(newVolume > 100){
                                newVolume = 100;
                            }
                            self.currentVolume = newVolume;
                            self.youtubePlayer.setVolume(newVolume);
                        } catch(error){
                            console.log(error);
                            self.handleExceptions(error);
                            document.getElementById('html-video-player').volume = self.currentVolume/100;
                        }
                    }
                },
                _volumeMute: function () {
                    var self = this;
                    try{
                        self.currentVolume = self.youtubePlayer.getVolume();
                        self.youtubePlayer.setVolume(0);
                    } catch(error){
                        document.getElementById('html-video-player').volume = 0;
                    }
                },
                _volumeUnmute: function () {
                    var self = this;
                    try{
                        self.youtubePlayer.unMute();
                        self.youtubePlayer.setVolume(self.currentVolume);
                    } catch(error){
                        document.getElementById('html-video-player').volume = self.currentVolume/100;
                    }
                },
                _volumeSet: function (toVolume) {
                    var self = this;
                    toVolume = parseInt(toVolume);
                    if (toVolume > 100) {
                        toVolume = 100;
                    } else if (toVolume < 0) {
                        toVolume = 0;
                    }
                    this.currentVolume = toVolume;
                    try {
                        this.youtubePlayer.unMute();
                        this.youtubePlayer.setVolume(toVolume);
                    } catch (error) {
                        // do nothing for now --
                        self.handleExceptions(error);
                    }
                },
                _restartSlideShow: function () {
                    var self = this;
                    try {
                        var self = this;
                        if (self.slideshow) {
                            clearTimeout(self.slideshow);
                        }
                        self.slideshow = setTimeout(function () {
                            self._direction('next');
                            if (self.options.autoplay) {
                                self._startShow();
                            }
                        }, self.options.interval);
                    } catch (error) {
                        self.handleExceptions(error);
                    }
                },
                _stopVideoPlaying: function () {
                    var self = this;
                    if (this.videoPlaying === true) {
                        try {
                            $("#ytplayer").hide();
                            $("#html-video-player-container").hide();
                            $("#html-video-player").hide();
                            if (self.youtubePlayer) {
                                self.youtubePlayer.stopVideo();
                                self.youtubePlayer.loadVideoById("5Cm1PoK_5n4");
                            }
                        } catch (error) {
                            self.handleExceptions(error);
                        }
                        this.videoPlaying = false;
                    }
                },
                _showNextSlide: function () {
                    this._stopVideoPlaying();
                    this._direction('next');
                    this._startShow();
                },
                _showPrevSlide: function () {
                    this._stopVideoPlaying();
                    this._direction('prev');
                    this._startShow();
                },
                _seekVideoTo: function (time) {
                    if (this.youtubePlayer) {
                        try {
                            this.youtubePlayer.seekTo(time, true);
                        } catch (error) {
                            // do nothing for now --
                        }
                    }
                },
                _sortElements: function () {
                    var self = this;
                    try {
                        var $wrapper = self.$element;
                        if($wrapper[0].classList.value == "public-display-items tickered"){
                            $wrapper.find(".slider-content").sort(function (a, b) {
                                return +a.dataset.index - +b.dataset.index;
     //                           return +b.dataset.timestamp - +a.dataset.timestamp;
                            }).appendTo($wrapper+' .ticker_contents .t_marquee');
                        } else {
                            $wrapper.find(".slider-content").sort(function (a, b) {
                                return +a.dataset.index - +b.dataset.index;
     //                           return +b.dataset.timestamp - +a.dataset.timestamp;
                            }).appendTo($wrapper);                            
                        }
//                         $wrapper.find(".slider-content").sort(function (a, b) {
//                             return +a.dataset.index - +b.dataset.index;
//  //                           return +b.dataset.timestamp - +a.dataset.timestamp;
//                         }).appendTo($wrapper);

                        //removing the oldest post to adopt only this.maxNoOfPosts in the DOM
                        var items = jQuery('.public-display-items .item');
                      //  items.removeClass(this.options.animateOut).removeClass("animated").removeClass("parllay-animate-in").removeClass(this.options.animateIn).addClass("parllay-animate-out").addClass(this.options.animateOut);
                        var count = items.length;
                        if (count > self.maxNoOfPosts) {
                            jQuery(".slider-content.item:gt(" + (parseInt(self.maxNoOfPosts, 10) - 1) + ")").remove();
                        }
                        self.refresh();
                    } catch (error) {
                        self.handleExceptions(error);
                    }

                },
                handleExceptions: function (error) {
                    Helpers.handleExceptions(error);

                }
            };

    $.fn.parllaySlider = function (options) {

        var self = $.data(this, 'parllaySlider');

        if (typeof options === 'string') {
            if (!self) {
                console.log("cannot call methods on parllaySlider prior to initialization; " + "attempted to call method '" + options + "'");
                return;
            }

            if (!$.isFunction(self[options]) || options.charAt(0) === "_") {
                console.log("no such method '" + options + "' for parllaySlider");
                return;
            }
            self[options].apply(self, args);

        } else {
            if (self) {
                self._initialize(options);
            } else {
                try {
                    parllaySliderObject = self = $.data(this, 'parllaySlider', new $.ParllaySlider(options, this));
                } catch (error) {
                    self.handleExceptions(error);
                }
            }
        }
        return self;
    };
}(jQuery, window));
