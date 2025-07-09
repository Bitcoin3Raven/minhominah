# Supabase Authentication 설정 가이드

## 1. Email 인증 활성화

1. Supabase 대시보드에서 **Authentication** 메뉴 클릭
2. **Providers** 탭 선택
3. **Email** 섹션에서 **Enable Email Provider** 활성화

## 2. 첫 번째 사용자 생성 (관리자)

### 방법 1: Supabase 대시보드에서 생성

1. **Authentication** > **Users** 탭으로 이동
2. **Add user** > **Create new user** 클릭
3. 다음 정보 입력:
   - Email: your-email@example.com
   - Password: 안전한 비밀번호
4. **Create user** 클릭

### 방법 2: SQL Editor에서 직접 생성

```sql
-- 사용자 생성 후 실행
-- 'your-user-id'를 실제 사용자 ID로 변경하세요

-- 부모 권한 부여
INSERT INTO profiles (id, username, full_name, role) 
VALUES (
    'your-user-id', 
    'admin',
    '관리자',
    'parent'
);
```

## 3. 로그인 테스트

1. 프로젝트 웹사이트 접속
2. 로그인 버튼 클릭
3. 생성한 이메일과 비밀번호로 로그인
4. 로그인 성공 시 "추억 추가" 버튼이 보이는지 확인

## 4. 추가 설정 (선택사항)

### 소셜 로그인 설정

1. **Providers** 탭에서 원하는 소셜 로그인 활성화:
   - Google
   - GitHub
   - Apple
   - Facebook

2. 각 제공자의 OAuth 설정:
   - Client ID
   - Client Secret
   - Redirect URL 설정

### 이메일 템플릿 커스터마이징

1. **Email Templates** 탭에서 이메일 템플릿 수정 가능:
   - 회원가입 확인
   - 비밀번호 재설정
   - 이메일 변경 확인

## 5. 보안 설정

### RLS (Row Level Security) 확인

현재 설정된 RLS 정책:
- **viewer**: 기본 권한, 조회만 가능
- **family**: 가족 구성원, 조회 및 댓글 작성 가능
- **parent**: 부모 권한, 모든 기능 사용 가능

### 권한 부여 방법

```sql
-- 가족 구성원으로 설정
UPDATE profiles 
SET role = 'family' 
WHERE id = 'user-id';

-- 부모로 설정
UPDATE profiles 
SET role = 'parent' 
WHERE id = 'user-id';
```

## 6. 문제 해결

### 로그인이 안 되는 경우

1. 브라우저 콘솔에서 오류 확인
2. Supabase URL과 Anon Key가 올바른지 확인
3. CORS 설정 확인

### 권한 오류가 발생하는 경우

1. profiles 테이블에 사용자 레코드가 있는지 확인
2. role이 올바르게 설정되어 있는지 확인
3. RLS 정책이 올바르게 적용되어 있는지 확인
