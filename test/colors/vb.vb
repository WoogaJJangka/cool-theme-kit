' 한글 주석
Imports System

Module Demo
    Const MaxSize As Integer = 10

    Function Greet(ByVal name As String, Optional times As Integer = 2) As String
        Dim message As String = "Hello " & name
        If times > 0 Then
            Return message
        End If
        Return Nothing
    End Function

    Sub Main()
        Console.WriteLine(Greet("하나"), True, &H1F)
    End Sub
End Module
