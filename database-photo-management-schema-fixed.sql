-- 사진 관리 고급 기능을 위한 데이터베이스 스키마
-- 휴지통, 활동 로그, 일괄 작업 등

-- 휴지통 테이블
CREATE TABLE IF NOT EXISTS trash (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_type TEXT NOT NULL CHECK (resource_type IN ('memory', 'media', 'tag', 'comment')),
    resource_id UUID NOT NULL,
    original_data JSONB NOT NULL, -- 원본 데이터 백업
    deleted_by UUID REFERENCES auth.users(id),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    permanent_delete_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    restored BOOLEAN DEFAULT FALSE,
    restored_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 활동 로그 테이블
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'restore', 'bulk_action', 'share', 'download')),
    resource_type TEXT NOT NULL CHECK (resource_type IN ('memory', 'media', 'tag', 'comment')),
    resource_id UUID,
    resource_title TEXT,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 일괄 작업 기록 테이블
CREATE TABLE IF NOT EXISTS bulk_operations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    operation_type TEXT NOT NULL CHECK (operation_type IN ('delete', 'tag', 'export', 'album_add', 'permission_change')),
    affected_items JSONB NOT NULL, -- 영향받은 항목들의 ID 목록
    performed_by UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 워터마크 설정 테이블
CREATE TABLE IF NOT EXISTS watermark_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) UNIQUE,
    enabled BOOLEAN DEFAULT FALSE,
    text TEXT DEFAULT '© 민호민아 성장앨범',
    position TEXT DEFAULT 'bottom_right' CHECK (position IN ('bottom_right', 'bottom_left', 'top_right', 'top_left', 'center')),
    opacity DECIMAL(3,2) DEFAULT 0.7 CHECK (opacity >= 0 AND opacity <= 1),
    font_size INTEGER DEFAULT 14,
    font_color TEXT DEFAULT '#FFFFFF',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 앨범 테이블
CREATE TABLE IF NOT EXISTS albums (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    cover_image_id UUID REFERENCES media_files(id),
    created_by UUID REFERENCES auth.users(id),
    is_public BOOLEAN DEFAULT FALSE,
    password_hash TEXT, -- 비밀번호 보호 옵션
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 앨범-추억 연결 테이블
CREATE TABLE IF NOT EXISTS album_memories (
    album_id UUID REFERENCES albums(id) ON DELETE CASCADE,
    memory_id UUID REFERENCES memories(id) ON DELETE CASCADE,
    position INTEGER DEFAULT 0, -- 앨범 내 순서
    added_by UUID REFERENCES auth.users(id),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (album_id, memory_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_trash_deleted_by ON trash(deleted_by);
CREATE INDEX IF NOT EXISTS idx_trash_permanent_delete_at ON trash(permanent_delete_at) WHERE restored = FALSE;
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource ON activity_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_bulk_operations_performed_by ON bulk_operations(performed_by);
CREATE INDEX IF NOT EXISTS idx_albums_created_by ON albums(created_by);

-- RLS (Row Level Security) 설정
ALTER TABLE trash ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE watermark_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE album_memories ENABLE ROW LEVEL SECURITY;

-- 휴지통 정책
CREATE POLICY "사용자는 자신이 삭제한 항목만 볼 수 있음" ON trash
    FOR SELECT USING (auth.uid() = deleted_by);

CREATE POLICY "사용자는 자신의 항목만 휴지통에 넣을 수 있음" ON trash
    FOR INSERT WITH CHECK (auth.uid() = deleted_by);

CREATE POLICY "사용자는 자신의 휴지통 항목만 복원할 수 있음" ON trash
    FOR UPDATE USING (auth.uid() = deleted_by);

-- 활동 로그 정책
CREATE POLICY "사용자는 자신의 활동 로그만 볼 수 있음" ON activity_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "시스템만 활동 로그를 생성할 수 있음" ON activity_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 일괄 작업 정책
CREATE POLICY "사용자는 자신의 일괄 작업만 볼 수 있음" ON bulk_operations
    FOR SELECT USING (auth.uid() = performed_by);

CREATE POLICY "사용자는 자신의 일괄 작업만 생성할 수 있음" ON bulk_operations
    FOR INSERT WITH CHECK (auth.uid() = performed_by);

-- 워터마크 설정 정책
CREATE POLICY "사용자는 자신의 워터마크 설정만 관리할 수 있음" ON watermark_settings
    FOR ALL USING (auth.uid() = user_id);

-- 앨범 정책
CREATE POLICY "공개 앨범은 누구나 볼 수 있음" ON albums
    FOR SELECT USING (is_public = TRUE OR auth.uid() = created_by);

CREATE POLICY "사용자는 자신의 앨범만 수정할 수 있음" ON albums
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "사용자는 앨범을 생성할 수 있음" ON albums
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "사용자는 자신의 앨범만 삭제할 수 있음" ON albums
    FOR DELETE USING (auth.uid() = created_by);

-- 자동 휴지통 비우기 함수
CREATE OR REPLACE FUNCTION auto_empty_trash()
RETURNS void AS $$
BEGIN
    -- 30일이 지난 항목 영구 삭제
    DELETE FROM trash
    WHERE permanent_delete_at <= NOW()
    AND restored = FALSE;
END;
$$ LANGUAGE plpgsql;

-- 활동 로그 자동 기록 함수
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- 추억 생성/수정/삭제 시 자동 로그
    IF TG_TABLE_NAME = 'memories' THEN
        IF TG_OP = 'INSERT' THEN
            INSERT INTO activity_logs (user_id, action, resource_type, resource_id, resource_title, details)
            VALUES (NEW.created_by, 'create', 'memory', NEW.id, NEW.title, jsonb_build_object('operation', TG_OP));
        ELSIF TG_OP = 'UPDATE' THEN
            INSERT INTO activity_logs (user_id, action, resource_type, resource_id, resource_title, details)
            VALUES (NEW.created_by, 'update', 'memory', NEW.id, NEW.title, jsonb_build_object('operation', TG_OP, 'old_title', OLD.title));
        ELSIF TG_OP = 'DELETE' THEN
            INSERT INTO activity_logs (user_id, action, resource_type, resource_id, resource_title, details)
            VALUES (OLD.created_by, 'delete', 'memory', OLD.id, OLD.title, jsonb_build_object('operation', TG_OP));
        END IF;
    END IF;
    
    -- DELETE 작업에서는 OLD를 반환
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER log_memory_activity
    AFTER INSERT OR UPDATE OR DELETE ON memories
    FOR EACH ROW
    EXECUTE FUNCTION log_activity();
