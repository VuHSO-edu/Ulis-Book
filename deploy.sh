#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# ULIS Books — Script Triển Khai 1 Câu Lệnh Trên Ubuntu Server (Docker Compose)
# Cách chạy trên Ubuntu:
#   bash deploy.sh
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "============================================================"
echo "🚀 Bắt đầu triển khai ULIS Books (Docker Compose)..."
echo "============================================================"

# 1. Kiểm tra & tự động cài Docker + Docker Compose trên Ubuntu nếu chưa có
if ! command -v docker >/dev/null 2>&1; then
  echo "📦 Chưa tìm thấy Docker. Đang tự động cài đặt Docker cho Ubuntu..."
  sudo apt-get update -y
  sudo apt-get install -y ca-certificates curl gnupg lsb-release openssl
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$USER" || true
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "📦 Đang cài đặt docker-compose-plugin..."
  sudo apt-get update -y
  sudo apt-get install -y docker-compose-plugin
fi

# 2. Tự động nhận diện IP máy chủ và khởi tạo file .env nếu chưa có
SERVER_IP="$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")"
if [ -z "$SERVER_IP" ]; then
  SERVER_IP="localhost"
fi

if [ ! -f ".env" ]; then
  echo "⚙️  Đang khởi tạo file .env tự động..."
  RANDOM_JWT_SECRET="$(openssl rand -hex 32 2>/dev/null || echo "ulis-books-prod-secret-key-$(date +%s)-256bit-safe")"
  cat > .env <<EOF
POSTGRES_DB=ulis
POSTGRES_USER=ulis
POSTGRES_PASSWORD=ulis

JWT_SECRET=${RANDOM_JWT_SECRET}

MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=nexteraofbooks@gmail.com
MAIL_PASSWORD=plcg ozzc nerr hwez

CORS_ALLOWED_ORIGINS=https://nextbooks.online,https://www.nextbooks.online,http://nextbooks.online,http://localhost:*,http://127.0.0.1:*,http://${SERVER_IP},http://${SERVER_IP}:*,https://${SERVER_IP},*
NEXTBOOK_DOMAIN=nextbooks.online
ADMIN_EMAIL=admin@ulis.edu.vn
ADMIN_PASSWORD=Admin@123456
EOF
  echo "✅ Đã tạo file .env (IP Server: ${SERVER_IP})"
else
  echo "✅ Đã tìm thấy file .env hiện có."
fi

# 3. Build và khởi chạy toàn bộ container (Postgres + Backend + Frontend/Nginx)
echo "🐳 Đang build và khởi chạy các container..."
sudo docker compose up --build -d

echo ""
echo "============================================================"
echo "🎉 TRIỂN KHAI THÀNH CÔNG!"
echo "------------------------------------------------------------"
echo "🌐 Truy cập Web App : http://${SERVER_IP}:9100"
echo "🔧 Truy cập API     : http://${SERVER_IP}:8080/swagger-ui/index.html"
echo "👤 Tài khoản Admin  : admin@ulis.edu.vn / Admin@123456"
echo "------------------------------------------------------------"
echo "📋 Xem log realtime : sudo docker compose logs -f"
echo "🛑 Dừng hệ thống    : sudo docker compose down"
echo "============================================================"
