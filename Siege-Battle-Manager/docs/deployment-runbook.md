# Deployment Runbook

이 문서는 첫 운영 배포를 진행할 때 따라갈 순서를 정리한다.

## 1. Neon PostgreSQL

1. Neon에서 새 프로젝트를 만든다.
2. 데이터베이스 이름과 계정을 확인한다.
3. JDBC URL을 복사한다.
4. 운영 비밀번호는 Git에 기록하지 않고 배포 서비스 환경변수에만 등록한다.

Render에 넣을 `DB_URL`은 JDBC 형식이어야 한다.

```text
jdbc:postgresql://HOST:5432/DB_NAME?sslmode=require
```

## 2. Render Backend

Render에서 Web Service를 만든다.

Blueprint로 생성할 경우 저장소 루트의 `render.yaml`을 사용한다. `sync: false`로 선언된 값은 Render 대시보드에서 직접 입력한다.

| Field | Value |
| --- | --- |
| Root Directory | `Siege-Battle-Manager/backend/siege-backend` |
| Runtime | Docker |

백엔드는 `Dockerfile`로 빌드한다. 운영 비밀값은 Dockerfile에 넣지 않고 Render 환경변수로만 등록한다.

필수 환경변수:

```text
SPRING_PROFILES_ACTIVE=prod
DB_URL=jdbc:postgresql://HOST:5432/DB_NAME?sslmode=require
DB_USERNAME=...
DB_PASSWORD=...
JWT_SECRET=...
CORS_ALLOWED_ORIGINS=https://FRONTEND_DOMAIN
DDL_AUTO=validate
```

첫 배포에서 테이블 생성이 필요하면 임시로 `DDL_AUTO=update`를 사용하고, 정상 확인 후 `validate`로 되돌린다.
최초 admin 계정 생성이 필요할 때만 `ADMIN_INITIAL_ID`, `ADMIN_INITIAL_PASSWORD`, `ADMIN_INITIAL_EMAIL`, `ADMIN_INITIAL_NICKNAME`을 임시로 등록한다.
admin 계정이 생성되면 해당 환경변수는 Render 환경변수에서 제거한다.

## 3. Cloudflare Pages Frontend

Cloudflare Pages에서 프론트 프로젝트를 연결한다.

| Field | Value |
| --- | --- |
| Root Directory | `Siege-Battle-Manager/frontend/siege-battle-manager` |
| Build Command | `npm run build` |
| Build Output Directory | `dist` |

필수 환경변수:

```text
VITE_API_BASE_URL=https://BACKEND_DOMAIN/api
```

프론트 빌드 이후 API 호출이 실패하면 먼저 `VITE_API_BASE_URL`과 백엔드 `CORS_ALLOWED_ORIGINS`가 서로 맞는지 확인한다.

Cloudflare 보안 설정은 `docs/cloudflare-security-checklist.md`를 기준으로 점검한다.

## 4. Smoke Test

배포 후 최소 확인 항목:

1. 로그인 실패 메시지가 정상 출력되는지 확인한다.
2. admin 계정 로그인이 가능한지 확인한다.
3. 일반 회원가입 요청이 승인 전 로그인 불가 상태인지 확인한다.
4. 길드장 승인 후 길드 탭 접근이 가능한지 확인한다.
5. 길드원은 다른 길드 데이터에 접근할 수 없는지 확인한다.
6. 인벤토리 수량 제한이 유지되는지 확인한다.
7. 방덱 생성, 전투 연구 작성, 댓글 작성이 가능한지 확인한다.
8. `/api/admin/**`가 일반 계정으로 차단되는지 확인한다.

## 5. After First Successful Deploy

첫 배포가 성공하면 저장소 분리를 진행한다.

- Public 저장소: 포트폴리오용 안정 버전과 문서 유지
- Private 저장소: 운영 설정, 점령전 로그 파서, SMTP 설정, 실서비스 자동화 관리

운영 비밀값은 어느 저장소에도 커밋하지 않는다.

## 6. Deployment Verification Log

### 2026-07-15

배포 저장소 분리 이후 기본 연결 상태를 확인했다.

- Frontend: `https://sw-siege.pages.dev` 200 응답 확인
- Backend: `https://sw-siege-backend.onrender.com/api/monsters` 200 응답 확인
- Database: `/api/monsters`에서 Neon PostgreSQL 데이터 조회 확인
- CORS: `Origin: https://sw-siege.pages.dev` 요청에 `access-control-allow-origin: https://sw-siege.pages.dev` 확인
- Frontend bundle: 배포된 JS 번들에 `https://sw-siege-backend.onrender.com/api` 포함 확인

대시보드에서 확인해야 할 항목:

- Render 백엔드 서비스가 비공개 저장소를 바라보는지 확인
- Cloudflare Pages 프론트 프로젝트가 비공개 저장소를 바라보는지 확인
- 공개 저장소 푸쉬가 실서비스 자동 배포를 트리거하지 않는지 확인

### 2026-07-15 보안 smoke test

운영 URL 기준 기본 보안 응답을 확인했다.

- Frontend: `https://sw-siege.pages.dev` 200 응답 확인
- Backend root: 미로그인 요청 401 응답 확인
- Admin API: `GET /api/admin/guilds` 미로그인 요청 401 JSON 응답 확인
- Auth API: `GET /api/users/me` 미로그인 요청 401 JSON 응답 확인
- Monster API: `GET /api/monsters` 200 응답 확인
- Monster API 응답 크기: 약 386KB
- Monster API 응답 시간: 약 2.68초

미로그인 차단 응답:

```json
{"success":false,"data":null,"message":"로그인이 필요합니다."}
```
