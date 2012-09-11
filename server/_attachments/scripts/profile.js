(function () {

var user = ($("session").getElementsByTagName("a")[0]
		.href.match(/profile\/([^"]+)/) || 0)[1],
	picsInfo = $("pics-info"),
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
	if (thumb == selectedThumb) return;
	selectedThumb = thumb;
	var fullSrc = thumb.src.replace('small', 'large');
	largePic.src = fullSrc;
}

function picHover(e) {
	if (!thumbLocked && e.target.src) selectThumb(e.target);
}
picsList.addEventListener("mouseover", picHover, false);

function picLoaded(e) {
	var time = largePic.src.match(/large\/([0-9]+)/)[1];
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
	commentForm.action = selectedThumb.parentNode.href;
	var unsentComment = !submittingComment && commentField.value;
	unsentComments[time] = unsentComment;
	commentField.value = unsentComments[time] || "";
	updateLikeList();
}
largePic.addEventListener("load", picLoaded, false);

picHover({target: picsList.getElementsByTagName("img")[0]});

function picClick(e) {
	if (!e.target.src) return;
	if (thumbLocked) {
		var wasLocked = selectedThumb;
		unlockThumb();
	}
	if (e.target != selectedThumb) {
		picHover(e);
	}
	if (e.target != wasLocked) {
		lockThumb();
	}
	e.preventDefault();
	e.stopPropagation();
}
pics.addEventListener("click", picClick, false);

function lockThumb() {
	selectedThumb.className = "selected";
	thumbLocked = true;
}

function unlockThumb() {
	selectedThumb.className = "";
	thumbLocked = false;
}
document.body.addEventListener("click", unlockThumb, false);

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

if (user) {
	$("comment-icon").src = "../images/profile/profile-" + user;
}

// comment link
$("comment-link").addEventListener("click", function (e) {
	e.preventDefault();
	commentField.focus();
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
	ajax(commentForm.action, {
		method: "post",
		data: {like: 1},
		success: function (resp) {
			submittingLike = false;
			var li = document.createElement("li");
			var a = document.createElement("a");
			a.href = user;
			a.title = user;
			a.appendChild(document.createTextNode(user));
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
				if (lis[i].firstChild.title == user) {
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
		if (a.title == user) {
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
		addComment(user, commentField.value, new Date());
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

}());
