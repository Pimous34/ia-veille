// Article Page Dynamic Content Loader
// Loads article content based on URL parameters

document.addEventListener('DOMContentLoaded', () => {
    // Get article ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');

    if (!articleId) {
        // If no article ID, show default content
        console.log('No article ID provided');
        return;
    }

    // Fetch article data from localStorage or use default data
    loadArticleContent(articleId);
});

async function loadArticleContent(articleId) {
    // Try to get article data from localStorage (if saved from main page)
    const articlesData = localStorage.getItem('articlesData');
    let article = null;

    // Check if articleId looks like a UUID (Supabase ID)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(articleId);

    if (articlesData && !isUUID) {
        const articles = JSON.parse(articlesData);
        // Try to find by title (legacy)
        article = articles.find(a => a.title === decodeURIComponent(articleId));
    }

    // If not found in localStorage or if it's a UUID, try fetching from Supabase
    if (!article && typeof _supabase !== 'undefined') {
        try {
            let query = _supabase.from('articles').select('*');
            
            if (isUUID) {
                query = query.eq('id', articleId);
            } else {
                query = query.eq('title', decodeURIComponent(articleId));
            }

            const { data, error } = await query.single();

            if (data) {
                // Check if we have content
                if (!data.content && data.url) {
                    if (isValidUrl(data.url)) {
                        // No content but we have a valid URL, redirect to source
                        window.location.href = data.url;
                        return;
                    } else {
                        console.warn('Invalid URL for article:', data.url);
                        // Fall through to display what we have (title, description)
                    }
                }

                article = {
                    title: data.title,
                    description: (data.excerpt || data.summary || '').replace(/<[^>]*>?/gm, ''),
                    content: data.content, // Get full content
                    category: 'IA', // Default or fetch from DB if available
                    tags: data.tags || [],
                    image: data.image_url,
                    link: data.url,
                    date: data.published_at
                };
            } else if (error) {
                console.error('Error fetching article from Supabase:', error);
            }
        } catch (err) {
            console.error('Unexpected error loading article:', err);
        }
    }

    // If article found, update the page content
    if (article) {
        updatePageContent(article);
    } else {
        // Article not found
        console.log('Article not found');
        document.title = "Article non trouvé - OREEGAM'IA";
        
        const container = document.querySelector('.article-container');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 4rem 2rem;">
                    <h1 style="font-size: 2rem; margin-bottom: 1rem;">Article non trouvé</h1>
                    <p style="color: #64748b; margin-bottom: 2rem;">L'article que vous cherchez n'existe pas ou a été déplacé.</p>
                    <a href="index.html" class="article-source-btn">Retour à l'accueil</a>
                </div>
            `;
        }
    }
}

function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

function updatePageContent(article) {
    // Update page title
    document.title = `${article.title} - OREEGAM'IA`;

    // Update article title
    const titleElement = document.querySelector('.article-title');
    if (titleElement) {
        titleElement.textContent = article.title;
    }

    // Update breadcrumb
    const breadcrumbSpan = document.querySelector('.article-breadcrumb span:last-child');
    if (breadcrumbSpan) {
        breadcrumbSpan.textContent = article.title.substring(0, 30) + '...';
    }

    // Update tags
    const tagsContainer = document.querySelector('.article-tags');
    if (tagsContainer && article.tags) {
        tagsContainer.innerHTML = article.tags.map(tag =>
            `<a href="#" class="article-tag">${tag}</a>`
        ).join('');
    }

    // Update category badge in breadcrumb
    const categoryLink = document.querySelector('.article-breadcrumb a:nth-child(3)');
    if (categoryLink && article.category) {
        categoryLink.textContent = article.category;
    }

    // Update featured image if available
    const featuredImage = document.querySelector('.article-featured-image');
    if (featuredImage && article.image) {
        featuredImage.innerHTML = `<img src="${article.image}" alt="${article.title}" style="width: 100%; height: 100%; object-fit: cover;">`;
        featuredImage.style.background = 'none'; // Remove gradient if image exists
    }

    // Update article content
    const contentContainer = document.querySelector('.article-content');
    if (contentContainer) {
        if (article.content) {
            contentContainer.innerHTML = article.content;
        } else if (article.description) {
            contentContainer.innerHTML = `<p>${article.description}</p>`;
        }
    }

    // Update source link
    const sourceBtn = document.querySelector('.article-source-btn');
    if (sourceBtn && article.link) {
        sourceBtn.href = article.link;
    }

    // Update read time if available
    const readTime = document.querySelector('.article-read-time');
    if (readTime && article.readTime) {
        readTime.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            ${article.readTime}
        `;
    }
}

// Store articles data in localStorage when on main page
if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
    // This will be called from script.js after articles are loaded
    window.storeArticlesData = function (articles) {
        localStorage.setItem('articlesData', JSON.stringify(articles));
    };
}
