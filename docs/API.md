# API.md

Siege-Battle-Manager API 문서

---

# 📌 공통 정보

## Base URL

```text id="2j2npi"
http://localhost:8080
```

---

# 📄 공통 응답 구조

모든 API는 아래 형태로 응답
```json
{
  "success": true,
  "data": {},
  "message": "성공"
}
```

---

# 🔐 인증 방식

JWT 기반 인증 사용

로그인 성공 시 발급된 토큰을 Header에 포함

```text
Authorization: Bearer {JWT}
```

---

# 👤 User API
## 회원가입
### Request
```http
POST /api/users/signup
Content-Type: application/json
```

---

## Body
```json
{
  "email": "test@test.com",
  "password": "1234",
  "name": "테스트"
}
```

---

## Response
```json
{
  "success": true,
  "data": {
    "id": 1
  },
  "message": "회원가입 성공"
}
```

---

# 🔐 로그인
## Request
```http
POST /api/users/login
Content-Type: application/json
```
---

## Body
```json
{
  "email": "test@test.com",
  "password": "1234"
}
```

---

## Response
```json
{
  "success": true,
  "data": {
    "token": "JWT_TOKEN"
  },
  "message": "로그인 성공"
}
```

---

# 🙋 내 정보 조회
## Request
```http
GET /api/users/me
Authorization: Bearer {JWT}
```

---

## Response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "test@test.com",
    "nickname": "테스트"
  }
}
```

---

# 🏰 Guild API
## 길드 생성
### Request
```http
POST /api/guilds
Authorization: Bearer {JWT}
Content-Type: application/json
```

---

### Body
```json
{
  "name": "테스트 길드"
}
```

---

### Response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "테스트 길드"
  }
}
```

---

# 🏰 내 길드 조회
## Request
```http
GET /api/guilds/me
Authorization: Bearer {JWT}
```

---

## Response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "테스트 길드",
    "memberCount": 5
  }
}
```

---

# 👥 길드원 조회
## Request
```http
GET /api/guilds/members
Authorization: Bearer {JWT}
```

---

## Response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "displayName": "길드마스터",
      "role": "MASTER"
    }
  ]
}
```

---

# 👾 Monster API
## 몬스터 목록 조회
### Request
```http
GET /api/monsters
```

---

### Response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "code": "def_fire_Franken",
      "name": "프랑켄",
      "attribute": "FIRE",
      "leaderEffectType": "방어력"
    }
  ]
}
```

---

# 📦 Inventory API
## 인벤토리 조회
### Request
```http
GET /api/guild-members/{guildMemberId}/inventory
Authorization: Bearer {JWT}
```

---

### Response
```json
{
  "success": true,
  "data": [
    {
      "monsterCode": "def_fire_Franken",
      "quantity": 3
    }
  ]
}
```

---

# 📦 인벤토리 수정
## Request
```http
PUT /api/guild-members/{guildMemberId}/inventory
Authorization: Bearer {JWT}
Content-Type: application/json
```

---

## Body
```json
{
  "items": [
    {
      "monsterCode": "def_fire_Franken",
      "quantity": 3
    }
  ]
}
```

---

## Response
```json
{
  "success": true,
  "message": "인벤토리 수정 완료"
}
```

---

# 🛡️ Defense Deck API
## 방덱 생성
### Request
```http
POST /api/defense-decks
Authorization: Bearer {JWT}
Content-Type: application/json
```

---

## Body
```json
{
  "ownerMemberId": 1,
  "monsterIds": [1, 2, 3]
}
```

---

## Response
```json
{
  "success": true,
  "message": "방덱 생성 완료"
}
```

---

# 🛡️ 방덱 목록 조회
## Request
```http
GET /api/defense-decks
Authorization: Bearer {JWT}
```

---

## Query Parameters
| 파라미터             | 설명           |
| ---------------- | ------------ |
| monsterId        | 특정 몬스터 포함 필터 |
| leaderEffectType | 리더 효과 필터     |
| ownerMemberId    | 특정 길드원 필터    |

---

## Response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "ownerName": "길드마스터",
      "monsters": [
        {
          "name": "프랑켄"
        },
        {
          "name": "그림리퍼"
        },
        {
          "name": "조커"
        }
      ]
    }
  ]
}
```

---

# 🗑️ 방덱 삭제
## Request
```http
DELETE /api/defense-decks/{deckId}
Authorization: Bearer {JWT}
```

---

## Response
```json
{
  "success": true,
  "message": "방덱 삭제 완료"
}
```

---

# ⚠️ 예외 응답
## 400 Bad Request
```json
{
  "success": false,
  "message": "잘못된 요청입니다."
}
```

---

## 401 Unauthorized
```json
{
  "success": false,
  "message": "인증이 필요합니다."
}
```

---

## 403 Forbidden
```json
{
  "success": false,
  "message": "권한이 없습니다."
}
```

---

## 404 Not Found
```json
{
  "success": false,
  "message": "데이터를 찾을 수 없습니다."
}
```

---

# 🚧 향후 추가 예정 API
- Battle Research API
- 공덱 댓글 API
- 통계 API
- 추천 API
- 실시간 API

---

## 📄 Documents

| 문서 | 설명 |
|---|---|
| [RoadMap](./RoadMap.md) | 프로젝트 진행 현황 |
| [Backend Docs](./BACKEND.md) | 백엔드 구조 |
| [API Docs](./API.md) | API 명세 |
| [ERD](./ERD.md) | 데이터베이스 구조 |
| [Trouble Shooting](./TROUBLE_SHOOTING.md) | 문제 해결 기록 |