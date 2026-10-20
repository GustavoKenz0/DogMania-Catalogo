# A Windows PowerShell child may inherit PSModulePath from PowerShell 7.
# Load the matching built-in module explicitly instead of resolving an incompatible DLL.
Import-Module (Join-Path $PSHOME 'Modules/Microsoft.PowerShell.Security/Microsoft.PowerShell.Security.psd1') -ErrorAction Stop

function Protect-LocalSecretPath([string]$LiteralPath) {
    $item = Get-Item -LiteralPath $LiteralPath -ErrorAction Stop
    if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Caminho privado nao pode ser um link.' }
    $userSid = [Security.Principal.WindowsIdentity]::GetCurrent().User.Value
    $rights = if ($item.PSIsContainer) { '(OI)(CI)F' } else { 'F' }
    $grants = @("*$($userSid):$rights", "*S-1-5-18:$rights")
    # icacls modifies only the DACL and does not request audit/owner privileges.
    & (Join-Path $env:WINDIR 'System32/icacls.exe') $item.FullName '/inheritance:r' '/grant:r' $grants | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Nao foi possivel restringir acesso ao arquivo privado.' }
    $acl = Get-Acl -LiteralPath $LiteralPath
    if (-not $acl.AreAccessRulesProtected) { throw 'Heranca de permissoes ainda esta ativa.' }
    $seen = @{}
    foreach ($entry in $acl.Access) {
        $sid = $entry.IdentityReference.Translate([Security.Principal.SecurityIdentifier]).Value
        if ($entry.IsInherited -or $sid -notin @($userSid, 'S-1-5-18') -or
                $entry.AccessControlType -ne [Security.AccessControl.AccessControlType]::Allow) {
            throw 'Permissao inesperada no caminho privado. Nenhum segredo deve ser gravado.'
        }
        $seen[$sid] = $true
    }
    if (-not $seen[$userSid] -or -not $seen['S-1-5-18']) { throw 'Permissoes privadas incompletas.' }
}

function Get-LocalSupabaseCaCertificate([string]$ProjectRoot) {
    $folder = Join-Path $ProjectRoot '.private'
    if (-not (Test-Path -LiteralPath $folder)) { New-Item -ItemType Directory -Path $folder | Out-Null }
    Protect-LocalSecretPath $folder
    $certificateFile = Join-Path $folder 'supabase-prod-ca-2021.crt'
    if (-not (Test-Path -LiteralPath $certificateFile)) {
        $handle = [IO.File]::Open($certificateFile, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write, [IO.FileShare]::None)
        $handle.Dispose()
        try {
            Protect-LocalSecretPath $certificateFile
            # Public CA distribution configured by Supabase Studio's official custom-content.json.
            Invoke-WebRequest -UseBasicParsing -Uri 'https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt' -OutFile $certificateFile
        } catch {
            Remove-Item -LiteralPath $certificateFile
            throw 'Nao foi possivel baixar o certificado oficial Supabase por HTTPS.'
        }
    }
    Protect-LocalSecretPath $certificateFile
    $certificate = [Security.Cryptography.X509Certificates.X509Certificate2]::new($certificateFile)
    try {
        if ($certificate.NotBefore.ToUniversalTime() -gt [DateTime]::UtcNow -or
                $certificate.NotAfter.ToUniversalTime() -lt [DateTime]::UtcNow) {
            throw 'Certificado Supabase fora do periodo de validade.'
        }
    } finally { $certificate.Dispose() }
    return $certificateFile
}

function Get-LocalSupabaseJdbcUrl([string]$PoolerHost, [string]$CertificateFile) {
    $encodedPath = [Uri]::EscapeDataString([IO.Path]::GetFullPath($CertificateFile))
    return "jdbc:postgresql://$($PoolerHost):5432/postgres?sslmode=verify-full&sslrootcert=$encodedPath&connectTimeout=10&socketTimeout=30"
}
