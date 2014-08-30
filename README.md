# Crash reports for iOS apps

This is a template and semi-complete framework for symbolicating
iOS apps crash reports based on the https://github.com/facebook/atosl.

It works on Linux and Mac OS X using pre-compiled binaries of the atosl for both platforms.

The provided Makefile has several targets that can be used for simple symbolication of the crash reports
without using third party services.

As an overview, for an iOS app project the makefile targets `build-app` and `build-crash`
compile and build the iOS app archive using current XCode settings for Release target and
then split dSYM into several architecture specific binaries. atosl cannot work with universal
archives so every platform must be in separate file.

Assuming there is a iOS project called TestApp. To prepare it for symbolication for the current version just run the following command in the project directory:

	make -f ../atosl/Makefile build-app build-crash APP=TestApp

By default in the ~/Downloads there will be several files named TestApp1.0.0.armv7 ...arvv7s
and dSYM archive in the ~/Downloads/1.0.0 folder. The VERSION is taken from the app plist info file,
the bundle version. 

The ipa file is also in the ~/Downloads directory signed with the current provisioning profile
specified in the project settings. 

Basically this command creates an archive the similar way as Xcode Archive command from the menu.

How the crash reports are delivered is out of scope of this simple system, it can be downloaded from the phone, it can
be posted from the app using https://www.plcrashreporter.org/. 

Here is the simple example how to send crash reports from the app:

	- (void)initCrashReporter
	{
        PLCrashReporter *crashReporter = [PLCrashReporter sharedReporter];
	    NSError *error = nil;
	    if ([crashReporter hasPendingCrashReport]) {
	        NSData *data = [crashReporter loadPendingCrashReportDataAndReturnError: &error];
                if (data) {
                    PLCrashReport *report = [[PLCrashReport alloc] initWithData:data error:&error];
                    if (report) {
                        NSString *str = [PLCrashReportTextFormatter stringValueForCrashReport:report withTextFormat:PLCrashReportTextFormatiOS];
    	   	            NSMutableURLRequest *request = [[NSMutableURLRequest alloc] initWithURL:url];
                        [request setHTTPMethod:@"POST"];
                        [request setHTTPBody:str];
			             .....
            	    }
		        }
                [crashReporter purgePendingCrashReport];
    	    }
            if (![crashReporter enableCrashReporterAndReturnError: &error]) {
                NSLog(@"Warning: Could not enable crash reporter: %@", error);
            }
    }
	- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
	{
    	    [self initCrashReporter];
	    return YES;
	}


To symbolicate a crash report which is in a local file:

	make show-crash APP=TestApp FILE=TestApp-crash-report-file

Authors

	Vlad Seryakov

