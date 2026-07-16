$ErrorActionPreference = "Stop"

$hostName = $env:SIEGE_RESTORE_DB_HOST
$database = $env:SIEGE_RESTORE_DB_NAME
$user = $env:SIEGE_RESTORE_DB_USER
$password = $env:PGPASSWORD
$dumpFile = $env:SIEGE_RESTORE_DUMP_FILE
$confirmRestore = $env:CONFIRM_RESTORE

if ([string]::IsNullOrWhiteSpace($hostName) -or
    [string]::IsNullOrWhiteSpace($database) -or
    [string]::IsNullOrWhiteSpace($user) -or
    [string]::IsNullOrWhiteSpace($password) -or
    [string]::IsNullOrWhiteSpace($dumpFile)) {
    Write-Host "Required environment variables:"
    Write-Host "  SIEGE_RESTORE_DB_HOST"
    Write-Host "  SIEGE_RESTORE_DB_NAME"
    Write-Host "  SIEGE_RESTORE_DB_USER"
    Write-Host "  PGPASSWORD"
    Write-Host "  SIEGE_RESTORE_DUMP_FILE"
    Write-Host "Safety confirmation:"
    Write-Host "  CONFIRM_RESTORE=YES"
    exit 1
}

if ($confirmRestore -ne "YES") {
    Write-Host "Restore is blocked. Set CONFIRM_RESTORE=YES only for a test Neon branch or local PostgreSQL database."
    exit 1
}

if (-not (Test-Path -LiteralPath $dumpFile)) {
    Write-Host "Dump file was not found: $dumpFile"
    exit 1
}

if (-not (Get-Command pg_restore -ErrorAction SilentlyContinue)) {
    Write-Host "pg_restore was not found. Install PostgreSQL client tools first."
    exit 1
}

pg_restore `
    --host $hostName `
    --port 5432 `
    --username $user `
    --dbname $database `
    --clean `
    --if-exists `
    --no-owner `
    --no-acl `
    $dumpFile

if ($LASTEXITCODE -ne 0) {
    Write-Host "Restore check failed."
    exit $LASTEXITCODE
}

Write-Host "Restore check completed against test database: $database"
