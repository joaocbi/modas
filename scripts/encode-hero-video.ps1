# Re-encode a source clip to H.264 MP4 suited for the site hero (16:9, web-friendly).
# Requires ffmpeg on PATH: https://ffmpeg.org/download.html
#
# Usage:
#   .\scripts\encode-hero-video.ps1 -InputPath "C:\path\beatriz_orig.mov" -OutputPath ".\public\assets\beatriz.mp4"
#   .\scripts\encode-hero-video.ps1 -InputPath ".\raw\clip.mp4" -OutputPath ".\public\assets\gif20.mp4" -Width 2560 -Height 1440 -Crf 20
#
# Notes:
# - CRF 18–23: lower = larger file, sharper. 18 is high quality; 20 is a balanced default for hero loops.
# - Preset "slow" improves compression efficiency; use "medium" for faster encodes.

param(
    [Parameter(Mandatory = $true)]
    [string] $InputPath,
    [Parameter(Mandatory = $true)]
    [string] $OutputPath,
    [int] $Width = 1920,
    [int] $Height = 1080,
    [ValidateRange(0, 51)]
    [int] $Crf = 20,
    [string] $Preset = "slow"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
    Write-Error "ffmpeg not found. Install ffmpeg and add it to PATH."
}

$inFull = Resolve-Path -LiteralPath $InputPath
$outFull = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputPath)
$outDir = Split-Path -Parent $outFull
if ($outDir -and -not (Test-Path -LiteralPath $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

# Letterbox/pillarbox into exact 16:9 canvas so object-fit: cover in the hero stays predictable.
$vf = "scale=${Width}:${Height}:force_original_aspect_ratio=decrease,pad=${Width}:${Height}:(ow-iw)/2:(oh-ih)/2,setsar=1"

Write-Host "[encode-hero-video] Input:  $inFull"
Write-Host "[encode-hero-video] Output: $outFull"
Write-Host "[encode-hero-video] Canvas: ${Width}x${Height}, CRF=$Crf, preset=$Preset"

& ffmpeg -hide_banner -y -i $inFull -an `
    -c:v libx264 -profile:v high -pix_fmt yuv420p `
    -vf $vf `
    -crf $Crf -preset $Preset `
    -movflags +faststart `
    $outFull

if ($LASTEXITCODE -ne 0) {
    Write-Error "ffmpeg exited with code $LASTEXITCODE"
}

Write-Host "[encode-hero-video] Done."
