# Siege-Battle-Manager

길드 점령전 방덱/공덱 관리 & 길드 운영 플랫폼

📌 소개

Siege-Battle-Manager는 
점령전(공성/점령 컨텐츠) 운영을 위해 **길드원별 보유 몬스터(수량)**를 기반으로  
- 길드 방어 덱(방덱) 생성/관리  
- “주인 없는 방덱(템플릿)”의 **가능 인원 수 자동 계산**  
- 전투 연구 게시판(방덱 연구 글/공덱 댓글) 공유  
를 지원하는 웹 애플리케이션입니다.

> 목표: “특정 방덱이 길드에서 몇 세트나 가능한지”를 빠르게 파악하고,  
> 길드 운영진이 길드원 인벤토리를 기반으로 방덱을 효율적으로 편성할 수 있게 합니다.

---


## Tech Stack

### Backend
- Java 17
- Spring Boot 3.x
- Spring Web / Validation
- Spring Security + JWT
- Spring Data JPA
- H2 (dev) / (추후 MySQL 예정)

### Frontend
- React + Vite + Tailwind (진행 중)
- (추후) Java Spring 서버 + 계정/저장소 연동

---

## Core Concepts

### 1) Monster
- 게임 내 몬스터 데이터
- 속성(불/물/풍/빛/암)
- 리더효과

### 2) Guild / GuildMember
- 길드 최대 인원: **35명**
- 길드원 유형:
  - `REAL`: 실제 로그인 유저 기반 길드원
  - `VIRTUAL`: 운영진이 임의로 추가하는 “인벤토리용 길드원”(길드원이 직접 가입하기 힘들 경우 사용)

### 3) Guild Roles & Permissions
- `MASTER`(길드 마스터): 모든 권한
  - 길드원 추방
  - 부마스터 임명(최대 5명)
  - 길드원 보유 몬스터(수량) 임의 수정
  - 길드원 방덱 구성/해체 가능
  - 주인 없는 방덱(템플릿) 생성/삭제 가능
- `SUB_MASTER`(부마스터): 마스터와 동일(단, 길드 해체 제외)
- `MEMBER`(일반 길드원):
  - 본인 인벤 입력 가능
  - 본인 보유 몬스터 범위 내에서 방덱 생성/삭제 가능
  - 전투 연구 게시글/댓글 작성 가능

---

## Defense Deck (방덱)

### 길드원 소유 방덱
- 방덱은 **몬스터 3마리**로 구성되며 순서가 중요합니다.
  - 0번 몬스터 = 리더
- 방덱 생성 시:
  - 길드원 인벤토리에서 해당 몬스터 수량이 각 1 이상이어야 함
  - 생성되면 각 몬스터 수량이 **-1 차감**
- 방덱 삭제 시:
  - 각 몬스터 수량이 **+1 복구**
- 필터링:
  - 특정 몬스터 포함 방덱만 보기
  - 리더효과 타입 필터
  - 길드원(소유자) 필터
  - 선택 몬스터가 **리더인 방덱 우선 정렬**
  - 몬스터 필터 + 리더효과 필터 **중첩 가능**

---

## Ownerless Defense Deck (주인 없는 방덱 템플릿)

운영진(마스터/부마스터)이 “길드 공용 방덱 템플릿”을 등록할 수 있습니다.

- 템플릿은 몬스터 3마리로 구성(0번 = 리더)
- 템플릿 상세 조회 시:
  - 해당 템플릿이 **가능한 길드원 목록**
  - **가능 인원 수(Count)** 자동 계산
- “가능” 기준:
  - 해당 길드원이 템플릿의 3마리 몬스터를 모두 **각 1개 이상 보유**하면 가능

> 운영 목적: “이 방덱이 나오는 사람이 길드에 몇 명인지”를 빠르게 파악하여  
> 방덱 채택/폐기 판단을 쉽게 합니다.

---

## Battle Research (전투 연구)

길드 내 전투 연구 게시판입니다.

- 게시글(Post) = “방덱 연구 글”
- 댓글(Comment) = “공덱/운용 코멘트”
- 게시글 작성 시:
  - 보유 여부와 관계 없이 “전체 몬스터”에서 3마리 방덱 업로드 가능
  - 짧은 제목 설정 가능
- 게시글 상세에서:
  - 공덱(0~3마리) + 코멘트를 댓글로 등록 가능

### 권한 정책
- 게시글 삭제: **작성자 / 마스터 / 부마스터**
- 게시글 수정: **작성자만**
- 댓글 삭제: **작성자 / 마스터 / 부마스터**
- 댓글 수정: **작성자만**
- 작성자가 게시글 삭제 시: 해당 게시글의 댓글도 함께 삭제됩니다.

### 데이터 유지 정책 (매우 중요)
전투 연구 탭은 길드 운영 기록 보존을 위해 다음 정책을 가집니다.

- 길드원이 탈퇴하거나 VIRTUAL 길드원이 삭제되어도:
  - 전투 연구의 게시글/댓글은 **절대 삭제되거나 변경되지 않습니다.**
- 이를 위해 전투 연구 도메인은 작성자 정보를 FK로 묶지 않고,
  - `authorName`(스냅샷 문자열)
  - `authorUserId`(실유저인 경우만 저장)
  형태로 저장합니다.

---

## API Response Format (Standard)

모든 API는 공통 응답 포맷을 사용합니다.

### Success
```json
{
  "success": true,
  "data": {},
  "message": null
}

---

### Error
{
  "success": false,
  "data": null,
  "message": "에러 메시지"
}

---

### Run (Local)
1) 실행
./gradlew bootRun

---

2) H2 Console

http://localhost:8080/h2-console

JDBC URL은 application.yml 설정에 맞춰 입력합니다.

---

3) Monster 초기 데이터(예시)
INSERT INTO monsters (name, attribute, leader_effect_type)
VALUES ('암 네오스톤 에이전트', 'DARK', 'ATTACK_SPEED');

INSERT INTO monsters (name, attribute, leader_effect_type)
VALUES ('암 마카롱 친위대', 'DARK', 'DEFENSE');

INSERT INTO monsters (name, attribute, leader_effect_type)
VALUES ('풍 젠이츠', 'WIND', 'ATTACK_SPEED');

---

### 주요 엔드포인트(요약)

Auth/User

POST /api/users/signup

POST /api/users/login

Defense Deck

POST /api/defense-decks/{guildMemberId}

DELETE /api/defense-decks/{deckId}

GET /api/defense-decks?monsterId=&leaderEffect=&ownerMemberId=

Ownerless Defense Deck (Template)

POST /api/ownerless-defense-decks

GET /api/ownerless-defense-decks/{deckId}

DELETE /api/ownerless-defense-decks/{deckId}

Battle Research

POST /api/research/posts

GET /api/research/posts

GET /api/research/posts/{postId}

PUT /api/research/posts/{postId}

DELETE /api/research/posts/{postId}

POST /api/research/posts/{postId}/comments

PUT /api/research/comments/{commentId}

DELETE /api/research/comments/{commentId}

---

### Roadmap

 JWT 인증/회원 시스템

 길드/길드원(REAL/VIRTUAL) + 권한 체계

 몬스터/인벤토리(수량)

 방덱 생성/삭제(인벤 차감/복구) + 필터링

 주인 없는 방덱(템플릿) + 가능 인원 자동 계산

 전투 연구(게시글/댓글) + 데이터 유지 정책

 성능 최적화(N+1 개선, count 쿼리 최적화)

 프론트 연동(API 문서 상세화)

 배포(MySQL 전환, 계정/스토리지 확장)

---


💻 프로젝트의 철학

이 프로젝트는 단순히 방덱을 저장하는 도구가 아니다.

길드 전체 방덱 전력을 계산하고

모든 길드원이 같은 목표를 향해 효율적으로 운영될 수 있게 하며

전략 연구 자료를 축적하는 데이터베이스 역할을 한다

즉, 점령전 운영을 시스템화한 길드 매니지먼트 플랫폼이다.

---