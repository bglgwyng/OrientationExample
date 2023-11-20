#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>

#import "OrientationExample-Swift.h"

#import <VisionCamera/FrameProcessorPluginRegistry.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"OrientationExample";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};
  
  [FrameProcessorPluginRegistry addFrameProcessorPlugin:@"saveFrame"
                                            withInitializer:^FrameSaverPlugin*(NSDictionary* options) {
        return [[FrameSaverPlugin alloc] init];
      }];

  [FrameProcessorPluginRegistry addFrameProcessorPlugin:@"scanFaces"
                                            withInitializer:^FaceDetectorPlugin*(NSDictionary* options) {
        return [[FaceDetectorPlugin alloc] init];
      }];

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end
