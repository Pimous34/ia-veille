# Script pour corriger le problème de clic sur les boutons
import re

# Lire le fichier
with open('article.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Ajouter z-index et position relative aux boutons
# On modifie la classe .article-action-bar
content = content.replace(
    '.article-action-bar {',
    '.article-action-bar {\n            position: relative;\n            z-index: 10;'
)

# On s'assure que les boutons ont pointer-events: auto
content = content.replace(
    '.action-btn {',
    '.action-btn {\n            pointer-events: auto;'
)

# Sauvegarder
with open('article.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Correction CSS appliquee!")
print("  - z-index: 10 ajoute a la barre d'action")
print("  - pointer-events: auto force sur les boutons")
