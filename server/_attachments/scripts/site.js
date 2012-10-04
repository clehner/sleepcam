(function (global) {

var base = "/",
	scriptsDir = "/scripts/",
	header,
	article,
	dbListeners = [];

var loginDialog = {
	el: null,
	doc: null,
	overlay: document.createElement("div"),
	resultEl: null,
	user: null,

	$: function (id) {
		return this.doc && this.doc.getElementById(id);
	},

	load: function (cb, arg) {
		var self = this;
		this.el = document.createElement("iframe");
		this.el.src = base + "login";
		this.el.id = "login-iframe";
		this.overlay.className = "overlay";
		document.body.appendChild(this.overlay);
		document.body.appendChild(this.el);
		this.el.style.display = "none";
		this.overlay.style.display = "none";

		this.el.addEventListener("load", function () {
			self.doc = self.el.contentDocument;
			setTimeout(function () {
				self.updateHeight();
			}, 100);
			self.updateHeight();

			var form = self.$("login-form");
			self.resultEl = self.$("login-result");

			if (form) {
				if (self.onload2) {
					self.onload2();
					delete self.onload2;
				}

				self.doc.addEventListener("keydown", function (e) {
					if (e.which == 27) { // escape
						form.reset();
					}
				}, false);

				self.$("signup-welcome-ok").addEventListener("click", function (e) {
					form.reset();
				}, false);

				form.addEventListener("submit", function (e) {
					self.user = self.$("name").value;
				}, false);

				form.addEventListener("reset", function (e) {
					self.$("name").value = "";
					self.$("password").value = "";
					self.hide();
				}, false);

				var signingUp = false;
				var signupBtn = self.$("signup-button");
				if (signupBtn) signupBtn.addEventListener("click", function () {
					if (signingUp++) return;
					var user = self.$("name").value;
					var password = self.$("password").value;
					Couch.signup({
						name: user,
						//roles: ["user"],
						roles: []
					}, password, {
						success: function () {
							signingUp = false;
							self.user = user;
							self.onSignupSuccess(user);
							Couch.login({
								name: user,
								password: password
							});
						},
						error: function (status, error, reason) {
							signingUp = false;
							self.onSignupError(user, error, reason);
						}
					});
				});

				if (cb) {
					cb.call(self, arg);
					cb = null;
				}

			} else {
				// could be a result from /_session
				var body = self.el.contentDocument.body;
				var text = body.innerText || body.textContent;
				try {
					var resp = JSON.parse(text);
				} catch(e) {
					resp = {error: true, reason: "JSON error " + text};
				} finally {
					var win = self.el.contentDocument.defaultView || self.el.contentWindow;
					//win.history.back();
					win.location.href = base + "login";
					self.onload2 = function () {
						self.$("name").value = self.user;
						if (resp.ok) {
							self.onLoginSuccess(self.user);
						} else if (resp.error) {
							self.onLoginError(resp.reason);
						}
					};
				}
			}
		}, false);
	},

	updateHeight: function () {
		if (this.doc) this.el.style.height = this.doc.body.offsetHeight + "px";
	},

	show: function (note) {
		if (!this.doc) return this.load(this.show, note);
		this.el.style.display = "block";
		this.overlay.style.display = "block";
		this.updateHeight();
		var self = this;
		setTimeout(function () { self.updateHeight(); }, 100);
		this.$("login-note").innerHTML = note || "";
		this.$("name").focus();
		this.$("signup-welcome").style.display = "none";
		this.$("login-form").style.display = "block";
		shim(window.hex_sha1, scriptsDir + "sha1.js");
	},

	hide: function () {
		this.el.style.display = "none";
		this.overlay.style.display = "none";
		this.resultEl.innerHTML = "";
		this.resultEl.className = "";
	},

	onLoginSuccess: function (user, dontHide) {
		if (!dontHide) this.hide();
		app.user = user;
		var a = $("profile-link");
		a.href = base + "profile/" + user;
		var img = a.getElementsByTagName("img")[0];
		var text = img.nextSibling;
		text.nodeValue = user;
		header.className = "logged-in";

		var imgs = document.getElementsByTagName("img");
		var profileIconSrc = base + "images/profile/profile-" + user;
		for (var i=0; i<imgs.length; i++) {
			if (imgs[i].className == "icon") { // not your-icon
				imgs[i].src = profileIconSrc;
				imgs[i].alt = "Your icon";
			}
		}
	},
	onLoginError: function (error) {
		this.resultEl.innerHTML = error;
		this.resultEl.className = "error";
		this.updateHeight();
	},

	onSignupSuccess: function (user) {
		this.onLoginSuccess(user, true);
		this.$("signup-welcome").style.display = "block";
		this.$("login-form").style.display = "none";
		this.$("signup-welcome").getElementsByTagName("h2")[0].firstChild.nodeValue =
			"Welcome, " + user + "!";
		this.updateHeight();
	},
	onSignupError: function (name, error, reason) {
		if (error == "conflict") reason = "Username '" + name + "' is already taken.";
		this.resultEl.innerHTML = reason;
		this.resultEl.className = "error";
		this.updateHeight();
	}
};

var app = {
	user: null,
	db: null,

	requireLogin: function (suggestion) {
		if (this.user) {
			return true;
		} else {
			loginDialog.show(suggestion);
			return false;
		}
	},

	getDb: function (cb) {
		if (this.db) cb(this.db);
		else dbListeners.push(cb);
	}
};

function init() {
	app.user = ($("session").getElementsByTagName("a")[0]
		.href.match(/profile\/([^"]+)/) || 0)[1];
	base = ((document.getElementsByTagName("h1")[0] || document)
		.getElementsByTagName("a")[0] || location).href;
	header = document.getElementsByTagName("header")[0];
	article = document.getElementsByTagName("article")[0];
	scriptsDir = base + "scripts/";
	var Couch;

	shim(window.JSON, scriptsDir + "json2.js", function () {
		shim(window.Couch, scriptsDir + "couchdb.js", function () {
			Couch = window.Couch;
			Couch.urlPrefix = base.replace(/\/$/, '');
			app.db = Couch.db("db");

			dbListeners.forEach(function (cb) {
				cb(app.db);
			});
			dbListeners.length = 0;
		});
	});

	$("login-link").addEventListener("click", function (e) {
		e.preventDefault();
		loginDialog.show();
	}, false);

	$("logout-link").addEventListener("click", function (e) {
		e.preventDefault();
		ajax("/_session", {
			method: "DELETE",
			format: "json",
			success: function (resp) {
				app.user = null;
				header.className = "not-logged-in";
			}
		});
	}, false);

}
setTimeout(init, 100);

global.app = app;

}(window));
