@echo off
echo 🚀 Installing AgroBlockchain Smart Contracts...
echo.

echo 📦 Installing Node.js dependencies...
call npm install

echo.
echo 📋 Copying environment template...
if not exist .env (
    copy .env.example .env
    echo ✅ Created .env file - please edit it with your configuration
) else (
    echo ⚠️  .env file already exists
)

echo.
echo 🔨 Compiling smart contracts...
call npm run compile

if %errorlevel% equ 0 (
    echo.
    echo ✅ Installation completed successfully!
    echo.
    echo 📚 Next steps:
    echo 1. Edit .env file with your configuration
    echo 2. Run tests: npm test
    echo 3. Start local network: npm run node
    echo 4. Deploy locally: npm run deploy:local
    echo.
    echo 📖 See README.md for detailed instructions
) else (
    echo.
    echo ❌ Installation failed! Please check the errors above.
)

pause