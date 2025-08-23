#!/bin/bash
# MVS 2.0 Docker 이미지 빌드 및 푸시 스크립트

set -e

# 설정
DOCKER_USERNAME="minsub"  # 실제 Docker Hub 사용자명으로 변경
VERSION=${1:-latest}
BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
GIT_COMMIT=$(git rev-parse --short HEAD)

echo "🐳 MVS 2.0 Docker 이미지 빌드 시작..."
echo "버전: $VERSION"
echo "빌드 날짜: $BUILD_DATE"
echo "Git 커밋: $GIT_COMMIT"

# Docker Hub 로그인 확인
echo "🔐 Docker Hub 로그인 확인 중..."
docker info | grep -q "Username" || {
    echo "❌ Docker Hub에 로그인이 필요합니다."
    echo "다음 명령어로 로그인하세요: docker login"
    exit 1
}

# Backend 이미지 빌드
echo "🏗️ Backend 이미지 빌드 중..."
docker build \
    --build-arg BUILD_DATE="$BUILD_DATE" \
    --build-arg GIT_COMMIT="$GIT_COMMIT" \
    -t "$DOCKER_USERNAME/mvs-backend:$VERSION" \
    -t "$DOCKER_USERNAME/mvs-backend:latest" \
    ./server

# Frontend 이미지 빌드
echo "🏗️ Frontend 이미지 빌드 중..."
docker build \
    --build-arg BUILD_DATE="$BUILD_DATE" \
    --build-arg GIT_COMMIT="$GIT_COMMIT" \
    --build-arg REACT_APP_API_URL="http://localhost:3001" \
    -t "$DOCKER_USERNAME/mvs-frontend:$VERSION" \
    -t "$DOCKER_USERNAME/mvs-frontend:latest" \
    ./client

# 이미지 푸시
echo "📤 Backend 이미지 푸시 중..."
docker push "$DOCKER_USERNAME/mvs-backend:$VERSION"
docker push "$DOCKER_USERNAME/mvs-backend:latest"

echo "📤 Frontend 이미지 푸시 중..."
docker push "$DOCKER_USERNAME/mvs-frontend:$VERSION"
docker push "$DOCKER_USERNAME/mvs-frontend:latest"

echo "✅ 모든 이미지 빌드 및 푸시 완료!"
echo ""
echo "🎯 배포된 이미지:"
echo "- $DOCKER_USERNAME/mvs-backend:$VERSION"
echo "- $DOCKER_USERNAME/mvs-backend:latest"
echo "- $DOCKER_USERNAME/mvs-frontend:$VERSION"
echo "- $DOCKER_USERNAME/mvs-frontend:latest"
echo ""
echo "🚀 이제 다음 명령어로 프로덕션 환경에서 실행할 수 있습니다:"
echo "docker-compose -f docker-compose.prod.yml up -d"


