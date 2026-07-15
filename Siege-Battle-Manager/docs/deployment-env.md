# Deployment Environment Variables

운영 배포에서는 민감한 값을 Git에 커밋하지 않고 배포 서비스의 환경변수로 관리한다.

## Backend

Render 또는 Spring Boot 실행 환경에 등록한다.

| Name | Example | Required | Note |
| --- | --- | --- | --- |
| `SPRING_PROFILES_ACTIVE` | `prod` | yes | 운영에서는 `prod` 사용 |
| `DB_URL` | `jdbc:postgresql://host:5432/dbname?sslmode=require` | yes | Neon PostgreSQL JDBC URL |
| `DB_USERNAME` | `neondb_owner` | yes | 운영 DB 계정 |
| `DB_PASSWORD` | `********` | yes | 운영 DB 비밀번호 |
| `DB_MAX_POOL_SIZE` | `5` | no | Render/Neon 기본 커넥션 풀 최대 크기 |
| `DB_MIN_IDLE` | `0` | no | 유휴 커넥션 최소 유지 수 |
| `DB_CONNECTION_TIMEOUT` | `30000` | no | DB 커넥션 획득 대기 시간(ms) |
| `DB_VALIDATION_TIMEOUT` | `5000` | no | DB 커넥션 검증 대기 시간(ms) |
| `DB_IDLE_TIMEOUT` | `60000` | no | 유휴 커넥션 정리 시간(ms) |
| `DB_MAX_LIFETIME` | `300000` | no | 커넥션 최대 생존 시간(ms) |
| `DB_KEEPALIVE_TIME` | `120000` | no | 커넥션 keepalive 주기(ms) |
| `JWT_SECRET` | `********` | yes | 32바이트 이상 새 값 사용 |
| `DDL_AUTO` | `validate` | no | 운영 기본값은 `validate` |
| `CORS_ALLOWED_ORIGINS` | `https://example.pages.dev,https://example.com` | yes | 프론트 운영 도메인만 허용 |
| `ADMIN_ALLOWED_IPS` | `203.0.113.10` | no | 비워두면 IP 제한 비활성화 |
| `RATE_LIMIT_ENABLED` | `true` | no | 기본값 `true` |
| `RATE_LIMIT_LOGIN_PER_MINUTE` | `10` | no | 로그인 요청 제한 |
| `RATE_LIMIT_SIGNUP_PER_MINUTE` | `5` | no | 회원가입 요청 제한 |
| `RATE_LIMIT_GUILD_REQUEST_PER_MINUTE` | `10` | no | 길드 가입/개설 요청 제한 |
| `RATE_LIMIT_ADMIN_PER_MINUTE` | `120` | no | 관리자 API 요청 제한 |
| `ADMIN_INITIAL_ID` | `admin` | no | 최초 admin 자동 생성용. 생성 후 제거 권장 |
| `ADMIN_INITIAL_PASSWORD` | `********` | no | 최초 admin 자동 생성용. 생성 후 제거 권장 |
| `ADMIN_INITIAL_EMAIL` | `admin@example.com` | no | 기본값 `admin@example.local` |
| `ADMIN_INITIAL_NICKNAME` | `admin` | no | 기본값 `admin` |
| `SWARFARM_BASE_URL` | `https://swarfarm.com/api/v2` | no | 기본값 있음 |
| `SWARFARM_IMAGE_BASE_URL` | `https://swarfarm.com/static/herders/images/monsters` | no | 기본값 있음 |
| `SWARFARM_PAGE_SIZE` | `200` | no | Swarfarm 동기화 페이지 크기 |
| `SWARFARM_CONNECT_TIMEOUT_SECONDS` | `10` | no | Swarfarm 연결 timeout |
| `SWARFARM_READ_TIMEOUT_SECONDS` | `30` | no | Swarfarm 응답 timeout |
| `SWARFARM_APPEND_MISSING_LOCALIZATION` | `false` | no | 운영에서는 `false` 권장 |

## Frontend

Cloudflare Pages 또는 Vercel에 등록한다.

| Name | Example | Required | Note |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | `https://api.example.com/api` | yes | 백엔드 API 주소 |

## Notes

- 공개된 적 있는 JWT 키는 운영에서 재사용하지 않는다.
- 운영 DB에서는 H2 console을 사용하지 않는다.
- 운영 첫 배포에서 스키마 자동 생성을 임시로 확인해야 할 때만 `DDL_AUTO=update`를 사용하고, 이후 `validate`로 되돌린다.
- `DDL_AUTO=validate` 상태에서는 엔티티와 DB 스키마가 맞지 않으면 서버가 시작되지 않는다. 운영 배포 전 로컬 PostgreSQL 또는 Neon branch에서 먼저 확인한다.
- Neon/Render 환경에서 간헐적인 DB I/O 오류가 보이면 커넥션 풀 값을 먼저 확인한다. 기본값은 저비용 플랜 기준으로 작게 잡는다.
- `ADMIN_ALLOWED_IPS`는 고정 IP가 있을 때만 사용한다. 고정 IP가 없으면 Cloudflare WAF나 관리자 계정 보안으로 보완한다.
- `ADMIN_INITIAL_ID`와 `ADMIN_INITIAL_PASSWORD`는 최초 운영 admin을 만들 때만 사용한다. admin 생성 후 Render 환경변수에서 제거한다.
