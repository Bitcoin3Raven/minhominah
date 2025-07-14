-- 휴지통 테이블 (소프트 삭제 기능)
CREATE TABLE IF NOT EXISTS trash (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    original_table TEXT NOT NULL,
    original_id UUID NOT NULL,
    original_data JSONB NOT NULL,
    deleted_by UUID REFERENCES auth.users(id),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days'
);

-- 활동 로그 테이블 (감사 추적)
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'restore', 'bulk_action', 'share', 'download')),
    resource_type TEXT NOT NULL CHECK (resource_type IN ('memory', 'media_file', 'tag', 'comment')),
    resource_id UUID,
    resource_title TEXT,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 벌크 작업 테이블 (대량 작업 기록)
CREATE TABLE IF NOT EXISTS bulk_operations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    operation_type TEXT NOT NULL CHECK (operation_type IN ('delete', 'tag', 'move', 'export', 'edit')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    total_items INTEGER NOT NULL,
    processed_items INTEGER DEFAULT 0,
    failed_items INTEGER DEFAULT 0,
    details JSONB,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 앨범/컬렉션 테이블
CREATE TABLE IF NOT EXISTS albums (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    cover_image_id UUID REFERENCES media_files(id),
    created_by UUID REFERENCES auth.users(id),
    is_public BOOLEAN DEFAULT false,
    password_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 앨범-추억 연결 테이블
CREATE TABLE IF NOT EXISTS album_memories (
    album_id UUID REFERENCES albums(id) ON DELETE CASCADE,
    memory_id UUID REFERENCES memories(id) ON DELETE CASCADE,
    order_position INTEGER,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (album_id, memory_id)
);

-- 사진 버전 관리 테이블
CREATE TABLE IF NOT EXISTS media_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    media_file_id UUID REFERENCES media_files(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    changes JSONB,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 워터마크 설정 테이블
CREATE TABLE IF NOT EXISTS watermark_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) UNIQUE,
    text TEXT,
    position TEXT CHECK (position IN ('top-left', 'top-right', 'bottom-left', 'bottom-right', 'center')),
    opacity DECIMAL(3,2) CHECK (opacity >= 0 AND opacity <= 1),
    font_size INTEGER,
    color TEXT,
    enabled BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_trash_expires_at ON trash(expires_at);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX idx_bulk_operations_user_status ON bulk_operations(user_id, status);
CREATE INDEX idx_albums_created_by ON albums(created_by);
CREATE INDEX idx_media_versions_media_file ON media_versions(media_file_id);

-- RLS 정책
ALTER TABLE trash ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE album_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE watermark_settings ENABLE ROW LEVEL SECURITY;

-- 휴지통 정책
CREATE POLICY "Users can view their own trash" ON trash
    FOR SELECT USING (deleted_by = auth.uid());

CREATE POLICY "Users can restore their own trash" ON trash
    FOR DELETE USING (deleted_by = auth.uid());

-- 활동 로그 정책 (부모만 볼 수 있음)
CREATE POLICY "Parents can view activity logs" ON activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'parent'
        )
    );

-- 벌크 작업 정책
CREATE POLICY "Users can view their own bulk operations" ON bulk_operations
    FOR ALL USING (user_id = auth.uid());

-- 앨범 정책
CREATE POLICY "Users can view public albums or their own" ON albums
    FOR SELECT USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create albums" ON albums
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own albums" ON albums
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own albums" ON albums
    FOR DELETE USING (created_by = auth.uid());

-- 자동 삭제 함수 (30일 후 휴지통 비우기)
CREATE OR REPLACE FUNCTION auto_empty_trash()
RETURNS void AS $$
BEGIN
    DELETE FROM trash WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 크론 작업 설정 (매일 실행)
-- SELECT cron.schedule('empty-trash', '0 0 * * *', 'SELECT auto_empty_trash();');
