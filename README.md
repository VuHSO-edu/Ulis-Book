# ULIS Books — Repo

Web trade sách sinh viên ULIS. Theo chuẩn `vuhso-java-backend-rules` (backend) và `vuhso-frontend-rules` (frontend).

## Cấu trúc
```
ulis-books/
├── backend/     # Gradle multi-module (com.ulis)
│   ├── library/ulis-core          # hạ tầng dùng chung: ApiResponse, ResponseBuilder, GlobalExceptionHandler
│   └── services/business-service  # service chính ULIS Books
└── frontend/    # monorepo pnpm + Turborepo (React + Vite + AntD 5)
    ├── packages/                  # utils, apis, locale, styles
    └── apps/web                   # app sinh viên (login shell + routes)
```

## Chạy backend
```bash
cd backend
./gradlew bootRun          # mặc định port 8080
# verify: GET http://localhost:8080/health -> ApiResponse envelope
./gradlew build            # compile + test
```

## Chạy frontend
```bash
cd frontend
pnpm install
pnpm run dev               # mặc định port 5173
pnpm run build             # typecheck (tsc) + vite build
pnpm run lint              # eslint
```

## Trạng thái
- [x] **ticket 01 — skeleton**: envelope `ApiResponse`, `ResponseBuilder`, `GlobalExceptionHandler`, CORS, `GET /health`; monorepo pnpm + Turborepo, layout + router + guard
- [x] **ticket 02 — đăng ký + OTP email giáo dục**: email `.edu`/`.edu.vn`, OTP 6 số (BCrypt, single-use, 5 phút, giới hạn resend), Dev/SmtpOtpSender; màn register + OTP (vi/en)
- [x] **ticket 03 — đăng nhập JWT + phiên + profile**: Spring Security stateless, JWT HS256 (access 15m / refresh 14d, rotation), `/auth/login|refresh`, `/profile/me` GET/PUT, 401/403 envelope, auto-refresh + route guard + màn profile
- [ ] Các ticket sau (04–14): xem `../.scratch/ulis-books/issues/` (tracker local, ngoài repo)
