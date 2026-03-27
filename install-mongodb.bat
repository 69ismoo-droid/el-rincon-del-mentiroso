@echo off
echo Installing MongoDB Community Edition...
echo.

REM Download MongoDB
curl -L -o mongodb.msi "https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-7.0.5-signed.msi"

REM Install MongoDB
msiexec /i mongodb.msi /quiet /norestart

echo MongoDB installed successfully!
echo You may need to restart your computer.
pause
