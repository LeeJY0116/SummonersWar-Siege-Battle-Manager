# PostgreSQL Local Test

로컬 개발은 기본적으로 H2 `dev` 프로필을 사용한다.
PostgreSQL 호환성 확인이 필요할 때만 아래 순서로 실행한다.

## 1. PostgreSQL 컨테이너 실행

```powershell
cd .\Siege-Battle-Manager\backend\siege-backend
docker compose up -d
```

## 2. Spring Boot를 prod 프로필로 실행

```powershell
$env:SPRING_PROFILES_ACTIVE="prod"
$env:DB_URL="jdbc:postgresql://localhost:5432/siege_manager"
$env:DB_USERNAME="siege_user"
$env:DB_PASSWORD="siege_password"
$env:JWT_SECRET="replace-with-a-32-byte-or-longer-local-secret"
$env:DDL_AUTO="update"
.\gradlew.bat bootRun
```

`DDL_AUTO=update`는 로컬 PostgreSQL 최초 확인용이다.
운영 환경에서는 기본값인 `validate`를 우선 사용한다.

## 3. 컨테이너 종료

```powershell
docker compose down
```

DB 데이터까지 삭제하려면:

```powershell
docker compose down -v
```
