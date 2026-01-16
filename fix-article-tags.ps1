# Script pour corriger les tags dans article.html
$file = "article.html"
$content = Get-Content $file -Raw

# 1. Ajouter pointer-events: none et cursor: default à .article-tag
$content = $content -replace '(\.article-tag \{[^}]+text-decoration: none;[^}]+transition: all 0\.2s;)', '$1`r`n            pointer-events: none;`r`n            cursor: default;'

# 2. Modifier le hover pour ne plus avoir d'effet
$content = $content -replace '(\.article-tag:hover \{[^}]+)background: rgba\(37, 99, 235, 0\.2\);([^}]+)transform: translateY\(-2px\);', '$1background: rgba(37, 99, 235, 0.1);$2transform: none;'

# 3. Ajouter les styles de couleurs pour les tags après .article-tag:hover
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

# 4. Ajouter les classes tag-chatgpt et tag-claude aux balises HTML
$content = $content -replace '<a href="#" class="article-tag">ChatGPT</a>', '<a href="#" class="article-tag tag-chatgpt">ChatGPT</a>'
$content = $content -replace '<a href="#" class="article-tag">Claude</a>', '<a href="#" class="article-tag tag-claude">Claude</a>'

# Sauvegarder
$content | Set-Content $file -NoNewline

Write-Host "✅ Modifications appliquées avec succès !" -ForegroundColor Green
Write-Host "Les tags sont maintenant:" -ForegroundColor Cyan
Write-Host "  - Non-cliquables (pointer-events: none)" -ForegroundColor Yellow
Write-Host "  - ChatGPT en vert (#10a37f)" -ForegroundColor Green
Write-Host "  - Claude en beige (#bf9060)" -ForegroundColor Yellow
