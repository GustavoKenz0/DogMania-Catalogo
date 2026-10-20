[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^aws-[0-9]+-[a-z0-9-]+\.pooler\.supabase\.com$')]
    [string]$PoolerHost,
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[a-z0-9]{20}$')]
    [string]$ProjectRef
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'local-security.ps1')
if (Test-Path -LiteralPath (Join-Path $PSScriptRoot '.env.local')) {
    throw 'O arquivo .env.local já existe. Não será sobrescrito nem será trocada a senha da role.'
}
$java = Get-Command java -ErrorAction SilentlyContinue
if (-not $java) { throw 'Instale um JDK 21 ou superior e disponibilize java no PATH.' }
# Use the version managed by this backend's Spring Boot parent, already in Maven's cache.
$pomFile = Join-Path $PSScriptRoot 'pom.xml'
[xml]$pom = [IO.File]::ReadAllText($pomFile)
$springVersion = [string]$pom.project.parent.version
$mavenRepo = Join-Path $env:USERPROFILE '.m2/repository'
$springPom = Join-Path $mavenRepo "org/springframework/boot/spring-boot-dependencies/$springVersion/spring-boot-dependencies-$springVersion.pom"
if (-not (Test-Path -LiteralPath $springPom)) {
    throw 'Dependências Maven ausentes. Prepare o backend com mvn -DskipTests compile antes de executar este assistente.'
}
[xml]$dependencies = [IO.File]::ReadAllText($springPom)
$driverVersion = [string]$dependencies.project.properties.'postgresql.version'
if ($driverVersion -notmatch '^[0-9]+(\.[0-9]+){2}$') { throw 'Versão do driver PostgreSQL não encontrada no BOM do backend.' }
$driver = Join-Path $mavenRepo "org/postgresql/postgresql/$driverVersion/postgresql-$driverVersion.jar"
if (-not (Test-Path -LiteralPath $driver)) { throw 'Driver JDBC ausente. Prepare as dependências Maven do backend.' }
$source = Join-Path $PSScriptRoot 'tools/ProvisionDatabase.java'
$caCertificate = Get-LocalSupabaseCaCertificate (Split-Path $PSScriptRoot -Parent)

Write-Host 'Etapa 1: habilitar somente o login da role restrita criada pelas migrations.'
Write-Host 'A primeira senha solicitada é a do banco PostgreSQL, escolhida na criação do projeto Supabase.'
Write-Host 'Escolha e guarde outra senha para dogmania_api; ela será solicitada novamente na etapa 2.'
& $java.Source '-Xmx128m' "-Ddogmania.setup.caCertificate=$caCertificate" '--class-path' $driver $source $PoolerHost $ProjectRef
if ($LASTEXITCODE -ne 0) {
    throw 'Provisionamento interrompido. Leia a mensagem acima. Nenhuma configuração local foi gravada.'
}

$databaseUrl = Get-LocalSupabaseJdbcUrl $PoolerHost $caCertificate
Write-Host 'Etapa 2: salvar a senha exclusiva da role e configurar o administrador do site.'
Write-Host 'Use a senha dogmania_api definida na etapa 1, não a senha postgres do projeto.'
& (Join-Path $PSScriptRoot 'configure-local.ps1') -DatabaseUrl $databaseUrl -DatabaseUser "dogmania_api.$ProjectRef"
Write-Host 'Para iniciar o backend: .\start-local.ps1'
