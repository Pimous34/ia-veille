# A faire

- [x] Fix TypeScript errors in supabase/functions/generate-daily-jt/index.ts
  - [x] Fix implicit 'any' for 'req'
  - [x] Fix 'unknown' type for catch variables
  - [x] Add DIDStatusResponse interface
  - [x] Create deno.json for Deno environment configuration
  - [x] Configure VS Code for Deno (settings.json)
- [ ] Configurer CORS Supabase pour localhost:8080 (Project Settings > API)
- [x] Mettre à jour la clé API D-ID et générer le JT (User Request)
- [x] Dupliquer le projet Supabase
    - [x] Migrer le schéma de base de données
    - [x] Déployer les Edge Functions
    - [x] Migrer les données (sources, articles, daily_news_videos)
    - [x] Migrer les fichiers Storage (vidéos, assets)
    - [x] Corriger les URLs dans la base de données
- [ ] Corriger le scénario Make (champ `type` -> "rss")
- [x] Fix lint errors in src/app/auth/page.tsx (Quotes escaping and Next/Image tags)
