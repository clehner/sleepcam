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
			code: 404,
			headers: {"Content-Type": "image/gif"},
			base64: "R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
		};
	}
}
