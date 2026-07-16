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
$smokeLoginId = $env:SMOKE_LOGIN_ID
$smokeLoginPassword = $env:SMOKE_LOGIN_PASSWORD
$smokeLoginIsAdmin = $env:SMOKE_LOGIN_IS_ADMIN -eq "true"

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

function Write-Skip {
    param([string]$Message)
    Write-Host "[SKIP] $Message"
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

function Assert-Health {
    param([string]$Uri)

    try {
        $response = Get-HttpResponse -Uri $Uri
        if ([int]$response.StatusCode -ne 200) {
            Write-Fail "Health API expected 200 but returned $($response.StatusCode)"
            return
        }

        $body = $response.Content | ConvertFrom-Json
        if ($body.success -eq $true -and $body.data.status -eq "UP") {
            Write-Pass "Health API returned UP"
        } else {
            Write-Fail "Health API returned unexpected body: $($response.Content)"
        }
    } catch {
        Write-Fail "Health API request failed: $($_.Exception.Message)"
    }
}

function Assert-MonsterApi {
    param(
        [string]$Name,
        [string]$Uri
    )

    try {
        $watch = [System.Diagnostics.Stopwatch]::StartNew()
        $response = Get-HttpResponse -Uri $Uri
        $watch.Stop()

        if ([int]$response.StatusCode -ne 200) {
            Write-Fail "$Name expected 200 but returned $($response.StatusCode)"
            return
        }

        $bytes = [System.Text.Encoding]::UTF8.GetByteCount($response.Content)
        if ($bytes -le 2) {
            Write-Fail "$Name returned an empty response"
            return
        }

        Write-Pass ("{0} returned 200, {1:N0} bytes, {2:N2}s" -f $Name, $bytes, $watch.Elapsed.TotalSeconds)
    } catch {
        Write-Fail "$Name request failed: $($_.Exception.Message)"
    }
}

function Get-SmokeToken {
    param(
        [string]$LoginId,
        [string]$Password
    )

    $payload = @{
        loginId = $LoginId
        password = $Password
    } | ConvertTo-Json

    try {
        $response = Invoke-WebRequest `
            -Uri "$backendUrl/api/users/login" `
            -Method POST `
            -ContentType "application/json" `
            -Body $payload `
            -UseBasicParsing `
            -TimeoutSec $requestTimeoutSec `
            -ErrorAction Stop

        $body = $response.Content | ConvertFrom-Json
        $token = $body.data.token

        if ([string]::IsNullOrWhiteSpace($token)) {
            Write-Fail "Login did not return a token"
            return $null
        }

        Write-Pass "Login returned a token"
        return $token
    } catch {
        Write-Fail "Login request failed: $($_.Exception.Message)"
        return $null
    }
}

function Assert-AuthenticatedSuccess {
    param(
        [string]$Name,
        [string]$Uri,
        [string]$Token
    )

    try {
        $response = Get-HttpResponse -Uri $Uri -Headers @{ Authorization = "Bearer $Token" }
        if ([int]$response.StatusCode -ne 200) {
            Write-Fail "$Name expected 200 but returned $($response.StatusCode)"
            return
        }

        $body = $response.Content | ConvertFrom-Json
        if ($body.success -eq $true) {
            Write-Pass "$Name returned success"
        } else {
            Write-Fail "$Name returned unexpected JSON body: $($response.Content)"
        }
    } catch {
        Write-Fail "$Name request failed: $($_.Exception.Message)"
    }
}

function Assert-AuthenticatedStatus {
    param(
        [string]$Name,
        [string]$Uri,
        [string]$Token,
        [int]$ExpectedStatus
    )

    try {
        $response = Get-HttpResponse -Uri $Uri -Headers @{ Authorization = "Bearer $Token" }
        if ([int]$response.StatusCode -eq $ExpectedStatus) {
            Write-Pass "$Name returned $ExpectedStatus"
        } else {
            Write-Fail "$Name expected $ExpectedStatus but returned $($response.StatusCode)"
        }
    } catch {
        Write-Fail "$Name request failed: $($_.Exception.Message)"
    }
}

Write-Host "Frontend: $frontendUrl"
Write-Host "Backend : $backendUrl"
Write-Host "Origin  : $origin"
Write-Host ""

Assert-Status -Name "Frontend" -Uri $frontendUrl -ExpectedStatus 200

$backendAvailable = $true
try {
    Get-HttpResponse -Uri $backendUrl | Out-Null
} catch {
    $backendAvailable = $false
    Write-Fail "Backend is not reachable: $($_.Exception.Message)"
}

if ($backendAvailable) {
    Assert-Health -Uri "$backendUrl/api/health"
    Assert-JsonMessage -Name "Backend root unauthenticated" -Uri $backendUrl -ExpectedStatus 401 -ExpectedMessage $loginRequiredMessage
    Assert-JsonMessage -Name "Admin API unauthenticated" -Uri "$backendUrl/api/admin/guilds" -ExpectedStatus 401 -ExpectedMessage $loginRequiredMessage
    Assert-JsonMessage -Name "User API unauthenticated" -Uri "$backendUrl/api/users/me" -ExpectedStatus 401 -ExpectedMessage $loginRequiredMessage
    Assert-MonsterApi -Name "Monster API" -Uri "$backendUrl/api/monsters"
    Assert-MonsterApi -Name "Monster selection API" -Uri "$backendUrl/api/monsters/selection"
    Assert-Cors -Uri "$backendUrl/api/monsters" -ExpectedOrigin $origin

    if (-not [string]::IsNullOrWhiteSpace($smokeLoginId) -and -not [string]::IsNullOrWhiteSpace($smokeLoginPassword)) {
        $token = Get-SmokeToken -LoginId $smokeLoginId -Password $smokeLoginPassword
        if (-not [string]::IsNullOrWhiteSpace($token)) {
            Assert-AuthenticatedSuccess -Name "Bootstrap API authenticated" -Uri "$backendUrl/api/users/bootstrap" -Token $token
            Assert-AuthenticatedSuccess -Name "Me API authenticated" -Uri "$backendUrl/api/users/me" -Token $token
            if ($smokeLoginIsAdmin) {
                Assert-AuthenticatedStatus -Name "Admin API authenticated as admin" -Uri "$backendUrl/api/admin/guilds" -Token $token -ExpectedStatus 200
            } else {
                Assert-AuthenticatedStatus -Name "Admin API blocked for normal user" -Uri "$backendUrl/api/admin/guilds" -Token $token -ExpectedStatus 403
            }
        }
    } else {
        Write-Skip "Authenticated checks require SMOKE_LOGIN_ID and SMOKE_LOGIN_PASSWORD"
    }
} else {
    Write-Skip "Health API"
    Write-Skip "Backend root unauthenticated"
    Write-Skip "Admin API unauthenticated"
    Write-Skip "User API unauthenticated"
    Write-Skip "Monster API"
    Write-Skip "Monster selection API"
    Write-Skip "CORS"
    Write-Skip "Authenticated checks"
}

Write-Host ""

if ($failures.Count -gt 0) {
    Write-Host "Smoke test failed with $($failures.Count) failure(s)."
    exit 1
}

Write-Host "Smoke test passed."
