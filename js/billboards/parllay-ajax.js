function ParllayAjax(){
    this._xhr = this._createXhr();
}

ParllayAjax.prototype = {
    _url: "/home",
    _params: {},
    _method: 'GET',
    _mode: true,
    _xhr: null,
    _dataType: 'html',
    _accepts: {
        html: 'text/html',
        json: 'application/json, text/javascript',
        script: 'text/javascript, application/javascript',
        text: 'text/plain',
        xml: 'application/xml, text/xml',
        _default: '*.*'
    },
    _remote: false,
    _createXhr: function(){
        try {return new window.XMLHttpRequest();} catch(e) {}
        try {return new ActiveXObject("Msxml2.XMLHTTP.6.0");} catch (e) {}
        try {return new ActiveXObject("Msxml2.XMLHTTP.3.0");} catch (e) {}
        try {return new ActiveXObject("Msxml2.XMLHTTP");} catch (e) {}
        try {return new ActiveXObject("Microsoft.XMLHTTP");} catch (e) {}
        alert("XMLHttpRequest not supported");
        return null;
    },
    _sendRequest: function(success, failed){
        if(!this._xhr) this._xhr = this._createXhr();
        if(this._xhr){
            //this._xhr.setRequestHeader("Accept", this._dataType && this._accepts[this._dataType]?this._accepts[this._dataType]+", *.*; q=0.01":this._accepts._default)
            if(this._dataType=="script" && this._remote){
                var head = document.getElementsByTagName("head")[0] || document.documentElement;
                var script = document.createElement("script");
                script.src = this._url;
                head.insertBefore(script, head.firstChild);
                return undefined;
            }
            var self = this;
            var url, qs;
            if(this._method=="GET"){
                url = ( this._url && this._url.indexOf("?") >= 0 ) ? ( this._url + "&" + this._getQS(true) ) : ( this._url + "?" + this._getQS(true) );
                qs = null;
            }else{
                url = this._url;
                qs = this._getQS(true);
            }
            this._xhr.open(this._method, url, this._mode);
            this._xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            if(this._method=="POST"){
                this._xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            }
            this._xhr.send(qs);
            this._xhr.onreadystatechange = function(){
                if(self._xhr.readyState == 4){
                    if(self._xhr.status==200){
                        success({info: self._xhr.statusText, responseText: self._xhr.responseText, success: true});
                    }else{
                        failed({info: self._xhr.statusText, responseText: self._xhr.responseText, success: false});
                    }
                }
            };
        }
    },
    _getQS: function(random){
        var pa = new Array();
        for(var name in this._params){
            pa.push(name+"="+this._params[name]);
        }
        var tQS = pa.join("&");
        if(random){
            tQS = tQS?tQS + "&r="+Math.random():"r="+Math.random();
        }
        return tQS;
    },
    _rhash: /#.*$/,
    _rurl: /^(\w+:)?\/\/([^\/?#]+)/,
    setURL: function(url){
        var parts = this._rurl.exec(url);
        this._remote = parts && (parts[1] && parts[1].toLowerCase() !== location.protocol || parts[2].toLowerCase() !== location.host);
        this._url = url.replace(this._rhash, "");
    },
    setDataType: function(dataType){
        this._dataType = dataType;
    },
    setMethod: function(method){
        var m = method || 'GET';
        this._method = method;
    },
    setAsyncMode: function(mode){
        this._mode = mode;
    },
    setParameters: function(params){
        if(typeof params !== 'object')return;
        this._params = params;
    },
    addParameter: function(key, value){
        this._params[key] = value;
    },
    addParameters: function(params){
        if(typeof params !== 'object')return;
        for(var name in params){
            this._params[name] = params[name];
        }
    },
    loadPagelet: function(pagelet, success, failed){
        this._dataType = 'html';
        this._url = "/js_v2/pagelets/"+pagelet+".html";
        this._sendRequest(function(data){
            success(data.responseText);
        }, function(info){
            failed(info.info);
        });
        
    },
    loadJSON: function(success, failed){
        this._dataType = 'json';
        this._sendRequest(function(data){
            var responseText = data.responseText;
            responseText = responseText.replace("\n","");
            try{
                var result = JSON.parse(responseText);
                
                // non-Parllay AJAX call
                if (!result || typeof result != "object" || !('success' in result)) {
                    success(result);
                    return;
                }
                if(result.success){
                    success(result.data);
                }else{
                    failed(result.error || result.err || responseText);
                }
            }catch(e){
                failed(e.message || e);
            }
            
            
        }, function(info){
            failed(info.info);
        });
    },
    loadScript: function(success, failed){
        this._dataType = 'script';
        this._sendRequest(function(data){
            success(data.responseText);
        }, function(info){
            failed(info.info);
        });
    },
    loadHtml : function(success, failed) {
        this._dataType = 'html';
        this._sendRequest(function(data){
            success(data.responseText);
        }, function(info){
            failed(info.info);
        });
    }
};