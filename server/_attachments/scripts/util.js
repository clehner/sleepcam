
function makeQuery(params) {
	var parts = [];
	for (var i in params) {
		parts[parts.length] = i + '=' + encodeURIComponent(params[i]);
	}
	return parts.join('&');
}

function ajax(url, opt) {
	var xhr = new XMLHttpRequest();
	var headers = opt.headers || {};
	var method = opt.method ? opt.method.toUpperCase() : "GET";
	var sendingData = method != "GET";
	if (sendingData) {
		headers["Content-Type"] = "application/x-www-form-urlencoded";
	}

	var data = opt.data || "";
	if (data && typeof data != "string") {
		if (opt.format && opt.format.toLowerCase() == "json") {
			data = JSON.stringify(data);
		} else {
			data = makeQuery(data);
		}
	}
	if (data && method == "GET") {
		url += "?" + data;
	}

	xhr.open(method, url, true);

	for (var header in headers) {
		xhr.setRequestHeader(header, headers[header]);
	}

	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			var resp = xhr.responseText;
			if (opt.format == "json" || opt.response_format == "json") {
				try {
					resp = JSON.parse(resp);
				} catch (e) {
					resp = {error: "JSON error", reason: "JSON decoding failed"};
				} finally {
					if (xhr.status in {200:1, 201:1, 202:1}) {
						if (opt.success) opt.success(resp);
					} else if (opt.error) {
						opt.error(resp);
					} else {
						alert("Error: " + resp.reason);
					}
				}
			} else if (opt.success) {
				opt.success(resp);
			}
			xhr = null;
		}
	};
	xhr.send(sendingData ? data : null);
}

function $(id) {
	return document.getElementById(id);
}

// http://www.nczonline.net/blog/2009/07/28/the-best-way-to-load-external-javascript/
function loadScript(url, callback) {
	var script = document.createElement("script");
	script.type = "text/javascript";
	script.async = "async";

	if (!callback) {
	} else if (script.readyState) { // IE
		script.onreadystatechange = function () {
			if (script.readyState in {loaded:1, complete:1}) {
				script.onreadystatechange = null;
				callback();
			}
		};
	} else { // others
		script.onload = callback;
	}

	script.src = url;
	var head = document.documentElement.firstChild;
	head.insertBefore(script, head.firstChild);
}

// Conditionally load a script
function shim(feature, url, callback) {
	if (feature) {
		callback && callback();
	} else {
		loadScript(url, callback);
	}
}

