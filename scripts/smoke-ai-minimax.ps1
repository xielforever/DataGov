param(
  [string]$ApiBase = "http://127.0.0.1:8080/api/v1",
  [string]$Username = $(if ($env:DATAGOV_BOOTSTRAP_ADMIN_USERNAME) { $env:DATAGOV_BOOTSTRAP_ADMIN_USERNAME } else { "admin" }),
  [string]$Password = $env:DATAGOV_BOOTSTRAP_ADMIN_PASSWORD,
  [string]$Question = "Write PostgreSQL SQL to count raw.ods_order rows from the last 1 day. Return SQL and one short assumption."
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

Write-Output "DataGov AI MiniMax E2E target: $ApiBase"

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

$request = @{
  capability = "write-sql"
  question = $Question
  context = @{
    viewId = "smoke-ai-minimax"
    viewTitle = "AI MiniMax E2E"
    url = "/testing/ai-e2e"
    dialect = "PostgreSQL"
    blocks = @(
      @{
        id = "sample-source"
        type = "metadata"
        title = "Sample data source"
        content = "datagov_sample_postgresql: raw.ods_order(order_id, user_id, order_amount, order_status, created_at)"
        priority = 90
        included = $true
      }
    )
  }
}

$answer = Invoke-Api -Method "POST" -Path "/ai/assistant/messages" -Token $token -Body $request
Assert-Success -Name "ai minimax assistant message" -Response $answer

if ([string]::IsNullOrWhiteSpace($answer.data.answer)) {
  throw "ai minimax assistant returned empty answer"
}
if ($answer.data.tokenUsage.totalTokens -le 0) {
  throw "ai minimax assistant did not record token usage"
}

$observability = Invoke-Api -Method "GET" -Path "/ai/observability" -Token $token
Assert-Success -Name "ai observability after minimax" -Response $observability

Write-Output "DataGov AI MiniMax E2E passed. Answer content is intentionally not printed."
