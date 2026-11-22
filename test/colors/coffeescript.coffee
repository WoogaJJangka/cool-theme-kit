# 한글 주석
MAX_SIZE = 10

###
Block comment
###

class Greeter
  constructor: (@name) ->

  greet: (times = 2) ->
    "Hello #{@name}\n".repeat times

greeter = new Greeter "하나"
console.log greeter.greet(), null, true, /\d+/g, 0x1F
