# Script complet pour configurer article.html avec typographie professionnelle
$file = "article.html"
$content = Get-Content $file -Raw

# 1. Améliorer la typographie du contenu d'article
$content = $content -replace 'font-size: 1\.125rem;', 'font-size: 1rem;'
$content = $content -replace '(\.article-content \{[^}]+)line-height: 1\.8;', '$1line-height: 1.7;'
$content = $content -replace '(\.article-content \{[^}]+)color: #334155;', '$1color: #374151;`r`n            max-width: 720px;`r`n            margin: 0 auto;'

# 2. Ajouter text-align: justify aux paragraphes
$content = $content -replace '(\.article-content p \{[^}]+margin: 0 0 1\.5rem 0;)', '$1`r`n            text-align: justify;'

# 3. Réduire la taille des titres H2 et H3
$content = $content -replace 'font-size: 2rem;', 'font-size: 1.75rem;'
$content = $content -replace 'font-size: 1\.5rem;', 'font-size: 1.25rem;'

# 4. Ajuster les marges
$content = $content -replace 'margin: 3rem 0 1\.5rem 0;', 'margin: 2.5rem 0 1.25rem 0;'
$content = $content -replace 'margin: 2rem 0 1rem 0;', 'margin: 2rem 0 1rem 0;'

# 5. Tags non-cliquables et plus petits
$content = $content -replace 'padding: 0\.5rem 1rem;', 'padding: 0.35rem 0.75rem;'
$content = $content -replace 'font-size: 0\.875rem;', 'font-size: 0.75rem;'
$content = $content -replace '(\.article-tag \{[^}]+text-decoration: none;[^}]+transition: all 0\.2s;)', '$1`r`n            pointer-events: none;`r`n            cursor: default;'

# 6. Modifier le hover pour ne plus avoir d'effet
$content = $content -replace '(\.article-tag:hover \{[^}]+)background: rgba\(37, 99, 235, 0\.2\);([^}]+)transform: translateY\(-2px\);', '$1background: rgba(37, 99, 235, 0.1);$2transform: none;'

# 7. Ajouter les couleurs des tags
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

# 8. Ajouter les classes aux tags HTML
$content = $content -replace '<a href="#" class="article-tag">ChatGPT</a>', '<a href="#" class="article-tag tag-chatgpt">ChatGPT</a>'
$content = $content -replace '<a href="#" class="article-tag">Claude</a>', '<a href="#" class="article-tag tag-claude">Claude</a>'

# 9. Supprimer la div article-meta
$pattern = '\s*<div class="article-meta">[\s\S]*?</div>\s*(?=</header>)'
$content = $content -replace $pattern, ''

# 10. Supprimer le sommaire
$tocPattern = '\s*<!-- Table of Contents -->[\s\S]*?</aside>\s*'
$content = $content -replace $tocPattern, "`r`n"

# Sauvegarder
$content | Set-Content $file -NoNewline

Write-Host "✅ Configuration complète réussie !" -ForegroundColor Green
Write-Host "  - Typographie professionnelle (texte plus petit, justifié)" -ForegroundColor Yellow
Write-Host "  - Titres réduits pour meilleure hiérarchie" -ForegroundColor Yellow
Write-Host "  - Tags non-cliquables et colorés" -ForegroundColor Yellow
Write-Host "  - Sommaire et article-meta supprimés" -ForegroundColor Yellow
