-- 공유 기능을 위한 데이터베이스 스키마
-- 추억을 외부 사용자와 공유할 수 있는 기능 구현

-- 공유 링크 테이블
CREATE TABLE IF NOT EXISTS public.share_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    memory_id UUID REFERENCES public.memories(id) ON DELETE CASCADE,
    share_code VARCHAR(20) UNIQUE NOT NULL, -- 짧은 공유 코드
    created_by UUID REFERENCES auth.users(id),
    expires_at TIMESTAMP WITH TIME ZONE, -- 만료 시간 (NULL이면 무제한)
    view_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    allowed_viewers TEXT[], -- 특정 이메일만 허용 (NULL이면 누구나 가능)
    require_password BOOLEAN DEFAULT false,
    password_hash TEXT, -- 패스워드 보호 옵션
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 공유 조회 로그 테이블
CREATE TABLE IF NOT EXISTS public.share_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    share_link_id UUID REFERENCES public.share_links(id) ON DELETE CASCADE,
    viewer_ip INET,
    viewer_email TEXT, -- 로그인한 경우
    user_agent TEXT,
    referer TEXT,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 공유 설정 테이블 (기본값 저장)
CREATE TABLE IF NOT EXISTS public.share_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) UNIQUE,
    default_expire_days INTEGER DEFAULT 7, -- 기본 만료일
    require_login BOOLEAN DEFAULT false, -- 기본적으로 로그인 필요 여부
    show_comments BOOLEAN DEFAULT true, -- 댓글 표시 여부
    allow_download BOOLEAN DEFAULT false, -- 다운로드 허용 여부
    watermark_enabled BOOLEAN DEFAULT false, -- 워터마크 추가 여부
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 인덱스 생성
CREATE INDEX idx_share_links_share_code ON public.share_links(share_code);
CREATE INDEX idx_share_links_memory_id ON public.share_links(memory_id);
CREATE INDEX idx_share_links_created_by ON public.share_links(created_by);
CREATE INDEX idx_share_views_share_link_id ON public.share_views(share_link_id);

-- RLS 정책 설정
ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_settings ENABLE ROW LEVEL SECURITY;

-- share_links 정책
-- 가족 구성원만 공유 링크 생성 가능
CREATE POLICY "가족 구성원만 공유 링크 생성 가능" ON public.share_links
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.family_members fm
            JOIN public.profiles p ON p.id = fm.user_id
            WHERE fm.user_id = auth.uid()
            AND fm.status = 'active'
            AND p.role IN ('parent', 'family')
        )
    );

-- 자신이 생성한 공유 링크만 수정/삭제 가능
CREATE POLICY "자신의 공유 링크만 수정 가능" ON public.share_links
    FOR UPDATE
    USING (created_by = auth.uid());

CREATE POLICY "자신의 공유 링크만 삭제 가능" ON public.share_links
    FOR DELETE
    USING (created_by = auth.uid());

-- 활성화된 공유 링크는 누구나 조회 가능 (공유 목적)
CREATE POLICY "활성 공유 링크는 공개 조회 가능" ON public.share_links
    FOR SELECT
    USING (
        is_active = true 
        AND (expires_at IS NULL OR expires_at > NOW())
        OR created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.family_members
            WHERE user_id = auth.uid()
            AND status = 'active'
        )
    );

-- share_views 정책
-- 누구나 조회 로그 생성 가능 (공유 링크 접속 시)
CREATE POLICY "공유 조회 로그는 누구나 생성 가능" ON public.share_views
    FOR INSERT
    WITH CHECK (true);

-- 가족 구성원만 조회 로그 확인 가능
CREATE POLICY "가족만 조회 로그 확인 가능" ON public.share_views
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.family_members
            WHERE user_id = auth.uid()
            AND status = 'active'
        )
    );

-- share_settings 정책
-- 자신의 설정만 관리 가능
CREATE POLICY "자신의 공유 설정만 관리 가능" ON public.share_settings
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 공유 코드 생성 함수
CREATE OR REPLACE FUNCTION generate_share_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    code TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..8 LOOP
        code := code || substr(chars, floor(random() * length(chars))::int + 1, 1);
    END LOOP;
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- 공유 링크 생성 시 자동으로 코드 생성
CREATE OR REPLACE FUNCTION set_share_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.share_code IS NULL THEN
        LOOP
            NEW.share_code := generate_share_code();
            EXIT WHEN NOT EXISTS (
                SELECT 1 FROM public.share_links 
                WHERE share_code = NEW.share_code
            );
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_share_code_trigger
    BEFORE INSERT ON public.share_links
    FOR EACH ROW
    EXECUTE FUNCTION set_share_code();

-- 공유 조회수 증가 함수
CREATE OR REPLACE FUNCTION increment_share_view_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.share_links
    SET view_count = view_count + 1
    WHERE id = NEW.share_link_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_view_count_trigger
    AFTER INSERT ON public.share_views
    FOR EACH ROW
    EXECUTE FUNCTION increment_share_view_count();

-- 만료된 공유 링크 자동 비활성화 함수
CREATE OR REPLACE FUNCTION deactivate_expired_shares()
RETURNS void AS $$
BEGIN
    UPDATE public.share_links
    SET is_active = false
    WHERE is_active = true
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 업데이트 시간 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_share_links_updated_at
    BEFORE UPDATE ON public.share_links
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_share_settings_updated_at
    BEFORE UPDATE ON public.share_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
