-- Create storage bucket for JT assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('jt-assets', 'jt-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow public read access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'jt-assets' );

-- Policy to allow service role uploads
CREATE POLICY "Service Role Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'jt-assets' );

-- Policy to allow service role updates
CREATE POLICY "Service Role Update"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'jt-assets' );
