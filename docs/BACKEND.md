# BACKEND.md

Siege-Battle-Manager 백엔드 구조 및 설계 문서

---

# 📌 백엔드 목표

단순 CRUD API 서버가 아니라:

- 인증/인가
- 권한 기반 처리
- 재고(인벤토리) 기반 로직
- 길드 단위 데이터 관리
- 성능 최적화

등 실제 서비스 구조를 경험하는 것을 목표로 개발

---

# 🛠️ 기술 스택

| 기술 | 설명 |
|---|---|
| Java 17 | 메인 언어 |
| Spring Boot 3 | 백엔드 프레임워크 |
| Spring Security | 인증/인가 |
| JWT | 토큰 기반 인증 |
| Spring Data JPA | ORM |
| Hibernate | JPA 구현체 |
| Gradle | 빌드 도구 |
| H2 Database | 개발용 DB |

---

# 📂 패키지 구조

```text
backend/
 ├─ controller/
 ├─ service/
 ├─ repository/
 ├─ domain/
 ├─ dto/
 ├─ security/
 ├─ config/
 └─ exception/
```
 
 # 📌 계층 구조

## Controller
HTTP 요청 처리
예시:
```text
POST /api/users/login
GET /api/guilds/me
POST /api/defense-decks
```
역할:
- 요청 수신
- DTO 변환
- 응답 반환

---

## Service
비즈니스 로직 처리
예시:
- 방덱 생성 가능 여부 검증
- 인벤토리 수량 감소
- 권한 검증
- 길드 검증
서비스 계층에 핵심 로직을 집중시켜 유지보수성을 높이도록 설계

---

## Repository
DB 접근 처리

Spring Data JPA 기반 구현
예시:
```java
findByGuildId()
findByUser()
existsByUser()
```

---

## Domain(Entity)
데이터베이스 테이블 매핑

주요 엔티티:
- User
- Guild
- GuildMember
- Monster
- DefenseDeck
- GuildMemberInventory

---

# 🔐 인증 구조

## JWT 기반 인증

로그인 성공 시 JWT 발급

```text
Authorization: Bearer {JWT}
```

형태로 인증 처리

--- 

## 인증 흐름
```text
클라이언트 로그인
    ↓
JWT 발급
    ↓
Authorization Header 저장
    ↓
API 요청 시 JWT 전달
    ↓
JwtAuthenticationFilter 검증
    ↓
인증 사용자 처리
```

---

## JwtAuthenticationFilter

OncePerRequestFilter 기반 구현

주요 역할:

- Authorization Header 추출
- JWT 검증
- SecurityContext 등록

---

# 🏰 길드 시스템 구조
## Guild

길드 정보 관리

포함 정보:

- 길드 이름
- 생성일
- 길드원 목록

---

## GuildMember

길드 내 사용자 관리

특징:

- REAL / VIRTUAL 구분
- 권한(Role) 보유
- 길드 단위 관리

---

## 권한 구조
| 권한         | 설명    |
| ---------- | ----- |
| MASTER     | 전체 관리 |
| SUB_MASTER | 운영 권한 |
| MEMBER     | 일반 권한 |

---

# 👾 몬스터 시스템
## Monster Entity

게임 몬스터 데이터 관리

포함 정보:

- 코드
- 이름
- 속성
- 리더 효과

---

## 속성 구조
```text
FIRE
WATER
WIND
LIGHT
DARK
```

---

# 🛡️ 방덱 시스템 구조
## DefenseDeck

3마리 몬스터 기반 방어 덱

특징:

- 몬스터 순서 보장
- 첫 번째 몬스터 = 리더
- 길드원 소유 구조

---

## ManyToMany + OrderColumn

```java
@OrderColumn(name = "position")
```

사용 이유:

- 몬스터 순서 유지
- 리더 몬스터 개념 구현

---

# 📦 인벤토리 시스템
## GuildMemberInventory

길드원별 몬스터 보유 수량 관리

---

## 핵심 로직
### 방덱 생성
```text
1. 보유 수량 확인
2. 중복 몬스터 검증
3. 수량 감소
4. 방덱 생성
```

---

###  방덱 삭제
```text
1. 방덱 조회
2. 사용 몬스터 확인
3. 수량 복구
4. 방덱 삭제
```

---

# ⚡ 성능 최적화
## N+1 문제 해결

문제:
```text
방덱 목록 조회 시
몬스터/길드원 추가 조회 발생
```

---

## 해결 방법
- Fetch Join 적용
- Count Query 분리
- 필요한 데이터만 조회

---

## 적용 예시
```java
@Query("""
select distinct d
from DefenseDeck d
join fetch d.owner
join fetch d.monsters
""")
```

---

# 📌 예외 처리 구조
## GlobalExceptionHandler

공통 예외 처리 적용

---


## 처리 상태 코드
| 상태 코드 | 설명     |
| ----- | ------ |
| 400   | 잘못된 요청 |
| 401   | 인증 실패  |
| 403   | 권한 없음  |
| 404   | 데이터 없음 |
| 500   | 서버 오류  |

---

# 📄 공통 응답 구조
## ApiResponse<T>
```json
{
  "success": true,
  "data": {},
  "message": "성공"
}
```
---

# 📌 고민했던 부분
## 1. 실제 서비스 로직 구조화

단순 CRUD가 아닌
- 권한
- 재고
- 상태 변화
를 고려한 구조로 설계

---

## 2. 길드 단위 데이터 처리

모든 데이터가
- 사용자 기준이 아닌
- 길드 기준으로 동작

하도록 구조 설계

---

## 3. 확장성 고려

향후:

- Battle Research
- 통계
- 추천 시스템
- Redis
- WebSocket

등 추가 가능한 구조를 고려하며 설계 진행

---

# 🚧 향후 개선 예정
- MySQL 전환
- Redis 캐싱
- QueryDSL 적용
- Docker 적용
- AWS 배포
- CI/CD 구축

---

## 📄 Documents

| 문서 | 설명 |
|---|---|
| [RoadMap](./RoadMap.md) | 프로젝트 진행 현황 |
| [Backend Docs](./BACKEND.md) | 백엔드 구조 |
| [API Docs](./API.md) | API 명세 |
| [ERD](./ERD.md) | 데이터베이스 구조 |
| [Trouble Shooting](./TROUBLE_SHOOTING.md) | 문제 해결 기록 |


