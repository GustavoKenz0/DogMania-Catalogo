[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^aws-[0-9]+-[a-z0-9-]+\.pooler\.supabase\.com$')]
    [string]$PoolerHost,
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[a-z0-9]{20}$')]
    [string]$ProjectRef,
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[^\s@]+@[^\s@]+\.[^\s@]+$')]
    [string]$AdminEmail
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'local-security.ps1')
$projectRoot = Split-Path $PSScriptRoot -Parent
$privateDir = Join-Path $projectRoot '.private'
$reportFile = Join-Path $privateDir 'ACESSOS_DO_SISTEMA.local.txt'
$statusFile = Join-Path $privateDir 'setup-status.local.json'
$localFile = Join-Path $PSScriptRoot '.env.local'
$requestFile = $null
$ownerPassword = $null
$runtimePassword = $null
$adminPassword = $null
$document = $null
$exitCode = 1
$attemptStarted = $false

function Protect-PrivatePath([string]$Path) {
    Protect-LocalSecretPath $Path
}
function New-PrivateFile([string]$Path) {
    $handle = [IO.File]::Open($Path, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write, [IO.FileShare]::None)
    $handle.Dispose()
    Protect-PrivatePath $Path
}
function Write-Status([string]$Stage) {
    [IO.File]::WriteAllText($statusFile, (@{ stage = $Stage; updatedAt = [DateTimeOffset]::UtcNow.ToString('o') } |
        ConvertTo-Json -Compress), [Text.UTF8Encoding]::new($false))
}
function New-RandomPassword([int]$Bytes = 32) {
    $bytesBuffer = New-Object byte[] $Bytes
    $generator = [Security.Cryptography.RandomNumberGenerator]::Create()
    try { $generator.GetBytes($bytesBuffer) } finally { $generator.Dispose() }
    return [Convert]::ToBase64String($bytesBuffer).TrimEnd('=').Replace('+', '-').Replace('/', '_')
}

try {
    if (Test-Path -LiteralPath $localFile) { throw 'Ja existe .env.local. Nenhuma senha sera alterada.' }
    if ((Test-Path -LiteralPath $reportFile) -or (Test-Path -LiteralPath $statusFile)) {
        throw 'Ja existe uma tentativa de configuracao. Preserve o documento e confira o estado antes de repetir.'
    }
    $attemptStarted = $true
    $java = Get-Command java -ErrorAction Stop
    [xml]$pom = [IO.File]::ReadAllText((Join-Path $PSScriptRoot 'pom.xml'))
    $springVersion = [string]$pom.project.parent.version
    $repo = Join-Path $env:USERPROFILE '.m2/repository'
    [xml]$bom = [IO.File]::ReadAllText((Join-Path $repo "org/springframework/boot/spring-boot-dependencies/$springVersion/spring-boot-dependencies-$springVersion.pom"))
    $driverVersion = [string]$bom.project.properties.'postgresql.version'
    if ($driverVersion -notmatch '^[0-9]+(\.[0-9]+){2}$') { throw 'Driver JDBC nao localizado no BOM.' }
    $driver = Join-Path $repo "org/postgresql/postgresql/$driverVersion/postgresql-$driverVersion.jar"
    if (-not (Test-Path -LiteralPath $driver)) { throw 'Dependencias Maven indisponiveis.' }
    if (-not (Test-Path -LiteralPath $privateDir)) { New-Item -ItemType Directory -Path $privateDir | Out-Null }
    $directory = Get-Item -LiteralPath $privateDir
    if (-not $directory.PSIsContainer -or ($directory.Attributes -band [IO.FileAttributes]::ReparsePoint)) {
        throw 'A pasta privada precisa ser um diretorio local regular.'
    }
    Protect-PrivatePath $privateDir
    $caCertificate = Get-LocalSupabaseCaCertificate $projectRoot
    New-PrivateFile $statusFile
    Write-Status 'awaiting_database_password'
    Write-Host ''
    Write-Host 'DOGMANIA - configuracao local'
    Write-Host 'Digite a senha PostgreSQL escolhida ao criar o projeto Supabase.'
    Write-Host 'A senha fica oculta. As novas senhas serao geradas e guardadas no documento privado.'
    $ownerSecure = Read-Host 'Senha atual do banco postgres' -AsSecureString
    $ownerPassword = [System.Net.NetworkCredential]::new('', $ownerSecure).Password
    if ([string]::IsNullOrWhiteSpace($ownerPassword)) { throw 'Senha do banco obrigatoria.' }
    $runtimePassword = New-RandomPassword
    $adminPassword = New-RandomPassword 24
    $databaseUrl = Get-LocalSupabaseJdbcUrl $PoolerHost $caCertificate
    $document = @"
DOGMANIA - ACESSOS PRIVADOS

Este arquivo contem senhas legiveis. Guarde-o apenas em local privado.
Ele e ignorado pelo Git e protegido por permissoes do Windows (usuario atual e SYSTEM).

STATUS: PREPARACAO - credenciais novas ainda nao confirmadas.

PROJETO SUPABASE
URL: https://$ProjectRef.supabase.co
Painel: https://supabase.com/dashboard/project/$ProjectRef
Host PostgreSQL: $PoolerHost
Porta: 5432
Banco: postgres
Modo: Session pooler, JDBC com TLS verify-full

OPERADOR POSTGRESQL (administracao do banco, nao usar na aplicacao)
Login via pooler: postgres.$ProjectRef
Senha atual informada pelo responsavel: $ownerPassword

BACKEND JAVA (acesso restrito ao banco)
Role PostgreSQL: dogmania_api
Login via pooler: dogmania_api.$ProjectRef
Senha gerada: $runtimePassword

PAINEL ADMINISTRATIVO DO SITE
Endereco: http://127.0.0.1:8081/admin
Login: $AdminEmail
Senha gerada: $adminPassword
Conta criada apenas depois da primeira inicializacao bem-sucedida da API.

ARQUIVOS E SERVICOS
Configuracao do backend: backend-api/.env.local
API: http://127.0.0.1:8080/api/v1
Site: http://127.0.0.1:8081
O segredo JWT fica somente no arquivo local do backend.
Este documento nao contem a senha da conta pessoal de acesso ao painel Supabase.
Storage/upload ainda depende de configuracao separada; imagens por URL HTTPS continuam disponiveis.
"@
    New-PrivateFile $reportFile
    [IO.File]::WriteAllText($reportFile, $document, [Text.UTF8Encoding]::new($false))
    $requestFile = Join-Path $privateDir ('setup-request-' + [Guid]::NewGuid().ToString('N') + '.local.properties')
    New-PrivateFile $requestFile
    $requestLines = @(
        'ownerPasswordB64=' + [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($ownerPassword))
        'runtimePasswordB64=' + [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($runtimePassword))
    )
    [IO.File]::WriteAllLines($requestFile, $requestLines, [Text.UTF8Encoding]::new($false))
    Write-Status 'provisioning_database_role'
    & $java.Source '-Xmx128m' "-Ddogmania.setup.caCertificate=$caCertificate" '--class-path' $driver (Join-Path $PSScriptRoot 'tools/ProvisionDatabase.java') $PoolerHost $ProjectRef $requestFile
    if ($LASTEXITCODE -ne 0) { throw 'Provisionamento nao confirmado. Preserve o documento para conferir as credenciais e o estado da role.' }
    Write-Status 'writing_backend_configuration'
    $runtimeSecure = ConvertTo-SecureString $runtimePassword -AsPlainText -Force
    $adminSecure = ConvertTo-SecureString $adminPassword -AsPlainText -Force
    & (Join-Path $PSScriptRoot 'configure-local.ps1') -DatabaseUrl $databaseUrl -DatabaseUser "dogmania_api.$ProjectRef" -RuntimePassword $runtimeSecure -EnableBootstrap -BootstrapEmail $AdminEmail -BootstrapPassword $adminSecure
    $document = $document.Replace('STATUS: PREPARACAO - credenciais novas ainda nao confirmadas.',
        'STATUS: JDBC da role confirmado; configuracao local gravada. Falta iniciar API e confirmar o administrador.')
    [IO.File]::WriteAllText($reportFile, $document, [Text.UTF8Encoding]::new($false))
    Write-Status 'configured'
    Write-Host ''
    Write-Host 'Conexao restrita confirmada e configuracao gravada.'
    Write-Host 'Documento privado: .private/ACESSOS_DO_SISTEMA.local.txt'
    Write-Host 'Volte ao chat para continuar a inicializacao do site.'
    $exitCode = 0
} catch {
    # Never print the caught exception, invocation or input values.
    $failureType = $_.Exception.GetType().Name
    $failureLine = $_.InvocationInfo.ScriptLineNumber
    if ($attemptStarted -and (Test-Path -LiteralPath $privateDir)) {
        if (-not (Test-Path -LiteralPath $statusFile)) { New-PrivateFile $statusFile }
        [IO.File]::WriteAllText($statusFile, (@{
            stage = 'needs_attention'; failureType = $failureType; failureLine = $failureLine
        } | ConvertTo-Json -Compress), [Text.UTF8Encoding]::new($false))
    }
    Write-Host 'A configuracao foi interrompida. Nao repita para evitar trocar uma senha ja aplicada.'
    Write-Host 'Volte ao chat; o documento privado, quando criado, preserva as credenciais planejadas.'
} finally {
    if ($requestFile -and (Test-Path -LiteralPath $requestFile)) {
        $requestAbsolute = [IO.Path]::GetFullPath($requestFile)
        $privateAbsolute = [IO.Path]::GetFullPath($privateDir).TrimEnd('\') + '\'
        if ($requestAbsolute.StartsWith($privateAbsolute, [StringComparison]::OrdinalIgnoreCase)) {
            Remove-Item -LiteralPath $requestAbsolute
        }
    }
    $ownerPassword = $null; $runtimePassword = $null; $adminPassword = $null
    $document = $null; $requestLines = $null; $ownerSecure = $null
    $runtimeSecure = $null; $adminSecure = $null
}
exit $exitCode
