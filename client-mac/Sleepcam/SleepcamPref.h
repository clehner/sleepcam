//
//  SleepcamPref.h
//  Sleepcam
//
//  Copyright (C) 2012 Charles Lehner
// 
//  Sleepcam is free software; you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation; either version 3 of the License, or (at your option) any later version.
// 
//  Sleepcam is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// 
//  You should have received a copy of the GNU General Public License along with Sleepcam. If not, see <http://www.gnu.org/licenses/>.

#import <PreferencePanes/PreferencePanes.h>

@interface SleepcamPref : NSPreferencePane 
{
	NSString *scriptPath;
    NSString *launchAgentPath;
    NSString *siteURL;
	
	IBOutlet NSTextField *usernameField;
	IBOutlet NSSecureTextField *passwordField;
	IBOutlet NSProgressIndicator *spinner;
	IBOutlet NSTextView *loginResultText;
	IBOutlet NSTextField *uninstallResultText;
    IBOutlet NSImageView *profileImageView;
}

- (void) mainViewDidLoad;
- (IBAction) login:(id)pId;
- (IBAction) createAccount:(id)pId;
- (IBAction) uninstall:(id)pId;
- (bool) execCommand:(NSArray*)args;

@end
