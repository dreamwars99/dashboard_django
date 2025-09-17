@echo off
REM --- pre-commit: repo_structure ?? ?? ---
python scripts\dump_structure.py >NUL 2>&1
IF %ERRORLEVEL% NEQ 0 python3 scripts\dump_structure.py >NUL 2>&1
git add repo_structure.txt
exit /B 0
