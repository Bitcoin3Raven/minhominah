# 관리자 페이지 프로필 편집 가이드

## 문제 상황
- 관리자 페이지에서 사용자가 "이름 없음"으로 표시됨
- 이메일이 표시되지 않음

## 해결 방법

### 1. 즉시 사용 가능한 기능
관리자 페이지에서 각 사용자 행의 작업 버튼을 확인하면:
- 📧 버튼: 프로필 정보 편집 (이름, 사용자명)
- ✏️ 버튼: 역할 변경

프로필 편집 버튼(📧)을 클릭하여:
- **이름**: 사용자의 실제 이름 입력
- **사용자명**: @username 형태로 표시될 이름 입력

### 2. 이메일 표시를 위한 추가 작업 필요

이메일 정보를 함께 표시하려면 Supabase 대시보드에서 다음 SQL을 실행해야 합니다:

1. Supabase 대시보드 접속
2. SQL Editor 열기
3. `database-get-users-with-email-rpc.sql` 파일의 내용 실행

```sql
CREATE OR REPLACE FUNCTION get_users_with_email()
RETURNS TABLE (
  id uuid,
  username text,
  full_name text,
  role text,
  created_at timestamptz,
  updated_at timestamptz,
  email text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 현재 사용자가 parent 역할인지 확인
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'parent'
  ) THEN
    RAISE EXCEPTION 'Access denied: Only parent role can access this function';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.full_name,
    p.role,
    p.created_at,
    p.updated_at,
    u.email
  FROM profiles p
  LEFT JOIN auth.users u ON p.id = u.id
  ORDER BY p.created_at DESC;
END;
$$;
```

### 3. 완료 후 확인
1. 페이지 새로고침 (F5)
2. 관리자 페이지에서 이메일이 정상적으로 표시되는지 확인
3. 프로필 편집 기능이 정상 작동하는지 확인

## 추가 기능
- 프로필 정보는 언제든지 수정 가능
- 이메일은 보안상 수정 불가 (읽기 전용)
- 역할 변경은 별도의 편집 버튼으로 관리
