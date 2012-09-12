function(head, req) {
	var Mustache = require("vendor/mustache");

	provides("html", function () {
		var row;
		var path = [req.headers.Host].concat(req.requested_path).join("/");
		var stash = {
			header: {},
			base: "",
			abs_base: "http://" + path + "/",
			current_user: req.userCtx.name,
			pics: []
		};

		while (row = getRow()) {
			var id = row.id;
			if (!id) break;
			var time = row.key;
			var date = new Date(time * 1000);
			stash.pics.push({
				id: id,
				user: id.split('-')[1],
				time: time,
				date: date.toDateString()
			});
		}

		stash.og_pics = stash.pics.slice(0, 4);

		return Mustache.render(this.templates.index, stash, this.templates.partials);
	});
}

