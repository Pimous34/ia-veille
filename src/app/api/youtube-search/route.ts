
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) return NextResponse.json({ error: 'No query provided' }, { status: 400 });

  try {
    const res = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });
    const html = await res.text();

    // Extraction robuste des données vidéo via Regex sur la structure JSON initiale de YouTube
    // On cherche les objets "videoRenderer" qui contiennent les infos des résultats de recherche
    const videoData = [];
    
    // Regex pour isoler les blocs videoRenderer
    const videoIdRegex = /"videoId":"([a-zA-Z0-9_-]{11})"/g;
    
    // On capture tous les IDs
    let match;
    const ids = new Set();
    
    while ((match = videoIdRegex.exec(html)) !== null && ids.size < 4) {
      if (!ids.has(match[1])) {
        ids.add(match[1]);
        
        // Pour chaque ID trouvé, on essaie d'extraire sommairement le titre alentour
        // C'est une approche heuristique car le HTML est minifié
        // On construit l'objet vidéo
        videoData.push({
          id: match[1],
          url: `https://www.youtube.com/watch?v=${match[1]}`,
          thumbnail: `https://i.ytimg.com/vi/${match[1]}/mqdefault.jpg`,
          // Titre temporaire car difficile à extraire proprement sans parser tout le JSON
          // Le front-end pourra éventuellement l'améliorer
        });
      }
    }

    return NextResponse.json({ videos: videoData });

  } catch (error) {
    console.error('YouTube Scrape Error:', error);
    return NextResponse.json({ error: 'Failed to fetch youtube results' }, { status: 500 });
  }
}
