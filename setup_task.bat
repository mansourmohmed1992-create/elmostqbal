@echo off
REM This script must be run as Administrator.
REM It creates a scheduled task named LabServer that runs run_server.bat at each logon.

:: Use the script's directory as base so it works even if moved.
set SCRIPT_DIR=%~dp0
schtasks /Create /SC ONLOGON /RL HIGHEST /TN "LabServer" /TR "%SCRIPT_DIR%run_server.bat" /F
if %ERRORLEVEL% equ 0 (
    echo Scheduled task "LabServer" created successfully.
) else (
    echo Failed to create scheduled task. You may need to run this as Administrator.
)
pause