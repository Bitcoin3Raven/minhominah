-- 민호민아 성장앨범: 댓글 시스템 간단 업데이트 (오류 수정 버전)
-- parent_comment_id 누락 문제 해결

-- 1. parent_comment_id 컬럼 추가 (대댓글 지원)
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE;

-- 2. is_edited 컬럼 추가
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE;

-- 3. updated_at 컬럼 추가
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. created_at 컬럼 확인 및 추가
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 5. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_comments_memory_id ON comments(memory_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_comment_id ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- 6. comment_likes 테이블 생성
CREATE TABLE IF NOT EXISTS comment_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- 7. comment_likes 인덱스
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);

-- 8. comment_notifications 테이블 생성
CREATE TABLE IF NOT EXISTS comment_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_user_id UUID NOT NULL REFERENCES auth.users(id),
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('new_comment', 'reply', 'like')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. comment_notifications 인덱스
CREATE INDEX IF NOT EXISTS idx_comment_notifications_recipient ON comment_notifications(recipient_user_id, is_read);

-- 10. RLS 활성화
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_notifications ENABLE ROW LEVEL SECURITY;

-- 11. 간단한 RLS 정책 (로그인한 사용자만)

-- 댓글 조회: 모든 로그인 사용자
DROP POLICY IF EXISTS "Comments viewable by authenticated users" ON comments;
CREATE POLICY "Comments viewable by authenticated users" ON comments
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- 댓글 작성: 로그인한 사용자만
DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
CREATE POLICY "Authenticated users can create comments" ON comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 댓글 수정: 작성자만
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
CREATE POLICY "Users can update own comments" ON comments
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 댓글 삭제: 작성자만
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
CREATE POLICY "Users can delete own comments" ON comments
    FOR DELETE USING (auth.uid() = user_id);

-- 좋아요 조회: 모든 로그인 사용자
DROP POLICY IF EXISTS "Likes viewable by authenticated users" ON comment_likes;
CREATE POLICY "Likes viewable by authenticated users" ON comment_likes
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- 좋아요 추가/삭제: 로그인한 사용자만
DROP POLICY IF EXISTS "Users can manage own likes" ON comment_likes;
CREATE POLICY "Users can manage own likes" ON comment_likes
    FOR ALL USING (auth.uid() = user_id);

-- 알림 조회: 수신자만
DROP POLICY IF EXISTS "Users can view own notifications" ON comment_notifications;
CREATE POLICY "Users can view own notifications" ON comment_notifications
    FOR SELECT USING (auth.uid() = recipient_user_id);

-- 알림 업데이트: 수신자만
DROP POLICY IF EXISTS "Users can update own notifications" ON comment_notifications;
CREATE POLICY "Users can update own notifications" ON comment_notifications
    FOR UPDATE USING (auth.uid() = recipient_user_id);

-- 12. 트리거 함수: 댓글 수정 시 updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.is_edited = TRUE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 13. 트리거 생성
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_updated_at();

-- 14. Realtime 활성화 (안전한 방법)
DO $$
BEGIN
    -- 기존 publication에서 테이블 제거 시도 (오류 무시)
    BEGIN
        ALTER PUBLICATION supabase_realtime DROP TABLE comments;
    EXCEPTION WHEN OTHERS THEN
        -- 테이블이 없으면 무시
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime DROP TABLE comment_likes;
    EXCEPTION WHEN OTHERS THEN
        -- 테이블이 없으면 무시
    END;
    
    -- 테이블 추가
    ALTER PUBLICATION supabase_realtime ADD TABLE comments;
    ALTER PUBLICATION supabase_realtime ADD TABLE comment_likes;
END $$;

-- 실행 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '댓글 시스템이 성공적으로 업데이트되었습니다!';
    RAISE NOTICE '추가된 기능:';
    RAISE NOTICE '- parent_comment_id: 대댓글 지원';
    RAISE NOTICE '- is_edited: 수정 여부 표시';
    RAISE NOTICE '- updated_at: 수정 시간 기록';
    RAISE NOTICE '- comment_likes: 좋아요 기능';
    RAISE NOTICE '- 간단한 RLS 정책 적용 (로그인 사용자만)';
    RAISE NOTICE '- Realtime 활성화 완료';
END $$;
