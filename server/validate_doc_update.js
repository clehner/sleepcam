function arrayDiff(oldArray, newArray, isEqual, onAppend, onRemove) {
	if (!oldArray) oldArray = '';
	if (!newArray) newArray = '';
	if (oldArray == newArray) return;

	var itemsDeleted = 0;
	for (var i = 0; i < oldArray.length; i++) {
		var oldItem = oldArray[i];
		var newItem = newArray[i-itemsDeleted];
		if (isEqual ? !isEqual(newItem, oldItem) : (newItem != oldItem)) {
			onRemove(oldItem);
			itemsDeleted++;
		}
	}

	for (i -= itemsDeleted; i < newArray.length; i++) {
		onAppend(newArray[i]);
	}
}

function commentsEqual(a, b) {
	return a && b &&
		a.user == b.user &&
		a.time == b.time &&
		a.content == b.content;
}

function isArrayOrNull(a) {
	return a == null ||
		(typeof a == "object" && a.length >= 0);
}

function (doc, oldDoc, userCtx) {
	var isAdmin = userCtx.roles.indexOf('_admin') != -1;
	if (!oldDoc) oldDoc = 0;

	if (doc.type == "pic") {
		// auth

		if (!userCtx.name && !isAdmin)
			throw {unauthorized: "You must be logged in."};

		if (doc._deleted) {
			if (oldDoc.user != userCtx.name && !isAdmin)
				throw {unauthorized: "this is not your doc to delete."};
			return;
		}

		if (oldDoc && oldDoc.user != doc.user)
			throw {unauthorized: "doc owner cannot be changed."};

		if (doc.user != userCtx.name && !isAdmin)
			throw {unauthorized: "this is not your doc."};

		// schema

		if (doc._id != doc.time + "-" + doc.user)
			throw {forbidden: "doc id must be in format \"time-user\""};

		if (typeof doc.time != "number")
			throw {forbidden: "doc must have a numeric timestamp."};

		if (oldDoc && oldDoc.time != doc.time)
			throw {unauthorized: "timestamp cannot be changed"};

		if (!doc._attachments)
			throw {forbidden: "doc needs picture attachments."};

		var largePic = doc._attachments["large.jpg"];
		var smallPic = doc._attachments["small.jpg"];
		if (!largePic || !smallPic)
			throw {forbidden: "doc needs attachments large.jpg and small.jpg"};

		if (largePic.content_type != "image/jpeg" ||
			smallPic.content_type != "image/jpeg")
				throw {forbidden: "pictures must be jpeg"};

		if (smallPic.length > largePic.length)
			throw {forbidden: "large pic should be larger than small pic!"};

		if (!isArrayOrNull(doc.likes))
			throw {forbidden: "improper likes array"};

		arrayDiff(oldDoc.likes, doc.likes, null,
			function like(like) {
				if (like != userCtx.name && !isAdmin)
					throw {unauthorized: "you can only like for yourself"};
			},
			function unlike(like) {
				if (like != userCtx.name && !isAdmin)
					throw {unauthorized: "cannot unlike another's like"};
			}
		);

		if (!isArrayOrNull(doc.comments))
			throw {forbidden: "improper comments array"};

		arrayDiff(oldDoc.comments, doc.comments, commentsEqual,
			function onAddComment(comment) {
				if (comment.user != userCtx.name)
					throw {unauthorized: "comment with your own name."};

				if (comments[i-1] && comments[i-1].time > comment.time)
					throw {forbidden: "comment time must be after previous"};

				if (typeof comment.content != "string" ||
					comment.content.trim().length == 0)
						throw {forbidden: "comment must have text content"};
			},
			function onRemoveComment(comment) {
				if (!isAdmin &&
					userCtx.name != doc.user &&
					userCtx.name != comment.user)
						throw {unauthorized: "you can only remove your own comments or comments made on your pictures."}; 
			}
		);

	} else if (doc.type == "profile") {
		// auth

		if (!userCtx.name && !isAdmin)
			throw {unauthorized: "You must be logged in."};

		if (doc._deleted) {
			if (oldDoc.user != userCtx.name && !isAdmin)
				throw {unauthorized: "this is not your doc to delete."};
			return;
		}

		if (oldDoc && oldDoc.user != doc.user)
			throw {unauthorized: "doc owner cannot be changed."};

		if (doc.user != userCtx.name && !isAdmin)
			throw {unauthorized: "this is not your doc."};

		// schema

		if (doc._id != "profile-" + doc.user)
			throw {forbidden: "doc id must be in format \"profile-USER\""};

		//if (typeof doc.title != "string")
			//throw {forbidden: "doc must have a title."};

		if (doc.profile_pic_time != null &&
			typeof doc.profile_pic_time != "number")
				throw {forbidden: "profile_pic_time must be a number."};

		if (!isArrayOrNull(doc.follows))
			throw {forbidden: "improper follows array"};

		arrayDiff(oldDoc.follows, doc.follows, null,
			function follow(user) {
				if (user != userCtx.name && !isAdmin)
					throw {unauthorized: "you can only follow for yourself"};
			},
			function unfollow(user) {
				if (user != userCtx.name && !isAdmin)
					throw {unauthorized: "cannot unfollow from someone else"};
			}
		);

	} else if (doc.type == "error") {
	} else {
		throw {forbidden: "unknown doc type"};
	}
}
