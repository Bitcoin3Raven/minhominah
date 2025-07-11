-- 알림 시스템 테이블 생성
-- notification_settings와 notifications 테이블이 누락되어 있습니다

-- 1. 알림 설정 테이블
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  push_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  browser_enabled BOOLEAN DEFAULT true,
  new_memory_notification BOOLEAN DEFAULT true,
  comment_notification BOOLEAN DEFAULT true,
  family_notification BOOLEAN DEFAULT true,
  milestone_notification BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. 알림 테이블
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('memory', 'comment', 'family', 'milestone', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data JSONB
);

-- 3. RLS 활성화
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 - notification_settings
CREATE POLICY "사용자 자신의 알림 설정 조회" ON notification_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "사용자 자신의 알림 설정 생성" ON notification_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "사용자 자신의 알림 설정 수정" ON notification_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- 5. RLS 정책 - notifications
CREATE POLICY "사용자 자신의 알림 조회" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "시스템 알림 생성" ON notifications
  FOR INSERT WITH CHECK (true); -- 시스템에서 알림 생성 가능

CREATE POLICY "사용자 자신의 알림 수정" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "사용자 자신의 알림 삭제" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- 6. 인덱스 생성
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- 7. 트리거: 알림 설정 자동 생성
CREATE OR REPLACE FUNCTION create_default_notification_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 새 사용자 생성 시 기본 알림 설정 생성
CREATE TRIGGER on_auth_user_created_notification_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_settings();

-- 실행 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '알림 시스템 테이블이 성공적으로 생성되었습니다!';
END $$;