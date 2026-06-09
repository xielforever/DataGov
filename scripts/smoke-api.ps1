param(
  [string]$ApiBase = "http://127.0.0.1:8080/api/v1",
  [string]$Username = $(if ($env:DATAGOV_BOOTSTRAP_ADMIN_USERNAME) { $env:DATAGOV_BOOTSTRAP_ADMIN_USERNAME } else { "admin" }),
  [string]$Password = $env:DATAGOV_BOOTSTRAP_ADMIN_PASSWORD
)

$ErrorActionPreference = "Stop"

function Invoke-Api {
  param(
    [string]$Method,
    [string]$Path,
    [object]$Body = $null,
    [string]$Token = ""
  )

  $headers = @{
    "Content-Type" = "application/json"
  }
  if ($Token) {
    $headers["Authorization"] = "Bearer $Token"
  }

  $parameters = @{
    Method = $Method
    Uri = "$ApiBase$Path"
    Headers = $headers
  }

  if ($null -ne $Body) {
    $parameters.Body = ($Body | ConvertTo-Json -Depth 20)
  }

  Invoke-RestMethod @parameters
}

function Assert-Success {
  param(
    [string]$Name,
    [object]$Response
  )

  if ($Response.code -ne 0) {
    throw "$Name failed: code=$($Response.code), message=$($Response.message)"
  }
  Write-Output "ok - $Name"
}

Write-Output "DataGov API smoke target: $ApiBase"

$health = Invoke-Api -Method "GET" -Path "/health"
Assert-Success -Name "health" -Response $health

try {
  Invoke-Api -Method "GET" -Path "/metadata/data-sources" | Out-Null
  throw "metadata data sources without token unexpectedly succeeded"
} catch {
  $statusCode = $_.Exception.Response.StatusCode.value__
  if ($statusCode -ne 401) {
    throw
  }
  Write-Output "ok - unauthenticated guard"
}

if ([string]::IsNullOrWhiteSpace($Password)) {
  if ($env:DATAGOV_ENV -eq "production") {
    throw "Password is required in production. Pass -Password or set DATAGOV_BOOTSTRAP_ADMIN_PASSWORD in the current shell."
  }
  Write-Output "Password not provided; using backend development default password."
  $Password = "DataGov@123"
}

$login = Invoke-Api -Method "POST" -Path "/auth/login" -Body @{
  username = $Username
  password = $Password
  rememberMe = $false
}
Assert-Success -Name "auth login" -Response $login

$token = $login.data.token
if ([string]::IsNullOrWhiteSpace($token)) {
  throw "auth login did not return a token"
}

$me = Invoke-Api -Method "GET" -Path "/auth/me" -Token $token
Assert-Success -Name "auth me" -Response $me

$dataSources = Invoke-Api -Method "GET" -Path "/metadata/data-sources" -Token $token
Assert-Success -Name "metadata data sources" -Response $dataSources

$scripts = Invoke-Api -Method "GET" -Path "/development/scripts" -Token $token
Assert-Success -Name "development scripts" -Response $scripts

$aiCapabilities = Invoke-Api -Method "GET" -Path "/ai/capabilities" -Token $token
Assert-Success -Name "ai capabilities" -Response $aiCapabilities

$aiTokenUsage = Invoke-Api -Method "GET" -Path "/ai/token-usage" -Token $token
Assert-Success -Name "ai token usage" -Response $aiTokenUsage

$aiTools = Invoke-Api -Method "GET" -Path "/ai/tools" -Token $token
Assert-Success -Name "ai tools" -Response $aiTools

$aiObservability = Invoke-Api -Method "GET" -Path "/ai/observability" -Token $token
Assert-Success -Name "ai observability" -Response $aiObservability

$approvals = Invoke-Api -Method "GET" -Path "/approvals" -Token $token
Assert-Success -Name "approvals" -Response $approvals

Write-Output "DataGov API smoke passed."
