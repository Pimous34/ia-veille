# Script PowerShell pour uploader les assets JT sur Supabase Storage
# Utilise l'API Supabase Storage pour uploader l'image du présentateur et le jingle

$ErrorActionPreference = "Stop"

Write-Host "Upload des assets JT sur Supabase Storage..." -ForegroundColor Cyan

# Charger les variables d'environnement
if (Test-Path ".env.local") {
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $key = $matches[1]
            $value = $matches[2]
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

$SUPABASE_URL = $env:NEXT_PUBLIC_SUPABASE_URL
$SUPABASE_SERVICE_KEY = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $SUPABASE_URL -or -not $SUPABASE_SERVICE_KEY) {
    Write-Host "Variables d'environnement manquantes!" -ForegroundColor Red
    Write-Host "Assurez-vous que NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont definis dans .env.local" -ForegroundColor Yellow
    exit 1
}

# Créer le bucket jt-assets s'il n'existe pas
Write-Host "Verification du bucket jt-assets..." -ForegroundColor Yellow

$createBucketBody = @{
    name = "jt-assets"
    public = $true
    file_size_limit = 52428800
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/storage/v1/bucket" `
        -Method Post `
        -Headers @{
            "Authorization" = "Bearer $SUPABASE_SERVICE_KEY"
            "Content-Type" = "application/json"
        } `
        -Body $createBucketBody `
        -ErrorAction SilentlyContinue
    Write-Host "Bucket jt-assets cree" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "Bucket jt-assets existe deja" -ForegroundColor Green
    } else {
        Write-Host "Erreur lors de la creation du bucket: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Upload de l'image du présentateur
Write-Host "`nUpload de l'image du presentateur..." -ForegroundColor Yellow

$presenterImagePath = "public\image\Gretta JT.jpg"
if (-not (Test-Path $presenterImagePath)) {
    Write-Host "Fichier non trouve: $presenterImagePath" -ForegroundColor Red
    exit 1
}

$presenterImageBytes = [System.IO.File]::ReadAllBytes($presenterImagePath)

try {
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/storage/v1/object/jt-assets/presenter/gretta-jt.jpg" `
        -Method Post `
        -Headers @{
            "Authorization" = "Bearer $SUPABASE_SERVICE_KEY"
            "Content-Type" = "image/jpeg"
        } `
        -Body $presenterImageBytes

    $presenterUrl = "$SUPABASE_URL/storage/v1/object/public/jt-assets/presenter/gretta-jt.jpg"
    Write-Host "Image du presentateur uploadee: $presenterUrl" -ForegroundColor Green
} catch {
    Write-Host "Erreur lors de l'upload de l'image: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Upload du jingle vidéo
Write-Host "`nUpload du jingle video..." -ForegroundColor Yellow

$jingleVideoPath = "public\video\Jingle.mp4"
if (-not (Test-Path $jingleVideoPath)) {
    Write-Host "Fichier non trouve: $jingleVideoPath" -ForegroundColor Red
    exit 1
}

$jingleVideoBytes = [System.IO.File]::ReadAllBytes($jingleVideoPath)

try {
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/storage/v1/object/jt-assets/jingle/jingle.mp4" `
        -Method Post `
        -Headers @{
            "Authorization" = "Bearer $SUPABASE_SERVICE_KEY"
            "Content-Type" = "video/mp4"
        } `
        -Body $jingleVideoBytes

    $jingleUrl = "$SUPABASE_URL/storage/v1/object/public/jt-assets/jingle/jingle.mp4"
    Write-Host "Jingle video uploade: $jingleUrl" -ForegroundColor Green
} catch {
    Write-Host "Erreur lors de l'upload du jingle: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`nTous les assets ont ete uploades avec succes!" -ForegroundColor Green
Write-Host "`nURLs des assets:" -ForegroundColor Cyan
Write-Host "   Image presentateur: $presenterUrl" -ForegroundColor White
Write-Host "   Jingle video: $jingleUrl" -ForegroundColor White
Write-Host "`nMettez a jour votre .env.local avec:" -ForegroundColor Yellow
Write-Host "   JT_PRESENTER_IMAGE_URL=$presenterUrl" -ForegroundColor White
