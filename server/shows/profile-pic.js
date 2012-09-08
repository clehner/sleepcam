function(doc, req) {  
	if (doc && doc.type == "profile") {
		var time = doc.profile_pic_time;
		var pic = "../pics/small/" + time + "-" + doc.user;
		return {
			code: 301,
			headers: {Location: pic}
		};
	} else {
		return {
			code: 301,
			headers: {Location: "../profile-pic.gif"}
		};
		//headers: {"Content-Type": "image/gif"},
		//body: "GIF89a\1\0\1\0\0\0\0\41\371\4\1\12\0\1\0\54\0\0\0\0\1\0\1\0\0\2\2\114\1\0;"
		//headers: {Location: "data:image/gif,GIF89a%01%00%01%00%00%00%00%21%F9%04%01%0A%00%01%00%2C%00%00%00%00%01%00%01%00%00%02%02L%01%00%3B"}
		//body: String.fromCharCode(71,73,70,56,57,97,1,0,1,0,0,0,0,33,249,4,1,10,0,1,0,44,0,0,0,0,1,0,1,0,0,2,2,76,1,0,59)
	}
}
