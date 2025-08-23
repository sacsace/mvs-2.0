@echo off
REM MVS 2.0 Docker 이미지 빌드 및 푸시 스크립트 (Windows)

setlocal enabledelayedexpansion

REM 설정
set DOCKER_USERNAME=minsub
set VERSION=%1
if "%VERSION%"=="" set VERSION=latest

echo 🐳 MVS 2.0 Docker 이미지 빌드 시작...
echo 버전: %VERSION%

REM Docker 설치 확인
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker가 설치되어 있지 않습니다.
    echo Docker Desktop을 설치하세요: https://docker.com/get-started
    exit /b 1
)

REM Docker Hub 로그인 확인
echo 🔐 Docker Hub 로그인 확인 중...
docker info | findstr "Username" >nul
if errorlevel 1 (
    echo ❌ Docker Hub에 로그인이 필요합니다.
    echo 다음 명령어로 로그인하세요: docker login
    pause
    exit /b 1
)

REM Backend 이미지 빌드
echo 🏗️ Backend 이미지 빌드 중...
docker build -t %DOCKER_USERNAME%/mvs-backend:%VERSION% -t %DOCKER_USERNAME%/mvs-backend:latest ./server
if errorlevel 1 (
    echo ❌ Backend 이미지 빌드 실패
    pause
    exit /b 1
)

REM Frontend 이미지 빌드
echo 🏗️ Frontend 이미지 빌드 중...
docker build --build-arg REACT_APP_API_URL=http://localhost:3001 -t %DOCKER_USERNAME%/mvs-frontend:%VERSION% -t %DOCKER_USERNAME%/mvs-frontend:latest ./client
if errorlevel 1 (
    echo ❌ Frontend 이미지 빌드 실패
    pause
    exit /b 1
)

REM 이미지 푸시
echo 📤 Backend 이미지 푸시 중...
docker push %DOCKER_USERNAME%/mvs-backend:%VERSION%
docker push %DOCKER_USERNAME%/mvs-backend:latest

echo 📤 Frontend 이미지 푸시 중...
docker push %DOCKER_USERNAME%/mvs-frontend:%VERSION%
docker push %DOCKER_USERNAME%/mvs-frontend:latest

echo.
echo ✅ 모든 이미지 빌드 및 푸시 완료!
echo.
echo 🎯 배포된 이미지:
echo - %DOCKER_USERNAME%/mvs-backend:%VERSION%
echo - %DOCKER_USERNAME%/mvs-backend:latest
echo - %DOCKER_USERNAME%/mvs-frontend:%VERSION%
echo - %DOCKER_USERNAME%/mvs-frontend:latest
echo.
echo 🚀 이제 다음 명령어로 프로덕션 환경에서 실행할 수 있습니다:
echo docker-compose -f docker-compose.prod.yml up -d
echo.
pause


