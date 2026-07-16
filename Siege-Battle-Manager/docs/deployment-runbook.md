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

백엔드와 DB는 같은 리전에 둔다. Neon PostgreSQL을 Singapore 리전으로 만들었다면 Render 백엔드도 Singapore 리전으로 생성한다. Render는 기존 서비스의 리전을 직접 변경할 수 없으므로, 리전 변경이 필요하면 새 Web Service를 원하는 리전에 만들고 `VITE_API_BASE_URL`을 새 백엔드 주소로 전환한다.

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

운영 URL의 기본 응답은 아래 스크립트로 빠르게 확인할 수 있다.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\operational-smoke-test.ps1
```

로그인 이후 API까지 확인하려면 운영 비밀번호를 파일에 쓰지 말고 현재 터미널 환경변수로만 넣는다.

```powershell
$env:SMOKE_LOGIN_ID="일반계정ID"
$env:SMOKE_LOGIN_PASSWORD="일반계정비밀번호"
powershell -ExecutionPolicy Bypass -File .\scripts\operational-smoke-test.ps1
```

admin 계정으로 admin API 접근 가능 여부를 확인할 때만 아래 값을 추가한다.

```powershell
$env:SMOKE_LOGIN_IS_ADMIN="true"
```

사용자 흐름 기준 기능 점검은 `docs/functional-release-checklist.md`를 기준으로 진행한다.

## 5. After First Successful Deploy

첫 배포가 성공하면 저장소 분리를 진행한다.

- Public 저장소: 포트폴리오용 안정 버전과 문서 유지
- Private 저장소: 운영 설정, 점령전 로그 파서, SMTP 설정, 실서비스 자동화 관리

운영 비밀값은 어느 저장소에도 커밋하지 않는다.

## 6. Deployment Verification Log

### 2026-07-15

배포 저장소 분리 이후 기본 연결 상태를 확인했다. 이 시점에는 이전 Oregon 백엔드 주소를 사용하고 있었다.

- Frontend: `https://sw-siege.pages.dev` 200 응답 확인
- Backend(이전 Oregon): `https://sw-siege-backend.onrender.com/api/monsters` 200 응답 확인
- Database: `/api/monsters`에서 Neon PostgreSQL 데이터 조회 확인
- CORS: `Origin: https://sw-siege.pages.dev` 요청에 `access-control-allow-origin: https://sw-siege.pages.dev` 확인
- Frontend bundle: 배포된 JS 번들에 이전 Oregon 백엔드 `https://sw-siege-backend.onrender.com/api` 포함 확인

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

### 2026-07-16 백엔드 리전 재배치

Neon PostgreSQL이 Singapore 리전인데 기존 Render 백엔드가 Oregon 리전에 있어 인증과 DB 조회가 들어가는 API가 1초 이상 지연됐다. Render 백엔드를 Singapore 리전에 새로 생성하고 Cloudflare Pages의 `VITE_API_BASE_URL`을 새 백엔드로 변경했다.

이전 구성:

```text
Cloudflare Pages -> Render Oregon -> Neon Singapore
```

변경 구성:

```text
Cloudflare Pages -> Render Singapore -> Neon Singapore
```

측정 결과:

| API | Oregon 평균 | Singapore 평균 |
| --- | ---: | ---: |
| `POST /api/users/login` | 1135ms | 702ms |
| `GET /api/users/bootstrap` | 1234ms | 228ms |
| `GET /api/guild-members/{id}/inventory` | 1082ms | 274ms |
| `GET /api/defense-decks` | 1082ms | 163ms |
| `GET /api/ownerless-defense-decks` | 1428ms | 175ms |
| `GET /api/research/posts?page=0` | 1502ms | 213ms |

운영 기준:

- Render 백엔드와 Neon DB 리전은 동일하게 맞춘다.
- 리전 변경 후 Cloudflare Pages 환경변수 `VITE_API_BASE_URL`을 새 백엔드 주소로 변경하고 재배포한다.
- 새 백엔드 동작 확인 후 기존 리전의 Render 서비스는 삭제해 중복 과금을 막는다.

### 2026-07-16 리전 전환 후 최종 smoke test

기존 Oregon Render 서비스를 삭제한 뒤 운영 프론트가 Singapore 백엔드만 바라보는지 확인했다.

- Frontend: `https://sw-siege.pages.dev` 200 응답 확인
- Frontend bundle: `https://sw-siege-backend-sg.onrender.com/api` 포함 확인
- Backend: `https://sw-siege-backend-sg.onrender.com/api/health` 응답 확인
- CORS: `Origin: https://sw-siege.pages.dev` 요청 정상 응답 확인
- Login: `asdf` 테스트 계정 로그인 정상 확인
- Guild: `asdf` 테스트 계정이 `asdf` 길드의 `MASTER`로 조회되는 것 확인

최종 측정:

| API | 응답 시간 |
| --- | ---: |
| Frontend 200 | 503ms |
| `GET /api/health` | 431ms |
| `GET /api/monsters/selection` | 864ms |
| `GET /api/guild-members/{id}/inventory` | 162ms |
| `GET /api/defense-decks` | 166ms |
| `GET /api/ownerless-defense-decks` | 306ms |
| `GET /api/research/posts?page=0` | 172ms |

운영 기본 백엔드 URL:

```text
https://sw-siege-backend-sg.onrender.com
```

### 2026-07-16 운영 보안 1차 점검

Singapore 백엔드 전환 후 운영 URL 기준 기본 보안 응답과 설정을 확인했다.

실행 확인:

- 미로그인 `GET /api/admin/guilds`: 401 응답
- 미로그인 `GET /api/guilds`: 401 응답
- 미로그인 `GET /api/users/admin/nickname-change-requests`: 401 응답
- 일반 계정 `asdf` 로그인 후 admin API 접근: 403 응답
- 허용 Origin `https://sw-siege.pages.dev`: CORS 허용 확인
- 비허용 Origin `https://evil.example`: CORS 허용 헤더 없이 차단 확인
- 운영 smoke test: 통과
- 일반 계정 인증 포함 smoke test: 통과

코드/설정 확인:

- `prod` 프로필에서 H2 console 비활성화 확인
- `server.error.include-*` 설정으로 운영 에러 상세 노출 차단 확인
- `JWT_SECRET`은 환경변수 `security.jwt.secret: ${JWT_SECRET}`로만 주입 확인
- `/api/admin/**`, `/api/users/admin/**`는 `ROLE_ADMIN` 필요
- 인벤토리, 방덱, 길드 방덱, 전투 연구 조회/수정 경로는 현재 로그인 유저의 승인된 길드 멤버와 대상 리소스의 길드가 일치하는지 검증
- 길드 방덱 생성/삭제는 마스터 또는 부마스터만 가능
- 전투 연구 게시글/댓글 삭제는 작성자 또는 길드장만 가능

잔여 확인:

- 실제 다른 길드 계정 2개를 준비하면 교차 길드 접근 차단을 운영 API로 한 번 더 확인한다.
- `ADMIN_ALLOWED_IPS`는 현재 비워두는 운영 방식이므로 Cloudflare WAF, rate limit, 강한 admin 비밀번호, admin API 권한 검수로 보완한다.

### 2026-07-16 운영 설정 최종 점검

Render, Cloudflare Pages, Neon 연결 기준을 Singapore 백엔드 기준으로 재확인했다.

확인 결과:

- 운영 프론트: `https://sw-siege.pages.dev` 200 응답
- 운영 백엔드: `https://sw-siege-backend-sg.onrender.com`
- `GET /api/health`: `UP` 응답
- `/api/monsters`: 200 응답, 약 431KB
- `/api/monsters/selection`: 200 응답, 약 360KB
- CORS 허용 Origin: `https://sw-siege.pages.dev`
- `render.yaml` 서비스명: `sw-siege-backend-sg`
- Render 민감 환경변수: `sync: false` 유지
- Cloudflare Pages `VITE_API_BASE_URL`은 Singapore 백엔드 `/api` 주소를 사용해야 함

보류:

- `SMOKE_LOGIN_ID`, `SMOKE_LOGIN_PASSWORD`를 설정한 인증 포함 smoke test는 필요할 때 별도로 실행한다.
- Cloudflare Bot Fight Mode/WAF는 Security Events를 보며 점진적으로 조정한다.

### 2026-07-16 인증 포함 운영 smoke test

운영 테스트 계정 `asdf`로 로그인한 뒤 인증이 필요한 기본 API와 권한 차단을 확인했다.

확인 결과:

- 운영 프론트: 200 응답
- 운영 백엔드 health: `UP` 응답
- 미로그인 API 보호 응답: 정상
- 몬스터 API: 정상 응답
- CORS 허용 Origin: `https://sw-siege.pages.dev`
- 로그인: 토큰 발급 정상
- `GET /api/users/bootstrap`: 인증 성공
- `GET /api/users/me`: 인증 성공
- 일반 계정의 `GET /api/admin/guilds`: 403 응답

명령:

```powershell
$env:SMOKE_LOGIN_ID="asdf"
$env:SMOKE_LOGIN_PASSWORD="asdf"
./scripts/operational-smoke-test.ps1
```
