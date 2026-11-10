#Requires -Version 7.2

<#
.SYNOPSIS
    Faz o backup lógico dos dados Dogmania e ensaia a restauração local em PostgreSQL 17.
.DESCRIPTION
    Use uma conexão direta ou o pooler de sessão e forneça a credencial do dono
    por Get-Credential. O dump contém dados privados, inclusive hashes de senha.
    As migrations do checkout recriam o esquema, as roles e as permissões.
    O dump cobre products, admin_users e audit_logs. Arquivos do Storage,
    configurações externas e senhas de roles ficam fora desse backup.
.EXAMPLE
    $owner = Get-Credential
    .\scripts\backup-restauracao-dogmania.ps1 -PgBin C:\PostgreSQL\bin `
        -SourceHost db.projeto.supabase.co -SourceCredential $owner -RootCertificate C:\certs\supabase.crt
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string]$PgBin,
    [Parameter(Mandatory)]
    [ValidatePattern('^[A-Za-z0-9][A-Za-z0-9.-]*$')]
    [string]$SourceHost,
    [ValidateRange(1, 65535)]
    [int]$SourcePort = 5432,
    [ValidatePattern('^[A-Za-z0-9_][A-Za-z0-9_-]*$')]
    [string]$SourceDatabase = 'postgres',
    [Parameter(Mandatory)]
    [PSCredential]$SourceCredential,
    [string]$RootCertificate,
    [switch]$AllowLocalSource
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

if (-not $IsWindows) { throw 'Este script usa os binários e as ACLs do Windows.' }
if ($SourceCredential.UserName -notmatch '^[A-Za-z0-9_][A-Za-z0-9_.-]*$' -or
    $SourceCredential.Password.Length -eq 0) {
    throw 'Informe uma credencial PostgreSQL válida.'
}
if ($AllowLocalSource -and $SourceHost -ne '127.0.0.1') {
    throw '-AllowLocalSource destina-se a ensaios em 127.0.0.1.'
}
if (-not $AllowLocalSource -and -not $RootCertificate) {
    throw 'Informe o arquivo da CA da origem em -RootCertificate.'
}

$repo = Split-Path -Parent $PSScriptRoot
$migrations = @(Get-ChildItem -LiteralPath (Join-Path $repo 'supabase/migrations') -File -Filter '*.sql' |
    Sort-Object Name)
$accessContract = Join-Path $repo 'supabase/tests/access_contract.sql'
if ($migrations.Count -eq 0 -or -not (Test-Path -LiteralPath $accessContract -PathType Leaf)) {
    throw 'As migrations e o contrato de acesso devem estar no checkout.'
}
$bin = (Resolve-Path -LiteralPath $PgBin).ProviderPath
foreach ($tool in @('psql', 'pg_dump', 'pg_restore', 'pg_ctl', 'initdb')) {
    if (-not (Test-Path -LiteralPath (Join-Path $bin "$tool.exe") -PathType Leaf)) {
        throw "Binário PostgreSQL ausente: $tool."
    }
}

function Start-PgTool {
    param([string]$Name, [string[]]$Arguments, [hashtable]$Settings = @{})

    $process = [Diagnostics.Process]::new()
    $process.StartInfo.FileName = Join-Path $bin "$Name.exe"
    $process.StartInfo.UseShellExecute = $false
    $process.StartInfo.CreateNoWindow = $true
    $process.StartInfo.RedirectStandardInput = $true
    $process.StartInfo.RedirectStandardOutput = $true
    $process.StartInfo.RedirectStandardError = $true
    $process.StartInfo.StandardInputEncoding = [Text.UTF8Encoding]::new($false)
    $process.StartInfo.StandardOutputEncoding = [Text.Encoding]::UTF8
    foreach ($argument in $Arguments) { $process.StartInfo.ArgumentList.Add($argument) }
    foreach ($key in @($process.StartInfo.Environment.Keys)) {
        if ($key.StartsWith('PG', [StringComparison]::OrdinalIgnoreCase)) {
            $null = $process.StartInfo.Environment.Remove($key)
        }
    }
    foreach ($key in $Settings.Keys) { $process.StartInfo.Environment[$key] = $Settings[$key] }
    try {
        $null = $process.Start()
        return $process
    }
    catch {
        $process.Dispose()
        throw "Não foi possível iniciar $Name."
    }
}

function Close-PgTool([Diagnostics.Process]$Process) {
    try {
        if (-not $Process.HasExited) {
            try { $Process.Kill($true) }
            catch { if (-not $Process.HasExited) { throw } }
            $null = $Process.WaitForExit(10000)
        }
    }
    finally {
        $Process.Dispose()
    }
}

function Invoke-PgTool {
    param(
        [string]$Name,
        [string[]]$Arguments,
        [hashtable]$Settings = @{},
        [string]$Sql = '',
        [Parameter(Mandatory)]
        [string]$Phase
    )

    $process = Start-PgTool -Name $Name -Arguments $Arguments -Settings $Settings
    try {
        $stdout = $process.StandardOutput.ReadToEndAsync()
        $null = $process.StandardError.ReadToEndAsync()
        if ($Sql) { $process.StandardInput.WriteLine($Sql) }
        $process.StandardInput.Close()
        if (-not $process.WaitForExit(600000)) { throw "$Phase excedeu dez minutos." }
        if ($process.ExitCode -ne 0) { throw "$Phase falhou (código $($process.ExitCode))." }
        # On Windows the detached server can inherit pg_ctl's pipe. Its exit code
        # is enough here because the start and stop commands already use -w.
        if ($Name -ne 'pg_ctl') { return $stdout.GetAwaiter().GetResult().Trim() }
    }
    finally {
        Close-PgTool $process
    }
}

function New-PrivateRunDirectory {
    $privateRoot = Join-Path $repo '.private'
    $privateDirectory = [IO.Directory]::CreateDirectory($privateRoot)
    if ($privateDirectory.Attributes.HasFlag([IO.FileAttributes]::ReparsePoint)) {
        throw 'A pasta .private não pode ser um ponto de nova análise.'
    }
    $path = Join-Path $privateRoot ("backup-dogmania-{0}-{1}" -f [DateTime]::UtcNow.ToString('yyyyMMdd-HHmmss'), [Guid]::NewGuid().ToString('N'))
    $sid = [Security.Principal.WindowsIdentity]::GetCurrent().User
    $acl = [Security.AccessControl.DirectorySecurity]::new()
    $acl.SetOwner($sid)
    $acl.SetAccessRuleProtection($true, $false)
    $rule = [Security.AccessControl.FileSystemAccessRule]::new(
        $sid, 'FullControl', 'ContainerInherit, ObjectInherit', 'None', 'Allow'
    )
    $acl.AddAccessRule($rule)
    [IO.FileSystemAclExtensions]::Create([IO.DirectoryInfo]::new($path), $acl)
    return $path
}

$sourceSettings = @{
    PGHOST = $SourceHost
    PGPORT = [string]$SourcePort
    PGDATABASE = $SourceDatabase
    PGUSER = $SourceCredential.UserName
    PGPASSWORD = $SourceCredential.GetNetworkCredential().Password
    PGCONNECT_TIMEOUT = '15'
    PGCLIENTENCODING = 'UTF8'
    PGSSLMODE = 'verify-full'
}
if ($AllowLocalSource) { $sourceSettings.PGSSLMODE = 'disable' }
else { $sourceSettings.PGSSLROOTCERT = (Resolve-Path -LiteralPath $RootCertificate).ProviderPath }

$psqlOptions = @('-X', '-w', '-A', '-t', '-q', '-v', 'ON_ERROR_STOP=1')
$tables = @('products', 'admin_users', 'audit_logs')
$tableQueries = foreach ($table in $tables) {
    @"
SELECT '$table' AS table_name, count(*) AS row_count,
    encode(sha256(convert_to(coalesce(string_agg(
        encode(sha256(convert_to(to_jsonb(t)::text, 'UTF8')), 'hex'), '' ORDER BY t.id
    ), ''), 'UTF8')), 'hex') AS fingerprint
FROM public.$table AS t
"@
}
$fingerprintQuery = @"
SELECT json_object_agg(table_name, json_build_object('count', row_count, 'sha256', fingerprint)
    ORDER BY table_name)::text
FROM (
$($tableQueries -join "`nUNION ALL`n")
) AS fingerprints;
"@
$beginSnapshot = @'
BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL TIME ZONE 'UTC';
SET LOCAL DateStyle TO 'ISO, YMD';
SET LOCAL idle_in_transaction_session_timeout = 0;
SET LOCAL statement_timeout = '120s';
'@
$legacyAuth = @'
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN;
CREATE SCHEMA auth;
CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql AS 'SELECT NULL::jsonb';
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS 'SELECT NULL::uuid';
'@

$serverVersion = Invoke-PgTool -Name 'initdb' -Arguments @('--version') -Phase 'Verificação do PostgreSQL local'
if ($serverVersion -notmatch '\b17\.\d+\b') { throw 'Use binários PostgreSQL 17.' }

$runDirectory = New-PrivateRunDirectory
$scratch = Join-Path $runDirectory 'ensaio'
$cluster = Join-Path $scratch 'pgdata'
$temporaryPasswordFile = Join-Path $scratch 'senha-local.tmp'
$pendingDump = Join-Path $runDirectory 'dogmania.pending'
$verifiedDump = Join-Path $runDirectory 'dogmania.dump'
$snapshotProcess = $null
$clusterMayBeRunning = $false
$verified = $false
$stopwatch = [Diagnostics.Stopwatch]::StartNew()
try {
    $null = [IO.Directory]::CreateDirectory($scratch)
    $snapshotProcess = Start-PgTool -Name 'psql' -Arguments $psqlOptions -Settings $sourceSettings
    $null = $snapshotProcess.StandardError.ReadToEndAsync()
    try {
        $snapshotProcess.StandardInput.WriteLine($beginSnapshot)
        $snapshotProcess.StandardInput.WriteLine('SELECT pg_export_snapshot();')
        $snapshotProcess.StandardInput.WriteLine($fingerprintQuery)
        $snapshotProcess.StandardInput.Flush()
        $snapshot = $snapshotProcess.StandardOutput.ReadLineAsync().WaitAsync([TimeSpan]::FromSeconds(150)).GetAwaiter().GetResult()
        $sourceFingerprint = $snapshotProcess.StandardOutput.ReadLineAsync().WaitAsync([TimeSpan]::FromSeconds(150)).GetAwaiter().GetResult()
        if ($snapshot -notmatch '^[0-9A-Fa-f]+-[0-9A-Fa-f]+-[0-9]+$' -or $sourceFingerprint -notmatch '^\{') {
            throw 'Resposta inesperada da sessão PostgreSQL.'
        }
    }
    catch { throw 'Não foi possível abrir o snapshot de leitura na origem. Verifique TLS, credencial, tabelas e modo de sessão.' }

    $dumpOptions = @('-w', '--format=custom', '--data-only', '--no-owner', '--no-privileges', '--strict-names',
        '--snapshot', $snapshot, '--file', $pendingDump)
    foreach ($table in $tables) { $dumpOptions += "--table=public.$table" }
    $null = Invoke-PgTool -Name 'pg_dump' -Arguments $dumpOptions -Settings $sourceSettings -Phase 'Backup do snapshot'
    Close-PgTool $snapshotProcess
    $snapshotProcess = $null
    $sourceSettings.Remove('PGPASSWORD')

    $portProbe = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, 0)
    $portProbe.Start()
    try { $port = $portProbe.LocalEndpoint.Port }
    finally { $portProbe.Stop() }

    $localPassword = [Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
    [IO.File]::WriteAllText($temporaryPasswordFile, "$localPassword`n", [Text.UTF8Encoding]::new($false))
    try {
        $null = Invoke-PgTool -Name 'initdb' -Arguments @('-D', $cluster, '-U', 'postgres', '--auth=scram-sha-256',
            '--no-locale', '--encoding=UTF8', '--pwfile', $temporaryPasswordFile) -Phase 'Inicialização local'
    }
    finally {
        Remove-Item -LiteralPath $temporaryPasswordFile
    }
    $localSettings = @{
        PGHOST = '127.0.0.1'
        PGPORT = [string]$port
        PGDATABASE = 'postgres'
        PGUSER = 'postgres'
        PGPASSWORD = $localPassword
        PGCONNECT_TIMEOUT = '10'
        PGCLIENTENCODING = 'UTF8'
        PGSSLMODE = 'disable'
    }
    $clusterMayBeRunning = $true
    $null = Invoke-PgTool -Name 'pg_ctl' -Arguments @('-D', $cluster, '-l', (Join-Path $scratch 'postgres.log'),
        '-o', "-h 127.0.0.1 -p $port", '-w', '-t', '60', 'start') -Phase 'Subida do PostgreSQL descartável'
    $null = Invoke-PgTool -Name 'psql' -Arguments $psqlOptions -Settings $localSettings -Sql $legacyAuth -Phase 'Criação das roles locais'
    foreach ($migration in $migrations) {
        $null = Invoke-PgTool -Name 'psql' -Arguments ($psqlOptions + @('-f', $migration.FullName)) `
            -Settings $localSettings -Phase "Migration $($migration.Name)"
    }
    $null = Invoke-PgTool -Name 'pg_restore' -Arguments @('-w', '-d', 'postgres', '--exit-on-error', '--single-transaction',
        '--data-only', '--disable-triggers', '--no-owner', '--no-privileges', $pendingDump) -Settings $localSettings -Phase 'Restauração do dump'

    $restoredFingerprint = Invoke-PgTool -Name 'psql' -Arguments $psqlOptions -Settings $localSettings `
        -Sql "$beginSnapshot`n$fingerprintQuery`nROLLBACK;" -Phase 'Conferência dos dados restaurados'
    if ($sourceFingerprint -cne $restoredFingerprint) { throw 'Os dados restaurados divergem do snapshot de origem.' }
    $null = Invoke-PgTool -Name 'psql' -Arguments ($psqlOptions + @('-f', $accessContract)) `
        -Settings $localSettings -Phase 'Validação de RLS, privilégios e auditoria'
    Move-Item -LiteralPath $pendingDump -Destination $verifiedDump
    $verified = $true
    $counts = $restoredFingerprint | ConvertFrom-Json
}
finally {
    $sourceSettings.Remove('PGPASSWORD')
    if ($null -ne $snapshotProcess) { Close-PgTool $snapshotProcess }
    if ($clusterMayBeRunning -and (Test-Path -LiteralPath (Join-Path $cluster 'postmaster.pid'))) {
        try {
            $null = Invoke-PgTool -Name 'pg_ctl' -Arguments @('-D', $cluster, '-m', 'fast', '-w', '-t', '30', 'stop') -Phase 'Parada do PostgreSQL descartável'
        }
        catch {
            $null = Invoke-PgTool -Name 'pg_ctl' -Arguments @('-D', $cluster, '-m', 'immediate', '-w', '-t', '30', 'stop') -Phase 'Parada de emergência do PostgreSQL descartável'
        }
    }
    if (Test-Path -LiteralPath $scratch) {
        $resolvedScratch = (Resolve-Path -LiteralPath $scratch).ProviderPath
        if ($resolvedScratch -ne [IO.Path]::GetFullPath((Join-Path $runDirectory 'ensaio')) -or
            (Get-Item -LiteralPath $resolvedScratch -Force).Attributes.HasFlag([IO.FileAttributes]::ReparsePoint)) {
            throw 'O caminho descartável mudou. Revise a pasta protegida antes de limpar.'
        }
        Remove-Item -LiteralPath $resolvedScratch -Recurse -Force
    }
    if (-not $verified) {
        if (Test-Path -LiteralPath $pendingDump) { Remove-Item -LiteralPath $pendingDump -Force }
        Remove-Item -LiteralPath $runDirectory
    }
}

[pscustomobject]@{
    Dump = $verifiedDump
    Sha256 = (Get-FileHash -LiteralPath $verifiedDump -Algorithm SHA256).Hash
    Produtos = $counts.products.count
    Administradores = $counts.admin_users.count
    Auditoria = $counts.audit_logs.count
    TempoSegundos = [Math]::Round($stopwatch.Elapsed.TotalSeconds, 2)
}
