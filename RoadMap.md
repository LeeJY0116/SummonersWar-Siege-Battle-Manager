# 📌 SummonersWar Siege Battle Manager 로드맵
> Last Updated: 2026-05-11

---

# 1. 프론트 1차 설계 & 구현 ✅

## 완료
- 몬스터 카탈로그 UI
- 우측 속성 아이콘 필터
- 트리오(3인 조합) UI
- 리더효과 분리
  - `leaderEffectType` (필터용)
  - `leaderEffectText` (표시용)
- 로컬스토리지 저장 구조
- 몬스터 nickname 검색 지원

---

# 2. 백엔드 기본 세팅 & 인증 ✅

## 완료
- Spring Boot 3.x / Java 17 / H2 / Gradle
- User 엔티티
- 생성/수정 시간 자동 처리
- Spring Security 적용
- BCrypt 비밀번호 해시
- JWT 발급/검증
- JWT Filter 적용
- 회원가입 / 로그인 API
- `/api/users/me` 인증 테스트 완료
- 프론트 로그인 연동
- JWT Authorization 헤더 자동 첨부

---

# 3. 길드 기본 구조 ✅

## 완료
- Guild 엔티티 / Repository / Service / Controller
- 길드 생성 API
- 내 길드 조회 API
- 길드 멤버 조회 API
- HeaderBar 길드명 / 인원 표시
- 길드 생성 프론트 연동
- 길드 최대 인원 35명 제한

## 남은 작업
- SUB_MASTER 최대 5명 제한 강제
- 길드 해체 기능
- 길드 초대/가입 플로우

---

# 4. 길드 멤버 도메인 ✅

## 완료
- GuildMember 엔티티
- REAL / VIRTUAL 타입 분리
- MASTER / SUB_MASTER / MEMBER 역할 구조
- 길드 생성 시 MASTER 자동 생성
- 가짜 길드원 생성/삭제 API
- 권한 기반 멤버 관리 구조
- 프론트 길드원 관리 UI 연동

---

# 5. 길드 인벤토리 시스템 ✅

## 백엔드 완료
- GuildMemberInventory 엔티티
- monsterCode 기반 저장 구조 통일
- 권한 검사
  - 본인
  - MASTER
  - SUB_MASTER
- 방덱 사용량 기반 최소 수량 정책
- inventory 전체 교체 방식 안정화
- flush 타이밍 및 중복 저장 문제 해결

## 프론트 완료
- 길드원 선택 기반 인벤 편집 UI
- 몬스터 검색
- +/- 수량 조절
- dirty-check 저장 버튼
- 최소 수량 이하 감소 제한
- 토스트 메시지 UX
- 0 이하 감소 방지
- monsterCode 기반 상태 관리

---

# 6. 길드 방덱(DefenseDeck) 시스템 ✅

## 백엔드 완료
- DefenseDeck 엔티티
- 몬스터 3인 조합 + 리더
- 생성 / 삭제 API
- 권한 검사
- 길드원 필터
- 몬스터 필터
- 리더효과 필터
- fetch join 기반 조회 최적화

## 수량 정책 리팩토링 완료

### 기존 구조

- 인벤 수량 직접 차감/복구

### 현재 구조

- inventory = 총 보유 수량
- defenseDeck = 사용 중 수량
- usable = total - used

### 효과

- 방덱 생성/삭제 안정성 개선
- 인벤 동기화 문제 해결
- 수량 정책 단순화

## 프론트 완료

- 방덱 생성/삭제 UI
- 이미지 기반 방덱 카드
- LEADER 강조 UI
- 이미지 기반 몬스터 선택 슬롯
- 활성 슬롯 강조
- 자동 다음 슬롯 이동
- 보유 몬스터만 선택 가능
- 사용 가능 수량 표시
- 가능 X / 보유 Y
- 생성 후 리더 슬롯 자동 복귀

---

# 7. 주인 없는 방덱 시스템 🟡

## 백엔드 완료

- OwnerlessDefenseDeck 도메인
- CRUD API
- 생성 가능 길드원 계산
- 가능 세트 수 계산 API

## 남은 작업

- 프론트 UI
- 가능 길드원 시각화
- 추천 기능

---

# 8. 전투 연구(Battle Research) 시스템 🟡

## 백엔드 완료

- BattleResearchPost
- BattleResearchComment
- 게시글 CRUD
- 댓글 CRUD
- 권한 정책
  - 작성자
  - MASTER
  - SUB_MASTER 삭제 가능
- 길드 탈퇴와 독립 유지 정책 설계

## 남은 작업

- 프론트 UI
- 댓글 UX
- 공덱 추천 시스템
- 좋아요/조회수 여부 결정

---

# 9. 프론트엔드 연동 2차 🚧

## 완료

- 로그인 연동
- JWT 자동 첨부
- 길드 생성/조회
- 길드원 관리
- 인벤토리 UI
- 방덱 UI
- 이미지 기반 UX 개선

## 진행 예정

- 방덱 필터 UI
  - 길드원 필터
  - 리더효과 필터
  - 몬스터 필터
- Ownerless 방덱 UI
- Battle Research UI
- 상세 화면 구조 개선
- 모바일 대응 여부 결정

---

# 10. 폴리싱 & 최적화 ⏳

## 예정

- 예외/검증 메시지 정리
- 공통 Toast 시스템
- 응답 포맷 정리
- fetch/error 구조 정리
- N+1 점검
- 애니메이션 개선
- 성능 최적화

---

# 11. 배포 준비 ⏳

## 예정

- dev/prod 환경 분리
- DB 전환
  - H2 → MySQL/PostgreSQL
- 환경변수 정리
- Docker 여부 결정
- 배포 스크립트
- CI/CD 여부 결정

---

# 12. 배포 ⏳

## 예정

- 백엔드 배포
- 프론트 배포
- 실제 길드 테스트
- 데이터 안정화
- 포트폴리오 정리
