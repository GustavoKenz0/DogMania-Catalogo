<# Local, non-destructive HTTP smoke checks. Does not certify OWASP coverage or XSS/SQLi prevention.
   Use on a development instance only. Authorization mutations are tested by MockMvc without a real database. #>
param([string]$BaseUrl = 'http://127.0.0.1:8080/api/v1')
$ErrorActionPreference = 'Stop'
$target = [Uri]$BaseUrl
if (-not $target.IsAbsoluteUri -or $target.Scheme -ne 'http' -or
    $target.Host -notin @('127.0.0.1', 'localhost', '[::1]') -or $target.UserInfo -or $target.Query -or $target.Fragment) {
    throw 'Only a local HTTP development instance is allowed.'
}
Add-Type -AssemblyName System.Net.Http
$handler = New-Object System.Net.Http.HttpClientHandler
$handler.AllowAutoRedirect = $false
$handler.UseProxy = $false
$client = New-Object System.Net.Http.HttpClient($handler)
$client.Timeout = [TimeSpan]::FromSeconds(5)
$failures = 0
$checks = 0
function Check-Http {
    param([string]$Name, [string]$Path, [int]$Expected, [string]$Method = 'GET', [hashtable]$Headers = @{})
    $script:checks++
    $request = New-Object System.Net.Http.HttpRequestMessage([System.Net.Http.HttpMethod]::new($Method), "$($BaseUrl.TrimEnd('/'))$Path")
    foreach ($key in $Headers.Keys) { [void]$request.Headers.TryAddWithoutValidation($key, $Headers[$key]) }
    try {
        $response = $client.SendAsync($request).GetAwaiter().GetResult()
        $actual = [int]$response.StatusCode
        if ($actual -ne $Expected) {
            $script:failures++
            Write-Host "FAIL $Name : HTTP $actual; expected $Expected" -ForegroundColor Red
        } else { Write-Host "PASS $Name : HTTP $actual" -ForegroundColor Green }
        $response.Dispose()
    } catch {
        # An unreachable server is a failed check, never evidence that an attack was blocked.
        $script:failures++
        Write-Host "FAIL $Name : no HTTP response (connection/timeout error)" -ForegroundColor Red
    } finally { $request.Dispose() }
}
try {
    Check-Http 'Public catalog' '/products?size=1' 200
    Check-Http 'Anonymous admin catalog denied' '/admin/products' 401
    Check-Http 'Anonymous current user denied' '/auth/me' 401
    Check-Http 'Malformed token denied' '/admin/products' 401 'GET' @{ Authorization = 'Bearer not.a.jwt' }
    Check-Http 'Foreign CORS preflight rejected' '/products' 403 'OPTIONS' @{
        Origin = 'https://attacker.invalid'; 'Access-Control-Request-Method' = 'POST'
    }
} finally { $client.Dispose(); $handler.Dispose() }
Write-Host "$($checks - $failures)/$checks local checks passed. Limited checks; no security guarantee."
if ($failures -gt 0) { exit 1 }
