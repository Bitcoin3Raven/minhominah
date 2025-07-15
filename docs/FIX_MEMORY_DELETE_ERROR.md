# 메모리 삭제 오류 해결 가이드

## 문제 상황
- /memories 페이지에서 메모리 삭제 시 "추억삭제에 실패했습니다" 오류 발생
- 400 에러가 발생하며 삭제가 되지 않음

## 원인
1. **코드와 데이터베이스 불일치**: 
   - RLS 정책은 `created_by` 컬럼을 확인하지만 코드는 `user_id`를 사용
   - 이미 코드 수정 완료 ✓

2. **사용자 권한 부족**:
   - 현재 사용자의 역할이 'viewer'로 설정되어 있음
   - RLS 정책상 'parent' 역할만 메모리 삭제 가능

## 해결 방법

### 방법 1: 사용자 역할 변경 (권장)
1. Supabase 대시보드 접속
2. SQL Editor 열기
3. 다음 SQL 실행:
```sql
UPDATE profiles 
SET role = 'parent' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'thaiholiccom@gmail.com');
```

### 방법 2: RLS 정책 수정
`database-fix-memories-delete-policy.sql` 파일의 옵션 2 부분 주석 해제 후 실행

## 확인 방법
1. 페이지 새로고침 (F5)
2. 메모리의 점점점 메뉴 클릭
3. 삭제 버튼 클릭
4. 정상적으로 삭제되는지 확인

## 추가 정보
- 코드 수정 사항은 이미 적용되었습니다
- 데이터베이스 권한만 수정하면 즉시 작동합니다
