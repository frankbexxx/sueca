@echo off
echo ========================================
echo Deploy Sueca Game - Vercel
echo ========================================
echo.

cd frontend

echo Verificando se Vercel CLI esta instalado...
vercel --version >nul 2>&1
if errorlevel 1 (
    echo Vercel CLI nao encontrado. Instalando...
    call npm install -g vercel
    echo.
)

echo.
echo Fazendo build do projeto...
call npm run build

if errorlevel 1 (
    echo.
    echo ERRO: Build falhou! Verifique os erros acima.
    pause
    exit /b 1
)

echo.
echo Build concluido com sucesso!
echo.
echo Iniciando deploy para Vercel...
echo.
vercel

echo.
echo ========================================
echo Deploy concluido!
echo ========================================
pause

