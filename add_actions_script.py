# Script pour ajouter le fichier JS et corriger la typo
import re

# Lire le fichier
with open('article.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Corriger la typo article-loader.js\
content = content.replace('article-loader.js\\', 'article-loader.js')

# 2. Ajouter le nouveau script article-actions.js avant la fermeture du body
if 'article-actions.js' not in content:
    content = content.replace('</body>', '    <script src="article-actions.js"></script>\n</body>')

# Sauvegarder
with open('article.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Scripts mis a jour!")
print("  - Typo corrigee (article-loader.js)")
print("  - article-actions.js ajoute")
