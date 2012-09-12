(function (global) {

var app = {};

setTimeout(function () {
	app.user = ($("session").getElementsByTagName("a")[0]
		.href.match(/profile\/([^"]+)/) || 0)[1];
}, 100);

global.app = app;

}(window));
