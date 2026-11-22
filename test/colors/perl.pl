#!/usr/bin/perl
# 한글 주석
use strict;
use warnings;

my $max_size = 10;
my @names = ('하나', 'two');
my %ages = (alice => 30);

sub greet {
    my ($name, $times) = @_;
    return "Hello $name\n" x $times;
}

if ($names[0] =~ /^\w+$/) {
    print greet($names[1], 2), 0x1F;
}
