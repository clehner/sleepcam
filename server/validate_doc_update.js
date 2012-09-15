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
		onAppend(newArray[i], i);
	}
}

function isArrayOrNull(a) {
	return a == null ||
		(typeof a == "object" && a.length >= 0);
}

function (doc, oldDoc, userCtx) {
	var isAdmin = userCtx.roles.indexOf('_admin') != -1;
	if (!oldDoc) oldDoc = 0;

	if (oldDoc.type && oldDoc.type != doc.type)
		throw {forbidden: "Cannot change doc type"};

	if (doc.type == "pic") {
		// auth

		var isMyDoc = (doc.user == userCtx.name) || isAdmin;

		if (!userCtx.name && !isAdmin)
			throw {unauthorized: "You must be logged in."};

		if (doc._deleted) {
			if (oldDoc.user != userCtx.name && !isAdmin)
				throw {unauthorized: "this is not your doc to delete."};
			return;
		}

		if (oldDoc && oldDoc.user != doc.user)
			throw {unauthorized: "doc owner cannot be changed."};

		// need to be able to comment and like, so this is removed.
		//if (!isMyDoc)
			//throw {unauthorized: "this is not your doc."};

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

		// prevent other users from altering the pictures
		var oldAttachments = oldDoc && oldDoc._attachments;
		var oldLargePic = oldAttachments && oldAttachments["large.jpg"];
		var oldSmallPic = oldAttachments && oldAttachments["small.jpg"];

		if (!isAdmin &&
			(oldSmallPic && oldSmallPic.digest != smallPic.digest ||
			oldLargePic && oldLargePic.digest != largePic.digest))
			throw {unauthorized: "cannot change pic"};

		if (!isArrayOrNull(doc.likes))
			throw {forbidden: "improper likes array"};

		arrayDiff(oldDoc.likes, doc.likes,
			function likesEqual(a, b) {
				return a && b &&
					a.user == b.user &&
					a.time == b.time;
			},
			function onAddLike(like, i) {
				if (like.user != userCtx.name && !isAdmin)
					throw {unauthorized: "you can only like for yourself"};

				if (doc.likes[i-1] && doc.likes[i-1].time > like.time)
					throw {forbidden: "like time must be after previous"};
			},
			function onUnlike(like) {
				if (like.user != userCtx.name && !isAdmin)
					throw {unauthorized: "cannot unlike another's like"};
			}
		);

		if (!isArrayOrNull(doc.comments))
			throw {forbidden: "improper comments array"};

		arrayDiff(oldDoc.comments, doc.comments,
			function commentsEqual(a, b) {
				return a && b &&
					a.user == b.user &&
					a.time == b.time &&
					a.content == b.content;
			},
			function onAddComment(comment, i) {
				if (comment.user != userCtx.name && !isAdmin)
					throw {unauthorized: "comment with your own name."};

				if (doc.comments[i-1] && doc.comments[i-1].time > comment.time)
					throw {forbidden: "comment time must be after previous"};

				if (typeof comment.content != "string" ||
					comment.content.trim().length == 0)
						throw {forbidden: "comment must have text content"};
			},
			function onRemoveComment(comment) {
				if (!isAdmin &&
					userCtx.name != doc.user &&
					userCtx.name != comment.user)
						throw {unauthorized: "you can only remove " +
							"your own comments or comments made on your pictures."}; 
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
