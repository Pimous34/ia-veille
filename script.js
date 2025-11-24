// Sample articles data - Replace with your actual data source
const jtArticles = [
    {
        id: 1,
        title: "L'IA générative révolutionne le développement d'applications",
        excerpt: "Découvrez comment les outils d'IA générative transforment la façon dont nous créons des applications, réduisant le temps de développement de manière significative.",
        category: "IA",
        tags: ["ChatGPT", "Claude"],
        date: "2024-01-15",
        link: "#",
        image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800"
    },
    {
        id: 2,
        title: "No-Code : La démocratisation de la création digitale",
        excerpt: "Les plateformes No-Code permettent désormais à tous de créer des applications professionnelles sans connaissances en programmation.",
        category: "No-Code",
        tags: ["Bubble", "Webflow"],
        date: "2024-01-14",
        link: "#",
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800"
    },
    {
        id: 3,
        title: "ChatGPT et les assistants IA : Nouveaux outils de productivité",
        excerpt: "Comment les assistants IA comme ChatGPT changent la productivité des développeurs et créateurs de contenu.",
        category: "IA",
        tags: ["ChatGPT"],
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
        tags: ["Midjourney", "DALL-E"],
        date: "2024-01-16",
        link: "#",
        image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800"
    },
    {
        id: 5,
        title: "Bubble.io : Créer une SaaS complète sans coder",
        excerpt: "Guide complet pour créer votre première application SaaS avec Bubble.io, la plateforme No-Code la plus populaire.",
        category: "No-Code",
        tags: ["Bubble"],
        date: "2024-01-15",
        link: "#",
        image: "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800"
    },
    {
        id: 6,
        title: "L'avenir du travail avec l'IA : Opportunités et défis",
        excerpt: "Exploration des transformations que l'IA apporte au monde du travail et comment s'y adapter.",
        category: "IA",
        tags: ["Gemini", "Perplexity"],
        date: "2024-01-14",
        link: "#",
        image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800"
    },
    {
        id: 7,
        title: "Webflow : Design et développement réunis",
        excerpt: "Découvrez comment Webflow révolutionne la création de sites web en combinant design visuel et développement.",
        category: "No-Code",
        tags: ["Webflow"],
        date: "2024-01-13",
        link: "#",
        image: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800"
    }
];

// Category Tags Configuration
const categoryTags = {
    'IA': ['ChatGPT', 'Gemini', 'Perplexity', 'Claude', 'Midjourney', 'DALL-E'],
    'No-Code': ['Bubble', 'Webflow', 'Make', 'Airtable', 'Notion'],
    'Automatisation': ['Make', 'Zapier', 'n8n'],
    'Vibe-coding': ['Cursor', 'Replit']
};

// ... (createArticleCard, formatDate, renderArticles functions remain same)

// Try to load logo on page load
document.addEventListener('DOMContentLoaded', function () {
    // Category Page Logic
    const categoryArticlesContainer = document.getElementById('categoryArticles');
    if (categoryArticlesContainer) {
        const urlParams = new URLSearchParams(window.location.search);
        const category = urlParams.get('category');

        // Combine all articles for filtering
        const allArticles = [...jtArticles, ...trendingArticles];

        if (category) {
            document.getElementById('categoryTitle').textContent = `Catégorie : ${category}`;
            document.title = `OREEGAM'IA - ${category}`;

            // Render Sub-category Tags
            const tagsContainer = document.getElementById('subcategoryTags');
            if (tagsContainer && categoryTags[category]) {
                const tags = categoryTags[category];

                // Tag color mapping (same as article tags)
                const tagColors = {
                    'ChatGPT': 'tag-chatgpt',
                    'Gemini': 'tag-gemini',
                    'Perplexity': 'tag-perplexity',
                    'Claude': 'tag-claude',
                    'Midjourney': 'tag-midjourney',
                    'DALL-E': 'tag-dalle',
                    'Bubble': 'tag-bubble',
                    'Webflow': 'tag-webflow',
                    'Make': 'tag-make',
                    'Airtable': 'tag-airtable',
                    'Notion': 'tag-notion',
                    'Zapier': 'tag-zapier',
                    'n8n': 'tag-n8n',
                    'Cursor': 'tag-cursor',
                    'Replit': 'tag-replit'
                };

                tagsContainer.innerHTML = tags.map(tag => {
                    const colorClass = tagColors[tag] || 'tag-default';
                    return `<button class="tag-btn ${colorClass}" onclick="filterByTag('${tag}')">${tag}</button>`;
                }).join('');
            }

            // Initial Filter (Show all for category)
            const filteredArticles = allArticles.filter(article => article.category === category);
            renderArticles(filteredArticles, 'categoryArticles');

            // Expose filter function globally for this page scope
            window.filterByTag = function (tag) {
                // Toggle active class on buttons
                const buttons = document.querySelectorAll('.tag-btn');
                let isActive = false;

                buttons.forEach(btn => {
                    if (btn.textContent === tag) {
                        if (btn.classList.contains('active')) {
                            btn.classList.remove('active');
                            isActive = false;
                        } else {
                            btn.classList.add('active');
                            isActive = true;
                        }
                    } else {
                        btn.classList.remove('active');
                    }
                });

                if (isActive) {
                    // Filter by tag
                    const tagFiltered = filteredArticles.filter(article => article.tags && article.tags.includes(tag));
                    renderArticles(tagFiltered, 'categoryArticles');
                } else {
                    // Show all for category
                    renderArticles(filteredArticles, 'categoryArticles');
                }
            };

        } else {
            document.getElementById('categoryTitle').textContent = `Tous les articles`;
            renderArticles(allArticles, 'categoryArticles');
        }
    }

    // Index Page Logic
    const jtContainer = document.getElementById('jtArticles');
    if (jtContainer) {
        renderArticles(jtArticles, 'jtArticles');
    }

    const trendingContainer = document.getElementById('trendingArticles');
    if (trendingContainer) {
        renderArticles(trendingArticles, 'trendingArticles');
    }

    // Logo Logic
    const logoContainer = document.querySelector('.logo');
    if (logoContainer) {
        const logos = logoContainer.querySelectorAll('.logo-img');
        const placeholder = logoContainer.querySelector('.logo-placeholder');

        const logoFormats = ['logo.png', 'logo.svg', 'logo.jpg', 'logo.jpeg'];
        let logoIndex = 0;

        function tryNextLogo() {
            if (logoIndex < logos.length) {
                const logo = logos[logoIndex];
                logo.style.display = 'block';
                logo.onload = function () {
                    logos.forEach((l, i) => {
                        if (i !== logoIndex) l.style.display = 'none';
                    });
                    if (placeholder) placeholder.style.display = 'none';
                };
                logo.onerror = function () {
                    logo.style.display = 'none';
                    logoIndex++;
                    tryNextLogo();
                };
                logo.src = logoFormats[logoIndex];
            } else {
                if (placeholder) placeholder.style.display = 'flex';
            }
        }

        tryNextLogo();
    }
});

function createArticleCard(article) {
    // Tag color mapping
    const tagColors = {
        'ChatGPT': 'tag-chatgpt',
        'Gemini': 'tag-gemini',
        'Perplexity': 'tag-perplexity',
        'Claude': 'tag-claude',
        'Midjourney': 'tag-midjourney',
        'DALL-E': 'tag-dalle',
        'Bubble': 'tag-bubble',
        'Webflow': 'tag-webflow',
        'Make': 'tag-make',
        'Airtable': 'tag-airtable',
        'Notion': 'tag-notion',
        'Zapier': 'tag-zapier',
        'n8n': 'tag-n8n',
        'Cursor': 'tag-cursor',
        'Replit': 'tag-replit'
    };

    // Generate tags HTML if tags exist
    const tagsHTML = article.tags && article.tags.length > 0
        ? `<div class="article-tags">
            ${article.tags.map(tag => {
            const colorClass = tagColors[tag] || 'tag-default';
            return `<span class="article-tag ${colorClass}">${tag}</span>`;
        }).join('')}
           </div>`
        : '';

    return `
        <article class="article-card" onclick="window.open('${article.link}', '_blank')">
            <img src="${article.image}" alt="${article.title}" class="article-image" onerror="this.style.display='none'">
            <div class="article-content">
                <span class="article-category">${article.category}</span>
                ${tagsHTML}
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

// Initialize the page - Logic moved to main DOMContentLoaded listener

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
document.addEventListener('DOMContentLoaded', function () {
    // Category Page Logic
    const categoryArticlesContainer = document.getElementById('categoryArticles');
    if (categoryArticlesContainer) {
        const urlParams = new URLSearchParams(window.location.search);
        const category = urlParams.get('category');

        // Combine all articles for filtering
        // Note: In a real app, you might fetch this from an API
        const allArticles = [...jtArticles, ...trendingArticles];

        if (category) {
            document.getElementById('categoryTitle').textContent = `Catégorie : ${category}`;
            document.title = `OREEGAM'IA - ${category}`;

            // Filter articles
            const filteredArticles = allArticles.filter(article => article.category === category);
            renderArticles(filteredArticles, 'categoryArticles');
        } else {
            document.getElementById('categoryTitle').textContent = `Tous les articles`;
            renderArticles(allArticles, 'categoryArticles');
        }
    }

    // Index Page Logic
    const jtContainer = document.getElementById('jtArticles');
    if (jtContainer) {
        renderArticles(jtArticles, 'jtArticles');
    }

    const trendingContainer = document.getElementById('trendingArticles');
    if (trendingContainer) {
        renderArticles(trendingArticles, 'trendingArticles');
    }

    // Logo Logic
    const logoContainer = document.querySelector('.logo');
    if (logoContainer) {
        const logos = logoContainer.querySelectorAll('.logo-img');
        const placeholder = logoContainer.querySelector('.logo-placeholder');

        // Try each logo format (PNG first, then other formats)
        const logoFormats = ['logo.png', 'logo.svg', 'logo.jpg', 'logo.jpeg'];
        let logoIndex = 0;

        function tryNextLogo() {
            if (logoIndex < logos.length) {
                const logo = logos[logoIndex];
                logo.style.display = 'block';
                logo.onload = function () {
                    // Hide other logos and placeholder
                    logos.forEach((l, i) => {
                        if (i !== logoIndex) l.style.display = 'none';
                    });
                    if (placeholder) placeholder.style.display = 'none';
                };
                logo.onerror = function () {
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
    }
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

// Format Switcher Logic
function toggleFormatMenu() {
    const menu = document.getElementById('formatMenu');
    menu.classList.toggle('show');
}

function setFormat(format) {
    // Hide all formats
    document.querySelectorAll('.format-content').forEach(el => {
        el.style.display = 'none';
        el.classList.remove('active');
    });

    // Show selected format
    const selected = document.getElementById(`format-${format}`);
    if (selected) {
        selected.style.display = 'block';
        // Small delay to allow display:block to apply before adding active class for potential transitions
        setTimeout(() => selected.classList.add('active'), 10);
    }

    // Close menu
    document.getElementById('formatMenu').classList.remove('show');
}

// Fullscreen Logic
function toggleFullscreen() {
    const videoColumn = document.querySelector('.video-column');

    if (!document.fullscreenElement) {
        if (videoColumn.requestFullscreen) {
            videoColumn.requestFullscreen();
        } else if (videoColumn.webkitRequestFullscreen) { /* Safari */
            videoColumn.webkitRequestFullscreen();
        } else if (videoColumn.msRequestFullscreen) { /* IE11 */
            videoColumn.msRequestFullscreen();
        }
        videoColumn.classList.add('fullscreen');
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) { /* Safari */
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE11 */
            document.msExitFullscreen();
        }
        videoColumn.classList.remove('fullscreen');
    }
}

// Listen for fullscreen change events (ESC key etc)
document.addEventListener('fullscreenchange', handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
document.addEventListener('mozfullscreenchange', handleFullscreenChange);
document.addEventListener('MSFullscreenChange', handleFullscreenChange);

// Helper to update button icon
function updateFullscreenButton(isFullscreen) {
    const btn = document.querySelector('.fullscreen-btn');
    const btnPath = btn ? btn.querySelector('svg path') : null;

    const expandPath = "M15 3h6v6M21 3l-7 7M9 21H3v-6M3 21l7-7";
    const compressPath = "M4 14h6v6M10 14L3 21M20 10h-6V4M14 10l7-7";

    if (isFullscreen) {
        if (btnPath) btnPath.setAttribute('d', compressPath);
        if (btn) btn.setAttribute('aria-label', 'Quitter plein écran');
    } else {
        if (btnPath) btnPath.setAttribute('d', expandPath);
        if (btn) btn.setAttribute('aria-label', 'Plein écran');
    }
}

// Fullscreen Logic
function toggleFullscreen() {
    const videoColumn = document.querySelector('.video-column');
    const isFullscreen = document.fullscreenElement ||
        document.webkitIsFullScreen ||
        document.mozFullScreen ||
        document.msFullscreenElement ||
        videoColumn.classList.contains('fullscreen');

    if (!isFullscreen) {
        // Enter fullscreen
        if (videoColumn.requestFullscreen) {
            videoColumn.requestFullscreen().catch(err => {
                // Fallback if requestFullscreen fails (e.g. user denied or not allowed)
                console.log('Fullscreen API failed, using CSS fallback');
            });
        } else if (videoColumn.webkitRequestFullscreen) { /* Safari */
            videoColumn.webkitRequestFullscreen();
        } else if (videoColumn.msRequestFullscreen) { /* IE11 */
            videoColumn.msRequestFullscreen();
        }
        // Always add class for CSS styling (and fallback)
        videoColumn.classList.add('fullscreen');
        updateFullscreenButton(true);
    } else {
        // Exit fullscreen
        if (document.fullscreenElement || document.webkitIsFullScreen || document.mozFullScreen || document.msFullscreenElement) {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) { /* Safari */
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) { /* IE11 */
                document.msExitFullscreen();
            }
        }
        // Always remove class
        videoColumn.classList.remove('fullscreen');
        updateFullscreenButton(false);
    }
}

function handleFullscreenChange() {
    const videoColumn = document.querySelector('.video-column');
    const isApiFullscreen = document.fullscreenElement || document.webkitIsFullScreen || document.mozFullScreen || document.msFullscreenElement;

    if (!isApiFullscreen && !videoColumn.classList.contains('fullscreen')) {
        // Only reset if both API and class say we are not fullscreen
        // But if API exited, we should probably sync the class
        videoColumn.classList.remove('fullscreen');
        updateFullscreenButton(false);
    } else if (isApiFullscreen) {
        videoColumn.classList.add('fullscreen');
        updateFullscreenButton(true);
    }
}

// Close menu when clicking outside
document.addEventListener('click', function (event) {
    const controls = document.querySelector('.format-controls');
    const menu = document.getElementById('formatMenu');

    if (controls && !controls.contains(event.target) && menu.classList.contains('show')) {
        menu.classList.remove('show');
    }
});

// Export functions for external use
window.updateVideo = updateVideo;
window.renderArticles = renderArticles;
window.handleLogoError = handleLogoError;
window.handleSearch = handleSearch;
window.toggleFormatMenu = toggleFormatMenu;
window.setFormat = setFormat;
window.toggleFullscreen = toggleFullscreen;

