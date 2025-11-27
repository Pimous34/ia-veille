# Script pour ajouter les boutons d'action à article.html
$file = "article.html"
$content = Get-Content $file -Raw

# 1. Ajouter les styles CSS pour les boutons d'action
$actionBarStyles = @"

        /* Article Action Bar */
        .article-action-bar {
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
            margin: 2rem 0;
            padding: 1.5rem;
            background: #f9fafb;
            border-radius: 12px;
            border: 1px solid #e5e7eb;
        }

        .action-btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.625rem 1.25rem;
            background: white;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 0.875rem;
            font-weight: 500;
            color: #374151;
            cursor: pointer;
            transition: all 0.2s;
        }

        .action-btn:hover {
            background: #f3f4f6;
            border-color: #9ca3af;
            transform: translateY(-1px);
        }

        .action-btn svg {
            width: 18px;
            height: 18px;
        }

        .like-dislike-group {
            display: flex;
            gap: 0.5rem;
            margin-left: auto;
        }

        .like-btn:hover {
            background: #dcfce7;
            border-color: #86efac;
            color: #16a34a;
        }

        .dislike-btn:hover {
            background: #fee2e2;
            border-color: #fca5a5;
            color: #dc2626;
        }
"@

# Ajouter les styles avant les styles responsive
$content = $content -replace '(\s+/\* Responsive \*/)', "$actionBarStyles`r`n`$1"

# 2. Ajouter le HTML des boutons après l'image
$actionBarHTML = @"
`r`n
        <!-- Article Actions -->
        <div class="article-action-bar">
            <button class="action-btn" onclick="saveArticle()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
                Sauvegarder
            </button>
            <button class="action-btn" onclick="watchLater()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                À regarder plus tard
            </button>
            <button class="action-btn" onclick="shareArticle()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
                Partager
            </button>
            <div class="like-dislike-group">
                <button class="action-btn like-btn" onclick="likeArticle()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                    </svg>
                    J'aime
                </button>
                <button class="action-btn dislike-btn" onclick="dislikeArticle()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
                    </svg>
                    J'aime pas
                </button>
            </div>
        </div>
"@

# Ajouter les boutons après l'image featured
$content = $content -replace '(</div>\s+<!-- Article Content -->)', "$actionBarHTML`r`n        `$1"

# Sauvegarder
$content | Set-Content $file -NoNewline

Write-Host "✅ Boutons d'action ajoutés avec succès !" -ForegroundColor Green
Write-Host "  - Sauvegarder" -ForegroundColor Yellow
Write-Host "  - À regarder plus tard" -ForegroundColor Yellow
Write-Host "  - Partager" -ForegroundColor Yellow
Write-Host "  - J'aime / J'aime pas" -ForegroundColor Yellow
