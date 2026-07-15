$ErrorActionPreference = "Stop"

$frontendUrl = $env:SMOKE_FRONTEND_URL
if ([string]::IsNullOrWhiteSpace($frontendUrl)) {
    $frontendUrl = "https://sw-siege.pages.dev"
}

$backendUrl = $env:SMOKE_BACKEND_URL
if ([string]::IsNullOrWhiteSpace($backendUrl)) {
    $backendUrl = "https://sw-siege-backend.onrender.com"
}

$origin = $env:SMOKE_ORIGIN
if ([string]::IsNullOrWhiteSpace($origin)) {
    $origin = $frontendUrl
}

$requestTimeoutSec = 20
$loginRequiredMessage = -join (47196, 44536, 51064, 51060, 32, 54596, 50836, 54633, 45768, 45796, 46 | ForEach-Object { [char]$_ })

$failures = New-Object System.Collections.Generic.List[string]

function Write-Pass {
    param([string]$Message)
    Write-Host "[ OK ] $Message"
}

function Write-Fail {
    param([string]$Message)
    $script:failures.Add($Message) | Out-Null
    Write-Host "[FAIL] $Message"
}

function Get-HttpResponse {
    param(
        [string]$Uri,
        [hashtable]$Headers = @{}
    )

    try {
        return Invoke-WebRequest -Uri $Uri -UseBasicParsing -TimeoutSec $requestTimeoutSec -Headers $Headers -ErrorAction Stop
    } catch {
        $response = $_.Exception.Response
        if ($null -eq $response) {
            throw
        }

        $stream = $response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $content = $reader.ReadToEnd()

        return [pscustomobject]@{
            StatusCode = [int]$response.StatusCode
            Content = $content
            Headers = $response.Headers
        }
    }
}

function Assert-Status {
    param(
        [string]$Name,
        [string]$Uri,
        [int]$ExpectedStatus
    )

    try {
        $response = Get-HttpResponse -Uri $Uri
        if ([int]$response.StatusCode -eq $ExpectedStatus) {
            Write-Pass "$Name returned $ExpectedStatus"
        } else {
            Write-Fail "$Name expected $ExpectedStatus but returned $($response.StatusCode)"
        }
    } catch {
        Write-Fail "$Name request failed: $($_.Exception.Message)"
    }
}

function Assert-JsonMessage {
    param(
        [string]$Name,
        [string]$Uri,
        [int]$ExpectedStatus,
        [string]$ExpectedMessage
    )

    try {
        $response = Get-HttpResponse -Uri $Uri
        if ([int]$response.StatusCode -ne $ExpectedStatus) {
            Write-Fail "$Name expected $ExpectedStatus but returned $($response.StatusCode)"
            return
        }

        $body = $response.Content | ConvertFrom-Json
        if ($body.success -eq $false -and $body.message -eq $ExpectedMessage) {
            Write-Pass "$Name returned expected JSON message"
        } else {
            Write-Fail "$Name returned unexpected JSON body: $($response.Content)"
        }
    } catch {
        Write-Fail "$Name request failed: $($_.Exception.Message)"
    }
}

function Assert-Cors {
    param(
        [string]$Uri,
        [string]$ExpectedOrigin
    )

    try {
        $response = Get-HttpResponse -Uri $Uri -Headers @{ Origin = $ExpectedOrigin }
        $actualOrigin = $response.Headers["access-control-allow-origin"]
        if ($actualOrigin -eq $ExpectedOrigin) {
            Write-Pass "CORS allowed origin is $ExpectedOrigin"
        } else {
            Write-Fail "CORS expected $ExpectedOrigin but returned $actualOrigin"
        }
    } catch {
        Write-Fail "CORS request failed: $($_.Exception.Message)"
    }
}

function Assert-MonsterApi {
    param([string]$Uri)

    try {
        $watch = [System.Diagnostics.Stopwatch]::StartNew()
        $response = Get-HttpResponse -Uri $Uri
        $watch.Stop()

        if ([int]$response.StatusCode -ne 200) {
            Write-Fail "Monster API expected 200 but returned $($response.StatusCode)"
            return
        }

        $bytes = [System.Text.Encoding]::UTF8.GetByteCount($response.Content)
        if ($bytes -le 2) {
            Write-Fail "Monster API returned an empty response"
            return
        }

        Write-Pass ("Monster API returned 200, {0:N0} bytes, {1:N2}s" -f $bytes, $watch.Elapsed.TotalSeconds)
    } catch {
        Write-Fail "Monster API request failed: $($_.Exception.Message)"
    }
}

Write-Host "Frontend: $frontendUrl"
Write-Host "Backend : $backendUrl"
Write-Host "Origin  : $origin"
Write-Host ""

Assert-Status -Name "Frontend" -Uri $frontendUrl -ExpectedStatus 200
Assert-JsonMessage -Name "Backend root unauthenticated" -Uri $backendUrl -ExpectedStatus 401 -ExpectedMessage $loginRequiredMessage
Assert-JsonMessage -Name "Admin API unauthenticated" -Uri "$backendUrl/api/admin/guilds" -ExpectedStatus 401 -ExpectedMessage $loginRequiredMessage
Assert-JsonMessage -Name "User API unauthenticated" -Uri "$backendUrl/api/users/me" -ExpectedStatus 401 -ExpectedMessage $loginRequiredMessage
Assert-MonsterApi -Uri "$backendUrl/api/monsters"
Assert-Cors -Uri "$backendUrl/api/monsters" -ExpectedOrigin $origin

Write-Host ""

if ($failures.Count -gt 0) {
    Write-Host "Smoke test failed with $($failures.Count) failure(s)."
    exit 1
}

Write-Host "Smoke test passed."
