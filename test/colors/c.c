#include <stdio.h>
#include <string.h>

#define MAX_SIZE 10

// 한글 주석
/** Doc comment */
struct greeter {
    const char *name;
    int times;
};

static int greet(const struct greeter *g, char *out, size_t size) {
    int written = snprintf(out, size, "Hello %s\n", g->name);
    return written > 0 ? written : -1;
}

int main(void) {
    struct greeter g = {"world", 2};
    char buffer[MAX_SIZE * 8];
    greet(&g, buffer, sizeof buffer);
    return strlen(buffer) > 0 ? 0 : 1;
}
