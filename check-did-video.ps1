# Script pour verifier le statut d'une video D-ID

$talkId = "tlk_EKHSVuXz0ebrdgoquz9uX"
$apiKey = "Basic YmVuamFtaW4ucmlnb3VzdGVAZ21haWwuY29t:fFfUrKUkym7Annpy8z2fp"

$headers = @{
    "Authorization" = $apiKey
}

Write-Host "Verification du statut de la video D-ID: $talkId" -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "https://api.d-id.com/talks/$talkId" -Method Get -Headers $headers
    
    Write-Host "`nStatut: $($response.status)" -ForegroundColor Yellow
    
    if ($response.result_url) {
        Write-Host "URL de la video: $($response.result_url)" -ForegroundColor Green
    }
    
    Write-Host "`nReponse complete:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10
    
} catch {
    Write-Host "Erreur lors de la verification:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message
    }
}
