#!/bin/bash
#
#  sleepcam.sh
#  Sleepcam
#
#  Copyright (C) 2012 Charles Lehner
# 
#  Sleepcam is free software; you can redistribute it and/or modify it under
#  the terms of the GNU General Public License as published by the Free
#  Software Foundation; either version 3 of the License, or (at your option)
#  any later version.
# 
#  Sleepcam is distributed in the hope that it will be useful, but WITHOUT ANY
#  WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
#  FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
#  details.
# 
#  You should have received a copy of the GNU General Public License along with
#  Sleepcam. If not, see <http:#www.gnu.org/licenses/>.
#

bundleid='org.sleepcam.sleepcam'
localstaging='Pictures/Sleep/taken'
localdest='Pictures/Sleep/sent'
defaultdb='https://sleepcam.iriscouch.com/sleepcam'
resources=`dirname "$0"`

cd $HOME

function loaddb {
	db=`defaults read $bundleid DBUrl 2>/dev/null`
	[[ $db ]] || db="$defaultdb"
	host=${db%/*}
}

function loadcreds {
	loaddb
	[[ $username ]] || username=`defaults read $bundleid UserName 2>/dev/null`
	[[ $password ]] || password=`security 2>&1 >/dev/null find-generic-password -a $username -s Sleepcam -g | cut -d '"' -f 2`
	[[ $username || $password ]] && db="${db/\/\////$username:$password@}" &&
	host=${db%/*}
}

function checklogin {
	loadcreds
	[[ `curl -s "$host/_session"` =~ '"authenticated":"' ]]
}

function takepicture {
	datetime=`date +%s`
	pic="$datetime.jpg"
	mkdir -p "$localstaging"
	"$resources/imagesnap" -q "$localstaging/$pic"
}

function isonline {
	ping -c 1 google.com >/dev/null 2>&1
}

function uploadpics {
	# try to get a connection
	if ! isonline; then
		sleep 10
		isonline || return 1
	fi
	#checklogin || return 1
	loadcreds

	mkdir -p "$localdest"
	# upload each pic in the staging area
	for pic in $localstaging/[0-9]*[0-9].jpg; do
		test -e "$pic" || continue
		picname=${pic##*/}
		time=${picname%.*}
		smallpic=/tmp/smallpic$time.jpg
		tmp=/tmp/pic$time.json
		sips -Z 96 "$pic" --out "$smallpic" >/dev/null 2>&1 || continue

		# json escaping
		username2=${username//\\/\\\\}
		username2=${username2//\"/\\\"}
		cat << EOF > $tmp
{
	"_id": "$time-$username2",
	"type": "pic",
	"user": "$username2",
	"time": $time,
	"_attachments": {
		"large.jpg": {
			"content_type": "image/jpeg",
			"data": "$(cat $pic | openssl base64 | tr -d '\n')"
		},
		"small.jpg": {
			"content_type": "image/jpeg",
			"data": "$(cat $smallpic | openssl base64 | tr -d '\n')"
		}
	}
}
EOF

		echo "uploading pic $time"
		result=`curl -s -HContent-Type:application/json -X PUT "$db/$time-$username" --data-binary "@$tmp"`
		if [[ "$result" =~ '"error":"' ]]; then
			echo "error: $result"
			if [[ "$result" =~ '"Name or password is incorrect."' ]]; then
				invalidloginerror
				break
			fi
		else
			mv $pic $localdest
			rm $tmp
			rm $smallpic
		fi
	done
}

function invalidloginerror {
	osascript -e '
	tell application "System Events"
		activate
		display dialog "Your Sleepcam username or password is incorrect." with icon 0 buttons {"OK", "Open Preferences"} default button 1 cancel button 1
		if button returned of result = "Open Preferences"
			tell application "System Preferences"
				activate
				set current pane to pane id "org.sleepcam.sleepcam"
			end tell
		end if
	end tell'
}

function loginaccount {
	username="$1"
	password="$2"
	defaults write $bundleid UserName "$1"
# -T /usr/bin/security -T '/Applications/System Preferences.app/Contents/MacOS/System Preferences'
	/usr/bin/security add-generic-password -s Sleepcam -U -a "$1" -w "$2"
	isonline || return 1
	checklogin
}

function createaccount {
	username="$1"
	password="$2"

	# json escaping
	username2=${username//\\/\\\\}
	username2=${username2//\"/\\\"}
	password2=${password//\\/\\\\}
	password2=${password2//\"/\\\"}

	defaults write $bundleid UserName "$1"
	/usr/bin/security add-generic-password -s Sleepcam -U -a "$1" -w "$2"
	isonline || return 1
	loaddb

	userdoc="{\"_id\":\"org.couchdb.user:$username2\",\"name\":\"$username2\",\"roles\":[],\"type\":\"user\",\"password\":\"$password2\"}"
	[[ `curl -sX PUT "$host/_users/org.couchdb.user:$username" --data-binary "$userdoc"` =~ '"ok":true' ]]
}

case "$1" in
	snap)
		takepicture
		uploadpics
		;;
	login)
		loginaccount $2 $3
		;;
	createaccount)
		createaccount $2 $3
		;;
	*)
		echo "Usage: ${0##*/} {snap|login|createaccount}" >&2
		exit 1
		;;
esac

