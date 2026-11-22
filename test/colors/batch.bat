@echo off
rem 한글 주석
:: another comment
set MAX_SIZE=10
set "NAME=world"

if "%NAME%"=="" (
    echo No name
) else (
    echo Hello %NAME%
)

for %%f in (*.txt) do call :greet %%f
goto :eof

:greet
echo %~1 %MAX_SIZE%
exit /b 0
