#import "DirectoryPicker.h"

#import <AppKit/AppKit.h>

@implementation DirectoryPicker

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

RCT_EXPORT_METHOD(pickDirectory:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    NSOpenPanel *panel = [NSOpenPanel openPanel];
    panel.allowsMultipleSelection = NO;
    panel.canChooseDirectories = YES;
    panel.canChooseFiles = NO;
    panel.canCreateDirectories = YES;
    panel.prompt = @"Choose";

    [panel beginWithCompletionHandler:^(NSModalResponse result) {
      if (result != NSModalResponseOK || panel.URL == nil) {
        resolve([NSNull null]);
        return;
      }

      NSURL *url = panel.URL;
      resolve(@{
        @"name" : url.lastPathComponent ?: @"",
        @"path" : url.path ?: @"",
      });
    }];
  });
}

RCT_EXPORT_METHOD(listDirectory:(NSString *)path
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0), ^{
    NSURL *directoryURL = [NSURL fileURLWithPath:path isDirectory:YES];
    NSArray<NSURLResourceKey> *resourceKeys = @[
      NSURLIsDirectoryKey,
      NSURLFileSizeKey,
    ];

    NSError *error = nil;
    NSArray<NSURL *> *urls = [[NSFileManager defaultManager]
        contentsOfDirectoryAtURL:directoryURL
      includingPropertiesForKeys:resourceKeys
                         options:0
                           error:&error];

    if (error != nil) {
      reject(@"directory_read_failed", error.localizedDescription, error);
      return;
    }

    NSMutableArray<NSDictionary *> *entries =
        [NSMutableArray arrayWithCapacity:urls.count];

    for (NSURL *url in urls) {
      NSNumber *isDirectory = @NO;
      NSNumber *fileSize = nil;
      [url getResourceValue:&isDirectory forKey:NSURLIsDirectoryKey error:nil];
      [url getResourceValue:&fileSize forKey:NSURLFileSizeKey error:nil];

      [entries addObject:@{
        @"isDirectory" : isDirectory ?: @NO,
        @"name" : url.lastPathComponent ?: @"",
        @"path" : url.path ?: @"",
        @"size" : fileSize ?: [NSNull null],
      }];
    }

    [entries sortUsingComparator:^NSComparisonResult(
                 NSDictionary *first, NSDictionary *second) {
      BOOL firstIsDirectory = [first[@"isDirectory"] boolValue];
      BOOL secondIsDirectory = [second[@"isDirectory"] boolValue];

      if (firstIsDirectory != secondIsDirectory) {
        return firstIsDirectory ? NSOrderedAscending : NSOrderedDescending;
      }

      return [first[@"name"] localizedCaseInsensitiveCompare:second[@"name"]];
    }];

    resolve(entries);
  });
}

@end
