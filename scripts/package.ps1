$ErrorActionPreference = 'Stop'
$releaseRoot = Split-Path $PSScriptRoot -Parent
$manifest = Get-Content -Raw (Join-Path $releaseRoot 'manifest.json') | ConvertFrom-Json
$releaseDirectory = Join-Path $releaseRoot 'dist'
New-Item -ItemType Directory -Force -Path $releaseDirectory | Out-Null
$releaseArchive = Join-Path $releaseDirectory "saved-tab-groups-$($manifest.version).zip"
$releaseFiles = @('manifest.json', 'popup', 'sidebar', 'shared', 'icons', 'LICENSE') | ForEach-Object { Join-Path $releaseRoot $_ }
Compress-Archive -LiteralPath $releaseFiles -DestinationPath $releaseArchive -Force
Write-Output "Upload package: $releaseArchive"
