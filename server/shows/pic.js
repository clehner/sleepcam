function(doc, req) {
	var Mustache = require("vendor/mustache");

	provides("html", function () {
		var user = doc.user;
		var comments = doc.comments || [];
		comments.forEach(function (comment) {
			comment.icon = "images/profile/profile-" + user;
			comment.date = new Date(comment.time * 1000);
		});
		return Mustache.render(this.templates.pic, {
			header: {
				current_user: req.userCtx.name,
				base: "../"
			},
			user: user,
			date: new Date(doc.time * 1000),
			id: doc._id,
			comments: comments,
			likes: doc.likes || []
		}, this.templates.partials);
	});
}