📌 지금까지 & 앞으로의 진행 로드맵


1. 프론트 1차 설계 & 구현 (완료)

→ 몬스터 카탈로그, 속성 필터, 트리오(3인 조합) UI

→ 우측 속성 아이콘 필터, 리더 효과 분리 등

2. 백엔드 기본 세팅 & 인증 (완료)

→ Spring Boot 3.x / Java 17 / H2 / Gradle 환경

→ User 엔티티 + 생성/수정 시간

→ spring-boot-starter-security 적용

→ 회원가입 / 로그인 API

→ BCrypt 비밀번호 해시

→ JWT 발급 + 검증

→ JWT 필터 + /api/users/me 인증 테스트 완료

2025-11-30
3. 길드 기본 구조 (진행 중)

→ Guild 엔티티, GuildRepository, GuildService, GuildController

→ 길드 생성, 길드 목록, 내 길드 조회

→ 아직 역할(마스터/부마스터/길드원), 가짜 길드원, 최대 인원 35명, 부마스터 최대 5명, 이런 세부 정책은 반영 전

4. [지금 할 것] 길드 멤버 도메인 정식 설계 (NEXT, 바로 이 단계)

→ GuildMember 엔티티 (실제 유저 + 가짜 길드원 공통 모델)

→ 역할: MASTER / SUB_MASTER / MEMBER

→ 타입: REAL(사이트 계정 연결) / VIRTUAL(임의 길드원)

→ Guild ↔ GuildMember 연관관계 재구성

→ 길드 생성 시 → 마스터 GuildMember 자동 생성

→ 임의 길드원 추가/삭제 API 기본 설계

5. 길드 인벤토리(보유 몬스터) 시스템

→ Monster 마스터 데이터 (공통 몬스터 목록)

→ GuildMemberInventory (길드원별 몬스터/수량)

→ 인벤 입력/수정 API (자기 자신 + 마스터/부마스터 권한)

6. 길드원 방덱(DefenseDeck) 시스템

→ DefenseDeck (소유자: GuildMember, 몬스터 3개, 리더)

→ 방덱 생성/삭제 시 인벤토리 수량 증감

→ 몬스터/리더효과/길드원 이름 필터 API

7. 주인 없는 방덱 & 가능 길드원 계산

→ OwnerlessDefenseDeck (템플릿)

→ 이 방덱을 만들 수 있는 GuildMember 목록 계산 로직

→ “몇 세트 가능한지” 통계 API

8. 전투 연구 탭 도메인 & API

→ BattleResearchPost (게시글 = 방덱 연구)

→ BattleResearchComment (공덱 + 코멘트)

→ 권한 규칙 반영 (작성자/마스터/부마스터 삭제 가능)

→ 길드원 탈퇴와 완전 독립 (글/댓글 유지)

9. 프론트엔드 연동 2차

→ 로그인 연동 (JWT 보관 & Authorization 헤더)

→ 길드 탭 UI (방덱 탭 / 전투 연구 탭 분리)

→ 필터/리스트/디테일 화면 구현

10. 폴리싱 & 배포 준비

→ 예외/검증 처리

→ 응답 포맷 통일

→ 환경 분리(dev/prod)

→ 배포 스크립트 or 서버 설정

11. 배포