-- Création de la table 'tutorials' (Tutos)
CREATE TABLE IF NOT EXISTS tutorials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    channel_name TEXT,          -- Nom chaine youtube
    url TEXT NOT NULL,          -- URL
    software TEXT               -- Logiciel (ex: Photoshop, Excel, etc.)
);

-- Activer la sécurité (RLS)
ALTER TABLE tutorials ENABLE ROW LEVEL SECURITY;

-- Politique : Tout le monde peut lire (public)
CREATE POLICY "Public tutorials are viewable by everyone" 
ON tutorials FOR SELECT 
USING (true);

-- Politique : Seul l'admin (service_role) peut modifier/ajouter
-- (Vous pourrez aussi ajouter des politiques pour les utilisateurs connectés plus tard)
