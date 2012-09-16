var util = require("util"),
	nano = require("nano"), // npm install nano
	auth = require("./credentials").couchdb,
	usersDb = nano("https://" + auth + "@sleepcam.iriscouch.com/_users");

// Add a role to every new user,
// because without a role they will get stale ETags when they log in and out.

var feed = usersDb.follow({include_docs: true});
feed.on("change", function (change) {
	var doc = change.doc;
	if (!doc) {
		util.puts("No doc: " + JSON.stringify(change));
		return;
	}
	if (doc.type != "user") {
		return;
	}
	var roles = doc.roles;
	if (roles && !roles.length) {
		roles.push("user");
		usersDb.insert(doc, function (er, ok) {
			if (er) util.puts("Error saving doc for " + doc.name +
				": " + JSON.stringify(er));
			else util.puts("Saved doc for " + doc.name);
		});
	} else {
		util.puts("Skipping " + doc.name);
	}
});
feed.follow();
