# Cloudflare 보안 체크리스트

이 문서는 `ADMIN_ALLOWED_IPS`를 비워두는 운영 방식을 전제로 Cloudflare에서 보완할 방어 기준을 정리한다.

## 목표

- 고정 IP가 없어도 관리자 기능과 로그인/가입 API를 기본적으로 보호한다.
- 과도한 요청으로 Render/Neon 무료 또는 저비용 플랜이 소모되지 않게 한다.
- 정상 사용자가 불필요하게 차단되지 않도록 처음에는 보수적으로 관찰 중심으로 시작한다.

## 기본 방어 구조

현재 프로젝트는 아래 계층으로 방어한다.

1. 백엔드 Spring Security 권한 검증
2. 백엔드 rate limit
3. Cloudflare Bot Fight Mode 또는 WAF
4. 강한 admin 비밀번호와 관리자 기능 최소 노출
5. Render/Cloudflare 로그 모니터링

`ADMIN_ALLOWED_IPS`는 고정 IP가 있을 때만 사용한다. 고정 IP가 없으면 비워두고 위 계층을 조합한다.

## Cloudflare 권장 설정

### 1. Bot Fight Mode

초기 운영에서는 Bot Fight Mode를 켜고, 로그인/가입/API 요청에 문제가 생기는지 관찰한다.

- 위치: Cloudflare Dashboard > Security > Settings 또는 Security > Bots
- 설정: Bot Fight Mode `On`
- 확인: Security > Events에서 Bot Fight Mode로 처리된 요청 확인

주의:

- Bot Fight Mode는 도메인 전체에 적용된다.
- API 트래픽이나 자동화된 정상 요청도 챌린지될 수 있다.
- 문제가 생기면 먼저 Security Events를 확인하고, 필요하면 Bot Fight Mode를 끈 뒤 WAF custom rule 중심으로 전환한다.

### 2. WAF Custom Rules

로그인, 가입, 관리자 화면처럼 민감한 경로부터 규칙을 만든다.

우선 후보:

- `/api/users/login`
- `/api/users/signup`
- `/api/guilds/join-requests`
- `/api/guilds/create-requests`
- `/api/admin/*`
- `/api/users/admin/*`

초기 권장 액션:

- 처음에는 `Managed Challenge` 또는 `JS Challenge`를 우선 사용한다.
- 바로 `Block`을 쓰면 정상 사용자를 막을 수 있으므로, 이벤트를 보고 점진적으로 강화한다.
- 명확한 악성 패턴이나 비정상 국가/ASN이 반복될 때만 차단을 검토한다.

### 3. Rate Limiting Rules

백엔드 rate limit과 별도로 Cloudflare에서도 외부 요청량을 줄인다.

초기 후보:

| 경로 | 기준 | 액션 |
| --- | --- | --- |
| `/api/users/login` | 같은 IP에서 짧은 시간 다수 요청 | Managed Challenge |
| `/api/users/signup` | 같은 IP에서 짧은 시간 다수 요청 | Managed Challenge |
| `/api/guilds/*requests*` | 가입/개설 요청 반복 | Managed Challenge |
| `/api/admin/*` | 관리자 API 반복 요청 | Managed Challenge 또는 Block |

정확한 숫자는 운영 로그를 보고 조정한다. 백엔드 기준값은 아래와 같다.

```text
RATE_LIMIT_LOGIN_PER_MINUTE=5
RATE_LIMIT_SIGNUP_PER_MINUTE=3
RATE_LIMIT_GUILD_REQUEST_PER_MINUTE=5
RATE_LIMIT_ADMIN_PER_MINUTE=60
```

Cloudflare는 백엔드보다 앞단에서 막는 역할이므로, 처음에는 백엔드보다 약간 넓게 잡고 이벤트를 보며 조정한다.

## 운영 확인 루틴

### 배포 직후

- 로그인 가능 여부 확인
- 회원가입 요청 가능 여부 확인
- admin 로그인 가능 여부 확인
- admin API가 일반 계정에서 403으로 막히는지 확인
- Security > Events에서 정상 요청이 과도하게 챌린지되지 않는지 확인

### 주기 점검

- 401, 403, 429 응답이 갑자기 늘었는지 Render 로그 확인
- Cloudflare Security Events에서 반복 IP 또는 반복 경로 확인
- 로그인 실패가 반복되는 IP가 있으면 WAF rule 강화 검토
- 정상 사용자가 챌린지에 걸린 사례가 있으면 규칙 완화 검토

## 보류 항목

아래 항목은 사용자가 늘어난 뒤 필요할 때 도입한다.

- admin 작업 시 비밀번호 재확인
- 관리자 액션 감사 로그 테이블
- 이메일 승인/거절 알림
- Cloudflare Turnstile
- 고정 IP 확보 후 `ADMIN_ALLOWED_IPS` 활성화

## 참고 문서

- Cloudflare Bot Fight Mode: https://developers.cloudflare.com/bots/get-started/bot-fight-mode/
- Cloudflare WAF Custom Rules: https://developers.cloudflare.com/waf/custom-rules/
- Cloudflare Rate Limiting Rules: https://developers.cloudflare.com/waf/rate-limiting-rules/
