-- Migration: Add onboarding fields to user_profiles table
-- This migration adds fields to track user onboarding completion and preferences

-- Add onboarding fields to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS user_type VARCHAR(20) CHECK (user_type IN ('professionnel', 'particulier')),
ADD COLUMN IF NOT EXISTS experience_level VARCHAR(20) CHECK (experience_level IN ('debutant', 'intermediaire', 'pro')),
ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tools_used TEXT[] DEFAULT '{}';

-- Create index for faster queries on onboarding_completed
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding ON user_profiles(onboarding_completed);

-- Add comment to document the purpose of these fields
COMMENT ON COLUMN user_profiles.onboarding_completed IS 'Indicates whether the user has completed the onboarding process';
COMMENT ON COLUMN user_profiles.user_type IS 'Type of user: professionnel or particulier';
COMMENT ON COLUMN user_profiles.experience_level IS 'User experience level with AI: debutant, intermediaire, or pro';
COMMENT ON COLUMN user_profiles.interests IS 'Array of AI topics the user is interested in';
COMMENT ON COLUMN user_profiles.tools_used IS 'Array of AI tools the user currently uses';
