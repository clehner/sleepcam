function(doc) {
	if (doc.type == "pic") {
		emit(doc.time, null);
	}
}
