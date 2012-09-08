function(doc) {
	if (doc.type == "profile") {
		if (doc.follows) doc.follows.forEach(function (follow) {
			emit(follow, doc.user);
		});
	}
}
