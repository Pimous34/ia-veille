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

// Course Preparation Articles - Articles to prepare for the next course
const coursePrepArticles = [
    {
        id: 8,
        title: "Les fondamentaux de l'IA pour débutants",
        excerpt: "Comprendre les bases de l'intelligence artificielle avant de plonger dans les outils avancés. Un guide essentiel pour bien démarrer.",
        category: "IA",
        tags: ["ChatGPT", "Gemini"],
        date: "2024-01-17",
        link: "#",
        image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800",
        coursePrep: true
    },
    {
        id: 9,
        title: "Premiers pas avec les prompts efficaces",
        excerpt: "Apprenez à formuler des prompts qui donnent des résultats précis et pertinents avec les IA génératives.",
        category: "IA",
        tags: ["ChatGPT", "Claude"],
        date: "2024-01-17",
        link: "#",
        image: "https://images.unsplash.com/photo-1676299080923-6c98c0cf4e48?w=800",
        coursePrep: true
    },
    {
        id: 10,
        title: "Introduction aux outils No-Code",
        excerpt: "Découvrez les plateformes No-Code les plus populaires et leurs cas d'usage pour créer sans coder.",
        category: "No-Code",
        tags: ["Bubble", "Webflow"],
        date: "2024-01-16",
        link: "#",
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800",
        coursePrep: true
    }
];

// Category Tags Configuration
const categoryTags = {
    'IA': ['ChatGPT', 'Gemini', 'Perplexity', 'Claude', 'Midjourney', 'DALL-E'],
    'No-Code': ['Bubble', 'Webflow', 'Airtable', 'Notion'],
    'Automatisation': ['Make', 'Zapier', 'n8n'],
    'Vibe-coding': ['Cursor', 'Winsurf', 'Antigravity', 'Bolt']
};

// ... (createArticleCard, formatDate, renderArticles functions remain same)

const globalFallbackImages = [
    "images/placeholders/placeholder_0.jpg",
    "images/placeholders/placeholder_1.jpg",
    "images/placeholders/placeholder_2.jpg",
    "images/placeholders/placeholder_3.jpg",
    "images/placeholders/placeholder_4.jpg",
    "images/placeholders/placeholder_5.jpg",
    "images/placeholders/placeholder_6.jpg",
    "images/placeholders/placeholder_7.jpg",
    "images/placeholders/placeholder_8.jpg",
    "images/placeholders/placeholder_9.jpg",
    "images/placeholders/placeholder_11.jpg",
    "images/placeholders/placeholder_12.jpg"
];

// Helper to get a deterministic random image based on string input
function getDeterministicImage(inputString) {
    let hash = 0;
    for (let i = 0; i < inputString.length; i++) {
        hash = inputString.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % globalFallbackImages.length;
    return globalFallbackImages[index];
}

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
                    'Replit': 'tag-replit',
                    'Winsurf': 'tag-winsurf',
                    'Antigravity': 'tag-antigravity',
                    'Bolt': 'tag-bolt'
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

    // Course Preparation Articles
    const coursePrepContainer = document.getElementById('coursePrepArticles');
    if (coursePrepContainer) {
        renderArticles(coursePrepArticles, 'coursePrepArticles');
    }

    // Logo Logic
    const logoContainer = document.querySelector('.logo');
    if (logoContainer) {
        const logos = logoContainer.querySelectorAll('.logo-img');
        const placeholder = logoContainer.querySelector('.logo-placeholder');

        const logoFormats = ['logo.png', 'logo.svg'];
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
        'Replit': 'tag-replit',
        'Winsurf': 'tag-winsurf',
        'Antigravity': 'tag-antigravity',
        'Bolt': 'tag-bolt'
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
            <div class="article-image-container">
                <img src="${article.image}" alt="${article.title}" class="article-image" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800';">
            </div>
            <div class="article-content">

                ${tagsHTML}
                <h3 class="article-title">${article.title}</h3>

                <div class="article-meta">
                    <span class="article-date">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        ${formatDate(article.date)}
                    </span>
                    <a href="article.html?id=${encodeURIComponent(article.title)}" class="article-link" onclick="event.stopPropagation()">
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
        const logoFormats = ['logo.png', 'logo.svg'];
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
                console.log('Fullscreen API failed, using CSS fallback', err);
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
window.jtArticles = jtArticles;
window.trendingArticles = trendingArticles;
window.coursePrepArticles = coursePrepArticles;

// Auth State Management
document.addEventListener('DOMContentLoaded', function() {
    if (typeof _supabase !== 'undefined') {
        // Listen for auth changes
        _supabase.auth.onAuthStateChange((event, session) => {
            updateAuthUI(session);
        });
        
        // Check initial session
        _supabase.auth.getSession().then(({ data: { session } }) => {
            updateAuthUI(session);
        });
    }
});

function updateAuthUI(session) {
    const authButton = document.querySelector('.auth-button');
    const authText = document.querySelector('.auth-text');
    
    if (!authButton) return;

    if (session) {
        // User is logged in
        const user = session.user;
        const displayName = user.user_metadata.full_name || user.user_metadata.name || user.email;
        
        if (authText) authText.textContent = displayName;
        
        // Change button behavior to logout (simple version)
        // In a real app, this would open a dropdown menu
        authButton.href = '#';
        authButton.onclick = (e) => {
            e.preventDefault();
            if (confirm(`Voulez-vous vous déconnecter de ${displayName} ?`)) {
                _supabase.auth.signOut().then(() => {
                    window.location.reload();
                });
            }
        };
    } else {
        // User is logged out
        if (authText) authText.textContent = 'S\'inscrire / Se connecter';
        authButton.href = 'auth.html';
        authButton.onclick = null;
    }
}

// Function to load the latest JT video from Supabase
async function loadLatestJT() {
    if (typeof _supabase === 'undefined') {
        console.warn('Supabase not initialized, cannot load JT');
        return;
    }

    try {
        const { data, error } = await _supabase
            .from('daily_news_videos')
            .select('*')
            .eq('status', 'completed')
            .order('date', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw error;

        if (data && data.video_url) {
            console.log('Latest JT found:', data);
            
            const videoPlayer = document.querySelector('.video-player');
            if (videoPlayer) {
                const jingleUrl = 'video/Jingle.mp4';
                const mainVideoUrl = data.video_url;

                // Set initial source to Jingle
                videoPlayer.src = jingleUrl;
                videoPlayer.muted = true; // Muted is required for autoplay
                videoPlayer.autoplay = true;
                videoPlayer.playsInline = true; // Important for mobile
                videoPlayer.preload = 'auto';
                
                // Update poster if thumbnail exists
                if (data.thumbnail_url) {
                    videoPlayer.poster = data.thumbnail_url;
                }

                // Force play attempt
                const playPromise = videoPlayer.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.log("Autoplay prevented:", error);
                        // Show a "Click to Play" overlay or similar if needed
                        // For now, we rely on the user interaction (click) to start if autoplay fails
                    });
                }

                // Handle click to unmute instead of pause
                const unmuteHandler = function(e) {
                    if (videoPlayer.muted) {
                        e.preventDefault();
                        videoPlayer.muted = false;
                        // If the click caused a pause, resume immediately
                        if (videoPlayer.paused) {
                            videoPlayer.play();
                        }
                    }
                };
                videoPlayer.addEventListener('click', unmuteHandler);

                // Handle Jingle end
                videoPlayer.onended = function() {
                    // Check if we just finished the jingle
                    if (videoPlayer.src.includes('Jingle.mp4')) {
                        console.log('Jingle finished, playing main video');
                        
                        // Pre-load main video logic could go here, but simple src switch is usually enough
                        videoPlayer.src = mainVideoUrl;
                        videoPlayer.load(); // Explicit load call
                        
                        // We must keep it muted if the user hasn't interacted yet to allow auto-transition
                        // But if they have unmuted the jingle, we want sound.
                        // However, browsers block unmuted autoplay without interaction.
                        // If jingle was playing unmuted, main video should play unmuted.
                        
                        const playMain = videoPlayer.play();
                        if (playMain !== undefined) {
                            playMain.catch(e => {
                                console.error("Main video autoplay failed:", e);
                                // Fallback: show controls and let user play
                                videoPlayer.controls = true;
                            });
                        }
                        
                        // Remove handler to prevent loop/issues when main video ends
                        videoPlayer.onended = null;
                        // Remove the unmute handler as main video should behave normally
                        videoPlayer.removeEventListener('click', unmuteHandler);
                    }
                };

                // Update title if possible
                const titleElement = document.getElementById('jt-section-title');
                if (titleElement) {
                    const date = new Date(data.date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                    });
                    titleElement.textContent = `JT News du ${date} : ${data.title}`;
                }

                // Populate "Sujets du JT" Column (Left - 1st column)
                if (data.article_ids && data.article_ids.length > 0) {
                    const { data: articles, error: articlesError } = await _supabase
                        .from('articles')
                        .select('id, title, image_url, url')
                        .in('id', data.article_ids)
                        .limit(5);

                    if (!articlesError && articles) {
                        const jtColumn = document.querySelector('.vignette-column:nth-child(1) .vignettes-list');
                        if (jtColumn) {
                            jtColumn.innerHTML = ''; // Clear placeholders
                            articles.forEach(article => {
                                const card = document.createElement('div');
                                card.className = 'vignette-card';
                                card.style.cursor = 'pointer';
                                
                                let bgImage = article.image_url;
                                if (!bgImage || bgImage === 'null' || bgImage === 'undefined' || (typeof bgImage === 'string' && bgImage.trim() === '')) {
                                    bgImage = getDeterministicImage(article.title);
                                }
                                
                                console.log(`Article: ${article.title}, Image: ${bgImage}`);
                                
                                card.innerHTML = `
                                    <img src="${bgImage}" class="vignette-image" alt="${article.title}" onerror="this.onerror=null; this.src='${getDeterministicImage(article.title)}';">
                                    <div class="vignette-info">${article.title}</div>
                                `;
                                
                                card.addEventListener('click', () => {
                                    if (article.url) {
                                        window.open(article.url, '_blank');
                                    } else {
                                        console.warn('No URL for article:', article.title);
                                    }
                                });

                                jtColumn.appendChild(card);
                            });
                        }
                    }
                }
            }
        } else {
            console.log('No JT video found');
        }
    } catch (err) {
        console.error('Error loading latest JT:', err);
    }
}

// Helper to generate tags from title
function generateTagsFromTitle(title) {
    const tags = [];
    const lowerTitle = title.toLowerCase();
    
    const tagKeywords = {
        'ChatGPT': ['chatgpt', 'openai', 'gpt'],
        'Gemini': ['gemini', 'google', 'bard'],
        'Claude': ['claude', 'anthropic'],
        'Midjourney': ['midjourney'],
        'No-Code': ['no-code', 'nocode', 'bubble', 'make', 'zapier', 'n8n'],
        'Dev': ['python', 'javascript', 'code', 'dev'],
        'Business': ['business', 'startup', 'levée', 'rachat']
    };
    
    for (const [tag, keywords] of Object.entries(tagKeywords)) {
        if (keywords.some(keyword => lowerTitle.includes(keyword))) {
            tags.push(tag);
        }
    }
    return tags;
}

// Function to load daily articles from Supabase
async function loadDailyArticles() {
    if (typeof _supabase === 'undefined') {
        return;
    }

    try {
        const { data, error } = await _supabase
            .from('articles')
            .select('*')
            .order('published_at', { ascending: false })
            .limit(30); // Fetch more to detect trends/buzz

        if (error) throw error;

        if (data && data.length > 0) {
            console.log('Articles loaded:', data.length);
            
            // Map Supabase articles
            let mappedArticles = data.map((article) => {
                const randomImage = getDeterministicImage(article.title + article.id); // Combine for uniqueness
                let displayTags = article.tags && article.tags.length > 0 ? article.tags : generateTagsFromTitle(article.title);
                
                let imageUrl = article.image_url;
                if (!imageUrl || imageUrl === 'null' || imageUrl === 'undefined' || (typeof imageUrl === 'string' && imageUrl.trim() === '')) {
                    imageUrl = randomImage;
                }
                
                return {
                    id: article.id,
                    title: article.title,
                    excerpt: (article.excerpt || '').replace(/<[^>]*>?/gm, ''),
                    category: 'IA',
                    tags: displayTags,
                    date: article.published_at,
                    link: article.url,
                    image: imageUrl
                };
            });

            // --- SMART SCORING ALGORITHM ---
            const interestingKeywords = ['nouveau', 'révolution', 'innovation', 'découverte', 'important', 'majeur', 'exclusif', 'outil', 'guide', 'comment', 'gpt-5', 'llm', 'agent'];
            
            mappedArticles = mappedArticles.map(article => {
                let score = 0;
                const lowerTitle = article.title.toLowerCase();
                const titleWords = lowerTitle.split(/\s+/).filter(w => w.length > 3);

                // 1. Keyword Bonus
                interestingKeywords.forEach(keyword => {
                    if (lowerTitle.includes(keyword)) score += 10;
                });
                
                // 2. Recency Bonus (Today = +10)
                const pubDate = new Date(article.date);
                const today = new Date();
                if (pubDate.toDateString() === today.toDateString()) score += 10;

                // 3. Buzz/Redundancy Bonus (Clustering)
                // If other articles have similar titles, it's a hot topic!
                const similarArticles = mappedArticles.filter(other => {
                    if (other.id === article.id) return false;
                    const otherWords = other.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
                    const intersection = titleWords.filter(w => otherWords.includes(w));
                    const similarity = intersection.length / Math.max(titleWords.length, otherWords.length);
                    return similarity > 0.35; // 35% similarity threshold
                });
                score += similarArticles.length * 20; // Big bonus for buzz

                return { ...article, score };
            });

            // Sort by Score DESC
            mappedArticles.sort((a, b) => b.score - a.score);

            // Update Trending Articles (Main section) - Show Top 15 sorted by relevance
            renderArticles(mappedArticles.slice(0, 15), 'trendingArticles');

                // Update "News" Column (Center - 2nd column) - Show Top 6 "Buzz"
            const newsColumn = document.querySelector('.vignette-column:nth-child(2) .vignettes-list');
            if (newsColumn) {
                newsColumn.innerHTML = ''; 
                
                mappedArticles.slice(0, 6).forEach(article => {
                    const card = document.createElement('div');
                    card.className = 'vignette-card';
                    card.style.cursor = 'pointer';
                    
                    // Add a "Hot" badge if score is high
                    const hotBadge = article.score > 20 ? '<span style="position:absolute; top:5px; right:5px; background:red; color:white; font-size:0.7em; padding:2px 6px; border-radius:10px;">HOT</span>' : '';

                    card.innerHTML = `
                        <div style="position: relative;">
                            <img src="${article.image}" class="vignette-image" alt="${article.title}" onerror="this.onerror=null; this.src='${getDeterministicImage(article.title)}';">
                            ${hotBadge}
                        </div>
                        <div class="vignette-info">
                            <div style="font-weight: bold; margin-bottom: 4px;">${article.title}</div>
                        </div>
                    `;
                    
                    card.addEventListener('click', () => {
                        if (article.link) {
                            window.open(article.link, '_blank');
                        }
                    });

                    newsColumn.appendChild(card);
                });
            }
        }
    } catch (err) {
        console.error('Error loading articles:', err);
    }
}

// Function to load tutorials from Supabase
async function loadTutorials() {
    if (typeof _supabase === 'undefined') {
        return;
    }

    try {
        const { data, error } = await _supabase
            .from('tutorials')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) throw error;

        if (data && data.length > 0) {
            // Update "Tutos" Column (Right - 3rd column)
            const tutosColumn = document.querySelector('.vignette-column:nth-child(3) .vignettes-list');
            if (tutosColumn) {
                tutosColumn.innerHTML = ''; // Clear placeholders

                data.forEach(tuto => {
                    const card = document.createElement('div');
                    card.className = 'vignette-card';
                    card.style.cursor = 'pointer';
                    
                    // 1. Try to get image from DB
                    let bgImage = tuto.image_url;
                    
                    // 2. Handle Airtable JSON object format
                    if (bgImage && typeof bgImage === 'string' && (bgImage.startsWith('{') || bgImage.startsWith('['))) {
                        try {
                            const parsed = JSON.parse(bgImage);
                            // Airtable often returns an array of attachments or a single object
                            const imageObj = Array.isArray(parsed) ? parsed[0] : parsed;
                            if (imageObj && imageObj.url) {
                                bgImage = imageObj.url;
                            }
                        } catch (e) {
                            console.warn('Failed to parse image JSON for tuto:', tuto.software, e);
                        }
                    }

                    // 3. If still no image, use Software-specific Fallback
                    if (!bgImage || bgImage === 'null') {
                        const softwareLower = (tuto.software || '').toLowerCase();
                        if (softwareLower.includes('notion')) bgImage = 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=400'; // Notebook/Laptop
                        else if (softwareLower.includes('airtable')) bgImage = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400'; // Data/Grid
                        else if (softwareLower.includes('n8n') || softwareLower.includes('make') || softwareLower.includes('zapier')) bgImage = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400'; // Automation/Chips
                        else if (softwareLower.includes('python') || softwareLower.includes('code')) bgImage = 'https://images.unsplash.com/photo-1555255707-c07966088b7b?w=400'; // Coding
                        else if (softwareLower.includes('lovable') || softwareLower.includes('flutter')) bgImage = 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400'; // Mobile App
                        else bgImage = 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400'; // Default Tech
                    }
                    
                    card.innerHTML = `
                        <img src="${bgImage}" class="vignette-image" alt="${tuto.software}" onerror="this.onerror=null; this.src='${getDeterministicImage(tuto.software || 'tuto')}';">
                        <div class="vignette-info">
                            <div style="font-weight: 900; font-size: 1.1em; color: #000; margin-bottom: 4px;">${tuto.software || 'Tuto'}</div>
                            <div style="font-size: 0.9em; color: #666;">${tuto.channel_name || ''}</div>
                        </div>
                    `;
                    
                    card.addEventListener('click', () => {
                        window.open(tuto.url, '_blank');
                    });

                    tutosColumn.appendChild(card);
                });
            }
        }
    } catch (err) {
        console.error('Error loading tutorials:', err);
    }
}

// Call functions on load
document.addEventListener('DOMContentLoaded', function() {
    loadLatestJT();
    loadDailyArticles();
    loadTutorials();
});

