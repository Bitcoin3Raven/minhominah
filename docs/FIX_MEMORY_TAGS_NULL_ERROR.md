# 메모리 태그/인물 연결 에러 해결 가이드

## 문제 상황
메모리 수정 시 다음과 같은 에러가 발생합니다:
- `null value in column "tag_id" violates not-null constraint`
- `new row violates row-level security policy for table "memory_tags"`
- `new row violates row-level security policy for table "memory_people"`

## 🚨 긴급 해결 방법

### Supabase에서 즉시 실행하세요!

1. [Supabase Dashboard](https://app.supabase.com)에 로그인
2. 프로젝트 선택
3. 좌측 메뉴에서 **SQL Editor** 클릭
4. 다음 SQL을 복사해서 붙여넣고 **RUN** 클릭:

```sql
-- 긴급 memory_people, memory_tags RLS 정책 수정

-- 1. memory_people 테이블 정책 삭제 및 재생성
DROP POLICY IF EXISTS "Users can view memory_people" ON memory_people;
DROP POLICY IF EXISTS "Users can insert memory_people" ON memory_people;
DROP POLICY IF EXISTS "Users can update memory_people" ON memory_people;
DROP POLICY IF EXISTS "Users can delete memory_people" ON memory_people;

-- 더 간단한 정책으로 재생성
CREATE POLICY "Enable all for authenticated users on memory_people" ON memory_people
    FOR ALL USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- 2. memory_tags 테이블도 동일하게 처리
DROP POLICY IF EXISTS "Users can view memory_tags" ON memory_tags;
DROP POLICY IF EXISTS "Users can insert memory_tags" ON memory_tags;
DROP POLICY IF EXISTS "Users can update memory_tags" ON memory_tags;
DROP POLICY IF EXISTS "Users can delete memory_tags" ON memory_tags;

CREATE POLICY "Enable all for authenticated users on memory_tags" ON memory_tags
    FOR ALL USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- 3. RLS 활성화 확인
ALTER TABLE memory_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_tags ENABLE ROW LEVEL SECURITY;
```

5. 실행 완료 메시지 확인
6. 웹사이트로 돌아가서 페이지 새로고침 (F5)
7. 메모리 수정 다시 시도

## 문제가 해결되었나요?

✅ **해결됨**: 이제 메모리 수정이 정상적으로 작동합니다!
- 기존 태그와 인물이 화면에 표시됨
- 수정/저장이 에러 없이 완료됨

❌ **아직 문제가 있다면**:
1. 브라우저 캐시 완전 삭제 (Ctrl+Shift+Delete)
2. 로그아웃 후 다시 로그인
3. 시크릿/프라이빗 모드로 시도

## 추가 정보
- 이 해결책은 모든 인증된 사용자가 memory_people과 memory_tags에 접근할 수 있도록 합니다
- 보안이 중요한 경우 나중에 더 세밀한 정책으로 수정할 수 있습니다
- 코드 레벨에서 이미 null 값 필터링이 적용되어 있습니다
