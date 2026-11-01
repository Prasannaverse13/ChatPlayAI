param([switch]$BundleRuntime)
$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$artifactRoot = Join-Path $projectRoot 'artifacts'
New-Item -ItemType Directory -Path $artifactRoot -Force | Out-Null
$stage = Join-Path $artifactRoot ('release-' + [Guid]::NewGuid().ToString('N'))
$packageRoot = Join-Path $stage 'chatplay'
New-Item -ItemType Directory -Path $packageRoot -Force | Out-Null
# Explicit allowlist: runtime credentials, logs, tokens and local data cannot enter a release.
$releaseFiles = @('dist','dist-server','native','src','shared','server','tests','scripts','docs','public','.github','package.json','package-lock.json','tsconfig.json','vite.config.ts','vitest.config.ts','index.html','.env.example','.gitignore','README.md','Start ChatPlay.cmd','Install ChatPlay.cmd','Install ChatPlay.ps1')
foreach ($item in $releaseFiles) {
    $sourcePath = Join-Path $projectRoot $item
    if (-not (Test-Path -LiteralPath $sourcePath)) { throw "Release source missing: $item" }
    Copy-Item -LiteralPath $sourcePath -Destination $packageRoot -Recurse
}
$version=(Get-Content -Raw -LiteralPath (Join-Path $projectRoot 'package.json') | ConvertFrom-Json).version
if($BundleRuntime){
 New-Item -ItemType Directory -Path (Join-Path $packageRoot 'runtime') -Force | Out-Null
 Copy-Item -LiteralPath (Get-Command node).Source -Destination (Join-Path $packageRoot 'runtime\node.exe')
 & npm.cmd ci --omit=dev --ignore-scripts --prefix $packageRoot
 if($LASTEXITCODE -ne 0){throw 'Production dependency installation failed.'}
 $archive=Join-Path $artifactRoot "ChatPlayAI-$version-Windows.zip"
} else { $archive = Join-Path $artifactRoot "ChatPlayAI-$version.zip" }
Compress-Archive -LiteralPath $packageRoot -DestinationPath $archive -Force
$hasher=[Security.Cryptography.SHA256]::Create();$archiveStream=[IO.File]::OpenRead($archive)
try{$checksum=([BitConverter]::ToString($hasher.ComputeHash($archiveStream))).Replace('-','').ToLower()}finally{$archiveStream.Dispose();$hasher.Dispose()}
($checksum+'  '+[IO.Path]::GetFileName($archive)) | Set-Content -LiteralPath ($archive+'.sha256') -Encoding ascii
# A completed ZIP no longer needs its temporary staging copy.
$resolvedStage = (Resolve-Path -LiteralPath $stage).Path
$resolvedArtifacts = (Resolve-Path -LiteralPath $artifactRoot).Path
if (-not $resolvedStage.StartsWith($resolvedArtifacts + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase) -or
    (Split-Path -Leaf $resolvedStage) -notmatch '^release-[0-9a-f]{32}$') {
    throw 'Refusing to clean an unexpected release staging path.'
}
Remove-Item -LiteralPath $resolvedStage -Recurse -Force
Write-Output "Release saved: $archive"
Write-Output 'Extract, install Node.js 22+, and run Start ChatPlay.cmd. No credentials or local data are included.'
