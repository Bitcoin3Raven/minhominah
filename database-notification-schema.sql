-- 알림 시스템을 위한 데이터베이스 스키마
-- 기념일, 업데이트, 댓글 등 다양한 알림 지원

-- 알림 테이블
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'anniversary', 'comment', 'memory_added', 'family_invite', 'share_view'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_item_id UUID, -- 관련 항목 ID (memory_id, comment_id 등)
    related_item_type VARCHAR(50), -- 'memory', 'comment', 'family_invite'
    link TEXT, -- 클릭 시 이동할 링크
    icon VARCHAR(50) DEFAULT 'bell', -- Font Awesome 아이콘 이름
    is_read BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    read_at TIMESTAMP WITH TIME ZONE
);

-- 알림 설정 테이블
CREATE TABLE IF NOT EXISTS public.notification_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- 알림 유형별 설정
    anniversary_enabled BOOLEAN DEFAULT true, -- 기념일 알림
    comment_enabled BOOLEAN DEFAULT true, -- 댓글 알림
    memory_added_enabled BOOLEAN DEFAULT true, -- 새 추억 추가 알림
    family_invite_enabled BOOLEAN DEFAULT true, -- 가족 초대 알림
    share_view_enabled BOOLEAN DEFAULT true, -- 공유 조회 알림
    
    -- 알림 방법
    browser_push_enabled BOOLEAN DEFAULT false, -- 브라우저 푸시 알림
    email_enabled BOOLEAN DEFAULT false, -- 이메일 알림
    
    -- 알림 시간 설정
    quiet_hours_start TIME, -- 방해금지 시작 시간
    quiet_hours_end TIME, -- 방해금지 종료 시간
    
    -- 기념일 알림 사전 알림 일수
    anniversary_reminder_days INTEGER DEFAULT 7, -- 기념일 X일 전 알림
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 기념일 테이블
CREATE TABLE IF NOT EXISTS public.anniversaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    person_id UUID REFERENCES public.people(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    anniversary_date DATE NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'birthday', 'first_walk', 'first_word', 'custom'
    is_recurring BOOLEAN DEFAULT false, -- 매년 반복 여부
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 브라우저 푸시 구독 테이블
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    UNIQUE(user_id, endpoint)
);

-- 인덱스 생성
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_anniversaries_date ON public.anniversaries(anniversary_date);
CREATE INDEX idx_anniversaries_person_id ON public.anniversaries(person_id);

-- RLS 정책 설정
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anniversaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- notifications 정책
-- 자신의 알림만 조회 가능
CREATE POLICY "자신의 알림만 조회 가능" ON public.notifications
    FOR SELECT
    USING (user_id = auth.uid());

-- 시스템에서만 알림 생성 가능 (서비스 역할)
CREATE POLICY "시스템만 알림 생성 가능" ON public.notifications
    FOR INSERT
    WITH CHECK (false); -- Edge Functions에서 service_role로만 생성

-- 자신의 알림만 수정 가능 (읽음 표시, 보관)
CREATE POLICY "자신의 알림만 수정 가능" ON public.notifications
    FOR UPDATE
    USING (user_id = auth.uid());

-- notification_settings 정책
-- 자신의 설정만 관리 가능
CREATE POLICY "자신의 알림 설정만 관리 가능" ON public.notification_settings
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- anniversaries 정책
-- 가족 구성원만 기념일 조회 가능
CREATE POLICY "가족만 기념일 조회 가능" ON public.anniversaries
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.family_members
            WHERE user_id = auth.uid()
            AND status = 'active'
        )
    );

-- 부모만 기념일 생성/수정/삭제 가능
CREATE POLICY "부모만 기념일 관리 가능" ON public.anniversaries
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.family_members fm
            JOIN public.profiles p ON p.id = fm.user_id
            WHERE fm.user_id = auth.uid()
            AND fm.status = 'active'
            AND p.role = 'parent'
        )
    );

-- push_subscriptions 정책
-- 자신의 구독만 관리 가능
CREATE POLICY "자신의 푸시 구독만 관리 가능" ON public.push_subscriptions
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 기념일 알림 생성 함수
CREATE OR REPLACE FUNCTION create_anniversary_notifications()
RETURNS void AS $$
DECLARE
    anniversary RECORD;
    family_member RECORD;
    reminder_days INTEGER;
BEGIN
    -- 오늘 또는 사전 알림일에 해당하는 기념일 찾기
    FOR anniversary IN
        SELECT a.*, p.name as person_name
        FROM public.anniversaries a
        JOIN public.people p ON p.id = a.person_id
        WHERE (
            -- 오늘이 기념일인 경우
            (a.is_recurring AND EXTRACT(MONTH FROM a.anniversary_date) = EXTRACT(MONTH FROM CURRENT_DATE)
                AND EXTRACT(DAY FROM a.anniversary_date) = EXTRACT(DAY FROM CURRENT_DATE))
            OR (NOT a.is_recurring AND a.anniversary_date = CURRENT_DATE)
        )
    LOOP
        -- 해당 가족의 모든 활성 구성원에게 알림 생성
        FOR family_member IN
            SELECT fm.user_id, ns.anniversary_enabled, ns.anniversary_reminder_days
            FROM public.family_members fm
            LEFT JOIN public.notification_settings ns ON ns.user_id = fm.user_id
            WHERE fm.status = 'active'
            AND (ns.anniversary_enabled IS NULL OR ns.anniversary_enabled = true)
        LOOP
            -- 알림 생성
            INSERT INTO public.notifications (
                user_id,
                type,
                title,
                message,
                related_item_id,
                related_item_type,
                icon
            ) VALUES (
                family_member.user_id,
                'anniversary',
                anniversary.person_name || '의 ' || anniversary.title,
                '오늘은 ' || anniversary.person_name || '의 ' || anniversary.title || '입니다!',
                anniversary.id,
                'anniversary',
                'calendar-check'
            );
        END LOOP;
    END LOOP;
    
    -- 사전 알림 처리
    FOR anniversary IN
        SELECT a.*, p.name as person_name
        FROM public.anniversaries a
        JOIN public.people p ON p.id = a.person_id
        WHERE a.is_recurring = true
    LOOP
        FOR family_member IN
            SELECT fm.user_id, COALESCE(ns.anniversary_reminder_days, 7) as reminder_days
            FROM public.family_members fm
            LEFT JOIN public.notification_settings ns ON ns.user_id = fm.user_id
            WHERE fm.status = 'active'
            AND (ns.anniversary_enabled IS NULL OR ns.anniversary_enabled = true)
        LOOP
            -- 사전 알림일 계산
            IF (
                EXTRACT(MONTH FROM anniversary.anniversary_date + INTERVAL '1 year' - INTERVAL (family_member.reminder_days || ' days')) = EXTRACT(MONTH FROM CURRENT_DATE)
                AND EXTRACT(DAY FROM anniversary.anniversary_date + INTERVAL '1 year' - INTERVAL (family_member.reminder_days || ' days')) = EXTRACT(DAY FROM CURRENT_DATE)
            ) THEN
                INSERT INTO public.notifications (
                    user_id,
                    type,
                    title,
                    message,
                    related_item_id,
                    related_item_type,
                    icon
                ) VALUES (
                    family_member.user_id,
                    'anniversary',
                    anniversary.person_name || '의 ' || anniversary.title || ' ' || family_member.reminder_days || '일 전',
                    family_member.reminder_days || '일 후 ' || anniversary.person_name || '의 ' || anniversary.title || '입니다.',
                    anniversary.id,
                    'anniversary',
                    'calendar'
                );
            END IF;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 댓글 알림 생성 트리거
CREATE OR REPLACE FUNCTION notify_on_new_comment()
RETURNS TRIGGER AS $$
DECLARE
    memory_owner UUID;
    memory_title TEXT;
    commenter_name TEXT;
BEGIN
    -- 추억 소유자와 제목 가져오기
    SELECT m.created_by, m.title INTO memory_owner, memory_title
    FROM public.memories m
    WHERE m.id = NEW.memory_id;
    
    -- 댓글 작성자 이름 가져오기
    SELECT p.full_name INTO commenter_name
    FROM public.profiles p
    WHERE p.id = NEW.user_id;
    
    -- 추억 소유자에게 알림 (자기 자신이 댓글 작성한 경우 제외)
    IF memory_owner != NEW.user_id THEN
        -- 알림 설정 확인
        IF EXISTS (
            SELECT 1 FROM public.notification_settings
            WHERE user_id = memory_owner
            AND comment_enabled = true
        ) OR NOT EXISTS (
            SELECT 1 FROM public.notification_settings
            WHERE user_id = memory_owner
        ) THEN
            INSERT INTO public.notifications (
                user_id,
                type,
                title,
                message,
                related_item_id,
                related_item_type,
                link,
                icon
            ) VALUES (
                memory_owner,
                'comment',
                '새 댓글',
                COALESCE(commenter_name, '누군가') || '님이 "' || memory_title || '"에 댓글을 남겼습니다.',
                NEW.id,
                'comment',
                '/index.html#memory-' || NEW.memory_id,
                'comment'
            );
        END IF;
    END IF;
    
    -- 다른 댓글 작성자들에게도 알림 (대댓글의 경우)
    IF NEW.parent_comment_id IS NOT NULL THEN
        INSERT INTO public.notifications (
            user_id,
            type,
            title,
            message,
            related_item_id,
            related_item_type,
            link,
            icon
        )
        SELECT DISTINCT
            c.user_id,
            'comment',
            '새 대댓글',
            COALESCE(commenter_name, '누군가') || '님이 회신했습니다.',
            NEW.id,
            'comment',
            '/index.html#memory-' || NEW.memory_id,
            'reply'
        FROM public.comments c
        WHERE c.id = NEW.parent_comment_id
        AND c.user_id != NEW.user_id
        AND (
            EXISTS (
                SELECT 1 FROM public.notification_settings
                WHERE user_id = c.user_id
                AND comment_enabled = true
            ) OR NOT EXISTS (
                SELECT 1 FROM public.notification_settings
                WHERE user_id = c.user_id
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_comment_notification
    AFTER INSERT ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION notify_on_new_comment();

-- 새 추억 알림 생성 트리거
CREATE OR REPLACE FUNCTION notify_on_new_memory()
RETURNS TRIGGER AS $$
DECLARE
    creator_name TEXT;
    family_member RECORD;
BEGIN
    -- 추억 생성자 이름 가져오기
    SELECT p.full_name INTO creator_name
    FROM public.profiles p
    WHERE p.id = NEW.created_by;
    
    -- 가족 구성원들에게 알림
    FOR family_member IN
        SELECT fm.user_id
        FROM public.family_members fm
        LEFT JOIN public.notification_settings ns ON ns.user_id = fm.user_id
        WHERE fm.status = 'active'
        AND fm.user_id != NEW.created_by
        AND (ns.memory_added_enabled IS NULL OR ns.memory_added_enabled = true)
    LOOP
        INSERT INTO public.notifications (
            user_id,
            type,
            title,
            message,
            related_item_id,
            related_item_type,
            link,
            icon
        ) VALUES (
            family_member.user_id,
            'memory_added',
            '새로운 추억',
            COALESCE(creator_name, '누군가') || '님이 새로운 추억 "' || NEW.title || '"을 추가했습니다.',
            NEW.id,
            'memory',
            '/index.html#memory-' || NEW.id,
            'image'
        );
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_memory_notification
    AFTER INSERT ON public.memories
    FOR EACH ROW
    EXECUTE FUNCTION notify_on_new_memory();

-- 업데이트 시간 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notification_settings_updated_at
    BEFORE UPDATE ON public.notification_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_anniversaries_updated_at
    BEFORE UPDATE ON public.anniversaries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 읽지 않은 알림 개수 함수
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM public.notifications
        WHERE user_id = p_user_id
        AND is_read = false
        AND is_archived = false
    );
END;
$$ LANGUAGE plpgsql;
