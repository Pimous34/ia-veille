# -*- coding: utf-8 -*-

# Lire le fichier
with open('article.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Remplacer la taille du logo pour qu'il soit plus petit et responsive
content = content.replace(
    'style="display: block; max-width: 150px; height: auto;"',
    'style="display: block; max-width: 80px; height: auto;"'
)

# Sauvegarder
with open('article.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("OK - Taille du logo ajustee a 80px!")
print("Rechargez article.html (Ctrl+F5)")
