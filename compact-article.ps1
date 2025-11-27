# Script final pour configurer article.html avec espacement réduit
$file = "article.html"
$content = Get-Content $file -Raw

# 1. Typographie professionnelle
$content = $content -replace 'font-size: 1\.125rem;', 'font-size: 1rem;'
$content = $content -replace '(\.article-content \{[^}]+)line-height: 1\.8;', '$1line-height: 1.7;'
$content = $content -replace '(\.article-content \{[^}]+)color: #334155;', '$1color: #374151;'

# 2. Réduire les espacements (COMPACT)
$content = $content -replace '(\.article-content p \{[^}]+)margin: 0 0 1\.5rem 0;', '$1margin: 0 0 1rem 0;'
$content = $content -replace '(\.article-content h2 \{[^}]+)margin: 3rem 0 1\.5rem 0;', '$1margin: 2rem 0 0.75rem 0;'
$content = $content -replace '(\.article-content h3 \{[^}]+)margin: 2rem 0 1rem 0;', '$1margin: 1.5rem 0 0.5rem 0;'
$content = $content -replace '(\.article-content ul,[\s\S]*?\.article-content ol \{[^}]+)margin: 0 0 1\.5rem 0;', '$1margin: 0 0 1rem 0;'

# 3. Réduire taille des titres
$content = $content -replace '(\.article-content h2 \{[^}]+)font-size: 2rem;', '$1font-size: 1.75rem;'
$content = $content -replace '(\.article-content h3 \{[^}]+)font-size: 1\.5rem;', '$1font-size: 1.25rem;'

# 4. Tags non-cliquables et plus petits
$content = $content -replace '(\.article-tag \{[^}]+)padding: 0\.5rem 1rem;', '$1padding: 0.35rem 0.75rem;'
$content = $content -replace '(\.article-tag \{[^}]+)font-size: 0\.875rem;', '$1font-size: 0.75rem;'
$content = $content -replace '(\.article-tag \{[^}]+)(transition: all 0\.2s;)', '$1$2`r`n            pointer-events: none;`r`n            cursor: default;'

# 5. Modifier le hover
$content = $content -replace '(\.article-tag:hover \{[^}]+)background: rgba\(37, 99, 235, 0\.2\);([^}]+)transform: translateY\(-2px\);', '$1background: rgba(37, 99, 235, 0.1);$2transform: none;'

# 6. Couleurs des tags
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

# 7. Classes HTML
$content = $content -replace '<a href="#" class="article-tag">ChatGPT</a>', '<a href="#" class="article-tag tag-chatgpt">ChatGPT</a>'
$content = $content -replace '<a href="#" class="article-tag">Claude</a>', '<a href="#" class="article-tag tag-claude">Claude</a>'

# 8. Supprimer article-meta
$pattern = '\s*<div class="article-meta">[\s\S]*?</div>\s*(?=</header>)'
$content = $content -replace $pattern, ''

# 9. Supprimer sommaire
$tocPattern = '\s*<!-- Table of Contents -->[\s\S]*?</aside>\s*'
$content = $content -replace $tocPattern, "`r`n"

# Sauvegarder
$content | Set-Content $file -NoNewline

Write-Host "✅ Configuration finale réussie !" -ForegroundColor Green
Write-Host "  - Espacement réduit entre paragraphes et titres" -ForegroundColor Yellow
Write-Host "  - Typographie professionnelle" -ForegroundColor Yellow
Write-Host "  - Tags non-cliquables et colorés" -ForegroundColor Yellow
