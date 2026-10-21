[CmdletBinding()]
param([switch]$UseLocalCredentials, [string]$AdminEmail, [Security.SecureString]$AdminPassword)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$baseUrl = 'http://127.0.0.1:8080/api/v1'
$checks = 0
$token = $null
$tempId = $null
$client = $null
$handler = $null
$manifest = $null
function Check([bool]$Passed, [string]$Label) {
    if (-not $Passed) { Write-Host ('FAIL API: ' + $Label); throw 'Verificação não aprovada.' }
    $script:checks++
    Write-Host ('PASS API: ' + $Label)
}
function Send-Api([string]$Method, [string]$Path, $Body = $null, [bool]$Authenticated = $true) {
    $request = New-Object Net.Http.HttpRequestMessage([Net.Http.HttpMethod]::new($Method), ($baseUrl + $Path))
    try {
        if ($Authenticated -and $token) { $request.Headers.Authorization = [Net.Http.Headers.AuthenticationHeaderValue]::new('Bearer', $token) }
        if ($null -ne $Body) { $request.Content = [Net.Http.StringContent]::new(($Body | ConvertTo-Json -Depth 8 -Compress), [Text.Encoding]::UTF8, 'application/json') }
        $response = $client.SendAsync($request).GetAwaiter().GetResult()
        try {
            $text = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
            $data = if ([string]::IsNullOrWhiteSpace($text)) { $null } else { $text | ConvertFrom-Json }
            return [PSCustomObject]@{ Status = [int]$response.StatusCode; Data = $data }
        } finally { $response.Dispose() }
    } finally { $request.Dispose() }
}
function Get-AdminProducts {
    $items = @()
    for ($page = 0; $page -lt 1000; $page++) {
        $response = Send-Api 'GET' ('/admin/products?size=100&page=' + $page)
        if ($response.Status -ne 200) { throw 'Listagem administrativa indisponível.' }
        $items += @($response.Data.content)
        if ($response.Data.last) { return $items }
    }
    throw 'Limite de paginação da ferramenta excedido.'
}
function Copy-Product($Product) { return ($Product | ConvertTo-Json -Depth 8 | ConvertFrom-Json) }
function Escape-Property([string]$Value) { return $Value.Replace('\','\\').Replace("`r",'\r').Replace("`n",'\n').Replace("`t",'\t') }
try {
    Add-Type -AssemblyName System.Net.Http
    $handler = New-Object Net.Http.HttpClientHandler
    $handler.AllowAutoRedirect = $false
    $handler.UseProxy = $false
    $client = New-Object Net.Http.HttpClient($handler)
    $client.Timeout = [TimeSpan]::FromSeconds(20)
    $fixtures = @(Get-Content -LiteralPath (Join-Path $PSScriptRoot 'produtos-exemplo.json') -Raw -Encoding UTF8 | ConvertFrom-Json)
    if ($fixtures.Count -ne 6) { throw 'Esperados seis exemplos.' }
    # Verificar os pré-requisitos JDBC antes de alterar dados pela API.
    [xml]$pom = [IO.File]::ReadAllText((Join-Path $root 'backend-api/pom.xml'))
    $boot = [string]$pom.project.parent.version
    $repo = Join-Path $env:USERPROFILE '.m2/repository'
    [xml]$bom = [IO.File]::ReadAllText((Join-Path $repo "org/springframework/boot/spring-boot-dependencies/$boot/spring-boot-dependencies-$boot.pom"))
    $version = [string]$bom.project.properties.'postgresql.version'
    $driver = Join-Path $repo "org/postgresql/postgresql/$version/postgresql-$version.jar"
    $java = (Get-Command java.exe -ErrorAction Stop).Source
    if (-not (Test-Path -LiteralPath $driver)) { throw 'Driver JDBC não encontrado; resolva as dependências Maven.' }
    if (-not (Test-Path -LiteralPath (Join-Path $root 'backend-api/.env.local'))) { throw 'Configuração JDBC local ausente.' }
    if ($UseLocalCredentials) {
        # Uso local explícito; nunca imprimir o documento ou transportar senhas em argumentos.
        $document = [IO.File]::ReadAllText((Join-Path $root '.private/ACESSOS_DO_SISTEMA.local.txt'))
        $section = [regex]::Match($document, '(?ms)^PAINEL ADMINISTRATIVO DO SITE\r?\n(.*?)(?:\r?\nARQUIVOS E SERVICOS|\z)').Groups[1].Value
        $AdminEmail = [regex]::Match($section, '(?m)^Login:\s*([^\r\n]+)').Groups[1].Value.Trim()
        $password = [regex]::Match($section, '(?m)^Senha gerada:\s*([^\r\n]+)').Groups[1].Value.Trim()
        $document = $null; $section = $null
    } else {
        if (-not $AdminEmail) { $AdminEmail = Read-Host 'E-mail do administrador' }
        if (-not $AdminPassword) { $AdminPassword = Read-Host 'Senha do administrador' -AsSecureString }
        $password = [Net.NetworkCredential]::new('', $AdminPassword).Password
    }
    if (-not $AdminEmail -or -not $password) { throw 'Acesso administrativo não localizado.' }
    $login = Send-Api 'POST' '/auth/login' @{ email = $AdminEmail; password = $password } $false
    $password = $null; $AdminPassword = $null
    Check ($login.Status -eq 200 -and $login.Data.role -in @('ADMIN','SUPER_ADMIN')) 'login de administrador'
    $token = $login.Data.token; $login = $null
    $initial = @(Get-AdminProducts)
    $created = 0
    $examples = @()
    foreach ($fixture in $fixtures) {
        $existing = @($initial | Where-Object { $_.title -eq $fixture.title })
        if ($existing.Count -gt 1) { throw 'Há exemplos duplicados; nenhum registro existente será alterado.' }
        if ($existing.Count -eq 1) {
            $product = $existing[0]
            foreach ($field in @('title','description','price','category','badge','image','active')) {
                if ($product.$field -ne $fixture.$field) { throw 'Exemplo existente foi editado; preserve-o e revise a fixture antes de repetir.' }
            }
        } else {
            $response = Send-Api 'POST' '/products' $fixture
            Check ($response.Status -eq 201 -and $response.Data.id) ('cadastro: ' + $fixture.title)
            $product = $response.Data
            $created++
        }
        $examples += $product
        $response = Send-Api 'GET' ('/products/' + $product.id) $null $false
        Check ($response.Status -eq $(if ($fixture.active) {200} else {404})) ('visibilidade pública: ' + $fixture.title)
    }
    $response = Send-Api 'POST' '/products' $fixtures[0] $false
    Check ($response.Status -eq 401) 'cadastro sem autenticação recusado'
    $invalidCases = @(
        @{ Field='title'; Value=''; Status=400; Label='nome vazio' },
        @{ Field='title'; Value=('A' * 151); Status=400; Label='nome acima de 150 caracteres' },
        @{ Field='description'; Value=('A' * 2001); Status=400; Label='descrição acima de 2000 caracteres' },
        @{ Field='price'; Value=$null; Status=400; Label='preço ausente' },
        @{ Field='price'; Value=-1; Status=400; Label='preço negativo' },
        @{ Field='price'; Value=0; Status=400; Label='preço zero' },
        @{ Field='price'; Value=12.345; Status=400; Label='preço com três casas decimais' },
        @{ Field='price'; Value=100000000; Status=400; Label='preço acima do limite' },
        @{ Field='category'; Value=''; Status=400; Label='categoria vazia' },
        @{ Field='category'; Value=('A' * 51); Status=400; Label='categoria acima de 50 caracteres' },
        @{ Field='image'; Value=''; Status=400; Label='imagem ausente' },
        @{ Field='image'; Value='http://example.com/foto.jpg'; Status=400; Label='imagem sem HTTPS' },
        @{ Field='title'; Value='A'; Status=409; Label='nome de um caractere barrado pelo banco' },
        @{ Field='category'; Value='A'; Status=409; Label='categoria de um caractere barrada pelo banco' }
    )
    foreach ($case in $invalidCases) {
        $payload = Copy-Product $fixtures[0]
        $payload.($case.Field) = $case.Value
        $response = Send-Api 'POST' '/products' $payload
        if ($response.Status -eq 201 -and $response.Data.id) { $null = Send-Api 'DELETE' ('/products/' + $response.Data.id) }
        $matches = $response.Status -eq $case.Status
        if ($case.Status -eq 400) { $matches = $matches -and ($null -ne $response.Data.validationErrors.PSObject.Properties[$case.Field]) }
        Check $matches ($case.Label + ': HTTP ' + $response.Status)
    }
    # CRUD somente em um registro temporário criado por esta execução.
    $payload = Copy-Product $fixtures[0]
    $payload.title = '[TESTE TEMPORARIO] ' + [guid]::NewGuid().ToString('N')
    $payload.active = $false
    $response = Send-Api 'POST' '/products' $payload
    Check ($response.Status -eq 201 -and $response.Data.id) 'criação de registro temporário para CRUD'
    $tempId = $response.Data.id
    $payload.title += ' editado'; $payload.price = 16.90
    $response = Send-Api 'PUT' ('/products/' + $tempId) $payload
    Check ($response.Status -eq 200 -and $response.Data.title -eq $payload.title -and $response.Data.price -eq 16.90) 'edição de nome e preço'
    $badUpdate = Copy-Product $payload; $badUpdate.price = -1
    $response = Send-Api 'PUT' ('/products/' + $tempId) $badUpdate
    Check ($response.Status -eq 400) 'edição com preço inválido recusada'
    $response = Send-Api 'PATCH' ('/products/' + $tempId + '/availability') @{ active = $true }
    Check ($response.Status -eq 200 -and $response.Data.active) 'ativação de estoque'
    $response = Send-Api 'GET' ('/products/' + $tempId) $null $false
    Check ($response.Status -eq 200 -and $response.Data.price -eq 16.90) 'leitura pública confirma edição e estoque'
    $response = Send-Api 'PATCH' ('/products/' + $tempId + '/availability') @{ active = $false }
    Check ($response.Status -eq 200 -and -not $response.Data.active) 'desativação de estoque'
    $response = Send-Api 'GET' ('/products/' + $tempId) $null $false
    Check ($response.Status -eq 404) 'produto desativado sai da consulta pública'
    $response = Send-Api 'DELETE' ('/products/' + $tempId)
    Check ($response.Status -eq 204) 'exclusão do registro temporário'
    $deletedId = $tempId; $tempId = $null
    $final = @(Get-AdminProducts)
    Check (@($final | Where-Object { $_.id -eq $deletedId }).Count -eq 0) 'registro excluído ausente no painel'
    Check ($final.Count -eq $initial.Count + $created) 'cadastros inválidos não acrescentaram registros'
    foreach ($example in $examples) {
        Check (@($final | Where-Object { $_.id -eq $example.id }).Count -eq 1) ('painel mantém o exemplo: ' + $example.title)
    }
    $tools = Join-Path $root '.tools'
    [IO.Directory]::CreateDirectory($tools) | Out-Null
    $manifest = Join-Path $tools ('catalog-expected-' + [guid]::NewGuid().ToString('N') + '.properties')
    $lines = @('count=' + $examples.Count)
    for ($index = 0; $index -lt $examples.Count; $index++) {
        foreach ($field in @('id','title','description','price','category','image','badge','active')) {
            $value = [Convert]::ToString($examples[$index].$field, [Globalization.CultureInfo]::InvariantCulture)
            if ($field -eq 'active') { $value = $value.ToLowerInvariant() }
            $lines += $index.ToString() + '.' + $field + '=' + (Escape-Property $value)
        }
    }
    [IO.File]::WriteAllLines($manifest, $lines, [Text.UTF8Encoding]::new($false))
    & $java '-Xmx128m' '--class-path' $driver (Join-Path $PSScriptRoot 'VerifyExampleProducts.java') $root $manifest
    if ($LASTEXITCODE -ne 0) { throw 'Persistência/constraints PostgreSQL não confirmadas.' }
    $result = @{ apiChecks=$checks; created=$created; examples=$examples; verifiedAt=[DateTimeOffset]::UtcNow.ToString('o') }
    [IO.File]::WriteAllText((Join-Path $tools 'catalogo-exemplos-resultados.json'), ($result | ConvertTo-Json -Depth 8), [Text.UTF8Encoding]::new($false))
    Write-Host ('Concluído: ' + $checks + ' verificações API; seis exemplos mantidos, sendo cinco ativos e um sem estoque.')
} catch {
    Write-Host ('Verificação interrompida (' + $_.Exception.GetType().Name + '). Nenhuma credencial foi exibida.')
    exit 1
} finally {
    if ($tempId -and $client -and $token) {
        try { $response = Send-Api 'DELETE' ('/products/' + $tempId); Write-Host ('Limpeza do temporário: HTTP ' + $response.Status) } catch { Write-Host ('Limpeza pendente apenas do temporário: ' + $tempId) }
    }
    if ($manifest -and (Test-Path -LiteralPath $manifest)) { Remove-Item -LiteralPath $manifest }
    $password=$null; $token=$null; $AdminPassword=$null; $document=$null; $section=$null
    if ($client) { $client.Dispose() }
    if ($handler) { $handler.Dispose() }
}
