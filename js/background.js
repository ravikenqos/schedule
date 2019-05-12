 chrome.app.runtime.onLaunched.addListener(function(e) {
//	if (chrome.power) {
		chrome.power.requestKeepAwake('display');
//	}
	
	chrome.app.window.create('../index.html', {

			'state' : 'fullscreen'
	})

});

