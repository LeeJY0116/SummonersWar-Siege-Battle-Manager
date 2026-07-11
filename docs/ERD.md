# ERD.md

Siege-Battle-Manager 데이터베이스 구조 문서

---

# 📌 ERD 설계 목표

단순 CRUD 테이블 구조가 아니라:

- 길드 단위 관리
- 권한 기반 처리
- 방덱 구성
- 인벤토리 관리
- 확장 가능한 구조

를 고려하여 설계

---

# 📂 전체 구조

```text id="4pxa1j"
User
 └─ GuildMember
      └─ Guild
           └─ DefenseDeck
                └─ Monster

GuildMember
 └─ GuildMemberInventory
      └─ Monster
```
---

# 👤 User

사용자 계정 정보 관리

---

## 주요 필드
| 필드           | 설명       |
| ------------ | -------- |
| id           | PK       |
| loginId      | 로그인 아이디  |
| email        | 연락용 이메일  |
| passwordHash | 암호화 비밀번호 |
| nickname     | 닉네임      |
| createdAt    | 생성일      |
| updatedAt    | 수정일      |

---

## 특징
- Spring Security 인증 대상
- JWT 발급 대상
- 실제 사용자 계정 정보 저장

---

# 🏰 Guild

길드 정보 관리

---

## 주요 필드
| 필드        | 설명    |
| --------- | ----- |
| id        | PK    |
| name      | 길드 이름 |
| createdAt | 생성일   |

---

## 특징
- 길드 단위 데이터 관리
- 여러 길드원 보유 가능

---

# 👥 GuildMember

길드 내 사용자 정보 관리

---

주요 필드
| 필드          | 설명             |
| ----------- | -------------- |
| id          | PK             |
| guild_id    | 소속 길드          |
| user_id     | 실제 사용자         |
| displayName | 표시 이름          |
| role        | 권한             |
| type        | REAL / VIRTUAL |
| createdAt   | 생성일            |

---

## 권한 구조
| Role       | 설명     |
| ---------- | ------ |
| MASTER     | 길드 마스터 |
| SUB_MASTER | 부마스터   |
| MEMBER     | 일반 길드원 |

---

## 타입 구조
| Type    | 설명     |
| ------- | ------ |
| REAL    | 실제 사용자 |
| VIRTUAL | 가상 길드원 |

---

## 특징
### REAL 길드원

실제 로그인 계정과 연결

---

### VIRTUAL 길드원

실제 계정 없이:

- 인벤토리 등록
- 방덱 구성

가능

---

# 👾 Monster

게임 몬스터 데이터 관리

---

## 주요 필드
| 필드               | 설명       |
| ---------------- | -------- |
| id               | PK       |
| code             | 몬스터 코드   |
| com2usId         | Swarfarm 기준 ID |
| name             | 몬스터 이름   |
| koreanName       | 한글 표시 이름 |
| aliases          | 별칭 목록    |
| attribute        | 속성       |
| imageUrl         | 이미지 URL  |
| naturalStars     | 기본 성급    |
| leaderEffectType | 리더 효과 타입 |
| leaderEffectAmount | 리더 효과 수치 |
| leaderEffectArea | 리더 효과 적용 범위 |
| leaderEffectElement | 속성 리더 효과 대상 |
| enabled          | 화면 표시 여부 |

---

## 속성 구조
| 속성    | 설명 |
| ----- | -- |
| FIRE  | 불  |
| WATER | 물  |
| WIND  | 바람 |
| LIGHT | 빛  |
| DARK  | 어둠 |

---

## 특징
- Swarfarm API 기반 동기화
- `monsterCode` 기준 식별
- 한글명/별칭 관리 파일 기반 표시
- 이름 중복 가능 고려
- 이미지 파일은 저장하지 않고 URL만 저장

---

# 📦 GuildMemberInventory

길드원별 몬스터 보유 수량 관리

---

## 주요 필드
| 필드              | 설명    |
| --------------- | ----- |
| id              | PK    |
| guild_member_id | 길드원   |
| monster_id      | 몬스터   |
| quantity        | 보유 수량 |

---

## 특징
- 실제 보유량 기반 처리
- 방덱 생성 시 수량 감소
- 방덱 삭제 시 수량 복구

---

# 🛡️ DefenseDeck

방어 덱 정보 관리

---

## 주요 필드
| 필드              | 설명     |
| --------------- | ------ |
| id              | PK     |
| guild_member_id | 소유 길드원 |
| createdAt       | 생성일    |

---

## 특징
- 3마리 몬스터 조합
- 길드원 단위 관리
- 리더 몬스터 개념 존재


---

# 🛡️ DefenseDeck_Monsters

방덱 몬스터 매핑 테이블

---

## 주요 필드
| 필드              | 설명     |
| --------------- | ------ |
| defense_deck_id | 방덱     |
| monster_id      | 몬스터    |
| position        | 몬스터 순서 |

---

## position 사용 이유
```text
0번 몬스터 = 리더
```
개념을 유지하기 위해 사용

---

## 특징
- ManyToMany 관계
- 순서 보장 필요
- 리더 개념 구현 가능

---

# 🔗 관계 구조
## User : GuildMember
```text
User 1 : N GuildMember
```
설명:

한 사용자는 여러 길드 가입 가능 구조 고려

(현재는 단일 길드 기준)

---

## Guild : GuildMember
```text
Guild 1 : N GuildMember
```

---

## GuildMember : Inventory
```text
GuildMember 1 : N GuildMemberInventory
```

---

## Monster : Inventory
```text
Monster 1 : N GuildMemberInventory
```

---

## GuildMember : DefenseDeck
```text
GuildMember 1 : N DefenseDeck
```

---

## DefenseDeck : Monster
```text
DefenseDeck N : N Monster
```

---

# 📌 설계 시 고민했던 부분
## 1. Monster 식별 기준

초기에는
```text
name
```
기준 관리 시도

---

### 문제
- 이름 중복 가능성
- JSON 데이터 충돌
- Unique Constraint 문제

발생

---


### 해결
```text
monsterCode
```
기준으로 변경

---

현재 기준:
- 외부 API 동기화 몬스터는 `sw_{com2usId}` 형식 사용
- API 요청/응답과 프론트 선택값은 `monsterCode` 우선 사용
- DB 내부 연관관계는 `monster_id`를 유지하되, 클라이언트 계약은 `monsterCode` 중심으로 확장

---

## 2. 방덱 순서 보장 문제

단순 ManyToMany 사용 시:
- 몬스터 순서 보장 불가
- 리더 개념 구현 어려움

---

### 해결
```java
@OrderColumn(name = "position")
```
적용

---

## 3. 실제 사용자 없는 길드원 처리

길드 운영 한계상
- 실제 사용자 없는 계정
- 임시 계정
- 부계정 관리

필요성 존재

---

### 해결

GuildMemberType 구조 추가
```text
REAL
VIRTUAL
```

---

## 4. 인벤토리 기반 방덱 처리

단순 방덱 저장이 아니라
```text
보유 수량 - 사용 중 수량
```
개념 필요

---

### 결과

실제 운영 로직 형태로 확장 가능 구조 설계

---

# 🚧 향후 추가 예정 구조
## Battle Research

예정 기능:

- 연구용 방덱 게시글
- 공덱 댓글
- 전략 공유

---

## Statistics

예정 기능:

- 사용률 통계
- 길드별 분석
- 방덱 카운트

---

## Redis

예정 기능:

- 캐싱
- 조회 성능 개선

---

## 📄 Documents

| 문서 | 설명 |
|---|---|
| [RoadMap](./RoadMap.md) | 프로젝트 진행 현황 |
| [Backend Docs](./BACKEND.md) | 백엔드 구조 |
| [API Docs](./API.md) | API 명세 |
| [ERD](./ERD.md) | 데이터베이스 구조 |
| [Trouble Shooting](./TROUBLE_SHOOTING.md) | 문제 해결 기록 |
