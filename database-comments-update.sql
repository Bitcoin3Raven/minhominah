-- 민호민아 성장앨범: 댓글 시스템 업데이트
-- 기존 comments 테이블에 누락된 컬럼 추가

-- 1. 현재 comments 테이블 구조 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'comments'
ORDER BY ordinal_position;

-- 2. parent_comment_id 컬럼 추가 (대댓글 지원)
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE;

-- 3. is_edited 컬럼 추가
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE;

-- 4. updated_at 컬럼 추가
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 5. created_at 컬럼 확인 및 추가
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 6. 인덱스 생성 (이미 존재하면 무시됨)
CREATE INDEX IF NOT EXISTS idx_comments_memory_id ON comments(memory_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_comment_id ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- 7. comment_likes 테이블 생성 (없으면 생성)
CREATE TABLE IF NOT EXISTS comment_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- 8. comment_likes 인덱스
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);

-- 9. comment_notifications 테이블 생성 (선택사항)
CREATE TABLE IF NOT EXISTS comment_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_user_id UUID NOT NULL REFERENCES auth.users(id),
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('new_comment', 'reply', 'like')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. comment_notifications 인덱스
CREATE INDEX IF NOT EXISTS idx_comment_notifications_recipient ON comment_notifications(recipient_user_id, is_read);

-- 11. RLS 활성화
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_notifications ENABLE ROW LEVEL SECURITY;

-- 12. RLS 정책 생성 (이미 존재하면 무시)

-- 댓글 조회 정책
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'comments' 
        AND policyname = 'Comments viewable by family members and author'
    ) THEN
        CREATE POLICY "Comments viewable by family members and author" ON comments
            FOR SELECT USING (
                auth.uid() = user_id
                OR
                EXISTS (
                    SELECT 1 FROM family_members fm1
                    WHERE fm1.user_id = auth.uid()
                    AND fm1.status = 'active'
                    AND EXISTS (
                        SELECT 1 FROM family_members fm2
                        WHERE fm2.user_id = comments.user_id
                        AND fm2.family_id = fm1.family_id
                        AND fm2.status = 'active'
                    )
                )
            );
    END IF;
END $$;

-- 댓글 작성 정책
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'comments' 
        AND policyname = 'Only family members can create comments'
    ) THEN
        CREATE POLICY "Only family members can create comments" ON comments
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM family_members
                    WHERE user_id = auth.uid()
                    AND status = 'active'
                )
                AND auth.uid() = user_id
            );
    END IF;
END $$;

-- 댓글 수정 정책
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'comments' 
        AND policyname = 'Only comment author can update'
    ) THEN
        CREATE POLICY "Only comment author can update" ON comments
            FOR UPDATE USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- 댓글 삭제 정책
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'comments' 
        AND policyname = 'Comment author and parents can delete'
    ) THEN
        CREATE POLICY "Comment author and parents can delete" ON comments
            FOR DELETE USING (
                auth.uid() = user_id
                OR
                EXISTS (
                    SELECT 1 FROM family_members
                    WHERE user_id = auth.uid()
                    AND role = 'parent'
                    AND status = 'active'
                )
            );
    END IF;
END $$;

-- 13. 트리거 함수: 댓글 수정 시 updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.is_edited = TRUE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 14. 트리거 생성
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_updated_at();

-- 15. Realtime 활성화 (댓글 실시간 업데이트)
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE comment_likes;

-- 실행 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '댓글 시스템이 성공적으로 업데이트되었습니다!';
    RAISE NOTICE '추가된 기능:';
    RAISE NOTICE '- parent_comment_id: 대댓글 지원';
    RAISE NOTICE '- is_edited: 수정 여부 표시';
    RAISE NOTICE '- updated_at: 수정 시간 기록';
    RAISE NOTICE '- comment_likes: 좋아요 기능';
    RAISE NOTICE '- RLS 정책 적용 완료';
END $$;
