// 한글 주석
module Demo

open System

/// Doc comment of greet
let maxSize = 10

type Greeter(name: string) =
    member this.Greet(times: int) =
        String.replicate times (sprintf "Hello %s\n" name)

let greet name = Greeter(name).Greet 2

[<EntryPoint>]
let main argv =
    printfn "%s %b %d" (greet "하나") true 0x1F
    0
