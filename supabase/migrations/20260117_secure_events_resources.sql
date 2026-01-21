-- Migration: Secure Tables (Events, Ressources)
-- Date: 2026-01-17
-- Description: Enable RLS and add basic security policies for events and resource tables.

-- 1. Security for 'events' table
ALTER TABLE IF EXISTS "public"."events" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Events are viewable by everyone" ON "public"."events";
CREATE POLICY "Events are viewable by everyone" 
ON "public"."events" 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Only admins can manage events" ON "public"."events";
CREATE POLICY "Only admins can manage events" 
ON "public"."events" 
FOR ALL 
USING (
  auth.jwt() ->> 'role' = 'service_role' 
  OR 
  (auth.jwt() ->> 'email' IN (SELECT email FROM admins))
);


-- 2. Security for 'ressources_intervenants' table
ALTER TABLE IF EXISTS "public"."ressources_intervenants" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Intervenants resources are viewable by authenticated users" ON "public"."ressources_intervenants";
CREATE POLICY "Intervenants resources are viewable by authenticated users" 
ON "public"."ressources_intervenants" 
FOR SELECT 
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Only admins can manage intervenants resources" ON "public"."ressources_intervenants";
CREATE POLICY "Only admins can manage intervenants resources" 
ON "public"."ressources_intervenants" 
FOR ALL 
USING (
  auth.jwt() ->> 'role' = 'service_role' 
  OR 
  (auth.jwt() ->> 'email' IN (SELECT email FROM admins))
);


-- 3. Security for 'ressources_formateurs' table
ALTER TABLE IF EXISTS "public"."ressources_formateurs" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Formateurs resources are viewable by authenticated users" ON "public"."ressources_formateurs";
CREATE POLICY "Formateurs resources are viewable by authenticated users" 
ON "public"."ressources_formateurs" 
FOR SELECT 
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Only admins can manage formateurs resources" ON "public"."ressources_formateurs";
CREATE POLICY "Only admins can manage formateurs resources" 
ON "public"."ressources_formateurs" 
FOR ALL 
USING (
  auth.jwt() ->> 'role' = 'service_role' 
  OR 
  (auth.jwt() ->> 'email' IN (SELECT email FROM admins))
);
