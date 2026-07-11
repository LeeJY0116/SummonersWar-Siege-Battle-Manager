# TEST_SCENARIO.md

Siege-Battle-Manager 로컬 테스트 시나리오

---

# 📌 테스트 목적

포트폴리오 확인자 또는 개발자가 로컬 환경에서 핵심 기능 흐름을 빠르게 검증할 수 있도록 정리한 시나리오입니다.

---

# 🧪 테스트 계정

로컬 H2 DB에 아래 계정이 있으면 이 계정으로 테스트합니다.

```text
email: test@test.com
password: test
nickname: test
guild: test
```

계정이 없다면 회원가입 화면에서 같은 정보로 계정을 생성한 뒤, `test` 길드를 생성합니다.

---

# ✅ 사전 준비

## 1) 백엔드 실행

```bash
cd Siege-Battle-Manager/backend/siege-backend
./gradlew bootRun
```

기본 API 주소:

```text
http://localhost:8080
```

## 2) 프론트엔드 실행

```bash
cd Siege-Battle-Manager/frontend/siege-battle-manager
npm install
npm run dev
```

기본 화면 주소:

```text
http://localhost:5173
```

---

# ✅ 기본 검증 흐름

## 1) 인증

1. `test@test.com / test`로 로그인합니다.
2. 계정이 없으면 회원가입 후 다시 로그인합니다.
3. 로그인 후 상단에 길드 정보 또는 길드 생성 화면이 표시되는지 확인합니다.

## 2) 길드

1. 길드가 없다면 `test` 이름으로 길드를 생성합니다.
2. 상단에 `길드: test`, `마스터: test`가 표시되는지 확인합니다.
3. 길드원 목록에서 본인 계정이 표시되는지 확인합니다.

## 3) 몬스터 데이터

1. 관리자 기능에서 `Sync Swarfarm`을 실행합니다.
2. 이어서 `Apply Names`를 실행합니다.
3. 도감 또는 몬스터 선택 UI에서 한글명과 별칭 검색이 동작하는지 확인합니다.
4. 신규 몬스터는 Swarfarm 동기화로 DB에 추가되지만, 사용자 노출은 `monster-localization.json`의 `koreanName`, `enabled`, `awakeningLevel` 기준을 따르는지 확인합니다.

관리 파일:

```text
Siege-Battle-Manager/backend/siege-backend/src/main/resources/data/monster-localization.json
```

## 4) 길드원 인벤토리

1. 길드 탭에서 길드원 인벤토리를 입력합니다.
2. 몬스터 이름, 한글명, 별칭 검색이 동작하는지 확인합니다.
3. 저장 후 새로고침해도 수량이 유지되는지 확인합니다.

## 5) 방덱 생성

1. 길드원 방덱 생성 화면에서 몬스터 3마리를 선택합니다.
2. 첫 번째 몬스터가 리더로 표시되는지 확인합니다.
3. 방덱 생성 후 인벤토리 수량이 차감되는지 확인합니다.
4. 방덱 삭제 후 수량이 복구되는지 확인합니다.
5. 리더 효과 필터와 포함 몬스터 검색이 동작하는지 확인합니다.

## 6) 전투 연구

1. 전투 연구 게시글을 작성합니다.
2. 연구 대상 방덱 몬스터가 한글명으로 표시되는지 확인합니다.
3. 댓글을 작성하고 수정/삭제가 가능한지 확인합니다.
4. 게시글 삭제 권한이 작성자/마스터/부마스터 기준으로 동작하는지 확인합니다.

---

# 🔒 공개 저장소 확인

아래 파일은 GitHub에 포함하지 않습니다.

- `.env`
- 로컬 H2 DB 파일
- 실행 로그
- 게임 몬스터 이미지 원본 파일
- IDE 설정 파일

공개 저장소에는 소스 코드, 문서, 예시 설정, 게임 이미지가 포함되지 않은 UI 스크린샷만 포함합니다.
