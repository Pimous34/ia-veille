# Script Python pour corriger la position des boutons
import re

# Lire le fichier
with open('article.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Supprimer les boutons mal placés
pattern = r'\s*<!-- Article Actions -->[\s\S]*?</div>\s*(?=</div>\s*<!-- Article Content -->)'
content = re.sub(pattern, '', content)

# Ajouter les boutons au bon endroit (APRÈS la div article-featured-image)
buttons_html = """

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
"""

# Trouver la fermeture de article-featured-image et ajouter les boutons APRÈS
pattern = r'(<div class="article-featured-image">[\s\S]*?</div>)'
replacement = r'\1' + buttons_html
content = re.sub(pattern, replacement, content)

# Sauvegarder
with open('article.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Position des boutons corrigee!")
print("Les boutons sont maintenant APRES l'image")
