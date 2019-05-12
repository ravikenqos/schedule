$.xhrPool = [];
var abortAll = function() {
    console.log('Aborting all AJAX calls');
    $(this).each(function(idx, jqXHR) {
        jqXHR.abort();
    });
    $.xhrPool = [];
    $.xhrPool.abortAll = abortAll;
}
$.xhrPool.abortAll = abortAll; 

$.ajaxSetup({
    beforeSend: function(jqXHR) {
        $.xhrPool.push(jqXHR);
    },
    complete: function(jqXHR) {
        var index = $.xhrPool.indexOf(jqXHR);
        if (index > -1) {
            $.xhrPool.splice(index, 1);
        }
    }
});
function SplitScreen() {
  //  this.initialize();
}

SplitScreen.prototype = {
    isAdmin: null,
    containerHeight: null,
    containerWidth: null,
    activeViewportHeight: null,
    activeViewportWidth: null,
    viewportChangeAllowed: null,
    viewportFreeWall: null,
    savePredefinedLayout: false,
    layoutNumber: null,
    billboardRestartTime: 5000,
    checkIsAdmin: function() {
        if (this.isAdmin != null) {
            return this.isAdmin;
        }
        this.isAdmin = false;
        var isEmbed = window != window.parent;
        if (isEmbed) {
            var referrer = "";
            if (document.referrer !== "") {
                referrer = '//' + (document.referrer.match(/:\/\/(.[^/]+)/)[1]);
            }
            if (referrer === businessServer && document.referrer.indexOf('cast-') < 0) {
                this.isAdmin = true;
            }
        }
        return this.isAdmin;
    },
    setStatusButtonClass: function(className){
        jQuery(".status-button")
                    .removeClass('red')
                    .removeClass('green')
                    .removeClass('orange')
                    .addClass(className);
    },
    forceRefresh: function(){
        $(".creative-column").each(function(i, v){
            var viewportId = $(this).attr('data-id');
            document.getElementById('viewport_' + viewportId).contentWindow.postMessage({command: 'forceRefresh'}, '*');
        });
    },
    initHealthCheck: function() {
        var self = this;
        setInterval(function() {
            if('undefined' == typeof window.ajaxCallWaiting){
                window.ajaxCallWaiting = false;
            }
            if(window.ajaxCallWaiting == true){
                return;
            }
            window.ajaxCallWaiting = true;
            $.ajax({
                url: 'https://me.parllay.com/images/categories.png?r=' + new Date().getTime(),
                crossDomain: true,
                jsonp: true,
                success: function() {
                    window.ajaxCallWaiting = false;
                    if (!jQuery(".status-button").hasClass('yellow')) {
                        var forceRefresh = jQuery(".status-button").hasClass('red');
                        self.setStatusButtonClass('green');
                        if (forceRefresh) {
                            self.forceRefresh();
                        }
                    }
                },
                error: function() {
                    window.ajaxCallWaiting = false;
                    Helpers.logDebug('no internet');
                    self.setStatusButtonClass('red');
                }
            });
        }, 60000);
    },
    sendCastTrackingInfo: function (jsonMessage) {
        var self = this;
        jsonMessage['chromecastId'] = deviceId;
        jsonMessage['chromecastName'] = 'Browser';
        jsonMessage['sessionId'] = deviceId;
        if ('undefined' === typeof jsonMessage.embedId) {
           jsonMessage.embedId = embedId;
        }
        jsonMessage.businessId = businessId;
        if ('undefined' === typeof jsonMessage.currentTimeStamp) {
           jsonMessage.currentTimeStamp = new Date().getTime();
        }
        var nodePrefix = '';
        if (window.location.hostname == 'me.parllay.com') {
             nodePrefix = 'brands.parllay.com';
        } else {
             nodePrefix = 'brands.parllayme.com';
        }

        if(window.location.hostname.indexOf('ppe') > 0){
             nodePrefix = 'brands-ppe.parllay.com';
        }

        jsonMessage.isVideo = ('undefined' !== typeof jsonMessage.isVideo?jsonMessage.isVideo.toString():'false');
        var url = 'https://' + nodePrefix + '/display/save-cast-snapshot';
        /*
         var url = document.location.protocol + '//' + NodeAPI.HTTPEndPoint + '/rest/des/v2?deviceId=' + window.location.hostname 
                + '&method=save.chromecast.snapshot&timestamp=' + jsonMessage.currentTimeStamp 
                + '&chromecastId=' + jsonMessage.chromecastId + '&screenOwnerBusinessId=' + jsonMessage.businessId 
                + '&dataOwnerBusinessId=' + jsonMessage.businessId;
        */
//        console.info('save snapshot URL is:' + url);
        var downTimeChecker = setTimeout(function(){
//             document.location.reload();
         }, window.SplitScreen.billboardRestartTime);
        jQuery.ajax({
           url: url,
           method: 'POST',
           type: 'POST',
           crossDomain: true,
           dataType: 'json',
           data: {data: JSON.stringify(jsonMessage)},
           success: function (data) {
               if(downTimeChecker != null){
                 clearTimeout(downTimeChecker);
               }
           },
           error: function () {

           }
        });
    },
    passMessage: function(){
        var self = this;
        $(window).on('message', function(event) {
            var message = event.originalEvent.data;
            if('billBoard.widget.connect.response.received' === message.userAction
                || message.command === 'slide_changing'
                || message.query === 'slide_status'){
                if(message.command === 'slide_changing'){
                    message['embedName'] = creativeName;
                }
                if(parent != window){
                    parent.postMessage(message, '*');
                } else {
                    if(message.command === 'slide_changing'){
                        self.sendCastTrackingInfo(message);
                    }
                }
            } else if(message.command === 'NewContentReceived') {
                $(document).trigger('NewContentReceived', JSON.stringify(message));
            } else if ('undefined' !== typeof message.command && message.command === 'tvViewPortSelection') {
                if($(".embed-public-display-preview .creative-column").length >= message.viewportNumber){
                    $(".embed-public-display-preview .creative-column").removeClass('selected').removeAttr('selected-viewport');
                    $(".embed-public-display-preview .creative-column:nth-child(" + message.viewportNumber + ")").addClass('selected').attr('selected-viewport', 'true');
                    setTimeout(function(){
                        $(".embed-public-display-preview .creative-column").removeClass('selected');
                    }, 2000);
                } else {
                    //toastr.error('Invalid viewport selection');
                }
            } else if ('undefined' !== typeof message.command && message.command === 'select-asset-image-response') {
                var selectedAssetImage = message.imageUrl;
                $('.appearence-color-picker-area .color-box.selected').removeClass('selected');
                $('.appearence-image-picker-area .img-box.selected').removeClass('selected');
                $('.appearence-image-picker-area .img-box.upload').addClass('selected');
                $('#message-post-bg-selection').val(selectedAssetImage);
                self.applyPreviewInline('card_bg_color', 'url("' + selectedAssetImage + '") no-repeat center center fixed');
                self.saveSettings('card_bg_color', selectedAssetImage);
            } else {
//                console.log(message);
                switch (message.command) {
                    case "prev_slide":
                    case "next_slide":
                    case "delete_slide":
                    case "seek_slide":
                    case "pause_video":
                    case "resume_video":
                    case "volume_mute":
                    case "volume_unmute":
                    case "volume_set":
                    case "volume_minus":
                    case "volume_plus":
                    case 'pause_slide':
                    case 'resume_slide':
                    case 'pause':
                    case 'resume':
                    case 'slide_status':
                        var iframeId = '';
                        if('undefined' !== typeof message.viewportId){
                            iframeId = 'viewport_' + message.viewportId;
                        } else {
                            var ifr = $(".embed-public-display-preview .creative-column[selected-viewport='true']");
                            if(ifr.length > 0){
                                ifr.addClass('selected');
                                iframeId = ifr.find('iframe').attr('id');
                                setTimeout(function(){
                                    ifr.removeClass('selected');
                                }, 2000);
                            } else {
                                iframeId = $(".creative-column:first").find('iframe').attr('id');
                            }
                        }
                        console.log(iframeId);
                        var iframeContentWindow = document.getElementById(iframeId).contentWindow;
                        iframeContentWindow.postMessage(message, '*');
                        break;
               }
            }
        });
    },
    listenViewPortSelection: function() {
        var self = this;
        $(window).on('message', function(event) {
            var data = event.originalEvent.data;
//            Helpers.logDebug(data);
            if ('undefined' !== typeof data.command && data.command === 'viewPortSelection') {
                $(".parllay-pullout-menu").removeClass('open');
                $(".nicescroll-rails").hide();
                if ($(".embed-public-display-preview .creative-column.active").attr('data-id') === data.viewPortId) {
                    return;
                }
                $(".embed-public-display-preview .creative-column.active").removeClass('active').removeClass('size_exceeded');
                $(".embed-public-display-preview .creative-column[data-id=" + data.viewPortId + "]").addClass('active');
                self.activeViewportHeight = $(".embed-public-display-preview .creative-column.active").height();
                self.activeViewportWidth = $(".embed-public-display-preview .creative-column.active").width();
//                self.makeResizable();
                parent.postMessage(data, '*');
                setTimeout(function(){
                    self.updateSettingsCogArea(data.viewPortId);
                },400);
            } else if ('undefined' !== typeof data.userAction && data.userAction === 'update-post-display-order') {
                Helpers.logDebug(data);
                document.getElementById('viewport_' + data.profileId).contentWindow.postMessage(data, '*');
            } else if ('undefined' !== typeof data.userAction && data.userAction === 'mimicReloadRequest') {
                document.getElementById('viewport_' + data.viewPortId).contentWindow.postMessage(data, '*');
            } else if ('undefined' !== typeof data.command && data.command === 'deleteViewPort') {
                parent.postMessage(data, '*');
            } else if ('undefined' !== typeof data.command && data.command === 'tickerViewPort') {
                parent.postMessage(data, '*');
            } else if ('undefined' !== typeof data.command && data.command === 'viewPortTickered') {
                document.getElementById("viewport_" + data.viewPortId).contentWindow.location.reload();
                //document.getElementById("viewport_" + data.viewPortId).contentWindow.postMessage(data, "*");
            } else if ('undefined' !== typeof data.command && data.command === 'viewPortDeleted') {
                $(".creative-column[data-id=" + data.viewPortId + "]").remove();
                var viewPortCount = $("#view-port-count").val();
                $("#view-port-count option[value=" + (viewPortCount - 1) + "]").attr('selected', true);
                $('#view-port-count').attr('original-value', (viewPortCount - 1)).trigger('liszt:updated');
                self.resetPredefinedLayout();
                self._changeViewportCount((viewPortCount - 1), viewPortCount, 1, function(){
                    self.updatePreview();
                });
            } else if ('undefined' !== typeof data.command && data.command === 'resetViewPort') {
                $(".creative-column[data-id=" + data.viewPortId + "]").height(data.originalSize.height - 1).width(data.originalSize.width - 1);
            } else if ('undefined' !== typeof data.command && data.command === 'viewportChangeCancelled') {
                if(self.viewportChangeAllowed == null){
                    $('#view-port-count option[value="' + data.originalValue + '"]').attr('selected', true);
                    $('#view-port-count').trigger('liszt:updated');
                }
            } else if ('undefined' !== typeof data.command && data.command === 'viewportChangeAllowed') {
                self.viewportChangeAllowed = true;
                $('#view-port-count option[value="' + data.count + '"]').attr('selected', true);
                $('#view-port-count').trigger('liszt:updated');
                if('undefined' !== typeof data.defaultLayoutId){
                    self.savePredefinedLayout = true;
                    self.layoutNumber = data.defaultLayoutId;
                }
                self._changeViewportCount(data.count, data.originalValue, 1, function(){
                    if('undefined' !== typeof data.defaultLayoutId){
                        self.adjustLayoutForPredefinedLayout(data.defaultLayoutId, null);
                    }
                });
            } else if ('undefined' !== typeof data.command && data.command === 'updateStatusButton') {
                if(!jQuery(".status-button").hasClass('red')){
                    self.setStatusButtonClass(data.class);
                }
            } else if ('undefined' !== typeof data.command && data.command === 'kill-all-ajax-calls') {
//                console.log(data);
                $.each($("iframe.public-display-preview"), function(i, v){
                    var id = $(v).attr('id');
                    document.getElementById(id).contentWindow.postMessage({'command': 'kill-all-ajax-calls'}, '*');
                });
                $.xhrPool.abortAll();
            } else if ('undefined' !== typeof data.command && (data.command === 'pause_all' || data.command === 'resume_all')) {
                var newCommand = data.command.replace("_all", "");
                $.each($("iframe.public-display-preview"), function(i, v){
                    var id = $(v).attr('id');
                    document.getElementById(id).contentWindow.postMessage({'command': newCommand}, '*');
                });
            }
        });
    },
    resetPredefinedLayout: function(){
        var self = this;
        $(".predefined-layout.active").removeClass('active');
        Helpers.logDebug('Inside resetPredefinedLayout');
        Helpers.logDebug($("input[type='radio'][name='viewport-layout-selection'][value='custom']").length);
        $("input[type='radio'][name='viewport-layout-selection'][value='custom']").trigger('click');
        self.saveSettingsToDb(null, 'predefined_layout', -1);
    },
    updateSettingsCogArea: function(viewPortId){
        var self = this;
        Helpers.logDebug('Start updateSettingsCogArea:' + new Date);
        Helpers.executeWithProgressIndicator($('.parllay-menu-button img'), function(progressCallback){
            var ajax = new ParllayAjax();
            ajax.setURL('/embed/splitScreenSettings');
            ajax.setMethod('POST');
            ajax.setParameters({viewPortId: viewPortId});
            ajax.loadJSON(function(settingsData){
                Helpers.logDebug('End updateSettingsCogArea:' + new Date);
                progressCallback();
                profileData = settingsData.profileData;
                embedId = profileData.id;
                $('.content-bg-color-picker-area .color-box').colpickSetColor(profileData.overlay_bg_color);
                $('.card-bg-color-picker-area .color-box').colpickSetColor(profileData.card_bg_color);
                $('.text-font-picker-area .color-spetrum').colpickSetColor(profileData.font_color);
                $('.text-font-picker-area .color-spetrum-2').colpickSetColor(profileData.font_color_2);
//                $(".parllay-settings-buttons").remove();
                $('.parllay-pullout-menu.public_display').remove();
//                Helpers.logDebug(settingsData.html);
                var settings = $(settingsData.html);
//                Helpers.logDebug(settings[settings.length-1]);
                $(settings[settings.length-1]).insertBefore('.embed-public-display-preview');
                self.registerCogButton(0);
            },function(error){
                Helpers.logDebug(error);
                progressCallback();
            });
        });
    },
    makeResizable: function() {
        var self = this;
        Helpers.logDebug(this.containerHeight);
        $(".creative-column.ui-resizable").resizable('destroy');
        $(".creative-column.active").resizable({
            containment: "parent",
            animate: true,
            handles: 'n, e, s, w, ne, se, sw, nw',
            ghost: true,
            maxWidth: ($(".embed-public-display-preview").width() - 2),
            start: function(event, ui) {
//                Helpers.logDebug(ui);
            },
            resize: function(event, ui) {
//                Helpers.logDebug(event);
//                Helpers.logDebug(ui);
//                Helpers.logDebug(self.containerHeight);
//                var lastCreativeColumn = $(".embed-public-display-preview .creative-column:last");
//                var lastCreativeColumnOffsetBottom = lastCreativeColumn.offset().top + lastCreativeColumn.height();
//                if(lastCreativeColumnOffsetBottom > self.containerHeight){
//                    var heightDiff = lastCreativeColumnOffsetBottom - self.containerHeight;
//                    var newHeight = Math.max((ui.size.height - heightDiff), ui.originalSize.height);
//                    $(ui.element[0]).height(newHeight);
//                    $(ui.element[0]).addClass('size_exceeded');
//                    Helpers.logDebug('Height exceeds');
//                    return false;
//                } else {
//                    $(ui.element[0]).removeClass('size_exceeded');
//                }
            },
            stop: function(event, ui) {
                $(ui.element[0]).removeClass('size_exceeded');
                Helpers.logDebug(ui);
                var height = Math.round(ui.size.height * 100 / self.containerHeight);
                var width = Math.round(ui.size.width * 100 / self.containerWidth);
                Helpers.logDebug('height: ' + height);
                Helpers.logDebug('width: ' + width);
                parent.postMessage({command: 'update-viewport-size', viewPortId: $(ui.element[0]).attr('data-id'), height: height, width: width, originalSize: ui.originalSize}, "*");
            }
        });
    },
    setLayout: function(){
        var self = this;

        if((isAdmin && $(".predefined-layout.active").length > 0 ) || (!isAdmin && predefinedLayout >= 0)){
            var gtr = parseInt($('#gutter_size').length > 0 ? $('#gutter_size').val(): gutter);
            Helpers.logDebug('Gutter:' + gtr);
            $(".embed-public-display-preview .creative-column").css('margin-right','0');
            var viewportCount = $(".embed-public-display-preview .creative-column").length;
            if(viewportCount > 1){
                $(".embed-public-display-preview").css('padding', gtr + 'px').css('width', 'calc(100vw - ' + (gtr) + 'px)').css('height', '100vh !important');
                if(isAdmin == true){
                    $(".embed-public-display-preview").css('padding-right', '0px').css('padding-bottom', '0px');
                }
            }
            var windowWidth = $(".embed-public-display-preview").width();
            var windowHeight = $(".embed-public-display-preview").height();
            Helpers.logDebug('windowWidth = ' + windowWidth);
            Helpers.logDebug('windowHeight = ' + windowHeight);
            $(".embed-public-display-preview").attr('data-wall-width', windowWidth).attr('data-wall-height', windowHeight);
            // console.log($(".embed-public-display-preview .creative-column"));
            $(".embed-public-display-preview .creative-column").each(function(i, v){
                // console.log(v);
                $(v).css('margin-top',0);
                var originalStyle = JSON.parse($(v).attr('original-style'));
                $.each(originalStyle, function(k, style){
                    if(style == ""){
                        return;
                    }
                    if(typeof k == 'number'){
                        var styleArr = style.split(':');
                        k = styleArr[0];
                        style = styleArr[1];
                    }
                    style = style.replace('%', '');
                    if(k == 'width'){
                        var dataWidth = Math.floor(windowWidth * parseFloat(style) / 100) - (gtr);
                        $(v).attr('data-width', dataWidth).css('width', dataWidth + 'px');
                    } else if(k == 'height'){
                        var dataHeight = Math.floor(windowHeight * parseFloat(style) / 100) - (gtr);
                        $(v).attr('data-height', dataHeight).css('height', dataHeight + 'px');
                    } else {
                        if(k == 'margin-bottom' || k == 'margin-right'){
                            $(v).css(k, gtr + 'px');
                        }
                    }
                });
            });
        }
        /*if(!isAdmin && predefinedLayout < 0){
            //for TV app
            var viewportHeight = Math.floor(($(window).height() - (2 * columns) - (2 * gutter) - (gutter - no_of_rows - 1)) / no_of_rows);
            $(".embed-public-display-preview .creative-column").css('height', viewportHeight + 'px');
        }*/
        if(self.viewportFreeWall === null){
            self.viewportFreeWall = $(".embed-public-display-preview").isotope({
                layoutMode: 'packery',
                itemSelector: '.creative-column',
                transitionDuration: '1s'
            });
        } else {
            $(".embed-public-display-preview").isotope('reloadItems').isotope({sortBy: 'original-order'});
            var lastViewPort = $(".embed-public-display-preview .creative-column:last");
            setTimeout(function(){
                var height = lastViewPort.offset().top + lastViewPort.height() + gtr + 2;
                $(".embed-public-display-preview").css('height', height + 'px');
            }, 1000);
        }
    },
    initialize: function() {
        var self = this;
        if (self.checkIsAdmin()) {
            self.listenViewPortSelection();
//            self.makeResizable();
//            self.containerHeight = $(".embed-public-display-preview").height();
//            self.containerWidth = $(".embed-public-display-preview").width();
//            self.activeViewportHeight = $(".embed-public-display-preview .creative-column.active").height();
//            self.activeViewportWidth = $(".embed-public-display-preview .creative-column.active").width();
            self.registerCogButton(1);
//            this.updatePreview();
        } else {
            if(viewPortCount == 1){
                gutter = 0;
            }
            var height = $(window).height() - (2 * gutter);
            $(".embed-public-display-preview").css('height', height + 'px');
        }
    //    self.passMessage();
        self.setLayout(predefinedLayout);
        $(window).resize(function(){
            Helpers.logDebug('resized');
            setTimeout(function(){
                self.setLayout();
            }, 500);
        });
    //    this.initHealthCheck();
    },
    saveSettings: function (context, value, callback) {
        var self = this;
        setTimeout(function () {
            var newColor = null;
            if (context === 'overlay_bg_color') {
                newColor = $('#content-bg-selection').val();
            } else if (context === 'card_bg_color') {
                newColor = $('#message-post-bg-selection').val();
            } else if (context === 'font_family') {
                newColor = $('#font_family_selection').val();
            } else if (context === 'font_family_2') {
                newColor = $('#font_family_selection_2').val();
            } else if (context === 'font_size_2') {
                newColor = $('#font_size_selection_2').val();
            } else if (context === 'font_size') {
                newColor = $('#font_size_selection').val();
            } else if (context === 'font_color_2') {
                newColor = $('#bar_font_colour_selection_2').val();
            } else if (context === 'font_color') {
                newColor = $('#bar_font_colour_selection').val();
            } else if (context === 'display_type') {
                newColor = $('#layout_option_selection').val();
            } else if (context === 'carousel_type') {
                newColor = $('#transition_animation_selection').val();
            } else if (context === 'is_single_card') {
                newColor = $('#transition_speed_selection').val();
            } else if (context === 'post_display_order') {
                newColor = $('#p_display_order').val();
            } else if (context === 'max_post_count') {
                newColor = $('#max_post_count').val();
            } else if (context === 'video_error_time') {
                newColor = $('#video-error-time').val();
            } else if (context === 'viewport_count') {
                value = parseInt(value);
                newColor = parseInt($('#view-port-count').val());
            } else if (context === 'gutter_size') {
                newColor = $('#gutter_size').val();
            } else if (context === 'creative_background') {
                newColor = $('#creative-bg-selection').val();
            } else if (context === 'no_of_rows') {
                newColor = parseInt($('#view-port-rows').val());
            } else if (context === 'no_of_columns') {
                newColor = parseInt($('#view-port-columns').val());
            } else if (context === 'outer_space') {
                newColor = $('#outer_space').val();
            } else if (context === 'viewport_border_color') {
                newColor = $('#viewport-border-color-selection').val();
            } else if (context === 'viewport_border_width') {
                newColor = $("input[type='radio'][name='viewport-border-selection']:checked").val();
            }
            console.log(value);
            console.log(newColor);
            if (value === newColor) {
                self.saveSettingsToDb($('<a />'), context, value, callback);
            }
        }, 1000);
    },
    saveSettingsToDb: function (progressElement, context, value, callback) {
        var self = this;
        callback = Helpers.ensureCallback(callback);
        var ajax = Helpers.makeAjax('/embed/updatePublicDisplaySettings', 'POST');
        var params = {
            context: context,
            value: value,
            profileId: profileData.id,
            businessId: profileData.business_id
        };
        if (context === 'viewport_count'
                || context === 'gutter_size'
                || context === 'creative_background'
                || context === 'no_of_columns'
                || context === 'no_of_rows'
                || context === 'predefined_layout'
                || context === 'outer_space'
                || context === 'viewport_border_width'
                || context === 'viewport_border_color'
                ) {
            params.profileId = creativeId;
            if (context === 'viewport_count'){
                params.columnCount = $('#view-port-columns').val();
                params.rowCount = $('#view-port-rows').val();
                if(self.savePredefinedLayout === true){
                    params.layoutNumber = self.layoutNumber;
                }
            }
        }
        ajax.setParameters(params);
        ajax.loadJSON(function (data) {
//            Helpers.logDebug(data);
            if(data != 'OK'){
                callback(data);
            } else {
                callback(true);
            }
        }, function (error) {
            Helpers.logDebug(error);
            if(error.toString().indexOf('Unexpected end of JSON input') < 0){
                parent.postMessage({
                         'userAction' : 'showMessage',
                         'method' : 'error',
                         'message' : "Error saving settings change. Please try again later!"
                }, "*");
                callback(false);
            }
        });
    },
    adjustLayoutForPredefinedLayout: function(layoutNumber, extraData){
        var self = this;
        self.savePredefinedLayout = false;
        self.layoutNumber = null;
        if(extraData == null){
            extraData = JSON.parse($(".predefined-layout.layout_" + layoutNumber).attr('extra-data'));
        }
        Helpers.logDebug(extraData);
        var gutter = parseInt($('#gutter_size').val());
        $.each(extraData, function(i, viewport){
            Helpers.logDebug(i);
            Helpers.logDebug(viewport);
            var creativeColumn = $('.embed-public-display-preview .creative-column:nth-child(' + (i + 1) + ')');
//            Helpers.logDebug(creativeColumn);
            creativeColumn.attr('style','');
            $.each(viewport, function(key, val){
                val = val.replace('{GUTTER}', gutter);
                creativeColumn.css(key, val);
            });
            creativeColumn.attr('original-style', JSON.stringify(viewport));
        });
        self.setLayout();
    },
    handleViewPortCountChange: function(count, originalValue, ids, callback){
        callback = Helpers.ensureCallback(callback);
        var self = this;
        $('#view-port-count').attr('original-value', count);
        if(parseInt(originalValue) > parseInt(count)){
            //remove from DOM and recalculate the alignments.
            $(".creative-column:gt(" + (count - 1) + ")").remove();
        } else {
            $.each(ids,function(i, viewPort){
                if($(".embed-public-display-preview .creative-column[data-id=" + viewPort.id + "]").length === 0){
                    var creativeColumn = $('<div class="creative-column" extra-data="' + i + '" data-id="' + viewPort.id + '" original-style=""></div>');
                    creativeColumn.append('<iframe id="viewport_' + viewPort.id + '" class="public-display-preview" src="' + userServer + '/' + namespace + '/display/' + viewPort.encoded + '?businessUser=true&amp;split_screen=true&amp;isAdmin=true#module=home"></iframe>');
                    $(".embed-public-display-preview").append(creativeColumn);
                }
            });
        }
        callback();
    },
    _changeViewportCount: function(count, originalValue, saveSettings, callback){
        callback = Helpers.ensureCallback(callback);
        var self = this;
        if($("input[type='radio'][name='viewport-layout-selection'][value='custom']:checked").length > 0){
            self.resetPredefinedLayout();
        }
        var columnCount = $('#view-port-columns').val();
        var rowCount = $('#view-port-rows').val();
        $('#view-port-rows option').remove();
        $('#view-port-columns option').remove();
        $('.viewport-preview-container').empty();
        for(var i=1; i<= count; i++){
            var option = '<option value="' + i + '">' + i + '</option>';
            $('#view-port-rows').append(option);
            $('#view-port-columns').append(option);
            $('.viewport-preview-container').append('<div class="viewport-preview" extra-data="' + (i-1) + '"></div>');
        }
        $('.viewport-preview-container').append('<div class="clear"></div>');
        if(columnCount > count){
            if(rowCount > count){
                rowCount = count;
            }
            columnCount = Math.ceil(count / rowCount);
        } else {
            rowCount = Math.ceil(count / columnCount);
        }
        $('#view-port-columns option[value=' + columnCount + ']').attr('selected', true);
        $('#view-port-rows option[value=' + rowCount + ']').attr('selected', true);
        $('#view-port-rows').trigger('liszt:updated');
        $('#view-port-columns').trigger('liszt:updated');
        if(saveSettings == 1){
            self.saveSettings('viewport_count', count, function(ids){
                self.viewportChangeAllowed = null;
                self.handleViewPortCountChange(count, originalValue, ids, callback);
            });
        } else {
            self.updatePreview();
        }
    },
    updatePreview: function(){
        if($(".predefined-layout.active").length > 0){
            this.setLayout();
            return;
        }
        var viewportCount = $('#view-port-count').val();
        var viewportColumns = $('#view-port-columns').val();
        var viewportRows = $('#view-port-rows').val();
        var gutter = parseInt($('#gutter_size').val());
        if(viewportCount > 1){
            $(".embed-public-display-preview").css('padding', gutter + 'px').css('width', 'calc(100% - ' + (gutter) + 'px)').css('height', 'calc(100% - ' + (gutter) + 'px) !important');
            if(isAdmin == true){
                $(".embed-public-display-preview").css('padding-right', '0px').css('padding-bottom', '0px');
            }
        }
        var viewPortsInLastRow = viewportColumns;
        var viewPortsTillSecondLastRow = viewportColumns * (viewportRows - 1);
        viewPortsInLastRow = viewportCount - viewPortsTillSecondLastRow;
        Helpers.logDebug('viewPortsTillSecondLastRow = ' + viewPortsTillSecondLastRow);
        Helpers.logDebug('viewPortsInLastRow = ' + viewPortsInLastRow);
        var width = '100%';
        var height = '100%';
        if(viewportCount > 1){
            if(viewportColumns > 1){
                width = "calc((100% - " + (2 * viewportColumns) + "px - " + (2 * gutter) + "px - " + (gutter * (viewportColumns - 1)) + "px) / " + viewportColumns + ")";
            } else {
                width = "calc(100% - " + (2 * viewportColumns) + "px)";
            }
            height = "calc((100%  - " + (2 * viewportRows) + "px - " + (2 * gutter) + "px - " + (gutter * (viewportRows - 1)) + "px) / " + viewportRows + ")";
        }
        Helpers.logDebug('width = ' + width);
        Helpers.logDebug('height = ' + height);
        $(".creative-column").attr('original-style','[""]').css('width', width).css('height', height).css('margin-right', gutter + "px");
        $(".viewport-preview-container .viewport-preview").css('width', width).css('margin-right', gutter + "px");
        $(".creative-column").removeClass('last-row');
        $(".viewport-preview-container .viewport-preview").removeClass('last-row');
        $(".creative-column:gt(" + (viewPortsTillSecondLastRow - 1) + ")").addClass('last-row');
        $(".viewport-preview-container .viewport-preview:gt(" + (viewPortsTillSecondLastRow - 1) + ")").addClass('last-row');
        if(viewPortsInLastRow == 1){
            width = "calc(100% - " + (2 * viewPortsInLastRow) + "px - " + (2 * gutter) + "px)";
        } else {
            width = "calc((100% - " + (2 * viewPortsInLastRow) + "px - " + (2 * gutter) + "px - " + (gutter * (viewPortsInLastRow - 1)) + "px) / " + viewPortsInLastRow + ")";
        }
        Helpers.logDebug('last-row width = ' + width);
        $(".creative-column.last-row").css('width', width);
        $(".viewport-preview-container .viewport-preview.last-row").css('width', width);
        $(".creative-column:nth-child(" + viewportColumns + "n)").css('margin-right', '0');
        $(".creative-column:nth-child(" + viewportCount + ")").css('margin-right', '0');
        $(".viewport-preview-container .viewport-preview:nth-child(" + viewportColumns + "n)").css('margin-right', '0');
        Helpers.logDebug(viewportCount);
        Helpers.logDebug(viewportColumns);
        Helpers.logDebug(viewportRows);
        if(Math.ceil(viewportCount / viewportColumns) != viewportRows){
            var rows = viewportRows;
            var viewportRemaining = viewportCount;
            Helpers.logDebug('Rows:' + rows);
            Helpers.logDebug('viewportRemaining:' + viewportRemaining);
            for(var i=1; i <= viewportRows; i++){
                viewportRemaining = parseInt(viewportRemaining);
                rows = parseInt(rows);
                Helpers.logDebug('Row ' + i);
                Helpers.logDebug('---------------');
                Helpers.logDebug('Remaining viewport count:' + viewportRemaining);
                Helpers.logDebug('Remaining row count:' + rows);
                Helpers.logDebug('viewportRemaining > rows: ' + (viewportRemaining > rows));
                if(viewportRemaining > rows){
                    Helpers.logDebug('If');
                    if((viewportRemaining - viewportColumns) > (rows - 1)){
                        viewportRemaining -= viewportColumns;
                    } else {
                        Helpers.logDebug('Adjust the viewportColumns');
                        var maxViewportColumns = viewportRemaining - (rows - 1);
                        Helpers.logDebug(maxViewportColumns);
                        var viewPortIndex = viewportCount - viewportRemaining;
                        Helpers.logDebug('viewPortIndex = ' + viewPortIndex);
                        width = "calc((100% - " + (2 * maxViewportColumns) + "px - " + (2 * gutter) + "px - " + (gutter * (maxViewportColumns - 1)) + "px) / " + maxViewportColumns + ")";
                        Helpers.logDebug('width = ' + width);
                        for(var j=viewPortIndex; j< (viewPortIndex + maxViewportColumns); j ++){
                            $(".creative-column[extra-data=" + j + "]").css('width', width);
                            $(".viewport-preview-container .viewport-preview[extra-data=" + j + "]").css('width', width);
                        }
                        viewportRemaining -= maxViewportColumns;
                    }
                } else {
                    Helpers.logDebug('else');
                    Helpers.logDebug('Row' + i + ':1');
                    var viewPortIndex = viewportCount - viewportRemaining;
                    Helpers.logDebug('viewPortIndex = ' + viewPortIndex);
                    viewportRemaining -= 1;
//                    $(".creative-column[extra-data=" + (viewPortIndex -1 ) + "]").css('width',"calc(100% - " + (2 * viewportColumns) + "px)");
                    $(".creative-column[extra-data=" + viewPortIndex + "]").css('width',"calc(100% - " + (2 * viewportColumns) + "px - " + (2 * gutter) + "px)");
//                    $(".viewport-preview-container .viewport-preview[extra-data=" + (viewPortIndex -1 ) + "]").css('width',"calc(100% - " + (2 * viewportColumns) + "px)");
                    $(".viewport-preview-container .viewport-preview[extra-data=" + viewPortIndex + "]").css('width',"calc(100% - " + (2 * viewportColumns) + "px - " + (2 * gutter) + "px)");
                }
                rows -= 1;
            }
        }
        adminSettingsCog.adjustScrollBar();
        this.setLayout();
    },
    refreshLocation: function(context){
        var self = this;
        var iframeId = 'viewport_' + profileData.id;
        var src = $('#' + iframeId).attr('src');
        if(context == 'layout_change'){
            var newLayout = $('#layout_option_selection').val();
            if(newLayout == 'grid'){
                src = src.replace('display/','fullscreen/');
            } else {
                 src = src.replace('fullscreen/','display/');
            }
            if($('#' + iframeId).attr('src') !== src){
                $('#' + iframeId).attr('src', src);
            }
        } else {
            src = src.replace('#module=home', '') + '&r=' + new Date().getMilliseconds() + '#module=home';
            $('#' + iframeId).attr('src', src);
        }
    },
    applyPreviewInline: function(context, value) {
        Helpers.logDebug('context:' + context);
        Helpers.logDebug('value:' + value);
        var iframeId = 'viewport_' + profileData.id;
        var data = {
            command: 'applyPreviewInline',
            context: context,
            value: value
        }
        document.getElementById(iframeId).contentWindow.postMessage(data, '*');
        setTimeout(function() {
            adminSettingsCog.adjustScrollBar();
        }, 500);
    },
    registerCogButton: function(initial){
        var self = this;
        if(initial == 1){
            $($("#parllay-pullout-menu").html()).prependTo($("body"));
            $("#parllay-pullout-menu").remove();
            adminSettingsCog.initializeCog();
        }
        Helpers.logDebug('registerCogButton');
        //overlay
        adminSettingsCog.colorPicker('.content-bg-color-picker-area .color-box.picker', function (hsb, hex, rgb, el, bySetColor) {
            $('.public-display-items .item > table + div, .sample-post .display-text').css('background', 'rgba(' + rgb['r'] + ',' + rgb['g'] + ',' + rgb['b'] + ',0.6)');
            $('.stream-explorer-view').css('background', '#' + hex);
            self.applyPreviewInline('overlay_bg_color', {hex: '#' + hex, rgb: rgb});
        }, function (hsb, hex, rgb, el) {
            $('#content-bg-selection').val('#' + hex);
            self.saveSettings('overlay_bg_color', '#' + hex);
        }, profileData.overlay_bg_color.replace('#', ''));
        // color palette
        adminSettingsCog.chooseColor('.content-bg-color-picker-area .color-box', function (colorCode) {
            $('#content-bg-selection').val(colorCode);
            $('.content-bg-color-picker-area .img-box.selected').removeClass('selected');
            $('.content-bg-color-picker-area .color-box').colpickSetColor(colorCode);
            self.saveSettings('overlay_bg_color', colorCode);
        });

        //card bg
        // color picker
        adminSettingsCog.colorPicker('.card-bg-color-picker-area .color-box.picker', function (hsb, hex, rgb, el, bySetColor) {
            $(".public-display-items .item, .stream-explorer-view .message-post, .text-content-preview-area .sample-post").css('background', '#' + hex);
            self.applyPreviewInline('card_bg_color', '#' + hex);
        }, function (hsb, hex, rgb, el) {
            $('#message-post-bg-selection').val('#' + hex);
            self.saveSettings('card_bg_color', '#' + hex);
            $("#message_post_css").remove();
            var h = document.getElementsByTagName('head').item(0);
            var s = document.createElement("style");
            s.type = "text/css";
            s.id = 'message_post_css';
            s.appendChild(document.createTextNode(".stream-explorer-view div.message-post{background-color: #" + hex + ";}"));
            $(h).prepend(s);
        }, profileData.card_bg_color.replace('#', ''));
        // color palette
        adminSettingsCog.chooseColor('.card-bg-color-picker-area .color-box', function (colorCode) {
            $('#message-post-bg-selection').val(colorCode);
            $('.card-bg-color-picker-area .color-box').colpickSetColor(colorCode);
            self.saveSettings('card_bg_color', colorCode);
            $("#message_post_css").remove();
            var h = document.getElementsByTagName('head').item(0);
            var s = document.createElement("style");
            s.type = "text/css";
            s.id = 'message_post_css';
            s.appendChild(document.createTextNode(".stream-explorer-view div.message-post{background-color: " + colorCode + ";}"));
            $(h).prepend(s);
        });

        //text
        adminSettingsCog.fontFamily('#page-font-family', function (e, params) {
            var fontFamily = "'Actor', sans-serif";
            if (params.selected !== 'default') {
                fontFamily = params.selected.split('::')[1].split(':')[1].replace(';', '');
            }
            $('.public-display-items .item > div').css('font-family', fontFamily);
            $('body, .parllay-pullout-menu .parllay-settings-pullout-menu .user-style, .parllay-pullout-menu .parllay-settings-pullout-menu .user-style *, .sample-post .display-text, .sample-post .display-text *').css('font-family', fontFamily);
            $('#font_family_selection').val(params.selected);
            self.applyPreviewInline('font_family', params.selected);
            self.saveSettings('font_family', params.selected);
            if (window.qaClient && window.qaClient._streamsObj) {
                window.qaClient._streamsObj._setFreeWallSize();
            }
        });
	
        //text
        adminSettingsCog.fontFamily('#page-font-family-2', function (e, params) {
            var fontFamily = "'Actor', sans-serif";
            if (params.selected !== 'default') {
                fontFamily = params.selected.split('::')[1].split(':')[1].replace(';', '');
            }
            $('.public-display-items .item .user-and-network-container .user-and-network').css('font-family', fontFamily);
            $('#font_family_selection_2').val(params.selected);
            self.applyPreviewInline('font_family_2', params.selected);
            self.saveSettings('font_family_2', params.selected);
            if (window.qaClient && window.qaClient._streamsObj) {
                window.qaClient._streamsObj._setFreeWallSize();
            }
        });
	
        adminSettingsCog.fontSize('#page-font-size', function(e, params){
            $('body')
                    .removeClass('small')
                    .removeClass('medium')
                    .removeClass('large')
                    .addClass($('#page-font-size').val());
            if (window.qaClient && window.qaClient._streamsObj) {
                window.qaClient._streamsObj._setFreeWallSize();
                setTimeout(function() {
                    window.qaClient._streamsObj._setFreeWallSize();
                }, 500);
            }
            setTimeout(function() {
                adminSettingsCog.adjustScrollBar();
            }, 500);
            $('#font_size_selection').val($("#page-font-size").val());
            self.applyPreviewInline('font_size', $('#page-font-size').val());
            self.saveSettings('font_size', $("#page-font-size").val());
        });
	
        adminSettingsCog.fontSize('#page-font-size-2', function(e, params){
            $('body')
                    .removeClass('small')
                    .removeClass('medium')
                    .removeClass('large')
                    .addClass($('#page-font-size-2').val());
            if (window.qaClient && window.qaClient._streamsObj) {
                window.qaClient._streamsObj._setFreeWallSize();
                setTimeout(function() {
                    window.qaClient._streamsObj._setFreeWallSize();
                }, 500);
            }
            setTimeout(function() {
                adminSettingsCog.adjustScrollBar();
            }, 500);
            $('#font_size_selection_2').val($("#page-font-size-2").val());
            self.applyPreviewInline('font_size_2', $('#page-font-size-2').val());
            self.saveSettings('font_size_2', $("#page-font-size-2").val());
        });

        adminSettingsCog.colorPicker('.text-font-picker-area .color-spetrum', function (hsb, hex, rgb, el, bySetColor) {
            $('body *, .public-display-items .item > div, .public-display-items .item > div table, .public-display-items .item > div table a, .sample-post .display-text, .sample-post .display-text *, .popup-profile').css('color', '#' + hex);
            self.applyPreviewInline('font_color', '#' + hex);
        }, function (hsb, hex, rgb, el) {
            $('#bar_font_colour_selection').val('#' + hex);
            self.saveSettings('font_color', '#' + hex);
        }, profileData.font_color.replace('#', ''));

        adminSettingsCog.colorPicker('.text-font-picker-area .color-spetrum-2', function (hsb, hex, rgb, el, bySetColor) {
            $('.public-display-items .item .user-and-network-container .user-and-network').css('color', '#' + hex);
            self.applyPreviewInline('font_color_2', '#' + hex);
        }, function (hsb, hex, rgb, el) {
            $('#bar_font_colour_selection_2').val('#' + hex);
            self.saveSettings('font_color_2', '#' + hex);
        }, profileData.font_color_2.replace('#', ''));
        //carousel type
        adminSettingsCog.layoutChange(function (layout) {
            $('#layout_option_selection').val(layout);
            $(".layout-option .apply_button_holder button").unbind('click').click(function () {
                self.saveSettings('display_type', layout, function () {
                    self.refreshLocation('layout_change');
                });
            });
        });
        adminSettingsCog.getCode();
        adminSettingsCog.effectsAnimationChange('.effects-animation-area #public-display-carousel', function (e, params) {
            $("#transition_animation_selection").val(params.selected);
            self.saveSettings('carousel_type', params.selected, function () {
                self.refreshLocation('carousel_type');
            });
        });
        adminSettingsCog.effectsTransitionChange('#pd-single-card', function (e, params) {
            $("#transition_speed_selection").val(params.selected);
            self.saveSettings('is_single_card', params.selected, function () {
                self.refreshLocation('is_single_card');
            });
        });

        adminSettingsCog.postDisplayOrder('#p_display_order', '#max_post_count', function (value) {
//           Helpers.logDebug(value); 
            self.saveSettings('post_display_order', value, function () {
                //To-do: update preview.
                self.refreshLocation('post_display_order');
            });
        });

        adminSettingsCog.maxPostCount('#max_post_count', function (value) {
//           Helpers.logDebug(value);
            self.saveSettings('max_post_count', value, function () {
                //To-do: update preview.
                self.refreshLocation('max_post_count');
            });
        });
        
        adminSettingsCog.maxPostCount('#video-error-time', function (value) {
            self.saveSettings('video_error_time', value, function () {
                //To-do: update preview.
            });
        });

        adminSettingsCog.publicDisplayAdvancedSettings("#public-display-text-only-post",function (value) {
            self.saveSettingsToDb(null, 'hide_text_only_post', value, function () {
                self.refreshLocation('hide_text_only_post');
            });
        });

        adminSettingsCog.publicDisplayAdvancedSettings("#public-display-hide-all-text",function (value) {
            self.saveSettingsToDb(null, 'hide_all_text', value, function () {
                self.refreshLocation('hide_all_text');
            });
        });

        adminSettingsCog.publicDisplayAdvancedSettings("#public-display-hide-urls",function (value) {
            self.saveSettingsToDb(null, 'hide_urls', value, function () {
                self.refreshLocation('hide_urls');
            });
        });

        adminSettingsCog.publicDisplayAdvancedSettings("#public-display-hide-hashtags",function (value) {
            self.saveSettingsToDb(null, 'hide_hashtags', value, function () {
                self.refreshLocation('hide_hashtags');
            });
        });

        adminSettingsCog.publicDisplayAdvancedSettings("#public-display-strech-image-to-fill",function (value) {
            self.saveSettingsToDb(null, 'stretch_image', value, function () {
                self.refreshLocation('stretch_image');
            });
        });
        
        adminSettingsCog.publicDisplayAdvancedSettings("#public-display-vertical-viewport",function (value) {
            self.saveSettingsToDb(null, 'vertical_viewport', value, function () {
                self.applyPreviewInline('vertical_viewport', value);
            });
        });
        adminSettingsCog.publicDisplayAdvancedSettings("#public-display-video-muted",function (value) {
            self.saveSettingsToDb(null, 'video_muted', value, function () {
                self.refreshLocation('video_muted');
            });
        });
        adminSettingsCog.publicDisplayAdvancedSettings("#public-display-hide-timespamps",function (value) {
            self.saveSettingsToDb(null, 'hide_timestamps', value, function () {
//                self.refreshLocation('hide_timestamps');
                self.applyPreviewInline('hide_timestamps', value);
            });
        });
        adminSettingsCog.publicDisplayAdvancedSettings("#public-display-hide-author-info",function (value) {
            self.saveSettingsToDb(null, 'hide_author_info', value, function () {
//                self.refreshLocation('hide_author_info');
                self.applyPreviewInline('hide_author_info', value);
            });
        });
        
        adminSettingsCog.publicDisplayAdvancedSettings("#public-display-set-ticker",function (value) {
            if(value == 0){
                $(".public-display-advanced-settings.hide-timespamps").removeClass('disabled');
                $(".public-display-advanced-settings.video-muted").removeClass('disabled');
                $("#public-display-video-muted").attr('disabled', false);
                $("#public-display-hide-timespamps").attr('disabled', false);
                $(".ticker-position").hide();
                $("#billboard_ticker_background").hide();
            } else {
                $(".public-display-advanced-settings.hide-timespamps").addClass('disabled');
                $(".public-display-advanced-settings.video-muted").addClass('disabled');
                $("#public-display-video-muted").attr('disabled', true);
                $("#public-display-hide-timespamps").attr('disabled', true);
                $(".ticker-position").show();
                $("#billboard_ticker_background").show();
            }
            self.saveSettingsToDb(null, 'tickered_profile', value, function () {
                self.refreshLocation('tickered_profile');
            });
        });
        
        $(".ticker-position input[type=radio][name='ticker-position']").change(function() {
            var selected = $(".ticker-position input[type=radio][name='ticker-position']:checked");
            var value  = selected.val();
            self.saveSettingsToDb(null, 'ticker_position', value, function () {
                self.refreshLocation('ticker_position');
            });
        });
        $(".ticker-position input[type=radio][name='ticker-direction']").change(function() {
            var selected = $(".ticker-position input[type=radio][name='ticker-direction']:checked");
            var value  = selected.val();
            self.saveSettingsToDb(null, 'ticker_direction', value, function () {
                self.applyPreviewInline('ticker_direction', value);
            });
        });

        adminSettingsCog.viewPortCount('#view-port-count', function(count, originalValue){
            Helpers.logDebug(originalValue);
            Helpers.logDebug(count);
            Helpers.logDebug(parseInt(originalValue));
            Helpers.logDebug(parseInt(count));
            if($("input[type='radio'][name='viewport-layout-selection'][value='custom']:checked").length > 0){
                self.resetPredefinedLayout();
            }
            if(parseInt(originalValue) > parseInt(count)){
                parent.postMessage({command: 'viewportChange', count: parseInt(count), originalValue: parseInt(originalValue)}, "*");
            } else {
                self._changeViewportCount(count, originalValue, 1, function(){
                    // Helpers.logDebug('callback');
                    self.updatePreview();
                });
            }
        });
        adminSettingsCog.viewPortRows('#view-port-rows', function(count){
            var viewportCount = $('#view-port-count').val();
            var columns = Math.ceil(viewportCount / count);
            /*var rows = Math.ceil(viewportCount / columns);
            if(count != rows){
                $('#view-port-rows option[value=' + rows + ']').attr('selected', true);
                $('#view-port-rows').trigger('liszt:updated');
                count = rows;
            }*/
            if($("input[type='radio'][name='viewport-layout-selection'][value='custom']:checked").length > 0){
                self.resetPredefinedLayout();
            }
            $('#view-port-columns option[value=' + columns + ']').attr('selected', true);
            $('#view-port-columns').trigger('liszt:updated');
            self.updatePreview();
            self.saveSettings('no_of_rows', count);
            self.saveSettings('no_of_columns', columns);
        });
        adminSettingsCog.viewPortColumns('#view-port-columns', function(count){
            Helpers.logDebug('Selected columns:' + count);
            var viewportCount = $('#view-port-count').val();
            var rows = Math.ceil(viewportCount / count);
            $('#view-port-rows option[value=' + rows + ']').attr('selected', true);
            $('#view-port-rows').trigger('liszt:updated');
            if($("input[type='radio'][name='viewport-layout-selection'][value='custom']:checked").length > 0){
                self.resetPredefinedLayout();
            }
            self.updatePreview();
            self.saveSettings('no_of_rows', rows);
            self.saveSettings('no_of_columns', count);
        });

        adminSettingsCog.gutterSize('#gutter_size', function(count){
            Helpers.logDebug('Selected gutter size:' + count);
            self.saveSettings('gutter_size', count);
            self.updatePreview();
        });
//        adminSettingsCog.outerSpace('#outer_space', function(count){
//            Helpers.logDebug('Selected outer_space:' + count);
//            self.saveSettings('outer_space', count);
//            $(".embed-public-display-preview").css('padding', count + 'px').css('width', 'calc(100% - ' + (2 * count) + 'px)').css('height', 'calc(100% - ' + (2 * count) + 'px) !important');
//            self.updatePreview();
//        });

        adminSettingsCog.colorPicker('.profile_background_customization .color-box.picker', function (hsb, hex, rgb, el, bySetColor) {
            $('.embed-public-display-preview, .viewport-preview-container, .predefined-layouts').css('background', '#' + hex);
            var complimentaryColor = (255 - rgb['r']) + ',' + (255 - rgb['g']) + ',' + (255 - rgb['b']);
            $("#complimentary_color_css").remove();
            var h = document.getElementsByTagName('head').item(0);
            var s = document.createElement("style");
            s.type = "text/css";
            s.id = 'complimentary_color_css';
            s.appendChild(document.createTextNode(".creative-column.active, .predefined-layout.active{ -webkit-box-shadow: 0px 0px 8px 3px rgba(" + complimentaryColor + ",1);-moz-box-shadow: 0px 0px 8px 3px rgba(" + complimentaryColor + ",1);box-shadow: 0px 0px 8px 3px rgba(" + complimentaryColor + ",1);opacity: 1;}"));
            $(h).prepend(s);
        }, function (hsb, hex, rgb, el) {
            $('#creative-bg-selection').val('#' + hex);
            self.saveSettings('creative_background', '#' + hex);
        }, creativeBackground.replace('#', ''));

        // color palette
        adminSettingsCog.chooseColor('.profile_background_customization .color-box', function (colorCode) {
            $('#creative-bg-selection').val(colorCode);
            $('.profile_background_customization .img-box.selected').removeClass('selected');
            $('.profile_background_customization .color-box').colpickSetColor(colorCode);
            self.saveSettings('creative_background', colorCode);
        });

        adminSettingsCog.publicDisplayAdvancedSettings("#public-display-show-business-logo",function (value) {
            self.saveSettingsToDb(null, 'show_logo', value, function () {
                self.applyPreviewInline('show_logo', value);
               if(value == 1) {
                    $(".logo-position").removeClass("hidden");
                } else {
                    $(".logo-position").removeClass("hidden").addClass("hidden");
                }
            });
        });

        $(".logo-position input[type=radio]").change(function() {
            var selected = $(".logo-position input[type=radio]:checked");

           if(selected.length > 0) {
              var value  = selected.val();
              self.saveSettingsToDb(null, 'logo_position', value, function () {
                    self.applyPreviewInline('logo_position', value);
//                    parent.postMessage({'userAction': 'showMessage', 'method': 'success', 'message': 'Successfully updated your preference(s)'}, '*');
                });
            }
        });

        adminSettingsCog.advancedSettings(self);
        adminSettingsCog.predefinedOrCustomLayouts(function(value){
            if(value === 'predefined'){
//                self.savePredefinedLayout = true;
            } else {
                self.savePredefinedLayout = false;
            }
        });
        adminSettingsCog.predefinedLayouts('.predefined-layout', '.predefined-viewport-preview', function(layoutNumber, extraData){
              Helpers.logDebug(extraData);
              Helpers.logDebug(layoutNumber);
              var numberOfViewPorts = extraData.length;
              Helpers.logDebug(numberOfViewPorts);
              var existingViewportCount = $(".embed-public-display-preview .creative-column").length;
              Helpers.logDebug(existingViewportCount);
              if(parseInt(existingViewportCount) !== parseInt(numberOfViewPorts)){
                  if(parseInt(existingViewportCount) > parseInt(numberOfViewPorts)){
                    parent.postMessage({command: 'viewportChange', count: parseInt(numberOfViewPorts), defaultLayoutId: layoutNumber, originalValue: parseInt(existingViewportCount)}, "*");
                  } else {
                    $('#view-port-count option[value="' + numberOfViewPorts + '"]').attr('selected', true);
                    $('#view-port-count').trigger('liszt:updated');
                    self.savePredefinedLayout = true;
                    self.layoutNumber = layoutNumber;
                    self._changeViewportCount(numberOfViewPorts, existingViewportCount, 1, function(){
                            self.adjustLayoutForPredefinedLayout(layoutNumber, extraData);
                        });
                  }
              } else {
                  self.saveSettingsToDb(null, 'predefined_layout', layoutNumber, function(){
                      self.adjustLayoutForPredefinedLayout(layoutNumber, extraData);
                  });
              }
        });
        
        adminSettingsCog.viewportBorder(function(value){
            $(".creative-column").css('border-width', value + 'px');
            $(".creative-column").css('border-width', value + 'px');
            if(value > 0){
                $(".viewport_border_color").show();
            } else {
                $(".viewport_border_color").hide();
            }
            adminSettingsCog.adjustScrollBar();
            self.saveSettings('viewport_border_width', value, function(){
                
            });
        });
        
        //viewport border
        adminSettingsCog.colorPicker('.viewport_border_color .color-box.picker', function (hsb, hex, rgb, el, bySetColor) {
            $("#viewport_border_color_css").remove();
            var h = document.getElementsByTagName('head').item(0);
            var s = document.createElement("style");
            s.type = "text/css";
            s.id = 'viewport_border_color_css';
            s.appendChild(document.createTextNode(".creative-column { border: 1px solid #" + hex + ";}"));
            $(h).prepend(s);
        }, function (hsb, hex, rgb, el) {
            $('#viewport-border-color-selection').val('#' + hex);
            self.saveSettings('viewport_border_color', '#' + hex);
        }, viewportBorderColor.replace('#', ''));

        // color palette
        adminSettingsCog.chooseColor('.viewport_border_color .color-box', function (colorCode) {
            $('#viewport-border-color-selection').val(colorCode);
            $('.viewport_border_color .img-box.selected').removeClass('selected');
            $('.viewport_border_color .color-box').colpickSetColor(colorCode);
            self.saveSettings('viewport_border_color', colorCode);
        });
        
        adminSettingsCog.bgImagePicker('.appearence-image-picker-area .img-box', function(image){
            $('.appearence-color-picker-area .color-box.selected').removeClass('selected');
            $('#message-post-bg-selection').val(image);
            self.applyPreviewInline('card_bg_color', 'url("' + image + '") no-repeat center center fixed');
            self.saveSettings('card_bg_color', image, function(status) {
            });
        }, 'select-asset-image');
    }
};
$(document).ready(function() {
    window.SplitScreen = new SplitScreen();
});

