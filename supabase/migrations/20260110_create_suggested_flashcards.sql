-- Migration: Create Suggested Flashcards Table
-- Date: 2026-01-10
-- Description: Table pour stocker les suggestions de flashcards des utilisateurs en attente de validation par l'admin.

CREATE TABLE IF NOT EXISTS suggested_flashcards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  category VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les perfs admin
CREATE INDEX IF NOT EXISTS suggested_flashcards_status_idx ON suggested_flashcards(status);
CREATE INDEX IF NOT EXISTS suggested_flashcards_created_at_idx ON suggested_flashcards(created_at DESC);

-- RLS
ALTER TABLE suggested_flashcards ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent proposer des cartes
CREATE POLICY "Users can suggest flashcards" 
ON suggested_flashcards
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Seul les admins peuvent tout voir et gérer
-- Note: On assume l'existence d'une table profiles ou d'un champ role dans metadata
CREATE POLICY "Anyone can suggest, admins manage" 
ON suggested_flashcards
FOR ALL 
USING (true) -- Permissif pour le développement, à restreindre selon le système de rôles réel
WITH CHECK (true);
