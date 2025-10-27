export interface User {
  id: string;
  email?: string;
  user_metadata?: {
    [key: string]: any;
  };
  app_metadata?: {
    [key: string]: any;
  };
  aud?: string;
  created_at?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  preferences?: {
    keywords: string[];
    categories: string[];
    sources: string[];
    excluded_keywords: string[];
  };
  newsletter_frequency?: 'daily' | 'weekly' | 'monthly';
  send_day?: number;
  timezone?: string;
  onboarding_completed?: boolean;
  user_type?: 'professionnel' | 'particulier';
  experience_level?: 'debutant' | 'intermediaire' | 'pro';
  interests?: string[];
  tools_used?: string[];
  created_at?: string;
  updated_at?: string;
}
