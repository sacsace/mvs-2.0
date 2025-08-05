@echo off
echo Starting MVS 2.0 Servers...

echo Checking and killing existing processes on ports 3000 and 3001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    taskkill /F /PID %%a 2>nul
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    taskkill /F /PID %%a 2>nul
)

echo Starting Backend Server first...
start cmd /k "cd server && npm run dev"

echo Waiting for backend server to initialize...
timeout /t 5 /nobreak

echo Starting Frontend Server...
start cmd /k "cd client && npm start"

echo Servers are starting...
echo Backend will be available at: http://localhost:3001
echo Frontend will be available at: http://localhost:3000

npx ts-node server/scripts/checkUsers.ts 