# Script pour améliorer le style des boutons
import re

# Lire le fichier
with open('article.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Nouveau style harmonieux avec le design de la page
new_styles = """
        /* Article Action Bar */
        .article-action-bar {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            margin: 2.5rem 0;
            padding: 0;
            background: transparent;
            border-radius: 0;
            border: none;
        }

        .action-btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
            border: 2px solid rgba(102, 126, 234, 0.2);
            border-radius: 12px;
            font-size: 0.875rem;
            font-weight: 600;
            color: #667eea;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
        }

        .action-btn:hover {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-color: #667eea;
            color: white;
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
        }

        .action-btn svg {
            width: 20px;
            height: 20px;
            transition: transform 0.3s ease;
        }

        .action-btn:hover svg {
            transform: scale(1.1);
        }

        .like-dislike-group {
            display: flex;
            gap: 1rem;
            margin-left: auto;
        }

        .like-btn {
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%);
            border-color: rgba(16, 185, 129, 0.2);
            color: #10b981;
        }

        .like-btn:hover {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            border-color: #10b981;
            color: white;
        }

        .dislike-btn {
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%);
            border-color: rgba(239, 68, 68, 0.2);
            color: #ef4444;
        }

        .dislike-btn:hover {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            border-color: #ef4444;
            color: white;
        }

        @media (max-width: 768px) {
            .article-action-bar {
                flex-direction: column;
            }
            
            .like-dislike-group {
                margin-left: 0;
                width: 100%;
            }
            
            .action-btn {
                flex: 1;
                justify-content: center;
            }
        }
"""

# Remplacer les anciens styles
old_pattern = r'/\* Article Action Bar \*/[\s\S]*?(?=\s*/\* Tags \*/)'
content = re.sub(old_pattern, new_styles + '\n        ', content)

# Sauvegarder
with open('article.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Style des boutons ameliore!")
print("  - Gradients violets harmonises avec la page")
print("  - Bordures arrondies modernes")
print("  - Effets hover elegants")
print("  - Boutons J'aime (vert) et J'aime pas (rouge)")
