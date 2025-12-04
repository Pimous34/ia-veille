# Oreegami - Veille IA & No-Code

Site web responsive pour un système de veille sur l'Intelligence Artificielle et le No-Code.

## Structure du site

- **Header** : Logo à gauche, position sticky
- **Section Vidéo** : JT News centré avec lecteur vidéo YouTube
- **Articles du JT News** : Articles cités dans le journal télévisé
- **Articles Tendances** : Articles populaires du moment

## Fonctionnalités

- Design responsive (mobile, tablette, desktop)
- Interface moderne et épurée
- Articles avec images, catégories et dates
- Navigation fluide et intuitive

## Installation

1. Placez votre logo dans le dossier racine sous le nom `logo.png`
2. Ouvrez `index.html` dans votre navigateur
3. Ou servez les fichiers avec un serveur local :
   ```bash
   # Avec Python
   python -m http.server 8000
   
   # Avec Node.js (http-server)
   npx http-server
   ```

## Personnalisation

### Changer la vidéo YouTube

Dans `index.html`, modifiez l'URL de la vidéo :
```html
<iframe 
    class="video-player"
    src="https://www.youtube.com/embed/VOTRE_VIDEO_ID" 
    ...
</iframe>
```

Ou utilisez JavaScript :
```javascript
updateVideo('VOTRE_VIDEO_ID');
```

### Modifier les articles

Éditez les tableaux `jtArticles` et `trendingArticles` dans `script.js` :

```javascript
const jtArticles = [
    {
        id: 1,
        title: "Titre de l'article",
        excerpt: "Description de l'article",
        category: "IA", // ou "No-Code"
        date: "2024-01-15",
        link: "https://url-de-l-article.com",
        image: "https://url-de-l-image.jpg"
    },
    // ...
];
```

### Personnaliser les couleurs

Modifiez les variables CSS dans `styles.css` :

```css
:root {
    --primary-color: #2563eb;
    --secondary-color: #1e40af;
    /* ... */
}
```

## Structure des fichiers

```
.
├── index.html      # Structure HTML
├── styles.css      # Styles CSS responsive
├── script.js       # Logique JavaScript
├── logo.png        # Logo (à ajouter)
└── README.md       # Documentation
```

## Notes

- Les images d'articles utilisent des URLs Unsplash par défaut (exemples)
- Remplacez-les par vos propres images ou URLs
- Le logo doit être au format PNG, JPG ou SVG
- Le site est entièrement responsive et fonctionne sur tous les appareils




