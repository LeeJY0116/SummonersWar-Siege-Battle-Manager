# Repository Security Checklist

이 문서는 공개 포트폴리오 저장소와 비공개 실서비스 저장소를 분리하기 전에 확인할 기준을 정리한다.

## Goals

- Public 저장소에는 실행 가능한 핵심 코드와 문서를 남기되, 운영 비밀값과 실제 운영 설정은 포함하지 않는다.
- Private 저장소에는 운영 환경변수, 실제 배포 설정, 점령전 로그 파서 같은 민감하거나 운영 전용인 기능을 관리한다.
- 공개된 적 있는 비밀값은 운영에서 재사용하지 않는다.

## Current Known Risk

- 과거 커밋 히스토리에 개발용 JWT secret이 포함된 적이 있다.
- 현재 코드는 `JWT_SECRET` 환경변수를 사용하도록 수정되어 있지만, 히스토리에는 문자열이 남아 있을 수 있다.
- 운영 배포 시에는 반드시 새 JWT secret을 생성해서 사용한다.

## Before Making Repository Public

1. 저장소를 임시로 Private 상태에서 점검한다.
2. `gitleaks` 또는 `trufflehog`로 전체 히스토리를 검사한다.
3. 노출된 비밀값이 있으면 해당 키를 폐기하고 새 값으로 교체한다.
4. 공개 저장소에 남겨도 되는 값인지 파일별로 확인한다.
5. 필요하면 `git-filter-repo`로 히스토리에서 민감 문자열을 제거한다.
6. 히스토리를 재작성했다면 원격 저장소를 강제 갱신하기 전에 백업 브랜치를 만든다.

## Public Repository

공개 저장소에 남겨도 되는 항목:

- Spring Boot / React 소스 코드
- 예시 환경설정 파일
- 로컬 개발용 H2 설정
- 로컬 PostgreSQL 테스트용 Docker Compose
- 포트폴리오 README와 트러블슈팅 문서
- 민감값이 제거된 테스트 코드

공개 저장소에 올리지 않을 항목:

- 운영 DB 접속 정보
- 실제 JWT secret
- 이메일 SMTP 비밀번호 또는 앱 비밀번호
- 운영 도메인에 종속된 관리자 IP 목록
- 실제 서비스 운영 로그
- 외부 API로 수집한 원본 대량 데이터 파일

## Private Repository

비공개 저장소에서 관리할 후보:

- 운영 배포 설정
- 점령전 로그 파서와 원본 로그 샘플
- 운영 모니터링 설정
- 운영 DB 백업 절차
- 실서비스 전용 자동화 스크립트

## Suggested Split Timing

1. 기능 마무리와 권한 검증을 먼저 끝낸다.
2. PostgreSQL 운영 프로필과 배포 환경변수 기준을 확정한다.
3. 보안 점검 도구로 히스토리를 검사한다.
4. Public 저장소를 포트폴리오 기준으로 정리한다.
5. Private 실서비스 저장소를 새로 만들고 운영 전용 파일을 옮긴다.
6. 배포는 Private 저장소 기준으로 연결한다.

## Command Examples

```powershell
gitleaks detect --source . --verbose
trufflehog git file://D:/Codes/SummonersWar --only-verified
```

히스토리 재작성은 되돌리기 어렵기 때문에 실제 실행 전에 백업 브랜치를 만들고 별도 단계로 진행한다.

## Scan History

### 2026-07-15

- `docker run --rm -v D:/Codes/SummonersWar:/repo:ro zricethezav/gitleaks:latest detect --source=/repo --verbose --redact`
  - 140 commits scanned
  - no leaks found
- `docker run --rm -v D:/Codes/SummonersWar:/repo:ro trufflesecurity/trufflehog:latest git file:///repo --only-verified --no-update`
  - verified secrets: 0
  - unverified secrets: 0

### 2026-07-14

- `gitleaks detect --source=/repo --verbose`
  - 124 commits scanned
  - no leaks found
- `trufflehog git file:///repo --only-verified`
  - verified secrets: 0
  - unverified secrets: 0
