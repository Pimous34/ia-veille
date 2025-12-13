# Script pour configurer complètement la page article.html
$file = "article.html"
$content = Get-Content $file -Raw

# 1. Ajouter pointer-events: none et cursor: default à .article-tag
$content = $content -replace '(\.article-tag \{[^}]+text-decoration: none;[^}]+transition: all 0\.2s;)', '$1`r`n            pointer-events: none;`r`n            cursor: default;'

# 2. Réduire la taille des tags
$content = $content -replace 'padding: 0\.5rem 1rem;', 'padding: 0.35rem 0.75rem;'
$content = $content -replace 'font-size: 0\.875rem;', 'font-size: 0.75rem;'

# 3. Modifier le hover pour ne plus avoir d'effet
$content = $content -replace '(\.article-tag:hover \{[^}]+)background: rgba\(37, 99, 235, 0\.2\);([^}]+)transform: translateY\(-2px\);', '$1background: rgba(37, 99, 235, 0.1);$2transform: none;'

# 4. Ajouter les styles de couleurs pour les tags après .article-tag:hover
$tagColors = @"

        /* Tag colors - AI tools */
        .article-tag.tag-chatgpt {
            background: rgba(16, 163, 127, 0.12);
            color: #10a37f;
        }

        .article-tag.tag-claude {
            background: rgba(191, 144, 96, 0.12);
            color: #bf9060;
        }
"@

$content = $content -replace '(\.article-tag:hover \{[^}]+\})', "`$1$tagColors"

# 5. Ajouter les classes tag-chatgpt et tag-claude aux balises HTML
$content = $content -replace '<a href="#" class="article-tag">ChatGPT</a>', '<a href="#" class="article-tag tag-chatgpt">ChatGPT</a>'
$content = $content -replace '<a href="#" class="article-tag">Claude</a>', '<a href="#" class="article-tag tag-claude">Claude</a>'

# 6. Supprimer la div article-meta
$pattern = '\s*<div class="article-meta">[\s\S]*?</div>\s*(?=</header>)'
$content = $content -replace $pattern, ''

# 7. Supprimer le sommaire (Table of Contents)
$tocPattern = '\s*<!-- Table of Contents -->[\s\S]*?</aside>\s*'
$content = $content -replace $tocPattern, "`r`n"

# Sauvegarder
$content | Set-Content $file -NoNewline

Write-Host "✅ Configuration complète de article.html réussie !" -ForegroundColor Green
Write-Host "  - Tags non-cliquables" -ForegroundColor Yellow
Write-Host "  - Tags plus petits (padding et font-size réduits)" -ForegroundColor Yellow
Write-Host "  - ChatGPT en vert, Claude en beige" -ForegroundColor Yellow
Write-Host "  - Div article-meta supprimée" -ForegroundColor Yellow
Write-Host "  - Sommaire supprimé" -ForegroundColor Yellow
