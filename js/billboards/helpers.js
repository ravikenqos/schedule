/**
 *  A collection of helper routines meant to be used as static methods.
 *
 * @author     Murali Vajjiravel
 * @copyright  Copyright (c) 2012 Parllay Inc.
 * 
 */

var ControlState = {
    Disabled: 0,
    Enabled: 1
};

var EntityService;

if (window.location.hostname == 'brands.parllay.com') {
    EntityService = {
        DynamicContent: 'http://parllaysocial.cloudapp.net/api/GetDynamicContentAnalysisMap',
        ReverseConcepts: 'http://parllaygraph.cloudapp.net/api/ParllayGraph',
        WikiInfo: 'http://parllaysocial.cloudapp.net/api/GetWikiInfoAndCategoryName'
    };

} else {
    EntityService = {
        DynamicContent: 'http://parllaysocial.cloudapp.net/api/GetDynamicContentAnalysisMap',
        ReverseConcepts: 'http://parllaygraph.cloudapp.net/api/ParllayGraph',
        WikiInfo: 'http://parllaysocial.cloudapp.net/api/GetWikiInfoAndCategoryName'
    };
}

var Linkedin = {
    defaultImageLocation: 'http://s.c.lnkd.licdn.com/scds/common/u/images/themes/katy/ghosts/person/ghost_person_65x65_v1.png',
    defaultCompayImageLocation: 'http://s.c.lnkd.licdn.com/scds/common/u/img/icon/icon_no_company_logo_100x60.png'
};

var SocialChannelType = {
    Facebook: 1101,
    Twitter: 1102,
    Linkedin: 1105,
    GPlus: 1106,
    LinkedinCompany: 1107,
    Instagram: 1108,
    Weibo: 1100,
    WeChat: 1099
};


var CustomAttribute = {
    // user entered
    placeholderTextOnClear: "disabled-placeholder",
    buddyControls: "buddy",
    skipControl: "skip",
    tooltipText: "title",
    passFailCheckMark: "ok-buddy",
    sectionChildren: "children",
    dirtyCloneBuddyControls: "dirty-buddy",
    allowedCharactersRegEx: "chars",
    eventHandlers: "handlers",
    errorContainer: "errors",
    targetStep: "step",
    previewPrefix: "preview-prefix",
    parentControl: "parent",
    targetId: "target-id",
    extraMetadata: "extra-data",
    elementState: "state",
    // system maintained
    disabledSettingOnEnable: "enabled-disabled-attr",
    valueOnEnable: "enabled-value",
    defaultValueForModifiedCheck: "default",
    background: "background-data",
    inputFileUrl: "file",
    categoryId: "category-id",
    // info: the element has a non-default value
    isControlModified: "dirty",
    // info: the element was explicitly customized by the end user
    isControlCustomized: "custom"
};
var wssPort = 8080;
if (document.location.protocol === 'https:') {
    wssPort = 8081;
}

var StreamingMethods = {
    WebSocket: "websocket",
    SocketIO: "socketio",
    REST: "REST"
};

var nodePrefix = '';
if (window.location.hostname == 'me.parllay.com') {
//    nodePrefix = 'streams-ws';
    nodePrefix = 'streams';
} else {
    nodePrefix = 'streams';
}

if(window.location.hostname.indexOf('ppe') > 0){
    nodePrefix += '-ppe';
}
if(window.location.hostname.indexOf('parllay.com') > 0){
    var NodeAPI = {
       "SocketEndPoint" : nodePrefix + ".parllay.com:" + wssPort,
       "HTTPEndPoint" : nodePrefix + ".parllay.com:" + (document.location.protocol === 'https:' ? "8251" : "8151"),
       "HTTPListenerEndPoint" : nodePrefix + ".parllay.com:" + (document.location.protocol === 'https:' ? "8252" : "8152"),
       "streamingMethod" : StreamingMethods.REST
    };
} else if (window.location.hostname.indexOf('parllayapp.com') > 0) {
    var NodeAPI = {
        "SocketEndPoint": nodePrefix + ".parllaypp.com:" + wssPort,
        "HTTPEndPoint": "localhost:8006",
        "HTTPListenerEndPoint": nodePrefix + ".parllaypp.com:" + (document.location.protocol === 'https:' ? "8252" : "8152"),
        "streamingMethod": StreamingMethods.REST
    };
} else {
    var NodeAPI = {
       "SocketEndPoint" : nodePrefix + ".parllayme.com:" + wssPort,
       "HTTPEndPoint" : nodePrefix + ".parllayme.com",
       "HTTPListenerEndPoint" : nodePrefix + ".parllayme.com:8082",
       "streamingMethod" : StreamingMethods.REST
    };
}

var Helpers = {
    loadSelectWithData: function (controls, data, errorMessage, callback) {
        var onExit = function (errors, size) {
            controls.trigger("liszt:updated");
            if (callback) {
                callback(errors, size);
            }
        };
        controls.find("option").remove();
        controls.append($("<option />").val("-1"));
        if (!data) {
            Helpers.showInternalError(errorMessage);
            onExit(errorMessage, 0);
            return;
        }

        data.forEach(function (element, index, array) {
            var optionElement = $("<option />").val(element.id).text(element.title);
            for (var attribute in element) {
                if (attribute == "id" || attribute == "title" || Number(attribute) == attribute) {
                    continue;
                }
                optionElement.attr(attribute, element[attribute]);
            }
            controls.append(optionElement);
        });
        onExit(null, data.length);
    },
    setValue: function (elements, value, isSoft) {
        elements.each(function (index, element) {
            element = $(element);
            if (element.is("img")) {
                element.attr("src", value);
            } else if (element.is('input[type="file"]')) {
                element.attr(CustomAttribute.inputFileUrl);
            } else if (element.is("div, span")) {
                element.text(value);
            } else if (element.is("a")) {
                element.text(value).attr("href", value);
            } else {
                element.val(value);
            }

            if (!isSoft) {
                element.attr(CustomAttribute.valueOnEnable, value);
            }
        });
        return elements;
    },
    // smart get value
    getValue: function (element) {
        if (element.is("img")) {
            return element.attr("src");
        }
        if (element.is('input[type="file"]')) {
            return element.attr(CustomAttribute.inputFileUrl);
        }
        if (element.is("div, span")) {
            return element.text();
        }
        if (element.is("a")) {
            return element.attr("href");
        }
        return element.val();
    },
    // enable/disable whole group of controls
    // when enabling ...
    // preserveFlag - true means keep old disabledSettingOnEnable. false means remove disabledSettingOnEnable
    // forceFlag - force the action, unless the field has [skip] set
    // clearFlag - unused
    // when disabling ...
    // preserveFlag - true means save current value of the control so we can restore it back later during an enable. false means don't bother
    // forceFlag - force the action, unless the field has [skip] set
    // clearFlag - true means empty the value in the control. false means don't bother
    changeControlsTo: function (parentContainer, stateFlag, preserveFlag, clearFlag, forceFlag) {
        var affectedControls = 'input:not([type="button"]), select, textarea, img, .image-input-close-icon';
        switch (stateFlag) {
            case ControlState.Enabled:
                parentContainer.removeClass("disabled");
                parentContainer.find(affectedControls).addBack(affectedControls).each(function (index, element) {
                    element = $(element);
                    if (!preserveFlag) {
                        element.removeAttr(CustomAttribute.disabledSettingOnEnable);
                    }
                    if (element.attr(CustomAttribute.skipControl) != "true" && (forceFlag || element.attr(CustomAttribute.disabledSettingOnEnable) != "disabled")) {
                        element.removeAttr("disabled");
                    }

                    if (element.is(".image-input-close-icon")) {
                        element.attr(CustomAttribute.isControlCustomized) == "true" ? element.show() : element.hide();
                        return;
                    }

                    var lastEnteredValue = element.attr(CustomAttribute.valueOnEnable);
                    if (!lastEnteredValue) {
                        return;
                    }
                    Helpers.setValue(element, lastEnteredValue);
                    element.removeAttr(CustomAttribute.valueOnEnable);
                    element.removeAttr("disabled");
                });
                break;
            case ControlState.Disabled:
                parentContainer.addClass("disabled");
                parentContainer.find(affectedControls).addBack(affectedControls).each(function (index, element) {
                    element = $(element);
                    // handle special cases - disabling a previously disabled control (either manually (i.e. without use of this function) or an earlier call of
                    // this function (i.e. unavoidable logic whereby we are costrained to call this function twice))
                    var currentDisabledFlag = element.attr("disabled");
                    var currentDisabledSettingOnEnable = element.attr(CustomAttribute.disabledSettingOnEnable);
                    if (!currentDisabledSettingOnEnable || forceFlag) {
                        element.attr(CustomAttribute.disabledSettingOnEnable, (currentDisabledFlag == "disabled" || forceFlag) ? "disabled" : "enabled");
                    }

                    // disable the control
                    element.attr("disabled", "disabled");
                    // special case for close icons
                    if (element.is(".image-input-close-icon")) {
                        element.hide();
                        return;
                    }

                    if (preserveFlag) {
                        element.attr(CustomAttribute.valueOnEnable, Helpers.getValue(element));
                    }
                    if (clearFlag) {
                        Helpers.setValue(element, element.attr(CustomAttribute.placeholderTextOnClear));
                    }
                });
                break;
            default:
                Helpers.showInternalError("Unexpected stateFlag: " + stateFlag);
                return;
        }

        // ensure the [chosen] select controls get redrawn
        parentContainer.find("select").trigger("liszt:updated");
    },
    updateElementAndBuddies: function (element, text, isSoft) {
        Helpers.setValue(element, text, isSoft);
        Helpers.updateBuddyControls(element, null, false, isSoft);
    },
    updateBuddyControls: function (elements, attributeList, skipValueUpdates, isSoft) {
// By default, we assume that [src] attribute of [img] elements needs to be copied. Pass a non-empty [attributeList] to override this behavior
        if (!attributeList) {
            attributeList = {
                src: 1
            };
        }

        elements.each(function (index, element) {
            element = $(element);
            // skip, if no buddy elements exist
            var buddySelectors = element.attr(CustomAttribute.buddyControls);
            if (!buddySelectors) {
                return;
            }

// collect all the attributes from the main element, before processing the buddy elements
            for (var attributeName in attributeList) {
                var value = element.attr(attributeName);
                if (value === undefined) {
                    attributeList[attributeName] = {
                        skip: true
                    };
                    continue;
                }
                attributeList[attributeName] = {
                    skip: false,
                    value: value
                };
            }

// Now, let us go through the buddies and get them fixed up
            var elementValue = Helpers.getValue(element);
            $(buddySelectors).each(function (index, buddyElement) {
                buddyElement = $(buddyElement);
                if (buddyElement.attr(CustomAttribute.isControlModified) == "true" || buddyElement.attr(CustomAttribute.isControlCustomized) == "true") {
                    return;
                }

                if (!skipValueUpdates) {
                    var isTextElement = buddyElement.is("div,span,a");
                    var placeholder = buddyElement.attr("placeholder");
                    isTextElement ? (buddyElement.text(elementValue ? elementValue : placeholder)) : Helpers.setValue(buddyElement, elementValue, isSoft);
                }
                for (var attributeName in attributeList) {
                    var metadata = attributeList[attributeName];
                    if (metadata.skip) {
                        continue;
                    }
                    buddyElement.attr(attributeName, metadata.value);
                }

                Helpers.updateBuddyControls(buddyElement, attributeList, skipValueUpdates, isSoft);
            });
        });
    },
    showInternalError: function (message) {
        Helpers.logDebug(message);
    },
    fetchWithAjax: function (container, memberName, ajaxPath, params, dataHelper, callback) {
        var ajax = Helpers.makeAjax(ajaxPath, "GET");
        ajax.setParameters(params);
        ajax.loadJSON(function (data) {
            container[memberName] = dataHelper ? dataHelper(data) : data;
            if (callback) {
                callback();
            }
        }, function (errors) {
            Helpers.showInternalError(Helpers.asString(errors) + ", URL context: " + ajaxPath + ";");
            if (!callback) {
                return;
            }
            callback(errors);
        });
    },
    loadSelectWithAjax: function (control, ajaxPath, params, errorMessage, callback, dataHelper) {
        var container = {};
        Helpers.fetchWithAjax(container, "data", ajaxPath, params, dataHelper, function (errors) {
            if (errors) {
                if (callback) {
                    callback(errors, 0);
                }
                return;
            }

            Helpers.loadSelectWithData(control, container.data, errorMessage, callback);
        });
    },
    ensureCallback: function (callback) {
        if (!callback) {
            return function () {
            };
        }
        return callback;
    },
    ensureCallbackFunction : function(callback) {
       if ("function" !== typeof callback) {
          return function() {
          };
       }
       return callback;
    },
    slideHorizontalAndHide: function (element, duration, callback) {
        callback = Helpers.ensureCallback(callback);

        var originalWidth = element.width();
        return element.animate({
            width: 0
        }, duration, function () {
            element.hide().width(originalWidth);
            if (callback) {
                callback();
            }
        });
    },
    animateImages: function (imageContainer, initialClass, finalClass, duration, callback) {
        var frontElement = imageContainer.find(finalClass);
        var backElement = imageContainer.find(initialClass);

        var isIE = (navigator.appName == "Microsoft Internet Explorer");
        var transitionEndEventNameList = "webkitTransitionEnd mozTransitionEnd msTransitionEnd oTransitionEnd otransitionend transitionEnd transitionend";
        var initialHeight = imageContainer.height();
        imageContainer.height(initialHeight);

        var flipHandler = null;
        flipHandler = function () {
            backElement.unbind(transitionEndEventNameList, flipHandler);
            setTimeout(function () {
                var callbackHandler = null;
                callbackHandler = function () {
                    frontElement.unbind(transitionEndEventNameList, callbackHandler);
                    setTimeout(function () {
                        var doFinal = function () {
                            backElement.hide();
                            if (callback) {
                                callback();
                            }
                        };
                        imageContainer.animate({
                            height: initialHeight
                        }, "fast", doFinal);
                    }, 100);
                };
                frontElement.show();
                frontElement.bind(transitionEndEventNameList, callbackHandler);

                // bring into view
                setTimeout(function () {
                    if (isIE) {
                        Helpers.animateCss2dScaleX(frontElement, 0, 1, duration, callbackHandler);
                    } else {
                        Helpers.animateFlipShow(frontElement, duration);
                    }
                }, 100);
            }, 100);
        };

        // take it off view
        backElement.bind(transitionEndEventNameList, flipHandler);
        setTimeout(function () {
            if (isIE) {
                Helpers.animateCss2dScaleX(backElement, 1, 0, duration, flipHandler);
            } else {
                Helpers.animateFlipHide(backElement, duration);
            }
        }, 100);
    },
    makeAjax: function (url, method) {
        var ajax = new ParllayAjax();
        ajax.setURL(url);
        ajax.setMethod(method);
        return ajax;
    },
    isColorTransparent: function (color) {
        if (color == "transparent") {
            return true;
        }

        var matchResults = color.match(/^\s*rgba\(.*,\s*(\d+)\s*\)\s*$/);
        if (matchResults) {
            return (parseInt(matchResults[1], 10) == 0);
        }
        return false;
    },
    _convertDurationToMs: function (duration) {
        if (!duration) {
            duration = "1000ms";
        } else if (duration == "fast") {
            duration = "200ms";
        } else if (duration == "slow") {
            duration = "600ms";
        }
        return duration;
    },
    animateCss2dScaleX: function (element, from, to, duration, callback) {
        duration = Helpers._convertDurationToMs(duration);

        var times = 20;
        var current = from;
        var step = (to - from) / times;
        var funcId = null;
        funcId = window.setInterval(function () {
            current += step;
            var newTransform = "scale(" + current + ", 1)";
            element.css({
                "-ms-transform": newTransform,
                "transform": newTransform
            });
            if ((from < to && current >= to) || (from > to && current <= to)) {
                window.clearInterval(funcId);
                if (callback) {
                    callback();
                }
            }
        }, duration / times);
    },
    _animateTransformHelper: function (elements, duration, transform) {
        duration = Helpers._convertDurationToMs(duration);
        elements.css({
            "-webkit-transition-duration": duration,
            "-moz-transition-duration": duration,
            "-ms-transition-duration": duration,
            "-o-transition-duration": duration,
            "transition-duration": duration,
            "-webkit-transform": transform,
            "-moz-transform": transform,
            "-ms-transform": transform,
            "-o-transform": transform,
            "transform": transform
        });
    },
    animateFlipHide: function (elements, duration) {
        if ($.browser.msie) {
            return Helpers.animateCss2dScaleX(elements, 1, 0, duration, function () {
                elements.hide();
            });
        }
        return Helpers._animateTransformHelper(elements, duration, "rotateY(90deg)");
    },
    animateFlipShow: function (elements, duration) {
        if ($.browser.msie) {
            return Helpers.animateCss2dScaleX(elements.show(), 0, 1, duration);
        }
        return Helpers._animateTransformHelper(elements, duration, "rotateY(0deg)");
    },
    getBackground: function (element) {
        if (element.length < 1) {
            return 'none';
        }
        var image = element.css('background-image');
        var color = element.css('background-color');
        if (image != 'none') {
            return image;
        }
        if (!Helpers.isColorTransparent(color)) {
            return color;
        }
        return Helpers.getBackground(element.parent());
    },
    executeWithProgressIndicator: function (elements, codeToExecute) {
        if (!elements || elements.length < 1) {
            return codeToExecute(function () {
            });
        }

        elements.each(function (index, element) {
            element = $(element);

            // is the element already spinning?
            var spinnerId = element.attr('spinner');
            if (spinnerId) {
                var spinner = $('#' + spinnerId);
                return spinner.attr('spinCount', Number(spinner.attr('spinCount')) + 1);
            }

            // prepare parent - to create an [absolute] style child element
            var parent = element.parent();
            var parentDisplay = parent.css("position");
            if (parentDisplay != "relative" && parentDisplay != "absolute" && parentDisplay != "fixed") {
                parent.css("position", "relative");
            }

            // compute dimensions of the control we are replacing
            var dimensions = element.position(); // left, top
            dimensions.width = element.outerWidth();
            dimensions.height = element.outerHeight();
            // workaround for JQuery bug with computing correctly the relative positions
            dimensions.top = element[0].offsetTop;
            dimensions.left = element[0].offsetLeft;

            // create the image element of the right size
            var spinnerSize = Math.min(dimensions.width, dimensions.height, 16);
            var marginSize = "-" + parseInt(spinnerSize / 2) + "px";
            spinnerSize += "px";
            var imageChild = $('<img src="/images/loading.gif" />').css({
                width: spinnerSize,
                height: spinnerSize,
                position: "absolute",
                top: "50%",
                left: "50%",
                "margin-left": marginSize,
                "margin-top": marginSize
            });

            // now, create the replacement element for the target element (the element we are replacing)
            spinnerId = Helpers.guid();
            var child = $('<span class="spinner" id="' + spinnerId + '" spinCount="1"></span').append(imageChild).css({
                position: "absolute",
                left: dimensions.left + "px",
                top: dimensions.top + "px",
                width: dimensions.width + "px",
                height: dimensions.height + "px",
                background: Helpers.getBackground(parent),
                'margin-top': element.css('margin-top'),
                'margin-right': element.css('margin-right'),
                'margin-bottom': element.css('margin-bottom'),
                'margin-left': element.css('margin-left')
            });
            element.attr('spinner', spinnerId);

            // finally, switch the elements
            var currentVisibility = element.css("visibility");
            element.css("visibility", "hidden");
            parent.append(child);
            child.attr('extra-data', JSON.stringify({
                currentVisibility: currentVisibility,
                parentDisplay: parentDisplay
            }));
        });

        // execute the code and on completion, undo all the changes we made to DOM
        codeToExecute(function () {
            elements.each(function (index, element) {
                element = $(element);

                var spinner = $('#' + element.attr('spinner'));
                var spinCount = Number(spinner.attr('spinCount'));
                if (spinCount > 1) {
                    return spinner.attr('spinCount', spinCount - 1);
                }
                var attr = spinner.attr("extra-data");
                if (attr) {
                    var childElementInfo = JSON.parse(attr);
                }
                spinner.remove();
                element.attr('spinner', '');
                if (childElementInfo) {
                    element.css("visibility", childElementInfo.currentVisibility);
                    element.parent().css("position", childElementInfo.parentDisplay);
                }
            });
        });
    },
    asString: function (obj) {
        if (!obj) {
            return '';
        }
        if (obj instanceof Error || (typeof obj == 'object' && obj.hasOwnProperty('toString'))) {
            return obj.toString();
        }
        return JSON.stringify(obj).slice(1, -1);
    },
    // Error handling
    errorSuppressor: function (errors) {
        Helpers.logDebug(errors);
    },
    //Log the debugging codes
    logDebug: function (message) {
        if ("undefined" !== typeof console) {
            // console.log(message);
        }
    },
    loadDialog: function (dialogContainer, createCallback, showTitleBar, errorCallback, openCallback, options) {
        if (!errorCallback) {
            errorCallback = Helpers.showError;
        }
        if (dialogContainer.length < 1) {
            debugger;
            Helpers.logDebug('FATAL. Helpers.loadDialog should never be called without the element already in DOM');
        }

        if (dialogContainer.hasClass('ui-dialog-content')) {
            dialogContainer.show().dialog("open").dialog("moveToTop");
            if (openCallback) {
                openCallback(dialogContainer);
            }
            return;
        }

        var dialogOptions = {
            closeOnEscape: false,
            draggable: true,
            resizable: false,
            autoResize: true,
            autoOpen: true,
            position: "center",
            width: parseInt(dialogContainer.css("width")),
            height: parseInt(dialogContainer.css("height")),
            buttons: [],
            create: function () {
                if (!showTitleBar) {
                    dialogContainer.prev().hide();
                    dialogContainer.parent().css('border', 'none');
                }

                if (createCallback) {
                    createCallback(dialogContainer);
                }
            },
            close: function () {
                dialogContainer.hide().dialog("close");
            }
        };
        for (var option in options) {
            dialogOptions[option] = options[option];
        }
        dialogContainer.dialog(dialogOptions);
        dialogContainer.show().dialog("moveToTop");
        if (openCallback) {
            openCallback(dialogContainer);
        }

        var dragHandles = dialogContainer.find('.tab-items, .tab-content h3, .dialog-header-title');
        dialogContainer.parent().draggable({
            containment: "parent",
            handle: dragHandles
        });
        dragHandles.css('cursor', 'move');
    },
    showError: function (message) {
        if (Helpers._hostPage) {
            if (Helpers._hostPage.showError) {
                return Helpers._hostPage.showError(message);
            }
            if (Helpers._hostPage.context && Helpers._hostPage.context.showError) {
                return Helpers._hostPage.context.showError(message);
            }
        }
        return Helpers.showMessage("Oops! we encounter an error", typeof message == "object" ? JSON.stringify(message) : message);
    },
    loadAjaxDialog: function (ajaxPath, containerId, createCallback, showTitleBar, errorCallback, openCallback, options) {
        if (!errorCallback) {
            errorCallback = Helpers.showError;
        }

        var dialogContainer = $("#" + containerId);
        if (dialogContainer.length > 0) {
            return Helpers.loadDialog(dialogContainer, createCallback, showTitleBar, errorCallback, openCallback, options);
        }
        $.get(ajaxPath, function (responseHtml) {
            if ($("#" + containerId).length < 1) {
                $("body").append($(responseHtml).hide());
            }
            return Helpers.loadDialog($("#" + containerId), createCallback, showTitleBar, errorCallback, openCallback, options);
        }).fail(function (errors) {
            errorCallback("Internal error. Retrieving Dialog partial from the server failed. " + Helpers.asString(errors));
        });
    },
    guid: function () {
        return 'f' + (Math.random() * (1 << 30)).toString(16).replace('.', '');
    },
    numToChars: function (num, minWidth) {
        var asString = num.toString();
        if (asString.length >= minWidth) {
            return asString;
        }
        return (new Array(minWidth - asString.length + 1)).join("0") + asString;
    },
    dateToString: function (date) {
        return Helpers.numToChars(date.getMonth() + 1, 2) + '/' + Helpers.numToChars(date.getDate(), 2) + '/' + date.getFullYear();
    },
    today: function () {
        return Helpers.dateToString(new Date());
    },
    rawTodayPlus: function (numDays, numMonths, numYears) {
        if (!numDays) {
            numDays = 0;
        }
        if (!numMonths) {
            numMonths = 0;
        }
        if (!numYears) {
            numYears = 0;
        }
        var today = new Date();
        return (new Date(today.getFullYear() + numYears, today.getMonth() + numMonths, today.getDate() + numDays));
    },
    todayPlus: function (numDays, numMonths, numYears) {
        return Helpers.dateToString(Helpers.rawTodayPlus(numDays, numMonths, numYears));
    },
    nextMonth: function () {
        return Helpers.todayPlus(0, 1, 0);
    },
    nextWeek: function () {
        return Helpers.todayPlus(7, 0, 0);
    },
    executeDataDispatcher: function (element, module, method, parameters, successCallback, failureCallback) {
        var defaultDispatcher = element.qaDataDispatcher({
            module: module,
            success: successCallback,
            failed: failureCallback
        });
        defaultDispatcher.reset();
        defaultDispatcher.addParameters({
            method: method
        });
        defaultDispatcher.addParameters(parameters);
        defaultDispatcher.doRequest();
    },
    htmlDecode : function(input) {
      if (typeof input !== "undefined") {
         input = input.replace(/\r\n/g, '<br />');
         input = php.stripslashes(input);
	 input = input.replace(/&amp;/g, '&');
	 input = input.replace(/&gt;/g, '>');
	 input = input.replace(/&lt;/g, '<');
	 input = input.replace(/&quot;/g, '"');
	 input = input.replace(/&#39;/g, "'");

	 var e = document.createElement('div');
	 e.innerHTML = input;
	 if (typeof e.childNodes[0] !== "undefined") {
	    return (e.childNodes[0].nodeValue == null?e.childNodes[0].innerHTML:e.childNodes[0].nodeValue);
	 } else {
	    return input;
	 }
      }
      return input;
   },
    executeAjaxCall: function (url, params, method, successCallback, failureCallback) {
        var ajax = new ParllayAjax();
        method = method ? method : 'GET';
        params = params ? (typeof params === 'object' ? params : {}) : {};
        ajax.setURL(url);
        ajax.setMethod(method);
        ajax.addParameters(params);
        successCallback = successCallback && typeof successCallback === 'function' ? successCallback : function (data) {
            Helpers.logDebug(data);
        };
        failureCallback = failureCallback && typeof failureCallback === 'function' ? failureCallback : function (error) {
            Helpers.logDebug(error);
        };
        ajax.loadJSON(successCallback, failureCallback);
    },
    createDatePicker: function (element, onCloseCallback, showToday, datePickerTriggerWidth, datePickerFontSize, yearRange) {
        yearRange = yearRange || 'c-10:c+10'
        element.datepicker({
            dateFormat: "mm/dd/yy",
            constrainInput: true,
            nextText: "Next month",
            prevText: "Previous month",
            selectOtherMonths: true,
            showOtherMonths: true,
            showAnim: "slideDown",
            currentText: "Show today",
            showButtonPanel: !!showToday,
            showMonthAfterYear: false,
            showOn: "both",
            buttonImage: "/images/calendar.gif",
            buttonImageOnly: true,
            changeMonth: true,
            changeYear: true,
            onClose: onCloseCallback,
            yearRange: yearRange
        });
        if (datePickerFontSize) {
            $("div.ui-datepicker").css({
                "font-size": datePickerFontSize
            });
        }
        var datePickerTriggerHeight = element.height() + 3;
        if (!datePickerTriggerWidth) {
            datePickerTriggerWidth = datePickerTriggerHeight - 3;
        }
        $(".ui-datepicker-trigger").css({
            height: datePickerTriggerHeight,
            width: datePickerTriggerWidth,
            padding: 0,
            "margin-right": element.css("margin-right"),
            "vertical-align": "middle"
        });
        $(".ui-datepicker-trigger img").css({
            height: datePickerTriggerHeight,
            width: datePickerTriggerWidth
        });
        var elementWidth = element.width();
        elementWidth = (elementWidth == 0) ? "auto" : (element.width() - datePickerTriggerWidth);
        element.css({
            width: elementWidth,
            "margin-right": "0px",
            "vertical-align": "middle"
        });
    },
    getCookieRootDomain: function () {
        var rootDomain = location.hostname;
        var matches = rootDomain.match(/[.]?[^.]+[.][^.]+$/);
        return matches.length > 0 ? matches[0] : rootDomain;
    },
    setCookie: function (name, value, expires, path, domain, secure) {
        var today = new Date();
        today.setTime(today.getTime());
        if (expires) {
            expires = expires * 1000 * 60 * 60 * 24;
        }

        var expires_date = new Date(today.getTime() + (expires));
        document.cookie = name + "=" + escape(value) +
                ((expires) ? ";expires=" + expires_date.toGMTString() : "") +
                ((path) ? ";path=" + path : "") +
                ((domain) ? ";domain=" + domain : "") +
                ((secure) ? ";secure" : "");
    },
    getCookie: function (check_name) {
        var a_all_cookies = document.cookie.split(';');
        var a_temp_cookie = '';
        var cookie_name = '';
        var cookie_value = '';
        var b_cookie_found = false;

        for (i = 0; i < a_all_cookies.length; i++) {
            a_temp_cookie = a_all_cookies[i].split('=');
            cookie_name = a_temp_cookie[0].replace(/^\s+|\s+$/g, '');
            if (cookie_name == check_name) {
                b_cookie_found = true;
                if (a_temp_cookie.length > 1) {
                    cookie_value = unescape(a_temp_cookie[1].replace(/^\s+|\s+$/g, ''));
                }
                return cookie_value;
                break;
            }
            a_temp_cookie = null;
            cookie_name = '';
        }
        if (!b_cookie_found)
        {
            return null;
        }
    },
    setZombieCookie: function (key, value) {
        Helpers.setCookie(key, value, 365, "/");
        if (localStorage) {
            localStorage.setItem(key, value);
        }
    },
    showDialog: function (title, prompt, buttons, cancelCallback) {
        while (prompt && prompt.indexOf("\n") != -1) {
            prompt = prompt.replace("\n", "<br />");
        }
        var closeButton = '<span class="close-button"> &nbsp; </span>';
        prompt = closeButton + "<div class='common-dialog-prompt'>" + prompt + "</div>";
        var common_dialog = $("#common-dialog");
        if (common_dialog.length > 0) {
            common_dialog.remove();
        }
        $("body").append('<div id="common-dialog" title="' + title + '"><div>');
        common_dialog = $("#common-dialog");
        common_dialog[0].onselectstart = Helpers.canSelect;
        var buttonsAndCallbacks = {};
        for (var counter = 0; counter < buttons.length; ++counter) {
            var modified = function () {
                var button = buttons[counter];
                buttonsAndCallbacks[button.caption] = function () {
                    common_dialog.dialog('close');
                    if (typeof button.callback == 'function') {
                        button.callback.call(button);
                    }
                };
            };
            modified();
        }
        common_dialog.dialog({
            resizable: true,
            autoResize: true,
            buttons: buttonsAndCallbacks,
            width: 600,
            close: cancelCallback,
            position: 'center',
            modal: true,
            create: function () {
                common_dialog.prev().hide();
                common_dialog.parent().css('border', 'none');

            },
            overlay: {
                backgroundColor: '#000',
                opacity: 0.5
            }
        });
        common_dialog.html(prompt);
        common_dialog.dialog('open');
        common_dialog.dialog('option', 'position', 'center');
        common_dialog.find('.close-button').click(function () {
            common_dialog.dialog('close');
        });
    },
    confirm: function (title, prompt, okCallback, cancelCallback, closeCallback) {
        if (!closeCallback) {
            closeCallback = cancelCallback;
        }
        if (!okCallback) {
            okCallback = closeCallback;
        }
        Helpers.showDialog(title, prompt, [{
                caption: "Confirm",
                callback: okCallback
            }, {
                caption: "Cancel",
                callback: cancelCallback
            }], closeCallback);
    },
    showMessage: function (title, message, callback) {
        var okButton = {};
        okButton.caption = 'OK';
        if (callback && typeof callback === 'function') {
            okButton.callback = callback;
        }
        Helpers.showDialog(title, message, [okButton]);
    },
    FBLogin: function () {
        $("#signup-password").hide().val(Math.random());
        $('label[for="signup-password"]').hide();
    },
    showJoinDialog: function (context) {
        var self = this;
        var reloadWindow = function () {
            if (window.parent) {
                window.parent.location.reload();
            } else {
                window.location.reload();
            }
        };

        function signInHandler() {
            $("#join-brand").hide(0, function () {
                $("#welcome-message-content").hide();
                $("#join-sign-in").show();
                $(".fb-login-message").hide();
            });
            $(".ui-dialog-title").html("Sign In &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span>Don't have an account? <span class='sign-up'>Sign Up</span></span>");
            $(".ui-dialog-title .sign-up").unbind('click').click(signUpHandler);
        }
        function signUpHandler() {
            $("#join-sign-in").hide(0, function () {
                $("#welcome-message-content").show();
                $("#join-brand").show();
                $(".fb-login-message").hide();
            });
            $(".ui-dialog-title").html("Join Now &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span>Already have an account? <span class='sign-in'>Sign In</span></span>");
            $(".ui-dialog-title .sign-in").unbind('click').click(signInHandler);
        }
        $("#join-dialog").dialog({
            width: 384,
            height: 445,
            resizable: false,
            autoSize: false,
            autoOpen: false,
            draggable: false,
            modal: true,
            open: function () {
                signInHandler();
            },
            create: function () {
                $("#join-dialog .more").mouseover(function () {
                    $(".benefit-tip").show();
                }).mouseout(function () {
                    $(".benefit-tip").hide();
                });
                signInHandler();

                function setZombieCookie(id, token, email) {
                    Helpers.setZombieCookie("_parllay_ua_id", id + "|" + token + "|" + email);
                    Helpers.setZombieCookie("_parllay_is_join_us", "yes");
                }
                $("#join-dialog .login-with-facebook").click(function () {
                    if (FB) {
                        FB.login(function (res) {
                            if (res && res.status == "connected") {
                                FB.api("/me?fields=email,first_name,last_name", function (res) {
                                    if (res && res.email) {
                                        var ajax = new ParllayAjax();
                                        ajax.setMethod("POST");
                                        ajax.setURL("/users/dispatcher?method=2009");
                                        ajax.addParameter("email", res.email);
                                        ajax.loadJSON(function (data) {
                                            if (data.status == 0) {
                                                Helpers.setZombieCookie(data.id, data.token, data.email);
                                                reloadWindow();
                                            } else {
                                                $("#signup-firstName").val(res.first_name);
                                                $("#signup-lastName").val(res.last_name);
                                                $("#signup-email").val(res.email);
                                                $(".ui-dialog-title .sign-up").trigger("click");
                                                //$("#confirm-tip").show();
                                                $("#join-dialog .login-with-facebook").hide();
                                                $("#join-dialog .sign-in-separator").hide();
                                                $("#join-dialog .fb-login-message").show();
                                                self.FBLogin();
                                            }
                                        }, function (error) {
                                            $("#sign-in-error").html(error).show();
                                        });
                                    } else {
                                        $("#sign-in-error").html('Login failed with Facebook.').show();
                                    }
                                });
                            }
                        }, {scope: 'email'});
                    }
                });
                $("#sign-up-form").validate({
                    rules: {
                        firstName: {
                            required: true
                        },
                        lastName: {
                            required: true
                        },
                        email: {
                            required: true,
                            email: true
                        },
                        password: {
                            required: true,
                            minlength: 8
                        }
                    },
                    messages: {
                        firstName: {
                            required: 'Please enter your first name'
                        },
                        lastName: {
                            required: 'Please enter your last name'
                        },
                        email: {
                            required: 'Please enter your email',
                            email: 'The email address is illegal'
                        },
                        password: {
                            required: 'Please enter your password',
                            minlengh: 'The length of password is 8 at least'
                        }
                    },
                    submitHandler: function (form) {
                        $(form).ajaxSubmit({dataType: 'json', success: function (data) {
                                if (data.success) {
                                    if (data.data.status != 0) {
                                        $("#sign-up-error").text("Email Already Exists. Try different email").show();
                                    } else {
                                        if (context.isJoinUs !== undefined) {
                                            context.isJoinUs = true;
                                        }
                                        setZombieCookie(data.data.id, data.data.token, data.data.email, data.data.businessId);
                                        $("#join-dialog").dialog('close');
                                        reloadWindow();
                                    }
                                } else {
                                    $("#sign-up-error").text('Internal error. please try again').show();
                                }
                            }});
                        return false;
                    }
                });
                $("#sign-in-form").validate({
                    rules: {
                        email: {
                            required: true,
                            email: true
                        },
                        password: {
                            required: true
                        }
                    },
                    messages: {
                        email: {
                            required: 'Please enter your email',
                            email: 'The email address is illegal'
                        },
                        password: {
                            required: 'Please enter your password'
                        }
                    },
                    submitHandler: function (form) {
                        $(form).ajaxSubmit({dataType: 'json', success: function (data) {
                                if (data.success) {
                                    if (data.data.status != 0) {
                                        $("#sign-in-error").text("Email or password not correct").show();
                                    } else {
                                        if (context.isJoinUs !== undefined) {
                                            context.isJoinUs = true;
                                        }
                                        setZombieCookie(data.data.id, data.data.token, data.data.email);
                                        $("#join-dialog").dialog('close');
                                        reloadWindow();
                                    }
                                } else {
                                    $("#sign-in-error").text("Internal error. please try again").show();
                                }
                            }});
                        return false;
                    }
                })
            },
            position: "center"
        });
        $("#join-dialog").dialog('open');
    },
    forgotPassword: function () {
        $("#login-container").hide();
        var forgetDialogErrorSelector = '#forgot-error-messages';
        var dialogContainer = $('#forget-dialog');
        dialogContainer.dialog({
            width: 500,
            resizable: false,
            autoSize: false,
            autoOpen: false,
            draggable: false,
            modal: true,
            open: function () {
                $(forgetDialogErrorSelector).empty().hide();
                $('#forgot-email').removeClass('error');
            },
            create: function () {
                dialogContainer.prev().hide();
                dialogContainer.parent().css('border', 'none');

                dialogContainer.find('.close-button').click(function () {
                    dialogContainer.dialog('close');
                });
                $("#forgot-form").validate({
                    errorLabelContainer: "#forgot-error-messages",
                    wrapper: "li",
                    rules: {
                        mailto: {
                            required: true,
                            email: true
                        }
                    },
                    messages: {
                        mailto: {
                            required: "Please enter your email",
                            email: "Please enter a valid email address (ex: me@parllay.com)"
                        }
                    },
                    submitHandler: function (form) {
                        $("forgot-submit").click(function () {
                            return false;
                        });
                        $(form).ajaxSubmit({dataType: 'json', success: function (data) {
                                $("#forgot-email").val('');
                                if (data.success) {
                                    if (data.code == '0') {
                                        $("#forgot-error-messages").css('color', 'green');
                                    } else {
                                        $("#forgot-error-messages").css('color', 'red');
                                    }
                                    $("#forgot-error-messages").html(data.message).show();
                                } else {
                                    $("#forgot-error-messages").html('Internal error. please try again').show();
                                }
                                setTimeout(function () {
                                    $(".ui-icon-closethick").trigger('click')
                                }, 3000);
                            }});
                    }
                });
            },
            position: "center"
        });
        $("#forget-dialog").dialog('open');
    },
    toUtcTime: function (deviceDate) {
        var offset = deviceDate.getTimezoneOffset();
        deviceDate.setHours(deviceDate.getHours() + parseInt(offset / 60));
        deviceDate.setMinutes(deviceDate.getMinutes() + (offset % 60));
        return deviceDate;
    },
    convertHexToRgba: function (hex, opacity) {
        hex = hex.replace('#', '');
        var r = parseInt(hex.substring(0, 2), 16);
        var g = parseInt(hex.substring(2, 4), 16);
        var b = parseInt(hex.substring(4, 6), 16);

        var result = 'rgba(' + r + ',' + g + ',' + b + ',' + opacity / 100 + ')';
        return result;
    },
    isMobileDevice: function () {
        var isMobile = false;
        // device detection
        if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent)
                || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0, 4))) {
            isMobile = true;
        }
        return isMobile;
    },
    timeSince: function (date) {

        var seconds = Math.floor((new Date() - date) / 1000);

        var interval = Math.floor(seconds / 31536000);

        if (interval > 1) {
            return interval + "y";
        }
        interval = Math.floor(seconds / 2592000);
        if (interval > 1) {
            return interval + "mon";
        }
        interval = Math.floor(seconds / 86400);
        if (interval > 1) {
            return interval + "d";
        }
        interval = Math.floor(seconds / 3600);
        if (interval > 1) {
            return interval + "h";
        }
        interval = Math.floor(seconds / 60);
        if (interval > 1) {
            return interval + "m";
        }
        return Math.floor(seconds) + "s";
    },
    getTimeSince: function (date) {
        date = date.replace("th", "");
        date = date.replace("st", "");
        date = date.replace("nd", "");
        date = date.replace("rd", "");
        date = new Date(date);
        date = Helpers.timeSince(date);
        return date;
    },
    includeSocketScript: function () {
        var js = document.createElement('script');
        js.type = "text/javascript";
        js.src = "https://cdn.socket.io/socket.io-1.3.5.js";
        document.body.appendChild(js);
    },
    animationClasses: {
        "image-only": "pt-page-moveToBottom", "image-text": "pt-page-moveToBottom50px"
    },
    findUrls: function (text) {
        var source = (text || '').toString();
        var urlArray = [];
        var url;
        var matchArray;

        // Regular expression to find FTP, HTTP(S) and email URLs.
        var regexToken = /(((ftp|https?):\/\/)[\-\w@:%_\+.~#?,&\/\/=]+)|((mailto:)?[_.\w-]+@([\w][\w\-]+\.)+[a-zA-Z]{2,3})/g;

        // Iterate through any URLs in the text.
        while ((matchArray = regexToken.exec(source)) !== null)
        {
            var token = matchArray[0];
            urlArray.push(token);
        }

        return urlArray;
    },
    registerHandlebarsHelpers: function () {

        /* a helper to execute an IF statement with any expression
         USAGE:
         -- Yes you NEED to properly escape the string literals, or just alternate single and double quotes 
         -- to access any global function or property you should use window.functionName() instead of just functionName()
         -- this example assumes you passed this context to your handlebars template( {name: 'Sam', age: '20' } ), notice age is a string, just for so I can demo parseInt later
         <p>
         {{#xif " this.name == 'Sam' && this.age === '12' " }}
         BOOM
         {{else}}
         BAMM
         {{/xif}}
         </p>
         */

        Handlebars.registerHelper("xif", function (expression, options) {
            return Handlebars.helpers["x"].apply(this, [expression, options]) ? options.fn(this) : options.inverse(this);
        });

        /* a helper to execute javascript expressions
         USAGE:
         -- Yes you NEED to properly escape the string literals or just alternate single and double quotes 
         -- to access any global function or property you should use window.functionName() instead of just functionName(), notice how I had to use window.parseInt() instead of parseInt()
         -- this example assumes you passed this context to your handlebars template( {name: 'Sam', age: '20' } )
         <p>Url: {{x " \"hi\" + this.name + \", \" + window.location.href + \" <---- this is your href,\" + " your Age is:" + window.parseInt(this.age, 10) "}}</p>
         OUTPUT:
         <p>Url: hi Sam, http://example.com <---- this is your href, your Age is: 20</p>
         */

        Handlebars.registerHelper("x", function (expression, options) {
            var fn = function () {
            }, result;
            try {
                fn = Function.apply(this, ["window", "return " + expression + " ;"]);
            } catch (e) {
                console.warn("{{x " + expression + "}} has invalid javascript", e);
            }

            try {
                result = fn.call(this, window);
            } catch (e) {
                console.warn("{{x " + expression + "}} hit a runtime error", e);
            }
            return result;
        });


        /* 
         if you want access upper level scope, this one is slightly different
         the expression is the JOIN of all arguments
         usage: say context data looks like this:
         
         // data
         {name: 'Sam', age: '20', address: { city: 'yomomaz' } }
         
         // in template
         // notice how the expression wrap all the string with quotes, and even the variables
         // as they will become strings by the time they hit the helper
         // play with it, you will immediately see the errored expressions and figure it out
         
         {{#with address}}
         {{z '"hi " + "' ../this.name '" + " you live with " + "' city '"' }}
         {{/with}}
         */
        Handlebars.registerHelper("z", function () {
            var options = arguments[arguments.length - 1]
            delete arguments[arguments.length - 1];
            return Handlebars.helpers["x"].apply(this, [Array.prototype.slice.call(arguments, 0).join(''), options]);
        });

        Handlebars.registerHelper("zif", function () {
            var options = arguments[arguments.length - 1]
            delete arguments[arguments.length - 1];
            return Handlebars.helpers["x"].apply(this, [Array.prototype.slice.call(arguments, 0).join(''), options]) ? options.fn(this) : options.inverse(this);
        });



        /*
         More goodies since you're reading this gist.
         */

// say you have some utility object with helpful functions which you want to use inside of your handlebars templates

        util = {
            // a helper to safely access object properties, think ot as a lite xpath accessor
            // usage: 
            // var greeting = util.prop( { a: { b: { c: { d: 'hi'} } } }, 'a.b.c.d');
            // greeting -> 'hi'

            // [IMPORTANT] THIS .prop function is REQUIRED if you want to use the handlebars helpers below, 
            // if you decide to move it somewhere else, update the helpers below accordingly
            prop: function () {
                if (typeof props == 'string') {
                    props = props.split('.');
                }
                if (!props || !props.length) {
                    return obj;
                }
                if (!obj || !Object.prototype.hasOwnProperty.call(obj, props[0])) {
                    return null;
                } else {
                    var newObj = obj[props[0]];
                    props.shift();
                    return util.prop(newObj, props);
                }
            },
            // some more helpers .. just examples, none is required
            isNumber: function (n) {
                return !isNaN(parseFloat(n)) && isFinite(n);
            },
            daysInMonth: function (m, y) {
                y = y || (new Date).getFullYear();
                return /8|3|5|10/.test(m) ? 30 : m == 1 ? (!(y % 4) && y % 100) || !(y % 400) ? 29 : 28 : 31;
            },
            uppercaseFirstLetter: function (str) {
                str || (str = '');
                return str.charAt(0).toUpperCase() + str.slice(1);
            },
            hasNumber: function (n) {
                return !isNaN(parseFloat(n));
            },
            truncate: function (str, len) {
                if (typeof str != 'string')
                    return str;
                len = util.isNumber(len) ? len : 20;
                return str.length <= len ? str : str.substr(0, len - 3) + '...';
            }
        };

// a helper to execute any util functions and get its return
// usage: {{u 'truncate' this.title 30}} to truncate the title 
        Handlebars.registerHelper('u', function () {
            var key = '';
            var args = Array.prototype.slice.call(arguments, 0);

            if (args.length) {
                key = args[0];
                // delete the util[functionName] as the first element in the array
                args.shift();
                // delete the options arguments passed by handlebars, which is the last argument
                args.pop();
            }
            if (util.hasOwnProperty(key)) {
                // notice the reference to util here
                return typeof util[key] == 'function' ?
                        util[key].apply(util, args) :
                        util[key];
            } else {
                log.error('util.' + key + ' is not a function nor a property');
            }
        });

// a helper to execute any util function as an if helper, 
// that util function should have a boolean return if you want to use this properly
// usage: {{uif 'isNumber' this.age}} {{this.age}} {{else}} this.dob {{/uif}}
        Handlebars.registerHelper('uif', function () {
            var options = arguments[arguments.length - 1];
            return Handlebars.helpers['u'].apply(this, arguments) ? options.fn(this) : options.inverse(this);
        });

// a helper to execute any global function or get global.property
// say you have some globally accessible metadata i.e 
// window.meta = {account: {state: 'MA', foo: function() { .. }, isBar: function() {...} } }
// usage: 
// {{g 'meta.account.state'}} to print the state

// or will execute a function
// {{g 'meta.account.foo'}} to print whatever foo returns
        Handlebars.registerHelper('g', function () {
            var path, value;
            if (arguments.length) {
                path = arguments[0];
                delete arguments[0];

                // delete the options arguments passed by handlebars
                delete arguments[arguments.length - 1];
            }

            // notice the util.prop is required here  
            value = util.prop(window, path);
            if (typeof value != 'undefined' && value !== null) {
                return typeof value == 'function' ?
                        value.apply({}, arguments) :
                        value;
            } else {
                log.warn('window.' + path + ' is not a function nor a property');
            }
        });

// global if 
// usage: 
// {{gif 'meta.account.isBar'}} // to execute isBar() and behave based on its truthy or not return
// or just check if a property is truthy or not
// {{gif 'meta.account.state'}} State is valid ! {{/gif}}
        Handlebars.registerHelper('gif', function () {
            var options = arguments[arguments.length - 1];
            return Handlebars.helpers['g'].apply(this, arguments) ? options.fn(this) : options.inverse(this);
        });

// just an {{#each}} warpper to iterate over a global array, 
// usage say you have: window.meta = { data: { countries: [ {name: 'US', code: 1}, {name: 'UK', code: '44'} ... ] } }
// {{geach 'meta.data.countries'}} {{this.code}} {{/geach}}

        Handlebars.registerHelper('geach', function (path, options) {
            var value = util.prop(window, arguments[0]);
            if (!_.isArray(value))
                value = [];
            return Handlebars.helpers['each'].apply(this, [value, options]);
        });
        Handlebars.registerHelper('ifEq', function (a, b, opts) {
            if (a == b) // Or === depending on your needs
                return opts.fn(this);
            else
                return opts.inverse(this);
        });

        Handlebars.registerHelper('json', function (context) {
            return JSON.stringify(context);
        });
        Handlebars.registerHelper('htmlentities_json', function (context) {
            return php.htmlentities(JSON.stringify(context));
        });
    },
    ucwords: function (str) {
        return (str + '')
                .replace(/^([a-z\u00E0-\u00FC])|\s+([a-z\u00E0-\u00FC])/g, function ($1) {
                    return $1.toUpperCase();
                });
    },
    strncmp: function (str1, str2, n) {
        str1 = str1.substring(0, n);
        str2 = str2.substring(0, n);
        return ((str1 == str2) ? 0 : ((str1 > str2) ? 1 : -1));
    },
    registerMimicReloadRequest: function (socket, type, profileId, numResultOnLoad, context) {
        Helpers.logDebug('Registering MimicReloadRequest');
        var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
        var eventer = window[eventMethod];
        var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";

        // Listen to message from child window
        eventer(messageEvent, function (e) {
            if (typeof e.data.userAction != "undefined" && e.data.userAction === 'mimicReloadRequest') {
                Helpers.logDebug('mimic reload request');
                context.contributingStreams = JSON.parse(e.data.selectedStreams);
                if (parent) {
                    parent.postMessage({userAction: 'update-contributing-streams', contributingStreams: context.contributingStreams}, '*');
                }
                var params = {
                    id: profileId,
                    count: numResultOnLoad,
                    numInitialResults: numResultOnLoad,
                    start: 0,
                    from: 0
                };
                Helpers.logDebug('emitting ' + type + '.get with param:' + JSON.stringify(params));
                socket.emit(type + '.get', params);
            }
        }, false);
    },
    checkZeroValue: function (number) {
        number = +number;
        if (!number) {
            return false;
        }
        return true;
    },
    aspectRatioFit: function (dimensions) {
        var newDimentions = {classes: []};
        if (Helpers.checkZeroValue(dimensions.wi) && Helpers.checkZeroValue(dimensions.hi)) {
            var widthRatio = dimensions.wa / dimensions.wi;
            var heightRatio = dimensions.ha / dimensions.hi;
            var ratio = Math.min(widthRatio, heightRatio);

            newDimentions.width = dimensions.wi * ratio;
            newDimentions.height = dimensions.hi * ratio;
            Helpers.logDebug("Ratio - " + widthRatio + ":" + heightRatio);
            if (widthRatio < heightRatio) {
                newDimentions.classes.push("width-fill");
                var heightNeeded = (dimensions.ha / 100) * 15;
                var heightAvailable = dimensions.ha - newDimentions.height;
                if (heightAvailable >= heightNeeded) {
                    newDimentions.classes.push("text-bottom-align");
                    newDimentions.availableHeight = heightAvailable;
                } else {
                    newDimentions.classes.push("image-vertical-align");
                }
            } else if (heightRatio <= widthRatio) {
                var widthNeeded = (dimensions.wa / 100) * 25;
                var widthtAvailable = dimensions.wa - newDimentions.width;
                newDimentions.classes.push("height-fill");
                if (widthtAvailable >= widthNeeded) {
                    newDimentions.classes.push("text-right-align");
                    newDimentions.availableWidth = widthtAvailable;
                } else {
                    newDimentions.classes.push("image-horizontal-align");
                }
            }
        }
        return newDimentions;
    },
    splitTextWithWordBoundary: function (text, maxLength) {
        if (text.length > maxLength) {
            text = text.substr(0, maxLength - 1);
            var lastChar = text.substr(-1);
            while (lastChar != " ") {
                var textLength = text.length;
                text = text.substr(0, textLength - 1);
                lastChar = text.substr(-1);
            }
            text = $.trim(text) + "...";
        }
        return text;
    },
    handleExceptions: function (error) {
        Helpers.logDebug("Exception occured");
        Helpers.logDebug(error.message);
        Helpers.logDebug(error.stack);
        var errorObject = error.toString();
        Helpers.logDebug(errorObject);
        /*var ajax = Helpers.makeAjax("", "POST");
         ajax.setParameters(params);
         ajax.loadJSON(function (data) {
         if (callback) {
         callback();
         }
         }, function (errors) {
         callback(errors);
         }); */
    },
    getDeviceId: function(){
        var uuid = localStorage.getItem('uuid');
        if (uuid !== null && uuid !== 'null') {
            return uuid;
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
        localStorage.setItem('uuid', uuid);
        return uuid;
    },
    garbageCleaner: function(obj){
        if('object' === typeof obj){
            for (var key in obj){
                delete obj[key];
            }
            if('undefined' !== typeof obj.length){
                obj.length = 0;
            }
        }
    }
};

var TimeZoneHelpers = {
    streamsTimeFormat: "ddd, MMM Do YYYY, h:mm a",
    businessOffset: $("#business-drop option:selected").attr("extra-data"),
    timestampToBusinessDateTime: function (timestamp, format, businessOffset) {
        var businessTimeStamp = TimeZoneHelpers.ToBusinessTimeStamp(timestamp, businessOffset);
        var date = new Date(1970, 0, 1); //start of time
        date.setSeconds(businessTimeStamp);
        return moment(date).format(format);
    },
    utcToTimestamp: function (dateTime) {
        var datetime = Date.parse(dateTime);
	//var datetime = new Date(dateTime).getTime();
        return datetime;
    },
    ToBusinessTimeStamp: function (timeStamp, businessOffset) {
        businessOffset = businessOffset * 60 * 1000;
        var businessTimeStamp = (timeStamp + businessOffset);
        businessTimeStamp = (businessTimeStamp / 1000);
        return businessTimeStamp;
    },
    getISODate: function (timeStamp, businessOffset) {
        pad = function (num) {
            var norm = Math.abs(Math.floor(num));
            return (norm < 10 ? '0' : '') + norm;
        };
        var isoDate = new Date(timeStamp).toISOString().split(".");
        var diff = (businessOffset >= 0) ? "+" : "-";
        return isoDate = isoDate[0] + diff + pad(businessOffset / 60) + ":" + pad(businessOffset % 60);
    }
};

var StreamsHelpers = {
    formatPostText: function (text, options) {
        text = $.trim(text);

        if (options.hideAllText == 1) {
            text = "";
        }

        if (text == "") {
            return text;
        }

        if (options.hideUrls == 1) {
            text = text.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '');
        }

        if (options.hideHashtags == 1) {
            text = text.replace(/#(\S*)/g, '');
        }
        return text;
    },
    formatStoryResponse: function (records, operation, businessOffset, widgetType, cardType, textHideOptions) {
        var self = this;
        var newRecords = [];
        if (operation === 'refresh') {
            $("#for-social-hub ul.sub-navigation-filter li").removeClass('visible');
        }
        records.forEach(function (record) {
            var newRecord = {};
            if (typeof record.stream_type != "undefined") {
                var postStreamId = "<not_present_in_post>";
                if ("undefined" !== typeof record.streams) {
                   
                    if (StreamsHelpers.context.contributingStreams.length > 1) {
                        postStreamId = $(record.streams).not($(record.streams).not(StreamsHelpers.context.contributingStreams));
                        if ('object' == typeof postStreamId) {
                            postStreamId = postStreamId[0];
                        }
                        if (typeof postStreamId == 'undefined') {
                            Helpers.logDebug('Contributing streams:');
                            Helpers.logDebug(StreamsHelpers.context.contributingStreams);
                            postStreamId = '<incorrect_list_of_stream_ids>';
                            Helpers.logDebug('record streams:');
                            Helpers.logDebug(record.streams);
                            $.each(record.streams, function (i, pStreamId) {
                                Helpers.logDebug(pStreamId);
                                Helpers.logDebug('intval: ' + parseInt(pStreamId));
                                if ($.inArray(parseInt(pStreamId), StreamsHelpers.context.contributingStreams) >= 0 || $.inArray(pStreamId.toString(), StreamsHelpers.context.contributingStreams) >= 0) {
                                    postStreamId = pStreamId;
                                }
                            });
                            Helpers.logDebug(postStreamId);
                            if (postStreamId === '<incorrect_list_of_stream_ids>') {
                                Helpers.logDebug(record);
                                postStreamId = 0;
                            }
                        }
                    } else {
                        postStreamId = StreamsHelpers.context.contributingStreams[0];
                    }
                }
                var social_type_code = record.stream_type;
                $("#for-social-hub ul.sub-navigation-filter li a[data-stream-type='" + social_type_code + "']").parent().addClass('visible');
                switch (social_type_code) {
                    case 1101:
                        newRecord = StreamsHelpers.formatFacebookPosts(record, businessOffset, widgetType, cardType);
                        break;
                    case 1102:
                        newRecord = StreamsHelpers.formatTwitterPosts(record, businessOffset, widgetType, cardType);
                        break;
                    case 1105:
                    case 1106:
                    case 1107:
                        break;
                    case 1110:
                        newRecord = StreamsHelpers.formatParllayPosts(record, businessOffset, widgetType, cardType);
                        break;
                    case 1108:
                        newRecord = StreamsHelpers.formatInstagramPosts(record, businessOffset, widgetType, cardType);
                        break;
                }
                if(newRecord === false){
                    return;
                }
                newRecord.repeat_activity = false;
                newRecord.repeat_count = 0;
                if('undefined' !== typeof record.repeat_activity && 'undefined' !== typeof record.repeat_count && record.repeat_count > 0){
                    newRecord.repeat_activity = record.repeat_activity;
                    newRecord.repeat_count = record.repeat_count;
                }
                if('undefined' !== typeof newRecord.image && newRecord.image != null){
                    newRecord.image = newRecord.image.replace('http://', '//').replace('https://', '//');
                }
                if('undefined' !== typeof newRecord.from && 'undefined' !== typeof newRecord.from.image){
                    newRecord.from.image = newRecord.from.image.replace('http://', '//').replace('https://', '//');
                }
                newRecord.streamId = postStreamId;
                if ("undefined" != typeof record.parllay && "undefined" != typeof record.parllay.pinned) {
                    newRecord.pinnedPost = record.parllay.pinned;
                }
                if ("undefined" != typeof record.parllay && "undefined" != typeof record.parllay.repeats) {
                    newRecord.repeatCount = record.parllay.repeats;
                } else {
                    newRecord.repeatCount = 0;
                }
                if (postStreamId && "undefined" != typeof record.parllay && "undefined" != typeof record.parllay[postStreamId]) {
                    newRecord.parllay = record.parllay[postStreamId];
                    if ("undefined" === typeof newRecord.parllay.target) {
                        newRecord.parllay.target = "_self";
                    }
                }
                if( "undefined" != typeof record.parllay &&  "undefined" != typeof record.parllay.cta){
                    newRecord.cta = record.parllay.cta;
                    if ("undefined" === typeof newRecord.cta.target) {
                        newRecord.cta.target = "_self";
                    }
                }
		
		newRecord.text = Helpers.htmlDecode(newRecord.text);

                if ("undefined" !== typeof textHideOptions) {
                    newRecord.text = StreamsHelpers.formatPostText(newRecord.text, textHideOptions);
                    newRecord.hideTextOnlyPost = textHideOptions.hideTextOnlyPost;
                }
                newRecord.hasVideo = 0;
                
                if('undefined' === typeof newRecord.videoUrl || newRecord.videoUrl == undefined){
                    newRecord.videoUrl = '';
                }
                Helpers.logDebug(newRecord.videoUrl);
                if (newRecord.mediaType == "video" || newRecord.videoUrl != "") {
                    newRecord.hideTextOnlyPost = 0;
                    newRecord.hasVideo = 1;
                }

                if ("undefined" !== typeof textHideOptions && "undefined" !== typeof textHideOptions.commentsRestriction) {
                    textHideOptions.commentsRestriction = parseInt(textHideOptions.commentsRestriction, 10);
                    if ("undefined" !== typeof newRecord.comments && newRecord.comments.length > textHideOptions.commentsRestriction) {
                        newRecord.comments.splice(0, newRecord.comments.length - textHideOptions.commentsRestriction);
                    }
                }
                newRecord.additional_class = "";
                if('undefined' != typeof isChromeBit && isChromeBit == false){
                    newRecord.additional_class = "cache_ready";
                }
                newRecords.push(newRecord);
            }
        });
        return newRecords;
    },
    formatParllayPosts: function (post, businessOffset, widgetType, cardType) {
        var processedPosts = null;
        var postTime = post.postedTime || post.created_time;
	var info = false;
	if(typeof post.info !== "undefined" && post.info !== null) {
	    info = JSON.parse(post.info);
	    if(typeof info.publish_time !== "undefined") {
	       postTime = info.publish_time;
	       if(!(postTime.match("T"))) {
		  postTime = postTime.replace(" ", "T");
	       }
	    }
	}
        var length = postTime.length;
        var timeStamp = null;
        if (typeof postTime === 'string' && length > 5 && postTime[length - 1] == 'Z' && postTime[length - 5] == ':') {
            var ms = Number(postTime.slice(-4, -1));
            timeStamp = Date.parse(postTime.slice(0, -5)) + ms;
        } else {
            if('undefined' === typeof post.timestamp || post.timestamp == '' || post.timestamp == null){
                timeStamp = TimeZoneHelpers.utcToTimestamp(postTime);
            } else{
                timeStamp = post.timestamp;
            }
        }
        var currentTimeStamp = Date.now();
        if(timeStamp < 1000000000000){
            currentTimeStamp = Math.floor(currentTimeStamp / 1000);
        }
        if(timeStamp > currentTimeStamp){
            // scheduled time has not reached
            return false;
        }
        postTime = TimeZoneHelpers.timestampToBusinessDateTime(timeStamp, TimeZoneHelpers.streamsTimeFormat, businessOffset);

        var postImage = post.media.image || post.full_picture || post.picture || null;
        if(postImage != null && postImage.substring(0,8) === '/uploads' && 'undefined' != typeof businessServer){
            postImage = businessServer + postImage;
        }
        var user = post.actor;

        var userId = user.id.split(":")[2];
        var postId = post.id.split(":")[2];
        var businessTimestamp = TimeZoneHelpers.ToBusinessTimeStamp(timeStamp, businessOffset);
        var ISO8601Date = TimeZoneHelpers.getISODate(timeStamp, businessOffset);

        var urls = Helpers.findUrls(post.body);

        var youTubeUrlRegex = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
        var videoType = "others"
        var entityType = "";
        var youtubeVideoId = null;
        $.each(urls, function (index, url) {
            var matches = (url.match(youTubeUrlRegex)) ? RegExp.$1 : false;
            if (matches != false) {
                post.videoUrl = url;
                youtubeVideoId = matches[0];
                videoType = "youtube";
                entityType = "video";
                return false;
            }
        });
	
	if(youtubeVideoId == null && typeof info !== "undefined" && info !== false) {
	   if(typeof info.post_type !== "undefined" && info.post_type !== null) {
	      if(info.post_type == ".mp4" || info.post_type == "video") {
		 entityType = "video";
		 var video_url = info.video_url || postImage;
		 var matches = (video_url.match(youTubeUrlRegex)) ? RegExp.$1 : false;
		 if (matches != false) {
		    videoType = "youtube";
		 }
		 post.videoUrl = video_url;
	      }
	   }
	}
	
	if(postImage && postImage.startsWith("//")) {
	   postImage = "http:" + postImage;
	}

        processedPosts = {
            "isAdmin": ("undefined" != typeof window.administrationFeatures ? window.administrationFeatures.checkIsAdmin() : ("undefined" != typeof window.parllayWidgetAdminFeatures ? window.parllayWidgetAdminFeatures.checkIsAdmin() : false)),
            "isWidget": ("undefined" != typeof StreamsHelpers.context ? (typeof StreamsHelpers.context.widgetStreams != "undefined" ? StreamsHelpers.context.widgetStreams : false) : false),
            "planId": $(".middle-content").attr('data-plan-id'),
            "businessUser": ("undefined" != typeof businessUser ? businessUser : null),
            "createdTime": postTime,
            "id": postId,
            "originalId": post.id,
            "text": post.body,
            "body": post.body,            
            "image": postImage,
            "cardType": cardType,
            "animationClass": Helpers.animationClasses[cardType] || '',
            "name": post.name,
            "postedTime": ISO8601Date,
            "caption": post.caption,
            "description": post.description,
            "mediaType": entityType,
            "videoType": videoType,
            "timeStamp": businessTimestamp,
            "videoUrl": post.videoUrl,
            "videoId": youtubeVideoId,
            "url": post.link,
            "widgetType": widgetType,
            "social_type_code": post.stream_type,
            "from": {
                "id": user.id,
                "name": user.displayName,
                "handle": user.preferredUsername,
                "url": user.link,
                "image": user.image
            }
        };
        return processedPosts;
    },
    formatInstagramPosts: function (media, businessOffset, widgetType, cardType) {
        var processedMedias = null;
        var timeStamp = media.created_time * 1000; //convert into milliseconds

        var createdTime = TimeZoneHelpers.timestampToBusinessDateTime(timeStamp, TimeZoneHelpers.streamsTimeFormat, businessOffset);

        var mediaImage = (media.images.standard_resolution.url) ? media.images.standard_resolution.url : null;

        var user = media.user;

        var comments = [];
        if (media.comments.data) {
            media.comments.data.forEach(function (comment) {
                comments.push({
                    "id": comment.id,
                    "message": comment.text,
                    "from": {
                        "id": comment.from.id,
                        "name": ("undefined" !== typeof comment.from.full_name && $.trim(comment.from.full_name) != "") ? $.trim(comment.from.full_name) : comment.from.username,
                        "image": comment.from.profile_picture
                    }
                });
            });
        }

        var videoUrl = (media.type == 'video') ? media.videos.standard_resolution.url : '';
        var businessTimestamp = TimeZoneHelpers.ToBusinessTimeStamp(timeStamp, businessOffset);
        var ISO8601Date = TimeZoneHelpers.getISODate(timeStamp, businessOffset);
        var processedMedias = {
            "isAdmin": ("undefined" != typeof window.administrationFeatures ? window.administrationFeatures.checkIsAdmin() : ("undefined" != typeof window.parllayWidgetAdminFeatures ? window.parllayWidgetAdminFeatures.checkIsAdmin() : false)),
            "isWidget": ("undefined" != typeof StreamsHelpers.context ? (typeof StreamsHelpers.context.widgetStreams != "undefined" ? StreamsHelpers.context.widgetStreams : false) : false),
            "planId": $(".middle-content").attr('data-plan-id'),
            "businessUser": ("undefined" != typeof businessUser ? businessUser : null),
            "createdTime": createdTime,
            "id": media.id,
            "originalId": media.id,
            "mediaType": media.type,
            "videoType": "others",
            "videoUrl": videoUrl,
            "text": (media.caption != null ? media.caption.text : ''),
            "body": (media.caption != null ? media.caption.text : ''),            
            "image": mediaImage,
            "cardType": cardType,
            "animationClass": Helpers.animationClasses[cardType] || '',
            "likes": media.likes.data,
            "likeCount": media.likes.count,
            "commentCount": media.comments.count,
            "widgetType": widgetType,
            "comments": comments,
            "postedTime": ISO8601Date,
            "timeStamp": businessTimestamp,
            "url": media.link,
            "liked": media.user_has_liked,
            "location": media.location,
            "social_type_code": media.stream_type,
            "from": {
                "id": user.id,
                "name": ("undefined" !== typeof user.full_name && $.trim(user.full_name) != "") ? $.trim(user.full_name) : user.username,
                "handle": user.username,
                "url": "//instagram.com/" + user.username,
                "image": ('undefined' !== typeof user.profile_picture?user.profile_picture: '//avatars.io/instagram/' + user.username)
            }
        };
        return processedMedias;
    },
    formatTwitterPosts: function (tweet, businessOffset, widgetType, cardType) {
        var processedTweets = null;
        var length = tweet.postedTime.length;
        var timeStamp = null;
        if (typeof tweet.postedTime === 'string' && length > 5 && tweet.postedTime[length - 1] == 'Z' && tweet.postedTime[length - 5] == ':') {
            var ms = Number(tweet.postedTime.slice(-4, -1));
            timeStamp = Date.parse(tweet.postedTime.slice(0, -5)) + ms;
        } else {
            timeStamp = TimeZoneHelpers.utcToTimestamp(tweet.postedTime);
        }
        var tweetTime = TimeZoneHelpers.timestampToBusinessDateTime(timeStamp, TimeZoneHelpers.streamsTimeFormat, businessOffset);

        var tweetedImage = null;

        tweet.videoUrl = "";

        var entityType = ""

        var videoType = "others";

        if (typeof tweet.twitter_extended_entities !== "undefined" && typeof tweet.twitter_extended_entities.media !== "undefined" && tweet.twitter_extended_entities.media.length > 0) {
            var medias = tweet.twitter_extended_entities.media;
            medias.forEach(function (entity) {
                if (entity.type == "video") {
                    var youTubeUrlRegex = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
                    var matches = (entity.url.match(youTubeUrlRegex)) ? RegExp.$1 : false;

                    if (matches != false) {
                        tweet.videoUrl = entity.url;
                        videoType = "youtube";
                        entityType = "video";
                    } else if ("undefined" !== typeof entity.video_info && "undefined" !== typeof entity.video_info.variants) {
                        var videoInfo = entity.video_info;
                        $.each(videoInfo.variants, function (index, variant) {
                            if ("undefined" !== typeof variant.content_type && variant.content_type == "video/mp4") {
                                tweet.videoUrl = variant.url;
                                videoType = "others";
                                entityType = "video";
                            }
                        });
                    } else {
                        entityType = "photo";
                    }
                    tweetedImage = entity.media_url;
                } else if (entity.type == "photo") {
                    tweetedImage = entity.media_url;
                    entityType = "photo";
                }
            });
        }

        if (tweet.videoUrl == "" && "undefined" !== typeof tweet.twitter_entities && "undefined" !== typeof tweet.twitter_entities.urls) {
            var urls = tweet.twitter_entities.urls;
            $.each(urls, function (index, url) {
                var expandedUrl = url.expanded_url;
                var youTubeUrlRegex = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
                var matches = (expandedUrl.match(youTubeUrlRegex)) ? RegExp.$1 : false;

                if (matches != false) {
                    entityType = "video";
                    videoType = "youtube";
                    tweet.videoUrl = expandedUrl;
                    return false;
                } /*else if(expandedUrl.indexOf('vimeo.com/') >= 0){
                    entityType = "video";
                  //  videoType = "vimeo";
                    tweet.videoUrl = expandedUrl;
                }*/
            });
        }

        if (tweet.videoUrl == "" && tweetedImage == null && "undefined" !== typeof tweet.twitter_entities && "undefined" !== typeof tweet.twitter_entities.media && tweet.twitter_entities.media.length > 0) {
            var medias = tweet.twitter_entities.media;
            medias.forEach(function (media) {
                if (media.type == "photo") {
                    tweetedImage = media.media_url;
                    entityType = "photo";
                }
            });
        }

        var user = tweet.actor;

        var userId = user.id.split(":")[2];
        var tweetId = tweet.id.split(":")[2];
        var commentCount = 0;
        var comments = [];
        var businessTimestamp = TimeZoneHelpers.ToBusinessTimeStamp(timeStamp, businessOffset);
        var ISO8601Date = TimeZoneHelpers.getISODate(timeStamp, businessOffset);
      //  console.log(tweet.body);
        processedTweets = {
            "isAdmin": ("undefined" != typeof window.administrationFeatures ? window.administrationFeatures.checkIsAdmin() : ("undefined" != typeof window.parllayWidgetAdminFeatures ? window.parllayWidgetAdminFeatures.checkIsAdmin() : false)),
            "isWidget": ("undefined" != typeof StreamsHelpers.context ? (typeof StreamsHelpers.context.widgetStreams != "undefined" ? StreamsHelpers.context.widgetStreams : false) : false),
            "planId": $(".middle-content").attr('data-plan-id'),
            "businessUser": ("undefined" != typeof businessUser ? businessUser : null),
            "createdTime": tweetTime,
            "id": tweetId,
            "originalId": tweet.id,
            "text": tweet.body.toString(),
            "body": tweet.body,
            "image": tweetedImage,
            "cardType": cardType,
            "animationClass": Helpers.animationClasses[cardType] || '',
            "retweetCount": tweet.retweetCount,
            "favoriteCount": tweet.favoritesCount,
            "commentCount": commentCount,
            "timeStamp": businessTimestamp,
            "videoUrl": tweet.videoUrl,
            "mediaType": entityType,
            "videoType": videoType,
            "postedTime": ISO8601Date,
            "comments": comments,
            "url": "//twitter.com/statuses/" + tweetId,
            "favorited": tweet.favorited, // need data from service
            "retweeted": (tweet.retweeted), // need data from service
            "isRetweet": (Helpers.strncmp(tweet.body, "RT @", 4) == 0),
            "widgetType": widgetType,
            "replyToTweetId": (tweet.in_reply_to_status_id_str ? tweet.in_reply_to_status_id_str : tweetId), // need data from service
            "twitterEntities": tweet.twitter_entities,
            "coordinates": tweet.coordinates, // need data from service
            "lang": tweet.twitter_lang,
            "social_type_code": tweet.stream_type,
            "from": {
                "id": userId,
                "name": user.displayName,
                "handle": user.preferredUsername,
                "url": user.link,
                "followersCount": user.followersCount,
                "followingCount": user.friendsCount,
                "favoritesCount": user.favoritesCount,
                "listedCount": user.listedCount,
                "tweetsCount": user.statusesCount,
                "location": user.location,
                "userEntities": user.entities, //no data from service
                "image": user.image
            }
        };
     //   console.log(processedTweets);
        return processedTweets;
    },
    formatFacebookPosts: function (post, businessOffset, widgetType, cardType) {
        var processedPosts = null;
        var postTime = post.postedTime || post.created_time;
        var length = postTime.length;
        var timeStamp = null;
        if (typeof postTime === 'string' && length > 5 && postTime[length - 1] == 'Z' && postTime[length - 5] == ':') {
            var ms = Number(postTime.slice(-4, -1));
            timeStamp = Date.parse(postTime.slice(0, -5)) + ms;
        } else {
            timeStamp = TimeZoneHelpers.utcToTimestamp(postTime);
        }
        Helpers.logDebug(timeStamp);
        var postTime = TimeZoneHelpers.timestampToBusinessDateTime(timeStamp, TimeZoneHelpers.streamsTimeFormat, businessOffset);

        var postImage = post.full_picture || post.source || null;
        if(postImage === null){ 
             if('undefined' !== typeof post.images){
                 postImage = post.images[0].source;
             } else {
                 postImage = post.picture || null;
             }
        }

        var user = post.actor;

        var userId = user.id.split(":")[2];
        var postId = post.id.split(":")[1];

        var commentCount = 0;
        var comments = [];
        var businessTimestamp = TimeZoneHelpers.ToBusinessTimeStamp(timeStamp, businessOffset);
        var ISO8601Date = TimeZoneHelpers.getISODate(timeStamp, businessOffset);

        var videoUrl = "";
        var videoType = "others"

        if (post.type == "video" && "undefined" !== typeof post.attachments) {
            $.each(post.attachments.data, function (index, attachment) {
                if ("undefined" !== typeof attachment.type) {
                    if (attachment.type == "video_share_youtube") {
                        videoUrl = post.link;
                        videoType = "youtube";
                    } else if (attachment.type == "video_inline") {
                        videoType = "others";
                        videoUrl = post.source;
                    }
                }
            });
        }

        processedPosts = {
            "isAdmin": ("undefined" != typeof window.administrationFeatures ? window.administrationFeatures.checkIsAdmin() : ("undefined" != typeof window.parllayWidgetAdminFeatures ? window.parllayWidgetAdminFeatures.checkIsAdmin() : false)),
            "isWidget": ("undefined" != typeof StreamsHelpers.context ? (typeof StreamsHelpers.context.widgetStreams != "undefined" ? StreamsHelpers.context.widgetStreams : false) : false),
            "planId": $(".middle-content").attr('data-plan-id'),
            "businessUser": ("undefined" != typeof businessUser ? businessUser : null),
            "createdTime": postTime,
            "id": postId,
            "originalId": post.id,
            "text": post.body || post.name || "",
            "body": post.body || post.name || "",            
            "image": postImage,
            "cardType": cardType,
            "animationClass": Helpers.animationClasses[cardType] || '',
            "likeCount": post.retweetCount,
            "shareCount": post.favoritesCount,
            "commentCount": commentCount,
            "fbPostType": post.type,
            "fbSource": post.d,
            "fbStatusType": post.status_type,
            "fbLink": post.link,
            "name": post.name,
            "postedTime": ISO8601Date,
            "caption": post.caption,
            "description": post.description,
            "fbAttachments": post.attachments || [ ],
            "timeStamp": businessTimestamp,
            "videoUrl": videoUrl,
            "mediaType": post.type,
            "videoType": videoType,
            "comments": comments,
            "url": post.link,
            "favorited": post.favorited, // need data from service
            "isLiked": post.isLiked,
            "widgetType": widgetType,
            "social_type_code": post.stream_type,
            "from": {
                "id": user.id,
                "name": user.displayName,
                "handle": user.preferredUsername,
                "url": user.link,
                "image": '//graph.facebook.com/' + user.id + '/picture'
            }
        };
        return processedPosts;
    },
    _processTweetText: function () {
    },
    _makeLinkable: function (post) {
        return post.replace(/(https?[:]\/\/[^\s]+)(?:\s|$)/g, ' <a class="link" href="$1" target="_blank">$1</a>', post);
    }
};
$(document).ready(function () {
    $('html').click(function () {
        parent.postMessage({"parllayPageClicked": true}, '*');
    });
});

if (!String.prototype.startsWith) {
   String.prototype.startsWith = function(searchString, position) {
      position = position || 0;
      return this.substr(position, searchString.length) === searchString;
   };
}