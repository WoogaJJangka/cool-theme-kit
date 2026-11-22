# 한글 주석
const MAX_SIZE = 10

struct Greeter
    name::String
end

"""Docstring of greet"""
function greet(g::Greeter, times::Int=2)
    message = "Hello $(g.name)\n"
    return repeat(message, times)
end

for name in ["하나", "two"]
    println(greet(Greeter(name)), nothing, true, 0x1f)
end
