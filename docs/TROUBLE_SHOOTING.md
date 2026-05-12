# TROUBLE_SHOOTING.md

Siege-Battle-Manager 개발 중 발생했던 문제와 해결 과정 정리

---

# 📌 목적

프로젝트 개발 과정에서 발생한:

- 인증 문제
- JPA 성능 문제
- 데이터 무결성 문제
- 프론트/백엔드 연동 문제

등을 기록하고 해결 과정을 정리

단순 결과만이 아니라:

- 왜 문제가 발생했는지
- 어떤 방식으로 분석했는지
- 왜 해당 해결 방법을 선택했는지

를 중심으로 정리

---

# 🔐 JWT 인증 시 403 Forbidden 발생

## 문제 상황

로그인 이후:

```text id="g2n5e5"
GET /api/guilds/me
```
요청 시 403 Forbidden 발생

---

## 원인

프론트엔드에서 JWT 저장은 되었지만:

```text
Authorization: Bearer undefined
```

형태로 전송되고 있었음

즉 실제 토큰이 Header에 포함되지 않음

---

## 해결 과정
### 1. DevTools Network 확인

Request Header 분석

---

### 2. JWT 저장 로직 확인

로그인 성공 이후:

- localStorage 저장
- 토큰 반환값

확인 진행

---

### 3. apiFetch 공통 함수 수정
```javascript
headers.Authorization = `Bearer ${token}`;
```
형태로 공통 처리

---

## 결과
- 인증 정상 처리
- /api/guilds/me 조회 성공

---

# 🔐 Spring Security 인증은 성공하지만 404 발생
## 문제 상황

JWT 인증은 성공했지만:

```text
가입된 길드가 없습니다.
```

응답 발생

---

## 원인

인증 문제로 오해했지만 실제 원인은:

```text
GuildMember 데이터 미생성
```
이었음

즉:

- 로그인은 정상
- JWT 인증 정상
- 하지만 길드 가입 정보가 존재하지 않음

---

## 해결
- User 기준 GuildMember 조회 로직 점검
- 길드 생성 시 GuildMember 자동 생성 처리 추가

---

# ⚡ JPA N+1 문제 발생
## 문제 상황

방덱 목록 조회 시:

```text
DefenseDeck 조회
→ owner 추가 조회
→ monsters 추가 조회
```
반복 발생

---

## 원인

JPA Lazy Loading으로 인해 방덱 수 만큼 추가 SQL 발생

---

## 해결 방법

Fetch Join 적용
```java
@Query("""
select distinct d
from DefenseDeck d
join fetch d.owner
join fetch d.monsters
""")
```

---

## 결과
- 불필요한 SQL 제거
- 조회 성능 개선

---

# ⚡ Fetch Join + Paging 문제
## 문제 상황

Fetch Join 적용 이후 
- 메모리 사용 증가 
- Paging 비효율

발생 가능성 확인

---

## 해결 방향
- Count Query 분리
- 필요한 데이터만 Fetch Join
- 일부 로직은 메모리 필터링 유지

---

# 📦 H2 Unique Constraint 오류
## 문제 상황

몬스터 저장 중:

```text
Unique index or primary key violation
```
발생

--- 

## 원인

Monster name 컬럼이 unique 상태였고:

- 동일 이름 몬스터
- 다른 형태 데이터

저장 시 충돌 발생

---

## 해결

이름(name)이 아니라:
```text
monsterCode
```
를 기준으로 관리하도록 변경

---

# 📦 NULL not allowed for column "ATTRIBUTE"
## 문제 상황

Monster 저장 시:

```text
NULL not allowed for column "ATTRIBUTE"
```

오류 발생

---

## 원인

Entity 생성 과정에서:
```java
new Monster(...)
```
생성자 파라미터 순서 문제 발생

---

## 해결
- 생성자 구조 수정
- Builder 패턴 고려
- 필수 필드 검증 추가

---

# 🔄 Monster ID / Monster Code 혼동 문제
## 문제 상황

인벤토리 저장 시:

```text
존재하지 않는 몬스터 ID: null
```

발생

---

## 원인

프론트에서는:

```json
{
  "monsterCode": "def_fire_Franken"
}
```

형태로 전달했지만

백엔드는 Long ID 기준 처리 중이었음

---

## 해결

MonsterRepository에:

```java
findByCode()
```

추가

---

## 결과

프론트 JSON 데이터와 DB 연동 구조 통일

---

# 🔄 React 무한 렌더링 문제
## 문제 상황

길드 조회 시:

- API 반복 호출
- 화면 재렌더링 반복

발생

---

## 원인

useEffect 의존성 배열 문제

---

## 해결
- 불필요 state 제거
- dependency 수정
- 초기 로딩 조건 분리

---

# 🔄 destroy is not a function 오류
## 문제 상황

React 렌더링 중:

```text
destroy is not a function
```

오류 발생

---

## 원인

컴포넌트 반환 구조 문제 및 cleanup 처리 문제

---

## 해결
- 컴포넌트 구조 정리
- effect cleanup 로직 점검

---

# 📌 배운 점
## 1. 인증 문제와 데이터 문제는 다르다

처음에는 모든 문제를 JWT 문제로 생각했지만

인증 실패, 권한 실패, 데이터 없음은 서로 다른 문제라는 점을 경험

---

## 2. JPA는 편하지만 성능을 고려해야 한다

단순 CRUD에서는 편리했지만

- Fetch Join
- Lazy Loading
- N+1

등을 직접 경험하며 성능 최적화 중요성을 체감

---

## 3. 실제 서비스는 상태 변화가 중요하다

단순 데이터 저장보다

- 몬스터 수량 감소
- 방덱 생성 가능 여부
- 권한 검증

등 상태 기반 로직 설계가 중요하다는 것을 체감

---

# 🚧 앞으로 추가 예정
- Redis 캐싱 적용 과정
- QueryDSL 적용
- Docker 배포 과정
- AWS 배포 과정
- WebSocket 적용 과정
- MySQL 전환 과정

---

## 📄 Documents

| 문서 | 설명 |
|---|---|
| [RoadMap](./RoadMap.md) | 프로젝트 진행 현황 |
| [Backend Docs](./BACKEND.md) | 백엔드 구조 |
| [API Docs](./API.md) | API 명세 |
| [ERD](./ERD.md) | 데이터베이스 구조 |
| [Trouble Shooting](./TROUBLE_SHOOTING.md) | 문제 해결 기록 |