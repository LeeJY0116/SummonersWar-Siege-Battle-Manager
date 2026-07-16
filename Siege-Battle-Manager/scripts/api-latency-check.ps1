$ErrorActionPreference = "Stop"

$backendUrl = $env:SMOKE_BACKEND_URL
if ([string]::IsNullOrWhiteSpace($backendUrl)) {
    $backendUrl = "https://sw-siege-backend.onrender.com"
}

$token = $env:SMOKE_AUTH_TOKEN
$requestTimeoutSec = 30

$checks = @(
    @{ Name = "Backend root"; Path = ""; Auth = $false },
    @{ Name = "Monsters"; Path = "/api/monsters"; Auth = $false },
    @{ Name = "Me"; Path = "/api/users/me"; Auth = $true },
    @{ Name = "My guild"; Path = "/api/guilds/me"; Auth = $true },
    @{ Name = "My guild members"; Path = "/api/guilds/me/members"; Auth = $true },
    @{ Name = "Defense decks"; Path = "/api/defense-decks"; Auth = $true },
    @{ Name = "Ownerless defense decks"; Path = "/api/ownerless-defense-decks"; Auth = $true },
    @{ Name = "Research posts"; Path = "/api/research/posts?page=0"; Auth = $true }
)

function Invoke-LatencyCheck {
    param(
        [string]$Name,
        [string]$Uri,
        [bool]$RequiresAuth
    )

    if ($RequiresAuth -and [string]::IsNullOrWhiteSpace($token)) {
        return [pscustomobject]@{
            Name = $Name
            Status = "SKIP"
            Milliseconds = $null
            Note = "SMOKE_AUTH_TOKEN required"
        }
    }

    $headers = @{}
    if ($RequiresAuth) {
        $headers["Authorization"] = "Bearer $token"
    }

    $watch = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $response = Invoke-WebRequest -Uri $Uri -UseBasicParsing -TimeoutSec $requestTimeoutSec -Headers $headers -ErrorAction Stop
        $watch.Stop()

        return [pscustomobject]@{
            Name = $Name
            Status = [int]$response.StatusCode
            Milliseconds = [math]::Round($watch.Elapsed.TotalMilliseconds)
            Note = ""
        }
    } catch {
        $watch.Stop()
        $response = $_.Exception.Response
        $status = "ERROR"
        if ($null -ne $response) {
            $status = [int]$response.StatusCode
        }

        return [pscustomobject]@{
            Name = $Name
            Status = $status
            Milliseconds = [math]::Round($watch.Elapsed.TotalMilliseconds)
            Note = $_.Exception.Message
        }
    }
}

Write-Host "Backend: $backendUrl"
Write-Host "Authenticated checks require SMOKE_AUTH_TOKEN."
Write-Host ""

$results = foreach ($check in $checks) {
    Invoke-LatencyCheck `
        -Name $check.Name `
        -Uri ($backendUrl + $check.Path) `
        -RequiresAuth $check.Auth
}

$results | Format-Table -AutoSize

$slow = $results | Where-Object {
    $_.Milliseconds -ne $null -and $_.Milliseconds -gt 2000
}

if ($slow.Count -gt 0) {
    Write-Host ""
    Write-Host "Slow API candidates (> 2000ms):"
    $slow | Format-Table -AutoSize
}
