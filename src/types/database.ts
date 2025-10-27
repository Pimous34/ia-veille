export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  url: string;
  image_url?: string;
  source_id: string;
  category_id: string;
  published_at: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  read_time?: number;
  author?: string;
}

export interface Source {
  id: string;
  name: string;
  url: string;
  rss_url?: string;
  type: 'rss' | 'api' | 'scraping' | 'twitter';
  logo_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  preferences: UserPreferences;
  newsletter_frequency: 'daily' | 'weekly' | 'monthly';
  send_day?: number;
  timezone?: string;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  keywords: string[];
  categories: string[];
  sources: string[];
  excluded_keywords?: string[];
}

export interface UserActivityLog {
  id: string;
  user_id: string;
  article_id: string;
  action: 'view' | 'click' | 'save' | 'like' | 'dislike' | 'share';
  timestamp: string;
}

export interface SavedArticle {
  id: string;
  user_id: string;
  article_id: string;
  saved_at: string;
  notes?: string;
}

export interface ArticleScore {
  article_id: string;
  user_id: string;
  score: number;
  calculated_at: string;
}

export interface Newsletter {
  id: string;
  user_id: string;
  sent_at: string;
  articles: string[];
  status: 'pending' | 'sent' | 'failed';
}
