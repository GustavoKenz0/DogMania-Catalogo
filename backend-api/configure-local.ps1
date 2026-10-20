[CmdletBinding()]
param(
    [string]$DatabaseUrl,
    [string]$DatabaseUser,
    [Security.SecureString]$RuntimePassword,
    [switch]$EnableBootstrap,
    [string]$BootstrapEmail,
    [Security.SecureString]$BootstrapPassword
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'local-security.ps1')
$localFile = Join-Path $PSScriptRoot '.env.local'
if (Test-Path -LiteralPath $localFile) {
    throw 'A configuração .env.local já existe. Edite esse arquivo localmente para alterar os dados.'
}
function Read-PrivateValue([string]$Prompt) {
    $secure = Read-Host $Prompt -AsSecureString
    return [System.Net.NetworkCredential]::new('', $secure).Password
}
function ConvertTo-Property([string]$Value) {
    return $Value.Replace('\', '\\').Replace("`r", '\r').Replace("`n", '\n').Replace("`t", '\t').Replace(' ', '\ ')
}
Write-Host 'Configuração local Dogmania. Senhas não serão exibidas nem enviadas ao GitHub.'
if (-not $DatabaseUrl) {
    $DatabaseUrl = Read-Host 'URL JDBC sem senha (jdbc:postgresql://HOST:5432/postgres?sslmode=verify-full)'
}
$databaseUrl = $DatabaseUrl.Trim()
if ($databaseUrl -notmatch '^jdbc:postgresql://[^/@\s]+/[^\s]+$' -or
        $databaseUrl -notmatch '[?&]sslmode=verify-full(?:&|$)' -or
        $databaseUrl -match '(?i)[?&](password|user)=') {
    throw 'Use a URL JDBC com sslmode=verify-full, sem usuário ou senha embutidos.'
}
if (-not $DatabaseUser) {
    $DatabaseUser = Read-Host 'Usuário JDBC de runtime (dogmania_api ou dogmania_api.PROJECT_REF no pooler)'
}
$databaseUser = $DatabaseUser.Trim()
if ($databaseUser -notmatch '^dogmania_api(?:\.[A-Za-z0-9_-]+)?$') {
    throw 'Use a role restrita dogmania_api, conforme supabase/README.md.'
}
$databasePassword = if ($RuntimePassword) {
    [System.Net.NetworkCredential]::new('', $RuntimePassword).Password
} else { Read-PrivateValue 'Senha da role dogmania_api' }
if ([string]::IsNullOrWhiteSpace($databasePassword)) { throw 'A senha do banco é obrigatória.' }
$bootstrap = $EnableBootstrap.IsPresent
if (-not $EnableBootstrap) {
    $bootstrap = (Read-Host 'Criar o primeiro administrador ao iniciar? (s/n)').Trim().ToLowerInvariant() -eq 's'
}
$adminEmail = ''
$adminPassword = ''
if ($bootstrap) {
    $adminEmail = if ($BootstrapEmail) { $BootstrapEmail.Trim() } else {
        (Read-Host 'E-mail do primeiro administrador').Trim()
    }
    if ($adminEmail -notmatch '^[^\s@]+@[^\s@]+\.[^\s@]+$') { throw 'E-mail inválido.' }
    $adminPassword = if ($BootstrapPassword) {
        [System.Net.NetworkCredential]::new('', $BootstrapPassword).Password
    } else { Read-PrivateValue 'Senha do administrador (mínimo 16 caracteres)' }
    if ($adminPassword.Length -lt 16 -or [Text.Encoding]::UTF8.GetByteCount($adminPassword) -gt 72) {
        throw 'A senha deve ter pelo menos 16 caracteres e no máximo 72 bytes UTF-8.'
    }
}
$randomBytes = New-Object byte[] 48
$random = [Security.Cryptography.RandomNumberGenerator]::Create()
try { $random.GetBytes($randomBytes) } finally { $random.Dispose() }
$jwtSecret = [Convert]::ToBase64String($randomBytes)
$values = [ordered]@{
    SUPABASE_DB_URL = $databaseUrl
    SUPABASE_DB_USER = $databaseUser
    SUPABASE_DB_PASSWORD = $databasePassword
    JWT_SECRET_KEY = $jwtSecret
    JWT_EXPIRATION_MS = '3600000'
    CORS_ORIGINS = 'http://127.0.0.1:8081,http://localhost:8081'
    SERVER_PORT = '8080'
    API_DOCS_ENABLED = 'false'
    STORAGE_ENABLED = 'false'
    DOGMANIA_BOOTSTRAP_ADMIN_ENABLED = $bootstrap.ToString().ToLowerInvariant()
    DOGMANIA_BOOTSTRAP_ADMIN_EMAIL = $adminEmail
    DOGMANIA_BOOTSTRAP_ADMIN_PASSWORD = $adminPassword
}
# Restrict permissions before writing secrets into the new file.
New-Item -ItemType File -Path $localFile -ErrorAction Stop | Out-Null
try {
    Protect-LocalSecretPath $localFile
    $lines = @('# Local only. Java properties format: KEY=value, without quotes.')
    foreach ($entry in $values.GetEnumerator()) {
        $lines += $entry.Key + '=' + (ConvertTo-Property ([string]$entry.Value))
    }
    [IO.File]::WriteAllLines($localFile, $lines, [Text.UTF8Encoding]::new($false))
} catch {
    # Only our newly created file, never an existing credential file.
    Remove-Item -LiteralPath $localFile -ErrorAction SilentlyContinue
    throw 'Não foi possível proteger/gravar a configuração local. Nenhum segredo foi exibido.'
} finally {
    $databasePassword = $null; $adminPassword = $null; $jwtSecret = $null
    $values.Clear()
}
Write-Host 'Configuração criada e protegida. Isso ainda não comprova conexão com o banco.'
if ($bootstrap) { Write-Host 'Depois do primeiro login, desative o bootstrap e remova sua senha do .env.local.' }
Write-Host 'Próximo comando: .\start-local.ps1'
