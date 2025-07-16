# 회원가입 시 사용자 정보 저장 문제 해결 가이드

## 문제
회원가입 시 이메일과 이름이 "설정 안 됨"으로 표시되는 문제

## 원인
1. 회원가입 시 사용자 이름(full_name)이 profiles 테이블에 저장되지 않음
2. profiles 테이블과 트리거가 제대로 설정되지 않았을 가능성

## 해결 방법

### 1. Supabase에서 SQL 실행
`database-setup-profiles-table.sql` 파일의 내용을 Supabase SQL Editor에서 실행하세요:

1. Supabase Dashboard로 이동
2. SQL Editor 메뉴 클릭
3. New query 클릭
4. `database-setup-profiles-table.sql` 파일의 내용을 복사하여 붙여넣기
5. Run 버튼 클릭

이 SQL은 다음을 수행합니다:
- profiles 테이블 생성 (이미 있다면 건너뜀)
- RLS(Row Level Security) 정책 설정
- 새 사용자 생성 시 자동으로 profiles 레코드를 생성하는 트리거 설정
- 이메일 정보를 포함한 사용자 목록을 가져오는 RPC 함수 생성

### 2. 코드 변경 사항
다음 파일들이 수정되었습니다:

1. **AuthContext.tsx**
   - `signUp` 함수가 이제 `fullName` 파라미터를 받습니다
   - 회원가입 시 user metadata에 full_name과 username을 저장합니다

2. **LoginPage.tsx**
   - 회원가입 시 입력받은 이름을 `signUp` 함수에 전달합니다

### 3. 기존 사용자 데이터 수정
이미 가입한 사용자들의 정보를 수정하려면:

1. Supabase Dashboard에서 Table Editor로 이동
2. profiles 테이블 선택
3. 각 사용자의 full_name과 username 직접 수정

또는 SQL로 업데이트:
```sql
UPDATE profiles 
SET full_name = '사용자 이름', 
    username = 'username'
WHERE id = '사용자-UUID';
```

### 4. 테스트
1. 새로운 계정으로 회원가입 시도
2. 이름 필드를 입력하고 가입 진행
3. 관리자 페이지에서 새 사용자의 이름과 이메일이 제대로 표시되는지 확인

## 주의사항
- 트리거는 새로 가입하는 사용자에게만 적용됩니다
- 기존 사용자는 수동으로 profiles 데이터를 업데이트해야 합니다
- RPC 함수 `get_users_with_email`이 제대로 생성되어야 관리자 페이지에서 이메일을 볼 수 있습니다