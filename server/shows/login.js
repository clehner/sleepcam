function(doc, req) {
	var Mustache = require("vendor/mustache");

	provides("html", function () {
		return this.templates.login;
	});
}

