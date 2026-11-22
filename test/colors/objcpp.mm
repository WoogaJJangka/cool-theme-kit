// 한글 주석
#import <Foundation/Foundation.h>
#include <vector>

namespace demo {
const int kMaxSize = 10;
}

@interface Greeter : NSObject
- (NSString *)greet:(NSInteger)times;
@end

@implementation Greeter
- (NSString *)greet:(NSInteger)times {
    std::vector<int> sizes{1, 2};
    return times > 0 ? @"Hello\n" : nil;
}
@end
