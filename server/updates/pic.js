function(doc, req) {
	if (!doc) return;
	var user = req.userCtx.name;

	if (req.form.delete) {
		doc._deleted = true;
	}

	if (req.form.post_comment) {
		var comment = {
			content: String(req.form.post_comment).trim(),
			time: new Date()/1000,
			user: user
		};
		if (doc.comments)
			doc.comments.push(comment);
		else
			doc.comments = [comment];
	}

	if (req.form.delete_comment) {
		var time = Number(req.form.delete_comment);
		if (doc.comments) for (var i = 0; i < doc.comments.length; i++) {
			if (doc.comments[i].time == time) {
				doc.comments.splice(i, 1);
				break;
			}
		}
	}

	if (req.form.like) {
		var like = {
			user: user,
			time: new Date()/1000
		};
		if (!doc.likes) {
			doc.likes = [like];
		} else if (doc.likes.every(function (like) {
			return like.user != user;
		})) {
			doc.likes.push(like);
		}
	}

	if (req.form.unlike) {
		if (doc.likes) doc.likes = doc.likes.filter(function (like) {
			return like.user != user;
		});
	}

	return [doc, "ok"];

	/*
	if (req.headers.Accept == "application/json") {
		return [doc, {
			code: 302,
			body: "",
			headers: {
				Location: "../profile/" + doc.user
			}
		}];
	}
	return [doc, {
		headers: {
			Location: "?"
		}
	}];
	*/
}
