# API.md

Siege-Battle-Manager API 문서

---

# 📌 공통 정보

## Base URL

```text
http://localhost:8080
```

## API Prefix

```text
/api
```

## 공통 응답 구조

```json
{
  "success": true,
  "data": {},
  "message": null
}
```

에러 응답:

```json
{
  "success": false,
  "data": null,
  "message": "에러 메시지"
}
```

## 인증 방식

JWT 인증이 필요한 API는 로그인 성공 시 발급된 토큰을 `Authorization` 헤더에 포함합니다.

```text
Authorization: Bearer {JWT}
```

## 몬스터 식별 기준

몬스터 식별자는 `monsterCode`를 우선 사용합니다.

```text
예: sw_10131
```

기존 응답에는 호환성을 위해 `monsterId`가 함께 내려갈 수 있지만, 신규 요청과 프론트 연동은 `monsterCode` 기준을 우선합니다.

---

# 👤 User API

## 회원가입

```http
POST /api/users/signup
Content-Type: application/json
```

```json
{
  "loginId": "test",
  "email": "test@test.com",
  "password": "test",
  "nickname": "test",
  "signupType": "master",
  "guildName": "test"
}
```

응답:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "loginId": "test",
    "email": "test@test.com",
    "nickname": "test"
  },
  "message": null
}
```

## 로그인

```http
POST /api/users/login
Content-Type: application/json
```

```json
{
  "loginId": "test",
  "password": "test"
}
```

응답:

```json
{
  "success": true,
  "data": {
    "userId": 1,
    "loginId": "test",
    "email": "test@test.com",
    "nickname": "test",
    "token": "JWT_TOKEN"
  },
  "message": null
}
```

## 내 정보 조회

```http
GET /api/users/me
Authorization: Bearer {JWT}
```

응답:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "loginId": "test",
    "email": "test@test.com",
    "nickname": "test",
    "role": "USER"
  },
  "message": null
}
```

## 닉네임 변경 요청

```http
POST /api/users/me/nickname-change-requests
Authorization: Bearer {JWT}
Content-Type: application/json
```

```json
{
  "newNickname": "새닉네임"
}
```

## 내 닉네임 변경 대기 요청 조회

```http
GET /api/users/me/nickname-change-requests/pending
Authorization: Bearer {JWT}
```

## 내 닉네임 변경 대기 요청 철회

```http
DELETE /api/users/me/nickname-change-requests/pending
Authorization: Bearer {JWT}
```

---

# 🏰 Guild API

## 길드 생성

```http
POST /api/guilds
Authorization: Bearer {JWT}
Content-Type: application/json
```

```json
{
  "name": "test"
}
```

## 길드 목록 조회

```http
GET /api/guilds
Authorization: Bearer {JWT}
```

## 내 길드 조회

```http
GET /api/guilds/me
Authorization: Bearer {JWT}
```

## 내 길드원 조회

```http
GET /api/guilds/me/members
Authorization: Bearer {JWT}
```

응답 예시:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "displayName": "test",
      "role": "MASTER"
    }
  ],
  "message": null
}
```

## 내 길드 가입 요청 목록 조회

길드장/부길드장이 처리할 수 있는 가입 요청을 조회합니다.

```http
GET /api/guilds/me/join-requests
Authorization: Bearer {JWT}
```

## 기존 계정의 길드 가입 요청

길드가 없는 기존 계정이 새 길드 가입을 요청합니다.

```http
POST /api/guilds/join-requests
Authorization: Bearer {JWT}
Content-Type: application/json
```

```json
{
  "guildName": "test"
}
```

## 내 기존 계정 가입 요청 조회

```http
GET /api/guilds/join-requests/me
Authorization: Bearer {JWT}
```

## 내 기존 계정 가입 요청 철회

```http
DELETE /api/guilds/join-requests/me
Authorization: Bearer {JWT}
```

## 기존 계정 가입 요청 승인

```http
POST /api/guilds/me/account-join-requests/{requestId}/approve
Authorization: Bearer {JWT}
```

## 기존 계정 가입 요청 거절

```http
POST /api/guilds/me/account-join-requests/{requestId}/reject
Authorization: Bearer {JWT}
```

---

# 👥 Guild Member API

## 가상 길드원 추가

길드장/부길드장이 로그인 계정 없이 인벤토리와 방덱만 관리할 더미 계정을 생성합니다.
더미 계정도 길드 정원 35명에 포함됩니다.

```http
POST /api/guild-members/{guildId}/virtual
Authorization: Bearer {JWT}
Content-Type: application/json
```

```json
{
  "displayName": "길드원A"
}
```

## 가상 길드원 삭제

```http
DELETE /api/guild-members/{guildMemberId}
Authorization: Bearer {JWT}
```

## 내 길드의 길드원 목록 조회

```http
GET /api/guild-members/me
Authorization: Bearer {JWT}
```

응답 예시:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userId": 1,
      "loginId": "test",
      "displayName": "테스트",
      "role": "MASTER",
      "status": "APPROVED",
      "realUser": true,
      "lastLoginAt": "2026-07-13T18:27:00"
    }
  ],
  "message": null
}
```

## 길드원 등급 변경

```http
PATCH /api/guild-members/{guildMemberId}/role
Authorization: Bearer {JWT}
Content-Type: application/json
```

```json
{
  "role": "SUB_MASTER"
}
```

## 실제 길드원 추방

```http
DELETE /api/guild-members/{guildMemberId}/real
Authorization: Bearer {JWT}
```

## 길드장 양도

현재 길드장만 같은 길드의 승인된 실제 길드원에게 양도할 수 있습니다.

```http
PATCH /api/guild-members/{guildMemberId}/transfer-master
Authorization: Bearer {JWT}
```

처리 결과:

- 기존 길드장은 `SUB_MASTER`로 변경
- 대상 길드원은 `MASTER`로 변경
- 길드의 `master` 참조도 대상 길드원으로 변경

## 재가입 불가 목록 조회

```http
GET /api/guild-members/bans
Authorization: Bearer {JWT}
```

## 재가입 불가 해제

```http
PATCH /api/guild-members/bans/{banId}/lift
Authorization: Bearer {JWT}
```

---

# 🛠️ Admin API

## 길드장 가입 신청 목록 조회

```http
GET /api/admin/guild-join-requests/masters
Authorization: Bearer {JWT}
```

## 가입 신청 승인

```http
POST /api/admin/guild-join-requests/{requestId}/approve
Authorization: Bearer {JWT}
```

## 가입 신청 거절

```http
POST /api/admin/guild-join-requests/{requestId}/reject
Authorization: Bearer {JWT}
```

## 닉네임 변경 요청 목록 조회

```http
GET /api/users/admin/nickname-change-requests
Authorization: Bearer {JWT}
```

## 닉네임 변경 요청 승인

```http
POST /api/users/admin/nickname-change-requests/{requestId}/approve
Authorization: Bearer {JWT}
```

## 닉네임 변경 요청 거절

```http
POST /api/users/admin/nickname-change-requests/{requestId}/reject
Authorization: Bearer {JWT}
```

## 관리자 길드 목록 조회

```http
GET /api/admin/guilds
Authorization: Bearer {JWT}
```

## 관리자 길드원 목록 조회

```http
GET /api/admin/guilds/{guildId}/members
Authorization: Bearer {JWT}
```

## 길드원 길드 이동 이력 조회

```http
GET /api/admin/guilds/members/{guildMemberId}/history
Authorization: Bearer {JWT}
```

## 길드원 닉네임 변경 이력 조회

```http
GET /api/admin/guilds/members/{guildMemberId}/nickname-histories
Authorization: Bearer {JWT}
```

---

# 🎒 Guild Member Inventory API

## 길드원 인벤토리 조회

```http
GET /api/guild-members/{guildMemberId}/inventory
Authorization: Bearer {JWT}
```

응답 예시:

```json
{
  "success": true,
  "data": [
    {
      "monsterId": 1,
      "monsterCode": "sw_10131",
      "monsterName": "프랑켄",
      "quantity": 2
    }
  ],
  "message": null
}
```

## 길드원 인벤토리 저장

```http
PUT /api/guild-members/{guildMemberId}/inventory
Authorization: Bearer {JWT}
Content-Type: application/json
```

```json
{
  "items": [
    {
      "monsterCode": "sw_10131",
      "quantity": 2
    }
  ]
}
```

제한:

- `quantity`는 0~10 범위로 저장됩니다.
- 10 초과 값은 10으로 보정됩니다.
- 음수 값은 0으로 보정됩니다.
- 이미 방덱에 사용 중인 수량보다 낮게 저장할 수 없습니다.

---

# 👾 Monster API

## 몬스터 목록 조회

```http
GET /api/monsters
```

응답 예시:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "code": "sw_10131",
      "name": "Crawler",
      "koreanName": "프랑켄",
      "aliases": ["불프랑", "프랑"],
      "attribute": "FIRE",
      "imageUrl": "https://swarfarm.com/static/herders/images/monsters/...",
      "naturalStars": 3,
      "awakeningLevel": 2,
      "enabled": true,
      "leaderEffectType": "Defense",
      "leaderEffectAmount": 21,
      "leaderEffectArea": "Guild"
    }
  ],
  "message": null
}
```

이미지 파일 원본은 저장소에 포함하지 않고, 외부 API 이미지 URL만 DB에 저장합니다.

## 몬스터 직접 생성

```http
POST /api/monsters
Content-Type: application/json
```

현재 운영 흐름에서는 Swarfarm 동기화와 로컬 관리 파일을 우선 사용합니다.

---

# 🧩 Monster Admin API

## Swarfarm 몬스터 동기화

```http
POST /api/admin/monsters/sync-swarfarm
Authorization: Bearer {JWT}
```

처리 기준:

- Swarfarm API에서 몬스터 데이터를 가져옵니다.
- `com2us_id` 기준으로 기존 몬스터를 갱신합니다.
- 신규 몬스터는 `code = "sw_" + com2usId` 형식으로 생성합니다.
- 이미지 파일은 저장하지 않고 `imageUrl`만 저장합니다.

## 로컬 한글명/별칭 적용

```http
POST /api/admin/monsters/apply-localization
Authorization: Bearer {JWT}
```

관리 파일:

```text
Siege-Battle-Manager/backend/siege-backend/src/main/resources/data/monster-localization.json
```

## 로컬라이징 목록 조회

```http
GET /api/admin/monsters/localization
Authorization: Bearer {JWT}
```

응답 예시:

```json
{
  "success": true,
  "data": [
    {
      "code": "sw_10131",
      "enabled": true,
      "awakeningLevel": 2,
      "englishName": "Crawler",
      "attribute": "FIRE",
      "naturalStars": 3,
      "koreanName": "프랑켄",
      "aliases": ["불프랑", "프랑"],
      "imageUrl": "https://swarfarm.com/static/herders/images/monsters/..."
    }
  ],
  "message": null
}
```

## 로컬라이징 항목 수정

```http
PUT /api/admin/monsters/localization/{code}
Authorization: Bearer {JWT}
Content-Type: application/json
```

```json
{
  "enabled": true,
  "koreanName": "프랑켄",
  "aliases": ["불프랑", "프랑"]
}
```

---

# 🛡️ Defense Deck API

## 길드원 방덱 생성

```http
POST /api/defense-decks/{guildMemberId}
Authorization: Bearer {JWT}
Content-Type: application/json
```

```json
{
  "monsterCodes": ["sw_10131", "sw_10231", "sw_10331"]
}
```

첫 번째 몬스터가 리더로 처리됩니다.

## 길드 방덱 목록 조회

```http
GET /api/defense-decks?monsterFilterCode=sw_10131&leaderEffect=Defense&ownerMemberId=1
Authorization: Bearer {JWT}
```

Query Params:

| 이름 | 필수 | 설명 |
|---|---:|---|
| `monsterFilterCode` | N | 포함 몬스터 필터. `monsterCode` 사용 |
| `leaderEffect` | N | 리더 효과 필터 |
| `ownerMemberId` | N | 특정 길드원 방덱만 조회 |

## 길드원 방덱 삭제

```http
DELETE /api/defense-decks/{deckId}
Authorization: Bearer {JWT}
```

---

# 📋 Ownerless Defense Deck API

주인 없는 방덱은 길드 운영진이 공용 템플릿처럼 관리하는 방덱입니다.

## 템플릿 생성

```http
POST /api/ownerless-defense-decks
Authorization: Bearer {JWT}
Content-Type: application/json
```

```json
{
  "title": "공용 방덱 A",
  "monsterCodes": ["sw_10131", "sw_10231", "sw_10331"]
}
```

## 템플릿 목록 조회

```http
GET /api/ownerless-defense-decks
Authorization: Bearer {JWT}
```

## 템플릿 상세 조회

```http
GET /api/ownerless-defense-decks/{deckId}
Authorization: Bearer {JWT}
```

## 템플릿 삭제

```http
DELETE /api/ownerless-defense-decks/{deckId}
Authorization: Bearer {JWT}
```

---

# 🔬 Battle Research API

API prefix:

```text
/api/research
```

## 게시글 작성

```http
POST /api/research/posts
Authorization: Bearer {JWT}
Content-Type: application/json
```

```json
{
  "title": "방덱 공략",
  "monsterCodes": ["sw_10131", "sw_10231", "sw_10331"],
  "content": "공략 내용"
}
```

제한:

- `title`: 최대 100자
- `content`: 최대 3000자
- 같은 사용자는 게시글을 30초에 1회 작성할 수 있습니다.

## 게시글 목록 조회

```http
GET /api/research/posts?page=0&size=10&leaderEffect=Defense&monsterCode=sw_10131&fourStarOnly=true
Authorization: Bearer {JWT}
```

Query Params:

| 이름 | 필수 | 설명 |
|---|---:|---|
| `page` | N | 0부터 시작하는 페이지 번호 |
| `size` | N | 페이지 크기. 기본 10개 단위 사용 |
| `leaderEffect` | N | 리더 효과 필터 |
| `monsterCode` | N | 포함 몬스터 필터 |
| `fourStarOnly` | N | `true`면 5성 몬스터 미포함 방덱만 조회 |

검색/필터는 백엔드에서 전체 게시글 기준으로 적용한 뒤 페이지네이션합니다.

## 게시글 상세 조회

```http
GET /api/research/posts/{postId}
Authorization: Bearer {JWT}
```

## 게시글 수정

```http
PUT /api/research/posts/{postId}
Authorization: Bearer {JWT}
Content-Type: application/json
```

```json
{
  "title": "수정된 공략",
  "defenseMonsterCodes": ["sw_10131", "sw_10231", "sw_10331"]
}
```

## 게시글 삭제

```http
DELETE /api/research/posts/{postId}
Authorization: Bearer {JWT}
```

## 댓글 작성

```http
POST /api/research/posts/{postId}/comments
Authorization: Bearer {JWT}
Content-Type: application/json
```

```json
{
  "attackMonsterCodes": ["sw_20131", "sw_20231", "sw_20331"],
  "content": "공덱 메모"
}
```

제한:

- `content`: 최대 1000자
- 같은 사용자는 댓글을 30초에 1회 작성할 수 있습니다.
- 댓글 목록은 상세 조회 응답에서 10개 단위 페이지네이션 기준으로 처리합니다.

## 댓글 수정

```http
PUT /api/research/comments/{commentId}
Authorization: Bearer {JWT}
Content-Type: application/json
```

```json
{
  "attackMonsterCodes": ["sw_20131", "sw_20231", "sw_20331"],
  "content": "수정된 공덱 메모"
}
```

## 댓글 삭제

```http
DELETE /api/research/comments/{commentId}
Authorization: Bearer {JWT}
```

---

# 🔒 공개 저장소 정책

- `.env`, 로컬 H2 DB, 실행 로그는 GitHub에 포함하지 않습니다.
- 게임 몬스터 이미지 원본 파일은 저장소에 포함하지 않습니다.
- 몬스터 이미지는 외부 API의 이미지 URL을 DB에 저장해 사용합니다.
- 사용자 화면 노출 이름은 `monster-localization.json`의 `koreanName`, `aliases`, `enabled`, `awakeningLevel` 기준을 따릅니다.
