import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import HomeClient from '@/components/HomeClient';
import React from 'react';

// --- Types (Duplicated from HomeClient to ensure Type Safety on Server) ---
interface Article {
  id: number | string;
  title: string;
  excerpt?: string;
  category?: string;
  tags?: string[];
  date: string;
  published_at: string;
  link?: string;
  url?: string;
  image: string;
  image_url?: string;
  score?: number;
}

interface Tutorial {
  id: number;
  software: string;
  channel_name: string;
  url: string;
  image_url: string;
}

interface JtVideo {
  id: number | string;
  video_url: string;
  thumbnail_url?: string;
  title?: string;
  date: string;
  article_ids?: number[];
}

// --- Helpers ---
const globalFallbackImages = [
  "/images/placeholders/placeholder_0.jpg",
  "/images/placeholders/placeholder_1.jpg",
  "/images/placeholders/placeholder_3.jpg",
  "/images/placeholders/placeholder_4.jpg",
  "/images/placeholders/placeholder_5.jpg",
  "/images/placeholders/placeholder_6.jpg",
  "/images/placeholders/placeholder_8.jpg",
  "/images/placeholders/placeholder_9.jpg",
  "/images/placeholders/placeholder_11.jpg",
  "/images/placeholders/placeholder_12.jpg"
];

function getDeterministicImage(inputString: string) {
  if (!inputString) return globalFallbackImages[0];
  let hash = 0;
  for (let i = 0; i < inputString.length; i++) {
    hash = inputString.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % globalFallbackImages.length;
  return globalFallbackImages[index];
}

// --- Fallback Data ---
const fallbackJtArticles: Article[] = [
  {
    id: 1,
    title: "L'IA générative révolutionne le développement d'applications",
    excerpt: "Découvrez comment les outils d'IA générative transforment la façon dont nous créons des applications.",
    category: "IA",
    tags: ["ChatGPT", "Claude"],
    date: "2024-01-15",
    published_at: "2024-01-15",
    link: "#",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800"
  },
  {
    id: 2,
    title: "No-Code : La démocratisation de la création digitale",
    excerpt: "Les plateformes No-Code permettent désormais à tous de créer des applications professionnelles.",
    category: "No-Code",
    tags: ["Bubble", "Webflow"],
    date: "2024-01-14",
    published_at: "2024-01-14",
    link: "#",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800"
  },
  {
    id: 3,
    title: "ChatGPT et les assistants IA : Nouveaux outils de productivité",
    excerpt: "Comment les assistants IA comme ChatGPT changent la productivité.",
    category: "IA",
    tags: ["ChatGPT"],
    date: "2024-01-13",
    published_at: "2024-01-13",
    link: "#",
    image: "https://images.unsplash.com/photo-1676299080923-6c98c0cf4e48?w=800"
  }
];

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  // --- Data Fetching (Parallelized) ---
  
  // 1. Fetch Latest JTs
  const jtPromise = supabase
      .from('daily_news_videos')
      .select('id, video_url, thumbnail_url, title, date, article_ids, status')
      .eq('status', 'completed')
      .order('date', { ascending: false })
      .limit(10);

  // 2. Fetch Articles for Buzz
  const articlesPromise = supabase
      .from('articles')
      .select('id, title, excerpt, tags, published_at, url, image_url, source_id')
      .order('published_at', { ascending: false })
      .limit(30);

  // 3. Fetch External Videos Sources
  const sourcesPromise = supabase
      .from('sources')
      .select('id')
      .in('name', ['Micode', 'Underscore_', 'Ludovic Salenne', 'GEEK CONCEPT']);

  // 4. Fetch Tutorials
  const tutorialsPromise = supabase
      .from('tutorials')
      .select('id, software, channel_name, url, image_url, created_at')
      .order('created_at', { ascending: false })
      .limit(20); // Limit to 20 for client-side filtering flexibility if needed later

  const [
    { data: jtDataList }, 
    { data: articlesData }, 
    { data: sourceIdsData },
    { data: tutoData }
  ] = await Promise.all([jtPromise, articlesPromise, sourcesPromise, tutorialsPromise]);

  // --- Data Processing (Server Side) ---

  // Process JTs
  let fetchedJts: JtVideo[] = [];
  if (jtDataList && jtDataList.length > 0) {
      fetchedJts = jtDataList.map((jt: JtVideo) => ({
        ...jt,
        thumbnail_url: jt.thumbnail_url || getDeterministicImage(jt.title || 'JT IA')
      }));
  }

  // Process Trending Articles
  let trendingArticles: Article[] = fallbackJtArticles;
  if (articlesData && articlesData.length > 0) {
      const interestingKeywords = ['nouveau', 'révolution', 'innovation', 'découverte', 'important', 'majeur', 'exclusif', 'outil', 'guide', 'comment', 'gpt-5', 'llm', 'agent'];
      
      const mapped = articlesData.map((article: any) => {
         let score = 0;
         const lowerTitle = article.title?.toLowerCase() || '';
         interestingKeywords.forEach(k => {
           if (lowerTitle.includes(k)) score += 10;
         });
         if (new Date(article.published_at).toDateString() === new Date().toDateString()) score += 10;
         
         return {
           id: article.id,
           title: article.title,
           excerpt: (article.excerpt || '').replace(/<[^>]*>?/gm, ''),
           category: 'IA',
           tags: article.tags,
           date: article.published_at,
           published_at: article.published_at,
           link: article.url,
           image: article.image_url || getDeterministicImage(article.title),
           score
         };
      });

      mapped.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
      trendingArticles = mapped.slice(0, 15);
  }

  // Process External Videos for Column
  let externalVideos: JtVideo[] = [];
  if (sourceIdsData && sourceIdsData.length > 0) {
      const ids = sourceIdsData.map(s => s.id);
      const { data: extArticles } = await supabase
          .from('articles')
          .select('id, title, url, image_url, published_at, source_id')
          .in('source_id', ids)
          .order('published_at', { ascending: false })
          .limit(10);

      if (extArticles) {
          externalVideos = extArticles.map((a: any) => ({
              id: a.id,
              video_url: a.url,
              thumbnail_url: a.image_url || getDeterministicImage(a.title),
              title: a.title,
              date: a.published_at,
              article_ids: []
          }));
      }
  }

  // Combined Videos Column
  const combinedVideos = [...fetchedJts, ...externalVideos].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // Process Tutorials
  let parsedTutos: Tutorial[] = [];
  if (tutoData) {
      // Simplified filtering (take top 5 for now as we don't have promoConfig on server easily without User DB fetch)
      // If we needed personalization, we would fetch user profile here.
      const limitedTutos = tutoData.slice(0, 5);

      parsedTutos = limitedTutos.map((tuto: any) => {
          let bgImage = tuto.image_url;
          if (bgImage && typeof bgImage === 'string' && (bgImage.startsWith('{') || bgImage.startsWith('['))) {
              try {
                  const parsed = JSON.parse(bgImage);
                  const imageObj = Array.isArray(parsed) ? parsed[0] : parsed;
                  if (imageObj && imageObj.url) {
                      bgImage = imageObj.url;
                  }
              } catch (e) { 
                  // ignore
              }
          }
          return { ...tuto, image_url: bgImage };
      });
  }

  return (
    <HomeClient 
      initialJtVideos={fetchedJts}
      initialArticles={trendingArticles}
      initialTutorials={parsedTutos}
      initialVideosColumn={combinedVideos}
    />
  );
}
