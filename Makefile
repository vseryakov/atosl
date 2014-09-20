BUILD_DIR=build/$(CONFIG)-iphoneos/$(APP).app
PROFILE_DIR=$(HOME)/Library/MobileDevice/Provisioning Profiles
PROFILE_NAME=$(shell xcodebuild -showBuildSettings|grep 'PROVISIONING_PROFILE ='|awk -F'= ' '{print $$2}')
DEVELOPER=$(shell xcodebuild -showBuildSettings|grep 'CODE_SIGN_IDENTITY ='|awk -F'= ' '{print $$2}')
SDK=$(shell xcodebuild -showBuildSettings|grep 'SDK_NAME ='|awk -F'= ' '{print $$2}')
VERSION=$(shell /usr/libexec/PlistBuddy -c "print :CFBundleVersion" $(APP)/$(APP)-Info.plist)
DEST_DIR=$(HOME)/Downloads/$(VERSION)
CONFIG=Release
ARCHS=armv7 armv7s
ATOSL_DIR=$(dir $(lastword $(MAKEFILE_LIST)))

clean-app:
	/usr/bin/xcodebuild clean -configuration $(CONFIG)
	rm -rf build

build-app: clean-app
	mkdir -p $(DEST_DIR)
	/usr/bin/xcodebuild -target $(APP) -configuration $(CONFIG)
	/usr/bin/xcrun --sdk $(SDK) PackageApplication "$(BUILD_DIR)" -o "$(DEST_DIR)/$(APP)$(VERSION).ipa" --sign "$(DEVELOPER)" --embed "$(PROFILE_DIR)/$(PROFILE_NAME).mobileprovision"

build-sim:
	mkdir -p $(DEST_DIR)
	/usr/bin/xcodebuild -arch i386 -sdk $(shell xcodebuild -showsdks|awk 'BEGIN {l=""} /simulator/ {l=$NF} END {print l}')
	cd build/Release-iphonesimulator && zip -r $(DEST_DIR)/$(APP)$(VERSION).zip $(APP).app

build-crash:
	mkdir -p $(DEST_DIR)
	cp -r "$(BUILD_DIR).dSYM" $(DEST_DIR)
	for a in $(ARCHS); do lipo -thin $$a $(BUILD_DIR).dSYM/Contents/Resources/DWARF/$(APP) -output $(DEST_DIR)/$(APP)$(VERSION).$$a; done

show-crash:
	$(ATOSL_DIR)atosl.js -bin $(ATOSL_DIR)atosl.$(shell uname -s) -app $(DEST_DIR)/$(APP) $(FILE)

