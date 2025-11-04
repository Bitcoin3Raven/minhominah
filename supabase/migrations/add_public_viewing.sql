-- Add public viewing feature to memories and albums
-- Created: 2024-11-04
-- Purpose: Allow selective public access to memories without authentication

-- Add is_public column to memories table
ALTER TABLE public.memories
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Add is_public column to albums table
ALTER TABLE public.albums
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Add public_share_id for shareable links
ALTER TABLE public.memories
ADD COLUMN IF NOT EXISTS public_share_id TEXT UNIQUE;

-- Create index for faster public queries
CREATE INDEX IF NOT EXISTS idx_memories_public ON public.memories(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_albums_public ON public.albums(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_memories_share_id ON public.memories(public_share_id) WHERE public_share_id IS NOT NULL;

-- Drop existing RLS policies if they exist
DROP POLICY IF EXISTS "Public memories are viewable by everyone" ON public.memories;
DROP POLICY IF EXISTS "Authenticated users can view all memories" ON public.memories;
DROP POLICY IF EXISTS "Public media files are viewable by everyone" ON public.media_files;
DROP POLICY IF EXISTS "Public albums are viewable by everyone" ON public.albums;

-- Create new RLS policies for public access

-- Policy: Anyone can view public memories
CREATE POLICY "Public memories are viewable by everyone"
ON public.memories
FOR SELECT
USING (is_public = true);

-- Policy: Authenticated users can view all memories
CREATE POLICY "Authenticated users can view all memories"
ON public.memories
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Policy: Anyone can view media files for public memories
CREATE POLICY "Public media files are viewable by everyone"
ON public.media_files
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.memories
    WHERE memories.id = media_files.memory_id
    AND memories.is_public = true
  )
);

-- Policy: Anyone can view public albums
CREATE POLICY "Public albums are viewable by everyone"
ON public.albums
FOR SELECT
USING (is_public = true);

-- Policy: Authenticated users can view all albums
CREATE POLICY "Authenticated users can view all albums"
ON public.albums
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Policy: Anyone can view memory_people for public memories
DROP POLICY IF EXISTS "Public memory people are viewable" ON public.memory_people;
CREATE POLICY "Public memory people are viewable"
ON public.memory_people
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.memories
    WHERE memories.id = memory_people.memory_id
    AND memories.is_public = true
  )
);

-- Policy: Anyone can view memory_tags for public memories
DROP POLICY IF EXISTS "Public memory tags are viewable" ON public.memory_tags;
CREATE POLICY "Public memory tags are viewable"
ON public.memory_tags
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.memories
    WHERE memories.id = memory_tags.memory_id
    AND memories.is_public = true
  )
);

-- Policy: Only parents can update public status
DROP POLICY IF EXISTS "Only parents can update public status" ON public.memories;
CREATE POLICY "Only parents can update public status"
ON public.memories
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'parent'
  )
);

-- Function to generate unique share ID
CREATE OR REPLACE FUNCTION generate_share_id()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(6), 'base64');
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate share ID when memory becomes public
CREATE OR REPLACE FUNCTION auto_generate_share_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_public = true AND NEW.public_share_id IS NULL THEN
    NEW.public_share_id = generate_share_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_share_id ON public.memories;
CREATE TRIGGER trigger_auto_share_id
BEFORE INSERT OR UPDATE ON public.memories
FOR EACH ROW
EXECUTE FUNCTION auto_generate_share_id();

-- Grant necessary permissions
GRANT SELECT ON public.memories TO anon;
GRANT SELECT ON public.albums TO anon;
GRANT SELECT ON public.media_files TO anon;
GRANT SELECT ON public.memory_people TO anon;
GRANT SELECT ON public.memory_tags TO anon;
GRANT SELECT ON public.people TO anon;
GRANT SELECT ON public.tags TO anon;

-- Add comment for documentation
COMMENT ON COLUMN public.memories.is_public IS 'Whether this memory is publicly viewable without authentication';
COMMENT ON COLUMN public.memories.public_share_id IS 'Unique ID for sharing public memories via URL';
COMMENT ON COLUMN public.albums.is_public IS 'Whether this album is publicly viewable without authentication';