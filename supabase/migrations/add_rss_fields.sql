-- Migration: Add RSS-specific fields to articles and sources tables
-- This migration adds fields needed for RSS feed aggregation

-- Add fields to sources table for RSS tracking
ALTER TABLE sources
ADD COLUMN IF NOT EXISTS last_fetch_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS fetch_status VARCHAR(20) DEFAULT 'active' CHECK (fetch_status IN ('active', 'paused', 'error')),
ADD COLUMN IF NOT EXISTS fetch_error_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_error_message TEXT;

-- Add RSS-specific fields to articles table
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS rss_guid TEXT,
ADD COLUMN IF NOT EXISTS canonical_url TEXT,
ADD COLUMN IF NOT EXISTS source_url TEXT;

-- Create unique index on rss_guid for deduplication
CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_rss_guid ON articles(rss_guid) WHERE rss_guid IS NOT NULL;

-- Create unique index on canonical_url for deduplication
CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_canonical_url ON articles(canonical_url) WHERE canonical_url IS NOT NULL;

-- Create index on source_url for faster queries
CREATE INDEX IF NOT EXISTS idx_articles_source_url ON articles(source_url);

-- Create index on last_fetch_date for sources
CREATE INDEX IF NOT EXISTS idx_sources_last_fetch ON sources(last_fetch_date);

-- Add comments
COMMENT ON COLUMN sources.last_fetch_date IS 'Last time this RSS feed was successfully fetched';
COMMENT ON COLUMN sources.fetch_status IS 'Current status of RSS feed fetching: active, paused, or error';
COMMENT ON COLUMN sources.fetch_error_count IS 'Number of consecutive fetch errors';
COMMENT ON COLUMN sources.last_error_message IS 'Last error message encountered during fetch';
COMMENT ON COLUMN articles.rss_guid IS 'GUID from RSS feed, used for deduplication';
COMMENT ON COLUMN articles.canonical_url IS 'Canonical URL of the article, used for deduplication';
COMMENT ON COLUMN articles.source_url IS 'URL of the source website';
