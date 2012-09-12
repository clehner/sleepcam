(function () {

var picsInfo = $("pics-info"),
	largePic = $("large-pic"),
	picsList = $("pics"),
	thumbLocked = false,
	selectedThumb,
	selectedInfo,
	selectedTime,
	picTime = picsInfo.getElementsByTagName("time")[0],

	commentForm = $("comment-form"),
	commentField = $("comment"),
	commentList,
	unsentComments = {},
	likeList,
	commentList,
	likeLink = $("like-link");

// Picture selection

function selectThumb(thumb) {
	if (!thumb) return selectNone();
	if (thumb == selectedThumb) return;
	if (selectedThumb) {
		selectedThumb.className = "";
	}
	selectedThumb = thumb;
	selectedThumb.className = "selected";
	largePic.src = thumb.src.replace('small', 'large');
}

function picLoaded() {
	var s = largePic.src.match(/large\/(.+)/);
	if (!s) return;
	var id = s[1] || "";
	var time = id.split("-")[0];
	var newInfo = $("pic-" + time + "-info");
	if (!newInfo || newInfo == selectedInfo) return;
	if (selectedInfo) selectedInfo.style.display = "";
	selectedInfo = newInfo;
	selectedInfo.style.display = "block";
	selectedTime = time;

	var uls = selectedInfo.getElementsByTagName("ul");
	likeList = uls[0];
	commentList = uls[1];

	picTime.setAttribute("datetime", selectedTime);
	updateTime(picTime);
	commentForm.action = "../pic/" + id;
	var unsentComment = !submittingComment && commentField.value;
	unsentComments[time] = unsentComment;
	commentField.value = unsentComments[time] || "";
	updateLikeList();
}
largePic.addEventListener("load", picLoaded, false);
//if (largePic.src) picLoaded();

function selectFirst() {
	selectThumb(picsList.getElementsByTagName("img")[0]);
}
function selectNone() {
	if (selectedInfo) selectedInfo.style.display = "";
	picTime.removeAttribute("datetime");
	picTime.firstChild.nodeValue = "";
	largePic.src = "../images/transparent.gif";
}

function picClick(e) {
	if (!e.target.src) return;
	if (e.target && e.target.src) selectThumb(e.target);
}
pics.addEventListener("click", picClick, false);

function onHashChange(e) {
	var hash = location.hash.substr(1), a, img;
	if ((hash[0] == "!") &&
		(a = $("pic-" + hash.substr(1))) &&
		(img = a.getElementsByTagName("img")[0])) {

		selectThumb(img);

		// scroll pic into view, if necessary
		var li = a.parentNode,
			ul = picsList;
		if (ul.scrollTop > li.offsetTop) {
			ul.scrollTop = li.offsetTop;
		} else if (ul.scrollTop + ul.clientHeight < li.offsetTop + li.offsetHeight) {
			ul.scrollTop = li.offsetTop + li.offsetHeight - ul.clientHeight;
		}
	}
}
window.addEventListener("hashchange", onHashChange, false);
onHashChange();
// if hash does give a pic selection, select the first one.
if (!selectedThumb) selectFirst();

function timeUnit(n, unit) {
	return ~~n + " " + unit + (~~n == 1 ? "" : "s") + " ago";
}
function updateTimes(container) {
	var els = (container || document).getElementsByTagName("time");
	for (var i = 0; i < els.length; i++) {
		updateTime(els[i]);
	}
}
function updateTime(el) {
	var time = el.getAttribute("datetime");
	var date = new Date(time * 1000);
	if (!time) return;
	var dt = new Date()/1000 - time;
	el.title = date;
	el.firstChild.nodeValue = 
		dt < 60 ? timeUnit(dt, "second") :
		(dt /= 60) < 60 ? timeUnit(dt, "minute") :
		(dt /= 60) < 24 ? timeUnit(dt, "hour") :
		(dt /= 24) < 7 ? timeUnit(dt, "day") :
		date.toDateString();
}
updateTimes();
setInterval(updateTimes, 60*1000);

// Comment form

// comment link
$("comment-link").addEventListener("click", function (e) {
	e.preventDefault();
	if (app.user) {
		commentField.focus();
	} else {
		alert("Log in or sign up to comment.");
	}
}, false);

// like
var submittingLike;
likeLink.addEventListener("click", function (e) {
	e.preventDefault();
	if (submittingLike) return;
	submittingLike = true;
	var like = (this.firstChild.nodeValue == "like");
	if (like) submitLike();
	else submitUnlike();
}, false);

function submitLike() {
	if (!app.user) {
		alert("Log in or sign up to submit your like.");
		return;
	}

	ajax(commentForm.action, {
		method: "post",
		data: {like: 1},
		success: function (resp) {
			submittingLike = false;
			var li = document.createElement("li");
			var a = document.createElement("a");
			a.href = app.user;
			a.title = app.user;
			a.appendChild(document.createTextNode(app.user));
			li.appendChild(a);
			likeList.appendChild(li);
			updateLikeList();
		}
	});
}

function submitUnlike() {
	ajax(commentForm.action, {
		method: "post",
		data: {unlike: 1},
		success: function (resp) {
			submittingLike = false;
			var lis = likeList.getElementsByTagName("li");
			for (var i = 0; i < lis.length; i++) {
				if (lis[i].firstChild.title == app.user) {
					likeList.removeChild(lis[i]);
					break;
				}
			}
			updateLikeList();
		}
	});
}

function updateLikeList() {
	updateTimes(likeList);
	var lis = likeList.getElementsByTagName("li");
	var numLikes = lis.length;
	var youLiked = false;
	for (var i = 0; i < numLikes; i++) {
		var a = lis[i].firstChild;
		if (a.title == app.user) {
			youLiked = true;
			a.firstChild.nodeValue = "You";
			break;
		}
	}
	likeLink.firstChild.nodeValue = youLiked ? "liked" : "like";
	likeList.nextSibling.nodeValue =
		numLikes == 0 ? "" :
		numLikes > 1 || youLiked ? " like this" :
		" likes this";
}

// submit comment
var submittingComment = false;
commentForm.addEventListener("submit", function (e) {
	e.preventDefault();
	if (submittingComment++) return;
	submitComment();
}, false);

function submitComment() {
	ajaxSubmit(commentForm, function (resp) {
		submittingComment = false;
		addComment(app.user, commentField.value, new Date());
		commentField.value = "";
	});
}

function addComment(user, content, date) {
	var li = document.createElement("li");
	li.className = "comment";

	var img = document.createElement("img");
	img.className = "icon";
	img.src = "../images/profile/profile-" + user;
	li.appendChild(img);

	var h4 = document.createElement("h4");
	li.appendChild(h4);

	var a = document.createElement("a");
	a.href = user;
	a.appendChild(document.createTextNode(user));
	h4.appendChild(a);

	var time = document.createElement("time");
	time.setAttribute("datetime", date.getTime()/1000);
	time.appendChild(document.createTextNode(date.toDateString()));
	h4.appendChild(time);

	var p = document.createElement("p");
	p.appendChild(document.createTextNode(content));
	li.appendChild(p);

	commentList.appendChild(li);
	updateTimes(commentList);
}

// delete
var deleteLink = $("delete-link");
if (deleteLink) deleteLink.addEventListener("click", function (e) {
	e.preventDefault();
	if (!confirm("Really delete this picture?")) return;
	var thumbEl = selectedThumb.parentNode.parentNode; //li
	var infoEl = selectedInfo;
	ajax(commentForm.action, {
		method: "post",
		data: {delete: 1},
		success: function (resp) {
			if (infoEl == selectedInfo) {
				// go to next pic
				thumbEl.nextSibling.getElementsByTagName("a")[0].click();
			}
			picsList.removeChild(thumbEl);
			picsInfo.removeChild(infoEl);
		}
	});
}, false);

}());
