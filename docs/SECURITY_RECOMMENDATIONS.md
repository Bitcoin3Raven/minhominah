# Supabase 보안 권장사항

## 개요
이 문서는 민호민아닷컴 프로젝트의 Supabase 보안 설정에 대한 권장사항을 담고 있습니다.

## 1. 해결된 보안 경고

### 1.1 Role Mutable Search Path 문제
모든 PostgreSQL 함수에 `SET search_path = public` 설정을 추가하여 해결했습니다.

**수정 방법:**
```sql
-- /sql/fix-security-warnings.sql 파일 실행
-- Supabase 대시보드의 SQL Editor에서 실행
```

### 1.2 함수별 보안 개선사항
- **update_user_role**: 역할 유효성 검사 및 자기 자신 변경 방지
- **create_invitation**: 역할 유효성 검사 추가
- **accept_invitation**: 이메일 확인 로직 추가
- **get_users_with_email**: parent 역할만 접근 가능하도록 제한

## 2. 추가 보안 권장사항

### 2.1 손상된 비밀번호 방지
Supabase Auth의 기본 설정이 이미 손상된 비밀번호를 차단하고 있습니다.

**추가 설정 (선택사항):**
1. Supabase 대시보드 → Authentication → Settings
2. Password Requirements에서 추가 규칙 설정:
   - 최소 길이: 8자 이상
   - 대문자, 소문자, 숫자, 특수문자 포함 요구

### 2.2 정기적인 데이터 정리

**만료된 초대 자동 정리:**
```sql
-- 크론 작업 설정 (pg_cron 확장 필요)
SELECT cron.schedule(
  'cleanup-expired-invitations',
  '0 2 * * *', -- 매일 새벽 2시
  $$SELECT cleanup_expired_invitations();$$
);
```

**오래된 휴지통 항목 자동 삭제:**
```sql
SELECT cron.schedule(
  'empty-old-trash',
  '0 3 * * *', -- 매일 새벽 3시
  $$SELECT auto_empty_trash();$$
);
```

### 2.3 활동 로그 관리

**활동 로그 보관 정책:**
```sql
-- 6개월 이상 된 로그 아카이빙
CREATE TABLE activity_logs_archive (LIKE activity_logs INCLUDING ALL);

-- 아카이빙 함수
CREATE OR REPLACE FUNCTION archive_old_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO activity_logs_archive
  SELECT * FROM activity_logs
  WHERE created_at < NOW() - INTERVAL '6 months';
  
  DELETE FROM activity_logs
  WHERE created_at < NOW() - INTERVAL '6 months';
END;
$$;
```

### 2.4 RLS (Row Level Security) 강화

**중요 테이블의 RLS 정책 검토:**
1. `memories` - 소유자와 가족만 접근
2. `profiles` - 본인 정보만 수정 가능
3. `comments` - 작성자만 수정/삭제 가능
4. `invitations` - 초대자와 초대받은 사람만 접근

### 2.5 API 보안

**Rate Limiting 설정:**
```sql
-- Supabase Edge Functions에서 rate limiting 구현
-- 또는 Supabase 대시보드에서 API Settings → Rate Limits 설정
```

### 2.6 백업 전략

**정기 백업 설정:**
1. Supabase 대시보드 → Settings → Backups
2. Point-in-time Recovery 활성화
3. 일일 백업 스케줄 설정

**백업 테스트:**
- 월 1회 백업 복원 테스트 수행
- 복원 절차 문서화

### 2.7 모니터링

**보안 이벤트 모니터링:**
```sql
-- 의심스러운 활동 감지 뷰
CREATE VIEW suspicious_activities AS
SELECT 
  user_id,
  COUNT(*) as action_count,
  DATE_TRUNC('hour', created_at) as hour
FROM activity_logs
WHERE action IN ('delete_memory', 'update_user_role', 'create_invitation')
GROUP BY user_id, DATE_TRUNC('hour', created_at)
HAVING COUNT(*) > 10; -- 시간당 10회 이상
```

### 2.8 환경 변수 보안

**프로덕션 환경 체크리스트:**
- [ ] `.env` 파일이 .gitignore에 포함되어 있는지 확인
- [ ] Supabase API 키가 환경 변수로 관리되는지 확인
- [ ] 프로덕션에서는 `anon` 키만 클라이언트에 노출
- [ ] `service_role` 키는 서버 사이드에서만 사용

## 3. 정기 보안 점검

### 월간 점검 항목:
1. [ ] 비활성 사용자 계정 검토
2. [ ] 비정상적인 활동 로그 패턴 확인
3. [ ] 만료된 초대 정리 확인
4. [ ] 백업 상태 확인

### 분기별 점검 항목:
1. [ ] RLS 정책 검토 및 업데이트
2. [ ] 함수 권한 검토
3. [ ] API 사용량 및 rate limit 검토
4. [ ] 보안 패치 및 업데이트 확인

## 4. 문제 발생 시 대응

### 보안 사고 대응 절차:
1. 영향받은 계정 즉시 비활성화
2. 활동 로그 분석
3. 필요시 특정 IP 차단
4. 영향받은 데이터 복원
5. 사고 보고서 작성

### 연락처:
- Supabase Support: support@supabase.io
- 프로젝트 관리자: [관리자 이메일]

---

마지막 업데이트: 2025-01-15