# 한글 주석
use v6;

constant MAX-SIZE = 10;

sub greet(Str $name, Int $times = 2) {
    return "Hello $name\n" x $times;
}

my @names = <하나 two>;
for @names -> $name {
    say greet($name), True, 0x1F;
}
