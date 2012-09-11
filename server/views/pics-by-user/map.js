function(doc) {
	if (doc.type == "pic") {
		emit([doc.user, String(doc.time)], null);
	} else if (doc.type == "profile") {
		emit([doc.user, {}], doc);
	}
}
