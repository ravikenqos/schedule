function streamingHelper(serviceType, context) {
    if (serviceType === 'widget') {
        NodeAPI.streamingMethod = StreamingMethods.REST;
    }
    this.serviceCallType = serviceType;
    this.dataFrequency = 30;
    this.context = context;
    this.context.noPostsCount = 0;
}
streamingHelper.prototype = {
    ConnectResponseCalled: false,
    connectionEmitted: false,
    serviceCallType: null,
    _prefetchedData: null,
    _prefetchAction: false,
    _pageIndex: 0,
    context: null,
    clientId: null,
    reconneting: false,
    getDeviceId: function(){
        if (Helpers.getCookie('deviceid') !== null && Helpers.getCookie('deviceid') !== 'null') {
            return Helpers.getCookie('deviceid');
        }
        var d = new Date().getTime();
        if (window.performance && typeof window.performance.now === "function") {
            d += performance.now(); //use high-precision timer if available
        }
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        Helpers.setCookie('deviceid', uuid, (new Date().getTime() + 2592000), '/', 'parllay.com');
        return uuid;
    },
    activitiesRefreshCallback: function(data){
        
    },
    refreshActivities: function(businessId, ids, responseHandler){
        responseHandler = Helpers.ensureCallbackFunction(responseHandler);
        var tmpId = [];
        $.each(ids, function(i, postId){
            if(postId.indexOf('facebook') >= 0){
                tmpId.push(postId);
            }
        });
        if(tmpId.length == 0){
            Helpers.logDebug('Only Facebook activities are supported to be refreshed at this time.');
            return;
        }
        var message =  'activities.refresh';
        var objects = {
            businessId: businessId,
            ids: JSON.stringify(tmpId)
        }
        streamingHelper.activitiesRefreshCallback = responseHandler;
        streamingHelper.sendRequest(message, objects, streamingHelper.activitiesRefreshCallback);
    },
    raiseReloadRequest: function(){
        var self = this;
        Helpers.logDebug('mimic reload request');
        if (NodeAPI.streamingMethod === StreamingMethods.REST) {
            var params = {
                id: self.context.serviceCallId,
                count: self.context.numResultOnLoad,
                numInitialResults: self.context.numResultOnLoad,
                start: 0,
                from: 0,
                message: self.serviceCallType + '.reload'
            };
            self.sendRequest(self.serviceCallType + '.get', params);
        }
    },
    registerMimicReloadRequest: function() {
        var self = this;
        Helpers.logDebug('Registering MimicReloadRequest');
        var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
        var eventer = window[eventMethod];
        var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";

        // Listen to message from child window
        eventer(messageEvent, function(e) {
            if (typeof e.data.userAction != "undefined" && e.data.userAction === 'mimicReloadRequest') {
                if (NodeAPI.streamingMethod === StreamingMethods.REST) {
                    self.context.contributingStreams = JSON.parse(e.data.selectedStreams);
                    self.raiseReloadRequest();
                }
            }
        }, false);
    },
    processUpdateStreamSelection: function(streams, forcedReload){
        var self = this;
        var tmp = [];
        var updateStreamSelection = false;
        $.each(streams, function(i, v) {
            var streamId = v.stream.toString();
            if($.inArray(streamId, self.context.contributingStreams) < 0 && updateStreamSelection === false){
                updateStreamSelection = true;
            }
            tmp.push(streamId);
        });
        if(updateStreamSelection === false){
            if(tmp.length != self.context.contributingStreams.length){
                updateStreamSelection = true;
            } else {
                $.each(self.context.contributingStreams, function(i, streamId){
                    if($.inArray(streamId, tmp) < 0 && updateStreamSelection === false){
                        updateStreamSelection = true;
                    }
                });
            }
        }
        Helpers.logDebug(tmp);
        Helpers.logDebug(self.context.contributingStreams);
        if(updateStreamSelection === true){
            self.context.contributingStreams = tmp;
            if (parent) {
                parent.postMessage({userAction: 'update-contributing-streams', contributingStreams: self.context.contributingStreams}, '*');
            }
            if(!forcedReload){
                self.raiseReloadRequest();
            }
        }
    },
    handleRestResponse: function(response) {
        var self = this;
        Helpers.logDebug(response);
        if ("undefined" !== response.success && response.success === false) {
            Helpers.logDebug(response.err);
        } else {
            var serviceType = this.serviceCallType + 's';
            if (this.serviceCallType === 'billBoard.widget') {
                serviceType = 'billBoardWidgets';
            } else if (this.serviceCallType === 'fanReel.widget') {
                serviceType = 'fanReelWidgets';
            }
            var message = this.message;
            if ('undefined' !== typeof response[serviceType][0]['message']) {
                message = response[serviceType][0]['message'];
            }
            Helpers.logDebug(message);
            if ('undefined' !== typeof response.streams) {
                var forcedReload = false;
                if ('undefined' !== response[serviceType] && 'undefined' !== response[serviceType][0].message && response[serviceType][0].message === this.serviceCallType + '.reload') {
                    forcedReload = true;
                }
                self.processUpdateStreamSelection(response.streams, forcedReload);
            }
            if (response.count > 0) {
                this.handleResponse(message + ".response", response);
            } else {
                //double check the streaming method is REST and posts count < 10
                if (NodeAPI.streamingMethod === StreamingMethods.REST && self.context.noPostsCount < 10) {
                    self.context.noPostsCount++;
                    self.sendRequest(self.serviceCallType + ".get", response[serviceType][0]);
                } else {
                    self.handleResponse(message + ".response", response);
                }
            }
        }
    },
    setRecordsReceived: function(count, action){
        var self = this;
        if("undefined" !== typeof self.context.recordsReceived){
            if(action === 'replace'){
                self.context.recordsReceived = count;
            } else if(action === 'add'){
                self.context.recordsReceived += count;
            }
        }
    },
    updateStreamsStatus: function(streams){
        if(parent && 'undefined' !== typeof isAdmin && isAdmin === true){
            parent.postMessage({userAction: 'update-stream-status', data: streams},'*');
        }
    },
    handleResponse: function(message, response) {
        var self = this;
        Helpers.logDebug(message);
        if('undefined' !== typeof response.streams){
            self.updateStreamsStatus(response.streams);
        }
        switch (message) {
            case "connection.accept":
                Helpers.logDebug(response);
                var clientId = 1;
                if (NodeAPI.streamingMethod === StreamingMethods.WebSocket) {
                    clientId = response.id;
                }
                self.getStreamsList(clientId);
                break;
            case self.serviceCallType + ".connect.response":
                self.connectResponseHandler(response);
                break;
            case self.serviceCallType + ".reload":
            case self.serviceCallType + ".reload.response":
                self.reloadHandler(response);
                break;
            case self.serviceCallType + ".get.response":
                self.getResponseHandler(response);
                break;
            case self.serviceCallType + ".message.new":
            case self.serviceCallType + ".message.new.response":
                self.newMessageHandler(response);
                break;
            case self.serviceCallType + ".update.response":
//                            self.handleResponse(response);
                break;
            case self.serviceCallType + ".message.delete":
                self.context.handleDeleteDisplayHandler(response);
                break;
            default:
                Helpers.logDebug("unknown message type: " + message + '. need code to handle the new message.');
                break;
        }
    },
    getDeletedPosts: function(params, callback) {
        var self = this;
        callback = Helpers.ensureCallback(callback);
        if (NodeAPI.streamingMethod === StreamingMethods.REST) {
            if(parent){
                //send tracking info
                /*parent.postMessage({
                    'postText': 'Call to get deleted posts starting',
                    'currentTimeStamp': new Date().getTime()
                },'*');*/
            }
            $.ajax({
                url: "https://me.parllay.com/portal/getRemovedPosts?r=" + new Date().getTime(),
                dataType: "json",
                method: 'POST',
                data: params,
                success: function(response) {
                    //send tracking info
                    /* parent.postMessage({
                        'postText': 'Call to get deleted posts completed',
                        'currentTimeStamp': new Date().getTime()
                    },'*');*/
                    Helpers.logDebug("message sucess!!!"); // server response
                    Helpers.logDebug(response);
                    if (response.success && response.data.removed_posts.length > 0) {
                        if ('function' !== typeof self.context.handleDeleteDisplayHandler) {
                            return;
                        }
                        var deleteRecord = [];
                        deleteRecord.count = response.data.removed_posts.length;
                        deleteRecord.data = [];
                        $.each(response.data.removed_posts, function(i, v) {
                            deleteRecord.data.push({postId: v});
                        });
                        Helpers.logDebug(deleteRecord);
                        self.context.handleDeleteDisplayHandler(deleteRecord);
                    }
                    if (response.success && response.data.meta_data != false){
                        profileData = response.data.meta_data;
                        if ('function' !== typeof self.context.handleMetadataChange) {
                            return;
                        }
                        self.context.handleMetadataChange(response.data.meta_data);
                    }
                    Helpers.garbageCleaner(response);
                    Helpers.garbageCleaner(deleteRecord);
                    callback();
                },
                error: function() {
                    if(parent){
                        //send tracking info
                       /* parent.postMessage({
                            'postText': 'Call to get deleted posts failed',
                            'currentTimeStamp': new Date().getTime()
                        },'*');*/
                    }
                    callback();
                }
            });
        }
    },
    sendRequest: function(message, object, successCallback) {
        var self = this;
        if(self.serviceCallType === 'billBoard.widget' && parent && ('undefined' === typeof isAdmin || !isAdmin)){
            //in Chromecast
            var getQueryString = function ( field, url ) {
                var href = url ? url : document.location.href;
                var reg = new RegExp( '[?&]' + field + '=([^&#]*)', 'i' );
                var string = reg.exec(href);
                return string ? string[1] : null;
            };
            Helpers.logDebug("It is Chromecast");
            var uuid = getQueryString('uuid');
            var uname = getQueryString('uname');
            Helpers.setCookie('deviceid', uuid, (new Date().getTime() + 2592000), '/', 'parllay.com');
            object.profileUrl = document.location.href.replace('?uname=' + uname + '&uuid=' + uuid, '');
            object.deviceName = uname;
        }
        self.message = message;
        Helpers.logDebug("before sending request");
        Helpers.logDebug("To-do: stop making this call while in Socialhub and active tab is not social hub");
        if(parent){
            //send tracking info
            /*parent.postMessage({
                'postText': 'before sending service request',
                'currentTimeStamp': new Date().getTime()
            },'*');*/
        }
        object.dataFrequency = self.dataFrequency;
        if (NodeAPI.streamingMethod === StreamingMethods.WebSocket) {
            self.socket.send(JSON.stringify({
                "message": message,
                "data": object
            }));
            Helpers.logDebug(JSON.stringify({
                "message": message,
                "data": object
            }));
        } else if (NodeAPI.streamingMethod === StreamingMethods.SocketIO) {
            Helpers.logDebug("emitting " + message + " at " + new Date());
            Helpers.logDebug("Parameters for " + message + " : " + JSON.stringify(object));
            self.socket.emit(message, object);
        } else if (NodeAPI.streamingMethod === StreamingMethods.REST) {
            function generateUUID() {
                return streamingHelper.getDeviceId();
            }
            if ('undefined' === typeof object.message) {
                object.message = message;
            }
            if (self.serviceCallType + ".connect" === message) {
                message = self.serviceCallType + ".get";
                object.start = 0;
                self.setRecordsReceived(0, 'replace');
            }
            if ('undefined' === typeof object.count) {
                object.count = ('undefined' !== typeof object.numInitialResults ? object.numInitialResults : 25)
            }
            try{
                var dataParams = {
                        "deviceId": generateUUID(),
                        "method": message
                    };
                var url = "https://" + NodeAPI.HTTPEndPoint + "/rest/dev/v2";
                if(message === 'activities.refresh'){
                    dataParams.businessId = object.businessId;
                    dataParams.ids = object.ids;
                    url = "https://" + NodeAPI.HTTPListenerEndPoint + "/rest/dev/v2";
                } else {
                    dataParams.params = JSON.stringify(object);
                }
                $.ajax({
                    url: url,
    //                jsonp: "callback",
    //                jsonpCallback: "window.streamingHelper.handleRestResponse",
                    dataType: "jsonp",
                    contentType: "application/json; charset=utf-8",
                    data: dataParams,
                    success: function(response) {
                        Helpers.logDebug("message sucess!!!"); // server response
                        Helpers.logDebug(response);
                        if('undefined' !== typeof successCallback){
                            //refreshActivities
                            successCallback(response);
                        } else {
                            if(parent){
                                //send tracking info
                               /* parent.postMessage({
                                    'postText': 'after sending service request: success',
                                    'currentTimeStamp': new Date().getTime()
                                },'*');*/
                            }
                            if(response && 'undefined' != typeof response.count){
                                window.streamingHelper.handleRestResponse(response);
                            }
                        }
                    },
                    error: function(){
                        console.log('error callback');
                        if(parent){
                            //send tracking info
                           /* parent.postMessage({
                                'postText': 'after sending service request: error',
                                'currentTimeStamp': new Date().getTime()
                            },'*');*/
                        }
                    }
                });
            } catch(error){
                console.log(error);
            }
        }
        Helpers.logDebug(object);
        Helpers.logDebug("after sending request");
    },
    getConnection: function(count) {
        var self = this;
        if (NodeAPI.streamingMethod === StreamingMethods.WebSocket) {
            Helpers.logDebug("inside websocket code");
            if (document.location.protocol === 'https:') {
                self.socket = new WebSocket("wss://" + NodeAPI.SocketEndPoint);
            } else {
                self.socket = new WebSocket("ws://" + NodeAPI.SocketEndPoint);
            }
            self.reconneting = false;
            Helpers.logDebug(self.socket);

            self.socket.onerror = function(error) {
                Helpers.logDebug("Error at: " + Date.now());
                Helpers.logDebug(error);
                if ('undefined' === typeof count) {
                    count = 1;
                }
                if (self.serviceCallType === "billBoard.widget" && count === 5 && jQuery(".public-display-items .item").length === 0) {
                    if ($("#socialhub-story-template").length > 0 && 'undefined' === typeof self.storyTemplate) {
                        self.storyTemplate = $("#socialhub-story-template").html();
                        self.storyTemplate = Handlebars.compile(self.storyTemplate);
                    }
                    self.context.readFromServerCache();
                }
                if (self.reconneting == false) {
                    Helpers.logDebug('reconnecting mode');
                    self.reconneting = true;
                    self.connectionEmitted = false;
                } else {
                    Helpers.logDebug('Already in reconnecting mode');
                    return;
                }
                self.socket.close();
                setTimeout(function() {
                    self.getConnection(count + 1);
                }, 4000);
            }

            self.socket.onclose = function(event) {
                Helpers.logDebug("Close at: " + Date.now());
                Helpers.logDebug(event);
                if (self.reconneting == false) {
                    Helpers.logDebug('reconnecting mode');
                    self.reconneting = true;
                    self.connectionEmitted = false;
                } else {
                    Helpers.logDebug('Already in reconnecting mode');
                    return;
                }
                if ('undefined' === typeof count) {
                    count = 1;
                }
                setTimeout(function() {
                    self.getConnection(count + 1);
                }, 4000);
            }

            self.socket.onopen = function(event) {
                Helpers.logDebug("web socket connection opened at: " + Date.now());
                Helpers.logDebug(event);
                self.reconneting = false;
            }
            self.socket.onmessage = function(message) {
                try {
                    var payload = JSON.parse(message.data);
                    Helpers.logDebug("Streaming server message received at: " + Date.now());
                    Helpers.logDebug(payload);
                    var response = payload.data;
                    var message = payload.message;
                    var serviceType = self.serviceCallType + 's';
                    if (self.serviceCallType === 'billBoard.widget') {
                        serviceType = 'billBoardWidgets';
                    } else if (self.serviceCallType === 'fanReel.widget') {
                        serviceType = 'fanReelWidgets';
                    }
                    if ('undefined' !== typeof response[serviceType] && 'undefined' !== typeof response[serviceType][0]['message']) {
                        message = response[serviceType][0]['message'];
                    }
                    self.handleResponse(message, response);
                } catch (error) {
                    Helpers.logDebug("error:" + JSON.stringify(error));
                }
            }
        } else if (NodeAPI.streamingMethod === StreamingMethods.SocketIO) {
            if (typeof io !== "undefined") {
                Helpers.logDebug("socket is going to connect: " + new Date());
                self.socket = io(NodeAPI.SocketEndPoint, {
                    pingTimeout: 60 * 1000,
                    pingInterval: 25000,
                    maxHttpBufferSize: 1024 * 1024 * 25,
                    allowRequest: function(context, callback) {
                        utils.logDebug('Context: ' + JSON.stringify(context) + ', Allow Request ... at ' + new Date());
                        callback(null, true);
                    },
                    transports: ['websocket'],
                    allowUpgrades: true,
                    perMessageDeflate: true,
                    httpCompression: {
                        threshold: 512
                    }
                });

                self.socket.on("connect", function() {
                    Helpers.logDebug('Connect called at ' + new Date());
                });
                self.socket.on("open", function() {
                    Helpers.logDebug('Open called at ' + new Date());
                });
                self.socket.on("disconnect", function() {
                    Helpers.logDebug('Disconnect called at ' + new Date());
                });
                self.socket.on("close", function() {
                    Helpers.logDebug('Close called at ' + new Date());
                });
                self.socket.on("error", function(err) {
                    Helpers.logDebug('Error called. Errors: ' + JSON.stringify(err) + " at " + new Date());
                });
                self.socket.on("upgradeError", function(err) {
                    Helpers.logDebug('Upgrade Error called. Errors: ' + JSON.stringify(err) + " at " + new Date());
                });
                self.socket.on("upgrade", function(err) {
                    Helpers.logDebug('Upgrade succeeded. Info: ' + JSON.stringify(err) + " at " + new Date());
                });
                self.socket.on("connect_error", function(err) {
                    Helpers.logDebug('Connect_Error called. Errors: ' + JSON.stringify(err) + " at " + new Date());
                });
                self.socket.on("connect_timeout", function() {
                    Helpers.logDebug('Connect_Timeout called at ' + new Date());
                });
                self.socket.on("reconnect", function(count) {
                    Helpers.logDebug('Reconnect called at ' + new Date() + '. Count: ' + count);
                });
                self.socket.on("reconnect_attempt", function() {
                    Helpers.logDebug('Reconnect attempt called at ' + new Date());
                });
                self.socket.on("reconnecting", function(count) {
                    self.connectionEmitted = false;
                    Helpers.logDebug('Reconnecting ... called at ' + new Date() + '. Count: ' + count);
                    if (self.serviceCallType === "billBoard.widget" && count >= 5 && !jQuery(".status-button").hasClass('red')) {
                        jQuery(".status-button")
                                .removeClass('red')
                                .removeClass('green')
                                .removeClass('yellow')
                                .addClass('yellow');
                    }
                    if (self.serviceCallType === "billBoard.widget" && count === 5 && jQuery(".public-display-items .item").length === 0) {
                        if ($("#socialhub-story-template").length > 0 && 'undefined' === typeof self.storyTemplate) {
                            self.storyTemplate = $("#socialhub-story-template").html();
                            self.storyTemplate = Handlebars.compile(self.storyTemplate);
                        }
                        self.context.readFromServerCache();
                    }
                });
                self.socket.on("reconnect_error", function(err) {
                    Helpers.logDebug('Reconnect_Error called. Errors: ' + JSON.stringify(err));
                });
                self.socket.on("reconnect_failed", function() {
                    Helpers.logDebug('Reconnect_Failed called at ' + new Date());
                });
                self.socket.on("connection.accept", function(clientId) {
                    try {
                        self.getStreamsList(clientId);
                    } catch (err) {
                        Helpers.logDebug('Errors within connection.accept: ' + err);
                    }
                });
                self.socket.on(self.serviceCallType + ".connect.response", function(response) {
                    self.handleResponse(self.serviceCallType + ".connect.response", response);
                });
                self.socket.on(self.serviceCallType + ".get.response", function(response) {
                    self.handleResponse(self.serviceCallType + ".get.response", response);
                });
                self.socket.on(self.serviceCallType + ".message.new", function(response) {
                    self.handleResponse(self.serviceCallType + ".message.new", response);
                });
//                self.socket.on(self.serviceCallType + ".update.response", function(response) {
//                  self.handleResponse(self.serviceCallType + ".update.response", response);
//                });
                self.socket.on(self.serviceCallType + ".reload", function(response) {
                    self.handleResponse(self.serviceCallType + ".reload", response);
                });

                self.socket.on(self.serviceCallType + ".message.delete", function(postId) {
                    try {
                        self.handleResponse(self.serviceCallType + ".message.delete", postId);
                    } catch (error) {
                        Helpers.logDebug("Error in billBoard response: " + JSON.stringify(error));
                    }
                });
            } else {
                Helpers.logDebug("Yet to Connect io");
            }
        } else if (NodeAPI.streamingMethod == StreamingMethods.REST) {
            Helpers.logDebug("REST API will be here");
            self.getStreamsList(1);
            var timeout = (typeof self.dataFrequency !== "undefined" ? self.dataFrequency : 120) * 1000;
            setInterval(function() {
                //auto refresh
                var autoRefreshParams = {
                    id: self.context.serviceCallId,
//                    numInitialResults: self.context.numRecordsForConnect,
                    count: ('undefined' !== typeof self.context.numResultForNew ? self.context.numResultForNew : self.context.numRecordsForConnect),
                    start: 0,
                    from: 0,
                    message: self.serviceCallType + ".message.new"
                };
                self.sendRequest(self.serviceCallType + ".get", autoRefreshParams);
            }, timeout);
            setInterval(function() {
                if('undefined' == typeof window.ajaxCallWaiting){
                    window.ajaxCallWaiting = false;
                }
                if(window.ajaxCallWaiting == true){
                    return;
                }
                window.ajaxCallWaiting = true;
                //getDeletedPosts
                var getDeletedPostsParams = {
                    profile_id: self.context.serviceCallId,
                    profile_type: self.serviceCallType,
                    business_id: "undefined" !== typeof profileData && profileData !== null && "undefined" !== typeof profileData.business_id ? profileData.business_id : businessId,
                    count: ('undefined' !== typeof self.context.numResultForNew ? self.context.numResultForNew : self.context.numRecordsForConnect),
                    start: 0,
                    last_updated_date: "undefined" !== typeof profileData && profileData !== null && "undefined" !== typeof profileData.last_updated_date ? profileData.last_updated_date : ''
                };
                self.getDeletedPosts(getDeletedPostsParams, function(){
                    window.ajaxCallWaiting = false;
                });
            }, (('undefined' !== typeof isAdmin && isAdmin === true)? timeout * 2 : timeout));
        }
    },
    getStreamsList: function(clientId) {
        var self = this;
        try {
            if (self.connectionEmitted === false || 'undefined' === typeof self.connectionEmitted) {
                self.clientId = clientId;
                Helpers.logDebug('client id:' + JSON.stringify(self.clientId));
                self.connectionEmitted = true;
                self.sendRequest(self.serviceCallType + ".connect", {id: self.context.serviceCallId, numInitialResults: self.context.numRecordsForConnect});
                self.registerMimicReloadRequest();
            }
        } catch (err) {
            Helpers.logDebug('Errors within connection.accept: ' + err);
        }
    },
    connectResponseHandler: function(response) {
        var self = this;
        Helpers.logDebug("Response received for " + self.serviceCallType + ".connect.response at " + new Date());
        try {
            self.setRecordsReceived(response.count, 'replace');
            Helpers.logDebug(self.ConnectResponseCalled);
            if (self.ConnectResponseCalled == false) {
                self.ConnectResponseCalled = true;
                Helpers.registerHandlebarsHelpers();
                if ($("#socialhub-story-template").length > 0) {
                    self.storyTemplate = $("#socialhub-story-template").html();
                    self.storyTemplate = Handlebars.compile(self.storyTemplate);
                }
                Helpers.logDebug(response);
                self.context.contributingStreams = contributingStreams;
                if (window.administrationFeatures) {
                    window.administrationFeatures.setupContentAreaCardsEdit();
                    window.administrationFeatures.listenContentAreaCardsEdit();
                } else if (window.parllayWidgetAdminFeatures) {
                    window.parllayWidgetAdminFeatures.setupContentAreaCardsEdit();
                    window.parllayWidgetAdminFeatures.listenContentAreaCardsEdit();
                }
                if (self.serviceCallType === "billBoard.widget") {
                    if (window != window.parent) {
                        parent.postMessage({userAction: 'billBoard.widget.connect.response.received'}, '*');
                    }
                    if (response.count > 0) {
                        if ($("#footer-body").length > 0) {
                            jQuery(".status-button").css('bottom', ($("#footer-body").height() + 16) + 'px');
                        }
                        jQuery(".status-button")
                                .removeClass('red')
                                .removeClass('green')
                                .removeClass('yellow')
                                .addClass('green');
                        if ('undefined' !== typeof self.context.updateServerCache) {
                            setTimeout(function() {
                                self.context.updateServerCache(response);
                            }, 2000);
                        }
                    }
                    if('undefined' !== typeof self.context && 'function' === typeof self.context.handleAutoScroll){
                        self.context.handleAutoScroll();
                    }
                }
                self.context.responseHandler(response, "refresh", function() {
                    //prefetch next page
                    self.getNextPage(true);
                });
                self._pageIndex++;
            }
        } catch (err) {
            Helpers.logDebug('Errors within ' + self.serviceCallType + '.connect.response: ' + err);
        }
    },
    newMessageHandler: function(response) {
        var self = this;
        Helpers.logDebug("Response received for " + self.serviceCallType + ".message.new at " + new Date());
        try {
            if (response.count > 0) {
                var tmpResponseData = [];
                for (var i = 0; i < response.data.length; i++) {
                    var postId = response.data[i].id;
                    if ($('.slider-content.item[data-id="' + postId + '"]').length > 0 || $('.message-post[post-id="' + postId + '"]').length > 0) {
                        //break;
                        continue;
                    }
                    tmpResponseData[i] = response.data[i];
                }
                response.data = tmpResponseData;
                response.count = tmpResponseData.length;
            }
            Helpers.logDebug(response);
            if (self.serviceCallType === "billBoard.widget") {
                self.context.responseHandler(response, "append");
                if ('undefined' !== typeof self.context.updateServerCache) {
                    setTimeout(function() {
                        self.context.updateServerCache(response);
                    }, 2000);
                }
            } else {
                self.context.responseHandler(response, "autorefresh");
            }
        } catch (err) {
            Helpers.logDebug('Errors within ' + self.serviceCallType + '.message.new: ' + err);
        }
    },
    getResponseHandler: function(response) {
        var self = this;
        Helpers.logDebug("Response received for  " + self.serviceCallType + ".get.response at " + new Date());
        try {
            self.setRecordsReceived(response.count, 'add');
            Helpers.logDebug(response);
            var serviceType = self.serviceCallType + 's';
            if (self.serviceCallType === 'billBoard.widget') {
                serviceType = 'billBoardWidgets';
            } else if (self.serviceCallType === 'fanReel.widget') {
                serviceType = 'fanReelWidgets';
            }
            if ('undefined' !== response[serviceType] && 'undefined' !== response[serviceType][0].message && response[serviceType][0].message === this.serviceCallType + '.reload') {
                Helpers.logDebug("mimic reload response received");
                self._prefetchedData = null;
                self._prefetchAction = false;
                self.pageIndex = 0;
                if (!self.context.widgetStreams) {
                    self.context.cleanupFeaturedArea();
                }
                self.context.cleanupContentArea();
                if (typeof response.contributing_streams !== 'undefined') {
                    self.context.contributingStreams = response.contributing_streams;
                    if (parent) {
                        parent.postMessage({userAction: 'update-contributing-streams', contributingStreams: self.context.contributingStreams}, '*');
                    }
                }
                if (self.context.widgetStreams) {
                    if (self.context.contributingStreams.length === 0) {
                        $(".pw-container").hide().siblings('.no-data').text('No Streams added for this Widget').show();
                    } else {
                        $(".pw-container").show().siblings('.no-data').hide();
                    }
                }
                if (response.count > 0) {
                    if (self.serviceCallType === 'fanReel.widget') {
                        $(".no-data").hide();
                        $(".wrapper").show();
                    }
                    self.context.responseHandler(response, "refresh", function() {
                        //prefetch next page
                        self.getNextPage(true);
                    });
                    if (self.serviceCallType === 'billBoard.widget' && 'undefined' !== typeof self.context.updateServerCache) {
                        setTimeout(function() {
                            self.context.updateServerCache(response);
                        }, 2000);
                    }
                } else if (self.context.contributingStreams.length == 0) {
                    if (self.serviceCallType === 'billBoard.widget') {
                        $(".bb_container").hide();
                        $(".parllay-pullout-menu").hide();
                        $(".bb_error_container").show();
                        $(".bb_error_container .no-data").text('No Streams added for this Billboard');
                    } else if (self.serviceCallType === 'fanReel.widget') {
                        $(".no-data").text('No Streams added for this fanreel').show();
                        $(".wrapper").hide();
                    } else if (self.serviceCallType === 'widget') {
                        $(".pw-container").hide().siblings('.no-data').text('No Streams added for this Widget').show();
                    }
                }
                self.pageIndex = 1;
            } else {
                Helpers.logDebug(response);
                self.context.streamContainer.siblings('.paging').find('.loader').hide();
                if (self._prefetchAction === true) {
                    Helpers.logDebug('Prefetch request. storing response in temp variable');
                    if (response.count > 0) {
                        self._prefetchedData = response;
                    } else {
                        self._prefetchedData = null;
                    }
                } else {
                    self.context.responseHandler(response, "append", function() {
                        //prefetch next page
                        self.getNextPage(true);
                    });
                    if (response.count === 0) {
                        //unbind scroll event
                        jQuery(window).unbind('scroll');
                    }
                }
                if (response.count > 0) {
                    self._pageIndex++;
                }
            }
        } catch (err) {
            Helpers.logDebug('Errors within ' + self.serviceCallType + '.get.response: ' + err);
        }
    },
    reloadHandler: function(response) {
        var self = this;
        Helpers.logDebug("Reload request received for  " + self.serviceCallType + ".reload at " + new Date());
        try {
            self.setRecordsReceived(response.count, 'replace');
            Helpers.logDebug(response);
            self._prefetchedData = null;
            self._prefetchAction = false;
            self.pageIndex = 0;
            if (!self.context.widgetStreams) {
                self.context.cleanupFeaturedArea();
            }
            self.context.cleanupContentArea();
            if (typeof response.contributing_streams !== 'undefined') {
                self.context.contributingStreams = response.contributing_streams;
                if (parent) {
                    parent.postMessage({userAction: 'update-contributing-streams', contributingStreams: self.context.contributingStreams}, '*');
                }
            }
            if (self.context.widgetStreams) {
                if (self.context.contributingStreams.length === 0) {
                    $(".pw-container").hide().siblings('.no-data').text('No Streams added for this Widget').show();
                } else {
                    $(".pw-container").show().siblings('.no-data').hide();
                }
            }

            if (response.count > 0) {
                if (self.serviceCallType === 'fanReel.widget') {
                    $(".no-data").hide();
                    $(".wrapper").show();
                }
                self.context.responseHandler(response, "refresh", function() {
                    //prefetch next page
                    self.getNextPage(true);
                });
                if (self.serviceCallType === 'billBoard.widget' && 'undefined' !== typeof self.context.updateServerCache) {
                    setTimeout(function() {
                        self.context.updateServerCache(response);
                    }, 2000);
                }
            } else if (self.context.contributingStreams.length == 0) {
                if (self.serviceCallType === 'billBoard.widget') {
                    $(".bb_container").hide();
                    $(".parllay-pullout-menu").hide();
                    $(".bb_error_container").show();
                    $(".bb_error_container .no-data").text('No Streams added for this Billboard');
                } else if (self.serviceCallType === 'fanReel.widget') {
                    $(".no-data").text('No Streams added for this fanreel').show();
                    $(".wrapper").hide();
                } else if (self.serviceCallType === 'widget') {
                    $(".pw-container").hide().siblings('.no-data').text('No Streams added for this Widget').show();
                }
            }
            self.pageIndex = 1;
        } catch (err) {
            Helpers.logDebug('Errors within ' + self.serviceCallType + '.reload: ' + err);
        }
    },
    getNextPage: function(prefetch) {
        var self = this;
        if (!self.connectionEmitted) {
            Helpers.logDebug('Waiting for connection');
            return;
        }
        if ("undefined" !== typeof prefetch && prefetch == true) {
            self._prefetchAction = true;
        } else {
            self._prefetchAction = false;
        }
        if (self._prefetchedData && "undefined" === typeof prefetch) {
            Helpers.logDebug('Displaying from prefetched data');
            self.context.responseHandler(self._prefetchedData, "append", function() {
                self._prefetchedData = null;
                self.getNextPage(true);
            });
        } else {
            Helpers.logDebug("calling next page");
            var start = (Math.max(0, (self._pageIndex - 1)) * self.context.numRecordsForAppend) + self.context.numRecordsForConnect;
            /*if('undefined' !== typeof self.context.recordsReceived && self.context.recordsReceived > 0){
                start = self.context.recordsReceived + 1;
            }*/
            self.sendRequest(self.serviceCallType + ".get", {id: self.context.serviceCallId, start: start, count: self.context.numRecordsForAppend});
        }
    }
};