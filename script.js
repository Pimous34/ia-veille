// Sample articles data - Replace with your actual data source
const jtArticles = [
    {
        id: 1,
        title: "L'IA générative révolutionne le développement d'applications",
        excerpt: "Découvrez comment les outils d'IA générative transforment la façon dont nous créons des applications, réduisant le temps de développement de manière significative.",
        category: "IA",
        date: "2024-01-15",
        link: "#",
        image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800"
    },
    {
        id: 2,
        title: "No-Code : La démocratisation de la création digitale",
        excerpt: "Les plateformes No-Code permettent désormais à tous de créer des applications professionnelles sans connaissances en programmation.",
        category: "No-Code",
        date: "2024-01-14",
        link: "#",
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800"
    },
    {
        id: 3,
        title: "ChatGPT et les assistants IA : Nouveaux outils de productivité",
        excerpt: "Comment les assistants IA comme ChatGPT changent la productivité des développeurs et créateurs de contenu.",
        category: "IA",
        date: "2024-01-13",
        link: "#",
        image: "https://images.unsplash.com/photo-1676299080923-6c98c0cf4e48?w=800"
    }
];

const trendingArticles = [
    {
        id: 4,
        title: "Midjourney vs DALL-E : Comparaison des générateurs d'images IA",
        excerpt: "Une analyse approfondie des deux leaders du marché de la génération d'images par intelligence artificielle.",
        category: "IA",
        date: "2024-01-16",
        link: "#",
        image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800"
    },
    {
        id: 5,
        title: "Bubble.io : Créer une SaaS complète sans coder",
        excerpt: "Guide complet pour créer votre première application SaaS avec Bubble.io, la plateforme No-Code la plus populaire.",
        category: "No-Code",
        date: "2024-01-15",
        link: "#",
        image: "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800"
    },
    {
        id: 6,
        title: "L'avenir du travail avec l'IA : Opportunités et défis",
        excerpt: "Exploration des transformations que l'IA apporte au monde du travail et comment s'y adapter.",
        category: "IA",
        date: "2024-01-14",
        link: "#",
        image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800"
    },
    {
        id: 7,
        title: "Webflow : Design et développement réunis",
        excerpt: "Découvrez comment Webflow révolutionne la création de sites web en combinant design visuel et développement.",
        category: "No-Code",
        date: "2024-01-13",
        link: "#",
        image: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800"
    }
];

// Function to create article card HTML
function createArticleCard(article) {
    return `
        <article class="article-card" onclick="window.open('${article.link}', '_blank')">
            <img src="${article.image}" alt="${article.title}" class="article-image" onerror="this.style.display='none'">
            <div class="article-content">
                <span class="article-category">${article.category}</span>
                <h3 class="article-title">${article.title}</h3>
                <p class="article-excerpt">${article.excerpt}</p>
                <div class="article-meta">
                    <span class="article-date">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        ${formatDate(article.date)}
                    </span>
                    <a href="${article.link}" class="article-link" onclick="event.stopPropagation()">
                        Lire →
                    </a>
                </div>
            </div>
        </article>
    `;
}

// Function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
}

// Function to render articles
function renderArticles(articles, containerId) {
    const container = document.getElementById(containerId);
    
    if (!container) {
        console.error(`Container ${containerId} not found`);
        return;
    }

    if (articles.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Aucun article disponible pour le moment.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = articles.map(article => createArticleCard(article)).join('');
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Render JT News articles
    renderArticles(jtArticles, 'jtArticles');
    
    // Render trending articles
    renderArticles(trendingArticles, 'trendingArticles');
});

// Function to update video source (you can call this to change the video)
function updateVideo(videoId) {
    const videoPlayer = document.querySelector('.video-player');
    if (videoPlayer) {
        videoPlayer.src = `https://www.youtube.com/embed/${videoId}`;
    }
}

// Function to handle logo loading errors
function handleLogoError(img) {
    const logoContainer = document.querySelector('.logo');
    const allLogos = logoContainer.querySelectorAll('.logo-img');
    const placeholder = logoContainer.querySelector('.logo-placeholder');
    
    // Hide the failed image
    img.style.display = 'none';
    
    // Try to find another logo format
    let foundLogo = false;
    allLogos.forEach(logo => {
        if (logo.complete && logo.naturalHeight !== 0 && logo.style.display !== 'none') {
            logo.style.display = 'block';
            foundLogo = true;
        }
    });
    
    // If no logo found, show placeholder
    if (!foundLogo && placeholder) {
        const allHidden = Array.from(allLogos).every(logo => logo.style.display === 'none' || !logo.complete || logo.naturalHeight === 0);
        if (allHidden) {
            placeholder.style.display = 'flex';
        }
    }
}

// Try to load logo on page load
document.addEventListener('DOMContentLoaded', function() {
    const logoContainer = document.querySelector('.logo');
    const logos = logoContainer.querySelectorAll('.logo-img');
    const placeholder = logoContainer.querySelector('.logo-placeholder');
    
    // Try each logo format (PNG first, then other formats)
    const logoFormats = ['logo.png', 'logo.svg', 'logo.jpg', 'logo.jpeg'];
    let logoIndex = 0;
    
    function tryNextLogo() {
        if (logoIndex < logos.length) {
            const logo = logos[logoIndex];
            logo.style.display = 'block';
            logo.onload = function() {
                // Hide other logos and placeholder
                logos.forEach((l, i) => {
                    if (i !== logoIndex) l.style.display = 'none';
                });
                if (placeholder) placeholder.style.display = 'none';
            };
            logo.onerror = function() {
                logo.style.display = 'none';
                logoIndex++;
                tryNextLogo();
            };
            // Force reload
            logo.src = logoFormats[logoIndex];
        } else {
            // All logos failed, show placeholder
            if (placeholder) placeholder.style.display = 'flex';
        }
    }
    
    tryNextLogo();
});

// Function to handle search
function handleSearch(event) {
    event.preventDefault();
    const searchInput = event.target.querySelector('.search-input');
    const searchTerm = searchInput.value.trim();
    
    if (searchTerm) {
        // You can implement search functionality here
        console.log('Recherche:', searchTerm);
        // Example: filter articles, redirect to search page, etc.
        alert(`Recherche pour: ${searchTerm}`);
    }
}

// Export functions for external use
window.updateVideo = updateVideo;
window.renderArticles = renderArticles;
window.handleLogoError = handleLogoError;
window.handleSearch = handleSearch;

