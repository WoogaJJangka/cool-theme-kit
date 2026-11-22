// 한글 주석
#import <Foundation/Foundation.h>

#define MAX_SIZE 10

@interface Greeter : NSObject
@property (nonatomic, copy) NSString *name;
- (NSString *)greet:(NSInteger)times;
@end

@implementation Greeter
- (NSString *)greet:(NSInteger)times {
    NSString *message = [NSString stringWithFormat:@"Hello %@\n", self.name];
    return times > 0 ? message : nil;
}
@end
