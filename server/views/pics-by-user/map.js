function(doc) {
	if (doc.type == "pic") {
		emit([doc.user, doc.time], null);
	} else if (doc.type == "profile") {
		emit([profile.user, {}], doc);
	}
}
