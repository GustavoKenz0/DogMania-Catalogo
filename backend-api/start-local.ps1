[CmdletBinding()]
param([switch]$Check, [switch]$Test)

$ErrorActionPreference = 'Stop'
if (-not $Test) {
    $localFile = Join-Path $PSScriptRoot '.env.local'
    if (-not (Test-Path -LiteralPath $localFile)) {
        throw 'Execute .\configure-local.ps1 primeiro. As credenciais ficam somente no seu computador.'
    }
    $config = @{}
    foreach ($line in [IO.File]::ReadAllLines($localFile)) {
        if ($line -match '^\s*([A-Z][A-Z0-9_]*)=(.*)$') { $config[$Matches[1]] = $Matches[2] }
    }
    foreach ($key in @('SUPABASE_DB_URL', 'SUPABASE_DB_USER', 'SUPABASE_DB_PASSWORD', 'JWT_SECRET_KEY')) {
        if ([string]::IsNullOrWhiteSpace($config[$key]) -or $config[$key] -match 'YOUR_|<[^>]+>') {
            throw "Configure $key em backend-api/.env.local. O valor não será exibido."
        }
    }
    if ($config['SUPABASE_DB_URL'] -notmatch '[?&]sslmode=verify-full(?:&|$)') {
        throw 'Configure TLS com sslmode=verify-full; não desative a verificação do certificado.'
    }
    $config.Clear()
}
$java = Get-Command java -ErrorAction SilentlyContinue
if (-not $java) { throw 'Instale um JDK 21 ou superior e disponibilize java no PATH.' }
$maven = Get-Command mvn.cmd -ErrorAction SilentlyContinue
if ($maven) {
    $mavenHome = Split-Path (Split-Path $maven.Source -Parent) -Parent
} else {
    $cache = Join-Path $env:USERPROFILE '.m2/wrapper/dists'
    $cachedMaven = Get-ChildItem -LiteralPath $cache -Filter mvn.cmd -Recurse -ErrorAction SilentlyContinue |
        Sort-Object FullName -Descending | Select-Object -First 1
    if (-not $cachedMaven) { throw 'Instale Maven 3.9 ou use uma distribuição Maven Wrapper já baixada.' }
    $mavenHome = Split-Path (Split-Path $cachedMaven.FullName -Parent) -Parent
}
$bootJar = Get-ChildItem -LiteralPath (Join-Path $mavenHome 'boot') -Filter 'plexus-classworlds-*.jar' |
    Select-Object -First 1 -ExpandProperty FullName
if (-not $bootJar) { throw 'Instalação Maven incompleta.' }
if ($Check) {
    Write-Host 'Arquivo local e ferramentas encontrados. A conexão JDBC ainda não foi testada.'
    return
}
$goal = if ($Test) { 'test' } else { 'spring-boot:run' }
$runtimeArguments = @()
if (-not $Test) {
    # Windows AF_UNIX sockets have a short path limit. The inherited sandbox TEMP
    # can exceed it on recent JDKs, preventing Tomcat's NIO selector from starting.
    $runtimeTemp = Join-Path (Split-Path $PSScriptRoot -Parent) '.tools/jtmp'
    New-Item -ItemType Directory -Path $runtimeTemp -Force | Out-Null
    # Java's argument file preserves spaces in Windows paths through PowerShell/Maven.
    $runtimeOptionsFile = Join-Path (Split-Path $PSScriptRoot -Parent) '.tools/backend-jvm.args'
    $runtimeOption = '"-Djdk.net.unixdomain.tmpdir=' + $runtimeTemp.Replace('\', '/') + '"'
    [IO.File]::WriteAllText($runtimeOptionsFile, $runtimeOption, [Text.UTF8Encoding]::new($false))
    $runtimeArguments = @('-Dspring-boot.run.jvmArguments=@../.tools/backend-jvm.args')
}
Push-Location $PSScriptRoot
try {
    & $java.Source '-Xmx256m' "-Dmaven.home=$mavenHome" `
        "-Dclassworlds.conf=$mavenHome/bin/m2.conf" `
        "-Dmaven.multiModuleProjectDirectory=$PSScriptRoot" `
        '-DargLine=-Xmx192m' '-classpath' $bootJar `
        'org.codehaus.plexus.classworlds.launcher.Launcher' '-B' '-ntp' @runtimeArguments '-f' (Join-Path $PSScriptRoot 'pom.xml') $goal
    if ($LASTEXITCODE -ne 0) { throw 'O Maven encerrou com erro. Confira a mensagem sem publicar credenciais.' }
} finally { Pop-Location }
