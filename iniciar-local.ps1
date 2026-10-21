[CmdletBinding()]
param(
    [ValidateSet('Todos', 'Backend', 'Frontend')]
    [string]$Servico = 'Todos'
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$backendDir = Join-Path $PSScriptRoot 'backend-api'
$frontendDir = Join-Path $PSScriptRoot 'Dogmania-Catalogo'
$backendScript = Join-Path $backendDir 'start-local.ps1'
$siteUrl = 'http://127.0.0.1:8081/'
$apiUrl = 'http://127.0.0.1:8080/api/v1/products?size=1'
$launcherScript = Join-Path $PSScriptRoot 'iniciar-local.ps1'

function Get-BunExecutable {
    $command = Get-Command bun.exe -ErrorAction SilentlyContinue
    if ($command) { return $command.Source }
    $candidate = Join-Path $env:USERPROFILE '.bun/bin/bun.exe'
    if (Test-Path -LiteralPath $candidate) { return $candidate }
    throw 'Bun nao encontrado. Instale o Bun para iniciar o frontend.'
}

function Test-LocalPort([int]$Port) {
    $client = [Net.Sockets.TcpClient]::new()
    try {
        $connection = $client.ConnectAsync('127.0.0.1', $Port)
        return $connection.Wait(500) -and $client.Connected
    } catch { return $false } finally { $client.Dispose() }
}

function Get-ServiceReady([string]$Name) {
    $url = if ($Name -eq 'Backend') { $apiUrl } else { $siteUrl }
    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 2
        if ($response.StatusCode -ne 200) { return $false }
        if ($Name -eq 'Backend') {
            $page = $response.Content | ConvertFrom-Json
            return ($null -ne $page.PSObject.Properties['content'] -and
                $null -ne $page.PSObject.Properties['totalElements'])
        }
        return $response.Content -match '(?i)dogmania'
    } catch { return $false }
}

function Start-ServiceWindow([string]$Name) {
    $shell = Join-Path $PSHOME 'powershell.exe'
    if (-not (Test-Path -LiteralPath $shell)) {
        $shell = (Get-Command powershell.exe -ErrorAction Stop).Source
    }
    # Public arguments only. Paths remain relative to this checkout's root.
    $arguments = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-NoExit',
        '-File', ('"{0}"' -f $launcherScript), '-Servico', $Name)
    return Start-Process -FilePath $shell -ArgumentList $arguments -WorkingDirectory $PSScriptRoot -WindowStyle Normal -PassThru
}

try {
    if ($Servico -eq 'Backend') {
        $Host.UI.RawUI.WindowTitle = 'Dogmania - Backend'
        Push-Location $backendDir
        try { & $backendScript } finally { Pop-Location }
        exit 0
    }
    if ($Servico -eq 'Frontend') {
        $Host.UI.RawUI.WindowTitle = 'Dogmania - Site'
        $bun = Get-BunExecutable
        Push-Location $frontendDir
        try {
            & $bun run dev
            if ($LASTEXITCODE -ne 0) { throw 'O frontend encerrou com erro. Confira a mensagem nesta janela.' }
        } finally { Pop-Location }
        exit 0
    }

    Write-Host 'DOGMANIA - iniciando o sistema local' -ForegroundColor Cyan
    Write-Host 'As janelas Backend e Site precisam permanecer abertas durante o uso.'
    if (-not (Test-Path -LiteralPath $backendScript) -or -not (Test-Path -LiteralPath (Join-Path $frontendDir 'package.json'))) {
        throw 'Mantenha este iniciador na raiz do projeto, junto das pastas backend-api e Dogmania-Catalogo.'
    }
    if (-not (Test-Path -LiteralPath (Join-Path $backendDir '.env.local'))) {
        throw 'A configuracao do backend nao foi encontrada. Configure o banco antes de iniciar.'
    }
    if (-not (Test-Path -LiteralPath (Join-Path $frontendDir 'node_modules/vite'))) {
        throw 'Dependencias do frontend ausentes. Execute bun install na pasta Dogmania-Catalogo.'
    }
    $null = Get-BunExecutable
    & $backendScript -Check | Out-Null

    # Avoid two launchers starting the same servers at the same time.
    $lockPath = Join-Path $PSScriptRoot '.tools/launcher.lock'
    New-Item -ItemType Directory -Path (Split-Path $lockPath -Parent) -Force | Out-Null
    $launchLock = $null
    try {
        try {
            $launchLock = [IO.File]::Open($lockPath, [IO.FileMode]::OpenOrCreate, [IO.FileAccess]::ReadWrite, [IO.FileShare]::None)
        } catch {
            throw 'Outra inicializacao ja esta em andamento. Aguarde a janela Iniciar Dogmania terminar.'
        }
        $backendReady = Get-ServiceReady 'Backend'
        $frontendReady = Get-ServiceReady 'Frontend'
        if (-not $backendReady -and (Test-LocalPort 8080)) {
            throw 'A porta 8080 esta ocupada e a API nao respondeu corretamente. Confira a janela Backend.'
        }
        if (-not $frontendReady -and (Test-LocalPort 8081)) {
            throw 'A porta 8081 esta ocupada e o site nao respondeu corretamente. Confira a janela Site.'
        }
        if (-not $backendReady) {
            Write-Host 'Abrindo o backend...'
            $null = Start-ServiceWindow 'Backend'
        } else { Write-Host 'Backend ja esta rodando.' }
        if (-not $frontendReady) {
            Write-Host 'Abrindo o site...'
            $null = Start-ServiceWindow 'Frontend'
        } else { Write-Host 'Site ja esta rodando.' }

        Write-Host 'Aguardando os servicos. A primeira abertura pode levar ate dois minutos...'
        $timer = [Diagnostics.Stopwatch]::StartNew()
        while ($timer.Elapsed.TotalSeconds -lt 120) {
            # Recheck both endpoints together so an early crash is not treated as success.
            $backendReady = Get-ServiceReady 'Backend'
            $frontendReady = Get-ServiceReady 'Frontend'
            if ($backendReady -and $frontendReady) {
                Start-Process -FilePath $siteUrl
                Write-Host 'Sistema pronto! O site foi aberto no navegador.' -ForegroundColor Green
                Write-Host 'Painel administrativo: http://127.0.0.1:8081/admin'
                Write-Host 'Para encerrar, pressione Ctrl+C nas janelas Backend e Site ou feche essas janelas.'
                exit 0
            }
            Start-Sleep -Seconds 1
        }
        throw 'Os servicos nao ficaram prontos a tempo. Confira as mensagens nas janelas Backend e Site antes de tentar novamente.'
    } finally {
        if ($launchLock) { $launchLock.Dispose() }
    }
} catch {
    Write-Host ('Nao foi possivel iniciar a Dogmania: ' + $_.Exception.Message) -ForegroundColor Red
    exit 1
}
