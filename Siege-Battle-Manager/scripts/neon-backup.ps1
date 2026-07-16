$ErrorActionPreference = "Stop"

$backupDir = $env:SIEGE_BACKUP_DIR
if ([string]::IsNullOrWhiteSpace($backupDir)) {
    $backupDir = Join-Path (Get-Location) "backup"
}

$hostName = $env:SIEGE_DB_HOST
$database = $env:SIEGE_DB_NAME
$user = $env:SIEGE_DB_USER
$password = $env:PGPASSWORD

if ([string]::IsNullOrWhiteSpace($hostName) -or
    [string]::IsNullOrWhiteSpace($database) -or
    [string]::IsNullOrWhiteSpace($user) -or
    [string]::IsNullOrWhiteSpace($password)) {
    Write-Host "Required environment variables:"
    Write-Host "  SIEGE_DB_HOST"
    Write-Host "  SIEGE_DB_NAME"
    Write-Host "  SIEGE_DB_USER"
    Write-Host "  PGPASSWORD"
    Write-Host "Optional:"
    Write-Host "  SIEGE_BACKUP_DIR"
    exit 1
}

if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) {
    Write-Host "pg_dump was not found. Install PostgreSQL client tools first."
    exit 1
}

New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$filePath = Join-Path $backupDir "siege-prod-$timestamp.dump"

pg_dump `
    --host $hostName `
    --port 5432 `
    --username $user `
    --dbname $database `
    --format custom `
    --no-owner `
    --no-acl `
    --file $filePath

if ($LASTEXITCODE -ne 0) {
    Write-Host "Backup failed."
    exit $LASTEXITCODE
}

Write-Host "Backup completed: $filePath"
