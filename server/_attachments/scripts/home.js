(function () {

// Add a new pic to the recents list
function gotPic(id, user, time, date) {
	var li = document.createElement("li");

	var a = document.createElement("a");
	a.href = "profile/" + user + "#!" + time;			
	a.title = user + " on " + date.toDateString();
	li.appendChild(a);

	var img = document.createElement("img");
	img.src = "images/pics/small/" + id;
	a.appendChild(img);

	var picsList = $("pics");
	picsList.insertBefore(li, picsList.firstChild);
}

// Listen for newly added pics
app.getDb(function (db) {
	db.changes(null, {
		filter: "sleepcam/new-pics"
	}).onChange(function (resp) {
		if (resp.results) resp.results.forEach(function (change) {
			var id = change.id;
				s = id.split("-"),
				user = s[1],
				time = s[0],
				date = new Date(time * 1000);

			gotPic(id, user, time, date);
		});
	});
});

}());
