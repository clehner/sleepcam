function(head, req) {
	var Mustache = require("vendor/mustache");

	provides("html", function () {
		var user = req.query.user;
		var row = getRow();
		var profile = {};
		if (!row) {
			// fail
			start({
				status: 404,
				body: 'User "' + user + '" not found.'
			});

		} else if (row.key && typeof row.key[1] == "object") {
			// got `user profile doc
			profile = row.value;
			row = getRow();
		}

		var iconTime = profile.profile_pic_time;
		var stash = {
			header: {
				current_user: req.userCtx.name,
				base: "../"
			},
			user: user,
			icon: iconTime ? "images/pics/small/" + iconTime + "-" + user : null,
			pics: []
		};

		if (row) do {
			var doc = row.doc;
			if (!doc) continue;

			var comments = doc.comments || [];
			comments.forEach(function (comment) {
				comment.icon = "images/profile/profile-" + user;
				comment.date = new Date(comment.time * 1000).toDateString();
			});
			stash.pics.push({
				id: row.id,
				link: "pic/" + row.id,
				comments: comments,
				likes: doc.likes || [],
				time: Number(doc.time),
				date: new Date(doc.time * 1000)
			});
		} while (row = getRow());

		return Mustache.render(this.templates.profile, stash, this.templates.partials);
	});
}