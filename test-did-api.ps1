$headers = @{
    'Authorization' = 'Basic YmVuamFtaW4ucmlnb3VzdGVAZ21haWwuY29t:fFfUrKUkym7Annpy8z2fp'
    'Content-Type' = 'application/json'
}

$body = @{
    source_url = 'https://jrlecaepyoivtplpvwoe.supabase.co/storage/v1/object/public/jt-assets/presenter/gretta-jt.jpg'
    script = @{
        type = 'text'
        input = 'Bonjour, ceci est un test.'
        provider = @{
            type = 'microsoft'
            voice_id = 'fr-FR-DeniseNeural'
        }
    }
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri 'https://api.d-id.com/talks' -Method Post -Headers $headers -Body $body
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "Talk ID: $($response.id)"
    $response | ConvertTo-Json
} catch {
    Write-Host "ERROR!" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)"
    Write-Host "Message: $($_.Exception.Message)"
    $_.Exception.Response
}
