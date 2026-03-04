@echo off
REM Run this script as Administrator to delete the LabServer scheduled task.
schtasks /Delete /TN "LabServer" /F
if %ERRORLEVEL% equ 0 (
    echo Scheduled task "LabServer" deleted.
) else (
    echo Could not delete task. It may not exist or you lack permissions.
)
pause