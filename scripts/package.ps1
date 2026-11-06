$ErrorActionPreference = 'Stop'
$releaseRoot = Split-Path $PSScriptRoot -Parent
$manifest = Get-Content -Raw (Join-Path $releaseRoot 'manifest.json') | ConvertFrom-Json
$releaseDirectory = Join-Path $releaseRoot 'dist'
New-Item -ItemType Directory -Force -Path $releaseDirectory | Out-Null
$releaseArchive = Join-Path $releaseDirectory "saved-tab-groups-$($manifest.version).zip"
$releaseFiles = @('manifest.json', 'popup', 'sidebar', 'shared', 'icons', 'LICENSE') | ForEach-Object { Join-Path $releaseRoot $_ }

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
if (Test-Path -LiteralPath $releaseArchive) {
  Remove-Item -LiteralPath $releaseArchive -Force
}

$archive = [System.IO.Compression.ZipFile]::Open(
  $releaseArchive,
  [System.IO.Compression.ZipArchiveMode]::Create
)

try {
  foreach ($releaseFile in $releaseFiles) {
    $files = if (Test-Path -LiteralPath $releaseFile -PathType Container) {
      Get-ChildItem -LiteralPath $releaseFile -File -Recurse
    } else {
      Get-Item -LiteralPath $releaseFile
    }

    foreach ($file in $files) {
      $entryName = $file.FullName.Substring($releaseRoot.Length).TrimStart('\', '/') -replace '\\', '/'
      $entry = $archive.CreateEntry($entryName, [System.IO.Compression.CompressionLevel]::Optimal)
      $entryStream = $entry.Open()
      $fileStream = [System.IO.File]::OpenRead($file.FullName)

      try {
        $fileStream.CopyTo($entryStream)
      } finally {
        $fileStream.Dispose()
        $entryStream.Dispose()
      }
    }
  }
} finally {
  $archive.Dispose()
}

Write-Output "Upload package: $releaseArchive"
