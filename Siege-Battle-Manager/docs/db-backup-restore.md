# DB 백업/복구 운영 메모

이 문서는 운영 DB를 Neon PostgreSQL로 사용할 때의 백업과 복구 기준을 정리한다.

## 기본 방향

- 짧은 기간의 실수 복구는 Neon의 Instant restore, 즉 PITR(point-in-time restore)를 우선 사용한다.
- 장기 보관이나 외부 보관이 필요한 백업은 PostgreSQL 표준 도구인 `pg_dump`를 사용한다.
- 운영 DB 접속 정보와 백업 파일은 Public 저장소에 커밋하지 않는다.

## Neon Instant Restore

Neon은 플랜별 restore window 안에서 특정 시점으로 root branch를 복구할 수 있다.

주의할 점:

- Instant restore는 root branch 기준으로 동작한다.
- 복구는 merge가 아니라 overwrite다. 선택한 시점 이후의 현재 데이터와 스키마가 복구 시점의 내용으로 교체된다.
- branch 안의 모든 database에 적용된다.
- 복구 중 기존 연결은 잠시 끊길 수 있다.
- 복구 전 상태는 backup branch로 보존될 수 있다.

운영에서 사용할 기준:

1. 실수 발생 시점을 먼저 확인한다.
2. Neon Console에서 Time Travel Assist로 복구 후보 시점을 조회한다.
3. 복구 전 현재 상태가 보존되는지 확인한다.
4. 트래픽이 적은 시간에 Instant restore를 실행한다.
5. Render 백엔드가 DB 연결을 다시 잡는지 확인한다.
6. 로그인, 길드 조회, 인벤토리, 방덱, 전투 연구 조회를 Smoke Test로 확인한다.

## pg_dump 백업

장기 보관용 백업은 `pg_dump`를 사용한다.

프로젝트에는 환경변수 기반 백업 스크립트를 둔다.

```powershell
$env:SIEGE_DB_HOST="NEON_HOST"
$env:SIEGE_DB_NAME="NEON_DB"
$env:SIEGE_DB_USER="NEON_USER"
$env:PGPASSWORD="운영 DB 비밀번호"
powershell -ExecutionPolicy Bypass -File .\scripts\neon-backup.ps1
```

PowerShell 예시:

```powershell
$env:PGPASSWORD="운영 DB 비밀번호"
pg_dump `
  --host "NEON_HOST" `
  --port "5432" `
  --username "NEON_USER" `
  --dbname "NEON_DB" `
  --format custom `
  --file "backup/siege-prod-YYYYMMDD.dump"
```

주의:

- `PGPASSWORD`와 dump 파일은 Git에 커밋하지 않는다.
- 백업 파일은 로컬 PC, 외장 저장소, 비공개 클라우드 저장소처럼 Public 저장소 밖에 보관한다.
- 백업 파일명에는 날짜를 넣는다.
- 복구 연습은 운영 DB가 아니라 별도 Neon branch 또는 로컬 PostgreSQL에서 먼저 한다.

## pg_restore 복구 연습

운영 DB에 바로 복구하지 말고, 테스트 DB에서 먼저 검증한다.

복구 연습은 별도 Neon branch 또는 로컬 PostgreSQL에서만 실행한다.

```powershell
$env:SIEGE_RESTORE_DB_HOST="TEST_HOST"
$env:SIEGE_RESTORE_DB_NAME="TEST_DB"
$env:SIEGE_RESTORE_DB_USER="TEST_USER"
$env:PGPASSWORD="테스트 DB 비밀번호"
$env:SIEGE_RESTORE_DUMP_FILE="backup/siege-prod-YYYYMMDD-HHMMSS.dump"
$env:CONFIRM_RESTORE="YES"
powershell -ExecutionPolicy Bypass -File .\scripts\neon-restore-check.ps1
```

```powershell
$env:PGPASSWORD="테스트 DB 비밀번호"
pg_restore `
  --host "TEST_HOST" `
  --port "5432" `
  --username "TEST_USER" `
  --dbname "TEST_DB" `
  --clean `
  --if-exists `
  "backup/siege-prod-YYYYMMDD.dump"
```

복구 후 확인할 항목:

- admin 로그인 가능 여부
- 길드 목록 조회
- 길드원 목록 조회
- 인벤토리 수량
- 방덱 목록
- 전투 연구 글과 댓글
- 몬스터 도감 데이터

## 현재 프로젝트 운영 기준

- Neon Instant restore는 실수 복구용 1차 수단으로 둔다.
- `pg_dump`는 배포 직전, 큰 데이터 변경 전, 운영 정책 변경 전에 수동으로 남긴다.
- 자동 백업은 실사용자가 늘어난 뒤 별도 Private 운영 저장소에서 스크립트로 관리한다.
- Public 포트폴리오 저장소에는 백업 파일, 운영 DB URL, 운영 비밀번호를 올리지 않는다.
- 백업 스크립트는 비밀값을 파일에 저장하지 않고 환경변수로만 받는다.
- 복구 스크립트는 `CONFIRM_RESTORE=YES`가 없으면 실행되지 않게 한다.

## 참고 문서

- Neon Backups: https://neon.com/docs/manage/backups
- Neon Instant restore: https://neon.com/docs/introduction/branch-restore
