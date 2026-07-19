# BACKEND.md

Siege-Battle-Manager 백엔드 구조 및 설계 문서

> Last Updated: 2026-07-19

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
| PostgreSQL | 운영용 DB |
| Flyway | 운영 스키마 마이그레이션 |
| Caffeine | 몬스터·통계 조회 캐시 |
| Docker | Render 배포 이미지 구성 |

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
- SignupRequest
- UserNicknameChangeRequest
- UserNicknameHistory
- Guild
- GuildMember
- ExistingGuildJoinRequest
- GuildMemberBan
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

로그인 성공 시 `User.lastLoginAt`을 현재 시각으로 갱신해 회원 관리 탭에서 최근 접속일을 표시합니다.

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
- 상태(Status) 보유
- 탈퇴/추방 후 재가입 시 기존 row를 재사용하지 않고 새 row 생성
- 현재 소속 길드는 `APPROVED` 상태의 최신 row를 기준으로 판단

---

## 가입 승인 구조

회원가입과 실제 계정 생성을 분리합니다.

- 가입 신청 시 `SignupRequest(PENDING)`만 저장
- 관리자 또는 길드장 승인 전에는 실제 `User`, `Guild`, `GuildMember`를 만들지 않음
- 길드장 신청 승인 시 `User`, `Guild`, `GuildMember(MASTER)` 생성
- 길드원 신청 승인 시 `User`, `GuildMember(MEMBER)` 생성
- 거절된 신청은 실제 계정을 만들지 않으므로 같은 아이디로 재신청 가능
- 가입 승인과 재가입 승인은 승인된 길드원 기준 35명 정원을 초과할 수 없음

기존 계정이 길드가 없는 상태라면 `ExistingGuildJoinRequest`를 통해 새 길드 가입을 요청합니다.

승인 전 로그인 시도는 실제 비밀번호가 맞더라도 JWT를 발급하지 않고, 길드장 신청은 관리자 승인 대기 메시지, 길드원 신청은 길드장/부길드장 승인 대기 메시지를 반환합니다.

---

## 회원 관리 / 재가입 차단

길드장과 부길드장은 회원 관리 탭에서 길드원을 관리합니다.

- 가입 요청 승인/거절
- 등급 변경
- 길드원 추방
- 길드장 양도
- 더미 계정 생성/삭제
- 최근 접속일 표시
- 추방된 계정의 재가입 차단 목록 조회
- 재가입 차단 해제

추방 시 `GuildMember`는 `LEFT` 상태로 변경하고, 재가입 차단은 `GuildMemberBan`으로 별도 관리합니다.

길드장 양도 시 기존 길드장은 `SUB_MASTER`가 되고, 대상 길드원은 `MASTER`가 됩니다. 이때 `Guild.master` 참조도 함께 갱신해 길드 목록과 헤더의 마스터 표시가 실제 권한과 일치하도록 유지합니다.

더미 계정은 실제 로그인 계정 없이 인벤토리와 방덱만 관리하기 위한 `VIRTUAL` 길드원입니다.
실제 계정과 동일하게 길드 정원 35명에 포함해 무분별한 생성을 제한합니다.

---

## 관리자 이력 관리

관리자는 운영 추적을 위해 다음 정보를 조회할 수 있습니다.

- 전체 길드 목록
- 길드별 길드원 목록
- 현재 소속 길드
- 길드 이동 이력
- 닉네임 변경 요청
- 닉네임 변경 이력

닉네임은 즉시 변경하지 않고 `UserNicknameChangeRequest` 승인 후 `UserNicknameHistory`에 기록합니다.

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
- 한글명
- 별칭
- 속성
- 이미지 URL
- 기본 성급
- 리더 효과
- 표시 여부

---

## Swarfarm 연동

몬스터 기본 데이터는 Swarfarm 외부 API를 통해 동기화합니다.

```text
GET https://swarfarm.com/api/v2/monsters/
```

동기화 기준:
- `com2usId` 기준 기존 몬스터 확인
- 신규 몬스터는 `sw_{com2usId}` 형태의 `monsterCode` 생성
- 이미지 파일은 저장하지 않고 이미지 URL만 DB에 저장
- 신규 몬스터는 관리 파일에 `enabled: false` 상태로 추가

---

## 한글명 / 별칭 관리

한글명과 별칭은 관리 파일을 기준으로 적용합니다.

```text
backend/siege-backend/src/main/resources/data/monster-localization.json
```

응답 정책:
- 사용자 화면 표시 이름은 `koreanName` 우선
- `koreanName`이 없으면 원문 이름 사용
- 검색은 `monsterCode`, 원문 이름, 한글명, 별칭을 함께 사용

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

## 수량 제한

운영 중 데이터 남용을 막기 위해 몬스터별 인벤토리 수량은 0~10 범위로 제한합니다.

- 10 초과 입력은 10으로 보정
- 음수 입력은 0으로 보정
- 이미 방덱에 사용 중인 수량보다 낮은 값은 저장 불가

---

# 🔬 전투 연구 V2

게시글과 댓글 중심의 레거시 구조 대신 조합과 매치업을 독립 도메인으로 관리합니다.

```text
BattleResearchDefenseDeck  ─┐
                            ├─ BattleResearchMatchup ─ BattleResearchGuide
BattleResearchAttackDeck   ─┘
```

- 방덱과 공덱은 길드 내 조합 단위로 한 번만 등록
- `Matchup`이 방덱과 공덱의 N:N 관계를 표현
- `Guide`는 특정 매치업에 여러 개 등록 가능
- 조합 연결 해제와 조합 자체 삭제를 분리
- 조합 삭제 시 연결된 매치업과 공략을 먼저 정리하고 반대편 조합은 보존
- 조합·매치업 목록은 10개 단위로 페이지네이션
- 검색어와 4성 조합 조건은 백엔드 요청 파라미터로 전달
- 공략 내용은 최대 3000자

전투 연구의 실제 사용 승률과 로그는 통계 원본을 조회해 계산하며, 연구 엔티티에 통계값을 중복 저장하지 않습니다.

---

# 📊 점령전 로그 통계

사용자가 업로드한 SWEX JSON을 원본 전투 로그로 저장하고 조회 시 조합 통계를 계산합니다.

핵심 원칙:

- 사이트 `User`·`GuildMember`와 JSON의 게임 닉네임을 연결하지 않음
- 사이트 길드는 통계 데이터 접근 권한을 구분하는 경계로만 사용
- 파일 단위와 전투 단위 중복 방지를 각각 적용
- 공격·방어 관점과 우리 기준 승패를 명시적으로 정규화
- 콜라보·오리지널 몬스터는 canonical `monsterCode`로 통합
- 유효한 리더가 없는 조합만 세 슬롯 전체를 정렬해 동일 조합으로 판정
- 리더가 있으면 0번 슬롯을 유지하고 나머지 두 슬롯만 정렬

공덱·방덱 목록은 필요한 필드만 projection으로 조회합니다. 방덱 목록은 50개 단위, 상세 사용 로그는 10개 단위로 페이지네이션합니다.

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
- 통계 목록 projection과 DB 인덱스 적용
- 몬스터 기준 정보와 통계 결과에 Caffeine 캐시 적용
- 로그 업로드·삭제 시 관련 통계 캐시 제거
- 프론트 상세 결과를 재사용해 반복 조회 방지

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

`IllegalStateException`은 사용자가 복구 가능한 정책 위반 메시지로 처리하기 위해 400 응답으로 변환합니다.

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

향후 데이터와 트래픽이 증가하면:

- 매치·일별 통계 집계 테이블
- 다중 인스턴스용 Redis 공유 캐시
- 공식 API를 제공하는 플랫폼의 길드 전용 챗봇

등 추가 가능한 구조를 고려하며 설계 진행

---

# 🚧 향후 개선 예정
- 실제 길드 데이터를 이용한 통계 정규화 검증
- 전투 연구 V2와 통계의 베타 테스트 안정화
- 베타 데이터 초기화와 운영 백업 검증
- SMTP 기반 가입 결과 알림과 비밀번호 재설정
- CI/CD smoke test 자동화 검토
- 통계 원본 증가량을 관찰한 뒤 집계 테이블 도입 여부 결정

---

## 📄 Documents

| 문서 | 설명 |
|---|---|
| [RoadMap](./RoadMap.md) | 프로젝트 진행 현황 |
| [Backend Docs](./BACKEND.md) | 백엔드 구조 |
| [API Docs](./API.md) | API 명세 |
| [ERD](./ERD.md) | 데이터베이스 구조 |
| [Trouble Shooting](./TROUBLE_SHOOTING.md) | 문제 해결 기록 |


