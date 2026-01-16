# Script pour supprimer article-read-time et article-actions
$file = "article.html"
$content = Get-Content $file -Raw

# Supprimer tout le contenu de la div article-meta en gardant juste la div vide
$pattern = '(<div class="article-meta">)[\s\S]*?(</div>\s*</header>)'
$replacement = '$1' + "`r`n            " + '$2'

$content = $content -replace $pattern, $replacement

# Sauvegarder
$content | Set-Content $file -NoNewline

Write-Host "✅ Sections supprimées avec succès !" -ForegroundColor Green
Write-Host "  - article-read-time (temps de lecture) supprimé" -ForegroundColor Yellow
Write-Host "  - article-actions (boutons Sauvegarder/Partager) supprimés" -ForegroundColor Yellow
