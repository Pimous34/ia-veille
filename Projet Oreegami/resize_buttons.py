# Script pour réduire la taille des boutons
import re

# Lire le fichier
with open('article.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Nouveau style avec tailles réduites
resized_styles = """
        /* Article Action Bar */
        .article-action-bar {
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
            margin: 2rem 0;
            padding: 0;
            background: transparent;
            border-radius: 0;
            border: none;
        }

        .action-btn {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.5rem 1rem;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
            border: 1px solid rgba(102, 126, 234, 0.2);
            border-radius: 50px;
            font-size: 0.75rem;
            font-weight: 600;
            color: #667eea;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 6px rgba(102, 126, 234, 0.1);
        }

        .action-btn:hover {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-color: #667eea;
            color: white;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.25);
        }

        .action-btn svg {
            width: 16px;
            height: 16px;
            transition: transform 0.3s ease;
        }

        .action-btn:hover svg {
            transform: scale(1.1);
        }

        .like-dislike-group {
            display: flex;
            gap: 0.75rem;
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
                gap: 0.5rem;
            }
            
            .like-dislike-group {
                margin-left: 0;
                width: 100%;
                justify-content: space-between;
            }
            
            .action-btn {
                flex: 1;
                justify-content: center;
            }
        }
"""

# Remplacer les anciens styles
# On cherche le bloc CSS qui commence par /* Article Action Bar */ et finit avant /* Tags */
old_pattern = r'/\* Article Action Bar \*/[\s\S]*?(?=\s*/\* Tags \*/)'
content = re.sub(old_pattern, resized_styles + '\n        ', content)

# Sauvegarder
with open('article.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Taille des boutons reduite!")
print("  - Padding reduit (0.5rem 1rem)")
print("  - Font-size reduite (0.75rem)")
print("  - Icones reduites (16px)")
print("  - Border-radius ajuste (50px) pour un style 'pill' plus compact")
