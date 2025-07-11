-- RLS policies for memories and related tables
-- This fixes the "new row violates row-level security policy" error

-- 1. Enable RLS for memories table
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all memories
CREATE POLICY "Anyone can view memories" 
    ON memories FOR SELECT 
    USING (true);

-- Allow authenticated users to create memories
CREATE POLICY "Authenticated users can create memories" 
    ON memories FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);

-- Allow users to update their own memories
CREATE POLICY "Users can update own memories" 
    ON memories FOR UPDATE 
    USING (auth.uid() = created_by);

-- Allow users to delete their own memories
CREATE POLICY "Users can delete own memories" 
    ON memories FOR DELETE 
    USING (auth.uid() = created_by);

-- 2. Enable RLS for memory_people table
ALTER TABLE memory_people ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view memory_people connections
CREATE POLICY "Anyone can view memory_people" 
    ON memory_people FOR SELECT 
    USING (true);

-- Allow memory creators to manage people connections
CREATE POLICY "Memory creators can insert memory_people" 
    ON memory_people FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM memories 
            WHERE memories.id = memory_people.memory_id 
            AND memories.created_by = auth.uid()
        )
    );

CREATE POLICY "Memory creators can delete memory_people" 
    ON memory_people FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM memories 
            WHERE memories.id = memory_people.memory_id 
            AND memories.created_by = auth.uid()
        )
    );

-- 3. Enable RLS for media_files table
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view media files
CREATE POLICY "Anyone can view media files" 
    ON media_files FOR SELECT 
    USING (true);

-- Allow memory creators to upload media files
CREATE POLICY "Memory creators can insert media files" 
    ON media_files FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM memories 
            WHERE memories.id = media_files.memory_id 
            AND memories.created_by = auth.uid()
        )
    );

-- Allow memory creators to delete media files
CREATE POLICY "Memory creators can delete media files" 
    ON media_files FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM memories 
            WHERE memories.id = media_files.memory_id 
            AND memories.created_by = auth.uid()
        )
    );

-- 4. Enable RLS for memory_tags table
ALTER TABLE memory_tags ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view memory tags
CREATE POLICY "Anyone can view memory tags" 
    ON memory_tags FOR SELECT 
    USING (true);

-- Allow memory creators to manage tags
CREATE POLICY "Memory creators can insert memory tags" 
    ON memory_tags FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM memories 
            WHERE memories.id = memory_tags.memory_id 
            AND memories.created_by = auth.uid()
        )
    );

CREATE POLICY "Memory creators can delete memory tags" 
    ON memory_tags FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM memories 
            WHERE memories.id = memory_tags.memory_id 
            AND memories.created_by = auth.uid()
        )
    );

-- 5. Ensure tags table has proper policies
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view tags
CREATE POLICY "Anyone can view tags" 
    ON tags FOR SELECT 
    USING (true);

-- Allow authenticated users to create tags
CREATE POLICY "Authenticated users can create tags" 
    ON tags FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL);

-- Tags should not be updated or deleted once created
-- (to maintain consistency across memories)