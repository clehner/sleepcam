function(doc, req) {
	var q = req.query;
	return (doc.type == "pic") &&
		!doc._deleted && // not deleted
		(q.include_updates || doc._rev.indexOf("1-") == 0) && // only new docs
		(!q.user || doc.user == q.user); // by specific user
}
