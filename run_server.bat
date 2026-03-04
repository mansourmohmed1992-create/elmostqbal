@echo off
cd /d "C:\Users\Dr.Mansour\Downloads\معمل-المستقبل-للتحاليل-الطبية-الكيميائية"

:loop
node server/run.cjs
echo Server exited with code %errorlevel%. Restarting in 2 seconds...
timeout /t 2 /nobreak >nul
goto loop
