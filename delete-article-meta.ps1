# Script pour supprimer complètement la div article-meta
$file = "article.html"
$content = Get-Content $file -Raw

# Supprimer la div article-meta et son contenu
$pattern = '\s*<div class="article-meta">[\s\S]*?</div>\s*(?=</header>)'
$content = $content -replace $pattern, ''

# Sauvegarder
$content | Set-Content $file -NoNewline

Write-Host "✅ Div article-meta supprimée avec succès !" -ForegroundColor Green
Write-Host "Le trait a été enlevé de la page d'article" -ForegroundColor Yellow
