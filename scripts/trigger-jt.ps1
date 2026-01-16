
# Script pour déclencher la génération du JT manuellement
# Usage: ./scripts/trigger-jt.ps1

$EnvFile = "$PSScriptRoot\..\.env.local"

if (!(Test-Path $EnvFile)) {
    Write-Error ".env.local file not found at $EnvFile"
    exit 1
}

# Charger les variables d'environnement
Get-Content $EnvFile | ForEach-Object {
    if ($_ -match '^([^#=]+)=(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        Set-Variable -Name $name -Value $value -Scope Script
    }
}

if (-not $script:NEXT_PUBLIC_SUPABASE_URL) {
    Write-Error "NEXT_PUBLIC_SUPABASE_URL not found in .env.local"
    exit 1
}

if (-not $script:SUPABASE_SERVICE_ROLE_KEY) {
    Write-Error "SUPABASE_SERVICE_ROLE_KEY not found in .env.local"
    exit 1
}

$Url = "$script:NEXT_PUBLIC_SUPABASE_URL/functions/v1/select-daily-news"
$Headers = @{
    "Authorization" = "Bearer $script:SUPABASE_SERVICE_ROLE_KEY"
    "Content-Type"  = "application/json"
}

Write-Host "🚀 Triggering daily news selection..."
Write-Host "URL: $Url"

try {
    $Response = Invoke-RestMethod -Uri $Url -Method Post -Headers $Headers -ErrorAction Stop
    Write-Host "✅ Success!"
    Write-Host ($Response | ConvertTo-Json -Depth 5)
}
catch {
    Write-Error "❌ Failed to trigger function: $_"
    if ($_.Exception.Response) {
        $Stream = $_.Exception.Response.GetResponseStream()
        $Reader = [System.IO.StreamReader]::new($Stream)
        $Body = $Reader.ReadToEnd()
        Write-Host "Response Body: $Body"
    }
}
