function(head, req) {
	var Mustache = require("vendor/mustache");

	provides("html", function () {
		var user = req.query.user,
			currentUser = req.userCtx.name,
			isAdmin = req.userCtx.roles.indexOf("_admin") != -1,
			row = getRow(),
			profile = {},
			hashPicId = req.query._escaped_fragment_,
			gotHashPic;

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
		var path = [req.headers.Host].concat(req.requested_path.slice(0, -2)).join("/");
		var stash = {
			hash: hashPicId ? "#!" + hashPicId : "",
			header: {},
			base: "../",
			abs_base: "http://" + path + "/",
			current_user: currentUser,
			user: user,
			icon: iconTime ? "images/pics/small/" + iconTime + "-" + user : null,
			pics: [],
			is_mine: currentUser == user
		};

		if (row) do {
			var doc = row.doc;
			if (!doc) continue;

			// If a pic is specified in the escaped hash,
			// select it, and don't show the other pics
			if (hashPicId) {
				if (hashPicId + "-" + user == row.id) {
					gotHashPic = true;
				} else if (gotHashPic) {
					break;
				} else {
					continue;
				}
			}

			var comments = doc.comments || [];
			comments.forEach(function (comment) {
				comment.icon = "images/profile/profile-" + comment.user;
				comment.date = new Date(comment.time * 1000).toDateString();
				// Can delete your own comments or comments on your stuff
				if (isAdmin ||
					currentUser == comment.user ||
					currentUser == user)
						comment.can_delete_comment = true;
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

		// pic for facebook is either pic referenced by hash,
		// or first 10 pics in the ;ist
		stash.og_pics = stash.pics.slice(0, 10);

		stash.og_desc = gotHashPic ?
			"Picture taken when " + user + "'s computer woke from sleep" :
			"Pictures taken when " + user + "'s computer wakes from sleep";
		stash.og_title = gotHashPic ?
			user + "'s Sleepcam: " + stash.pics[0].date.toDateString() :
			user + "'s Sleepcam";

		return Mustache.render(this.templates.profile, stash, this.templates.partials);
	});
}
