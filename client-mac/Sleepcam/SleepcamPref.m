//
//  SleepcamPref.m
//  Sleepcam
//
//  Copyright (C) 2012 Charles Lehner
// 
//  Sleepcam is free software; you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation; either version 3 of the License, or (at your option) any later version.
// 
//  Sleepcam is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// 
//  You should have received a copy of the GNU General Public License along with Sleepcam. If not, see <http://www.gnu.org/licenses/>.

#import "SleepcamPref.h"

@interface SleepcamPref (PrivateMethods)
- (void) updateProfileImage:(NSString *)username;
- (void) updateLoginResult:(NSString *)text withURL:(NSString *)url;
@end

@implementation SleepcamPref

- (void) mainViewDidLoad
{
	NSString *resourcesPath = [[self bundle] resourcePath];
	NSString *launchAgentResourcePath = [resourcesPath stringByAppendingPathComponent:@"org.sleepcam.sleepcam.plist"];
	launchAgentPath = [NSHomeDirectory() stringByAppendingPathComponent:@"Library/LaunchAgents/org.sleepcam.sleepcam.plist"];
    scriptPath = [resourcesPath stringByAppendingPathComponent:@"sleepcam.sh"];
    NSDictionary *prefs = [[NSUserDefaults standardUserDefaults]
                             persistentDomainForName:@"org.sleepcam.sleepcam"];
    siteURL = [prefs valueForKey:@"SiteUrl"];
    if (!siteURL) siteURL = @"http://sleepcam.org/";
	
	// Check if launchagent is installed.
    NSTask *task = [NSTask launchedTaskWithLaunchPath:@"/bin/launchctl"
                                            arguments:[NSArray arrayWithObjects:@"list",
                                                       @"org.sleepcam.sleepcam", nil]];
    [task waitUntilExit];
    if ([task terminationStatus] != 0) {
		// Install the agent, with the correct path in it.
		NSError *anError;
		NSString *agentContents = [NSString stringWithContentsOfFile:launchAgentResourcePath
															encoding:NSUTF8StringEncoding
															   error:&anError];
		if (!agentContents) {
			NSLog(@"%@", [anError localizedDescription]);
		} else {
			NSString *agentContents2 = [agentContents
                                        stringByReplacingOccurrencesOfString:@"{RESOURCES}"
                                        withString:resourcesPath];
			[agentContents2 writeToFile:launchAgentPath
							 atomically:YES
							   encoding:NSUTF8StringEncoding
								  error:NULL];
			// Load the agent
            [NSTask launchedTaskWithLaunchPath:@"/bin/launchctl"
                                      arguments:[NSArray arrayWithObjects:@"load",
                                                 launchAgentPath, nil]];
		}
	}
    
    // Populate login fields
    
    // Get username from preferences
    NSString *username = [prefs valueForKey:@"UserName"];
    
    if (username != NULL) {
        [usernameField setStringValue:username];
        // Get password from keychain
        UInt32 passwordLength;
        char passwordStr[128];
        void *passwordData;
        const char *usernameStr = [username cStringUsingEncoding:NSASCIIStringEncoding];
        UInt32 usernameStrlen = strlen(usernameStr);
        
        if (SecKeychainFindGenericPassword(NULL, 8, "Sleepcam", usernameStrlen, usernameStr, &passwordLength, &passwordData, NULL) == errSecSuccess) {
            strncpy(passwordStr, passwordData, MIN(passwordLength, 128));
            passwordStr[passwordLength] = '\0';
            NSString *password = [NSString stringWithCString:passwordStr
                                                    encoding:NSASCIIStringEncoding];
            SecKeychainItemFreeContent(NULL, passwordData);
            [passwordField setStringValue:password];
        }
        
        [self updateProfileImage:username];
    }
    
    [self updateLoginResult:@"Visit sleepcam.org"
                    withURL:siteURL];
}

- (void) updateLoginResult:(NSString *)text
{
	NSTextStorage *resultText = [loginResultText textStorage];
    [resultText beginEditing];
    [resultText setAttributedString:[[NSAttributedString alloc] initWithString:text]];
 	[resultText endEditing];
}

- (void) updateLoginResult:(NSString *)text withURL:(NSString *)url
{
	NSTextStorage *resultText = [loginResultText textStorage];
    [resultText beginEditing];
    NSMutableParagraphStyle *style = [[[NSMutableParagraphStyle alloc] init] autorelease];
    [style setAlignment:NSCenterTextAlignment];
    NSDictionary *attributes = [NSDictionary dictionaryWithObjectsAndKeys:
                                url, NSLinkAttributeName,
                                style, NSParagraphStyleAttributeName,
                                nil];
    [resultText setAttributedString:[[NSAttributedString alloc] initWithString:text
                                                                    attributes:attributes]];
 	[resultText endEditing];
}

- (void) updateProfileImage:(NSString *)username
{
    NSString *url = [siteURL stringByAppendingString:[@"images/profile/profile-"
                     stringByAppendingString:username]];
    NSImage *newImage;
    NSURL *imageURL = [NSURL URLWithString:url];
    NSData *imageData = [NSData dataWithContentsOfURL:imageURL];
    if (imageData != nil) {
        newImage = [[NSImage alloc] initWithData:imageData];
        [profileImageView setImage:newImage];
        [newImage release];
    }
}

- (IBAction) login:(id)pId
{
	NSString *username = [usernameField stringValue];
	[spinner startAnimation:self];
    
    bool success = [self execCommand:[NSArray arrayWithObjects:@"login",
                                      username,
                                      [passwordField stringValue],
                                      nil]];
    if (success) {
        NSString *url = [siteURL stringByAppendingString:[@"profile/"
                                                          stringByAppendingString:username]];
        [self updateLoginResult:@"Logged in! Visit your profile page"
                        withURL:url];
    } else {
        [self updateLoginResult:@"Unable to login."];
    }
	[spinner stopAnimation:self];
    [self updateProfileImage:username];
}

- (IBAction) createAccount:(id)pId
{
	NSString *username = [usernameField stringValue];
	[spinner startAnimation:self];
    
    bool success = [self execCommand:[NSArray arrayWithObjects:@"createaccount",
                                      username,
                                      [passwordField stringValue],
                                      nil]];
    if (success) {
        NSString *url = [siteURL stringByAppendingString:[@"profile/"
                                                          stringByAppendingString:username]];
        [self updateLoginResult:@"Welcome! Visit your profile page"
                        withURL:url];
    } else {
        [self updateLoginResult:@"Unable to create account."];
    }
	[spinner stopAnimation:self];
}

- (IBAction) uninstall:(id)pId
{
 	[spinner startAnimation:self];

    // Unload launchagent
    [[NSTask launchedTaskWithLaunchPath:@"/bin/launchctl"
                              arguments:[NSArray arrayWithObjects:@"unload",
                                         launchAgentPath, nil]] waitUntilExit];
    // Move launchagent to trash
    NSFileManager *fm = [NSFileManager defaultManager];
    NSString *trashPath = [NSHomeDirectory() stringByAppendingPathComponent:@".Trash"];
    // Move prefpane to trash
    NSString *prefPanePath = [[self bundle] bundlePath];
    if ([fm moveItemAtPath:launchAgentPath
                    toPath:[trashPath stringByAppendingPathComponent:[launchAgentPath lastPathComponent]] error:nil] == YES &&
        [fm moveItemAtPath:prefPanePath
                    toPath:[trashPath stringByAppendingPathComponent:[prefPanePath lastPathComponent]] error:nil] == YES) {
        
        [uninstallResultText setStringValue:@"Sleepcam was uninstalled successfully."];
    } else {
        [uninstallResultText setStringValue:@"There was an error uninstalling Sleepcam."];
    }
	[spinner stopAnimation:self];
}

- (bool) execCommand:(NSArray*)args
{
    NSTask *task = [NSTask launchedTaskWithLaunchPath:scriptPath arguments:args];
    [task waitUntilExit];
    return ([task terminationStatus] == 0);
    /*
     NSTask *task = [[NSTask alloc] init];
     [task setLaunchPath: scriptPath];
     [task setArguments: args];
     
     NSPipe *pipe;
     pipe = [NSPipe pipe];
     [task setStandardOutput: pipe];
     
     NSFileHandle *file;
     file = [pipe fileHandleForReading];
     
     [task launch];
     
     NSData *data;
     data = [file readDataToEndOfFile];
     
     NSString *string;
     string = [[NSString alloc] initWithData: data
     encoding: NSUTF8StringEncoding];
     */
}

@end
