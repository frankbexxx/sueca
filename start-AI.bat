@echo off
echo ========================================
echo Iniciando AI Sueca...
echo ========================================
cd sueca-ai
echo.
echo Instalando dependencias (se necessario)...
call pip install -r requirements.txt
echo.
echo Iniciando AI Sueca...
echo.
echo Pressione Ctrl+C para parar o AI Sueca
echo ========================================
call uvicorn api.main:app --reload --port 8000
pause
