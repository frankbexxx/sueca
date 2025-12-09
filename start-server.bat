@echo off
echo ========================================
echo Iniciando servidor de desenvolvimento...
echo ========================================
cd frontend
echo.
echo Instalando dependencias (se necessario)...
call npm install
echo.
echo Iniciando servidor React...
echo O servidor deve abrir automaticamente no navegador
echo Se nao abrir, acesse: http://localhost:3000
echo.
echo Pressione Ctrl+C para parar o servidor
echo ========================================
call npm start
pause

