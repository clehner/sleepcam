
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
			if (opt.format == "json") {
				try {
					resp = JSON.parse(resp);
				} catch (e) {
					resp = {error: "JSON error", reason: e.message};
				} finally {
					if (opt.error) {
						opt.error(resp);
					} else {
						alert("JSON Error: " + e.message);
					}
				}
			}

			if (opt.success) {
				opt.success(resp);
			}
			xhr = null;
		}
	};
	xhr.send(sendingData ? data : null);
}

function ajaxSubmit(form, cb) {
	var data = {};
	["input", "select", "textarea"].forEach(function (tag) {
		[].forEach.call(form.getElementsByTagName(tag), function (input) {
			var name = input.name || input.id;
			if (name) data[name] = input.value;
		});
	});
	ajax(form.action || "", {
		method: form.method,
		data: data,
		success: cb
	});
}

function $(id) {
	return document.getElementById(id);
}

