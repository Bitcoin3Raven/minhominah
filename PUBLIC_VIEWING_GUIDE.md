# 공개 사진 열람 기능 배포 가이드

## 🚀 구현 완료 내용

### 1. 데이터베이스 변경사항
- `memories` 테이블에 `is_public` 컬럼 추가
- `memories` 테이블에 `public_share_id` 컬럼 추가
- `albums` 테이블에 `is_public` 컬럼 추가
- RLS 정책 업데이트로 공개 콘텐츠 접근 허용

### 2. 프론트엔드 변경사항
- **OptionalAuthRoute.tsx**: 선택적 인증 라우트 컴포넌트
- **App.tsx**: memories와 albums 라우트를 공개 접근 가능하도록 변경
- **MemoriesPage.tsx**: 공개/비공개 필터링 로직 추가
- **MemoryDetailPage.tsx**: 공개 추억 접근 제어
- **UploadPage.tsx**: 공개 설정 토글 UI 추가

## 📝 배포 순서

### Step 1: Supabase 데이터베이스 업데이트
```bash
# Supabase 대시보드에서 SQL Editor 열기
# 또는 Supabase CLI 사용

# 마이그레이션 파일 실행
supabase db push
```

또는 Supabase 대시보드 SQL Editor에서 직접 실행:
```sql
-- /supabase/migrations/add_public_viewing.sql 내용 복사해서 실행
```

### Step 2: 프론트엔드 빌드 및 배포
```bash
# 의존성 설치
npm install

# 빌드
npm run build

# Vercel 배포 (자동)
git add .
git commit -m "feat: 공개 사진 열람 기능 추가"
git push origin main
```

## 🧪 테스트 시나리오

### 1. 비로그인 사용자 테스트
1. 브라우저 시크릿/프라이빗 모드 열기
2. 사이트 방문 (로그인하지 않음)
3. `/memories` 페이지 접근
4. **예상 결과**: 공개로 설정된 추억만 표시됨

### 2. 공개 추억 설정 테스트
1. 가족 계정으로 로그인
2. `/upload` 페이지에서 새 추억 업로드
3. "🌍 공개 추억으로 설정" 체크박스 선택
4. 저장 후 로그아웃
5. **예상 결과**: 로그아웃 상태에서도 해당 추억 열람 가능

### 3. 기존 추억 공개 전환 테스트
1. 가족 계정으로 로그인
2. 기존 추억 편집 모드 진입
3. "🌍 공개 추억으로 설정" 체크박스 선택
4. 저장
5. **예상 결과**: 해당 추억이 공개로 전환됨

### 4. 공개 링크 공유 테스트
1. 공개 추억 상세 페이지 URL 복사
2. 다른 브라우저/디바이스에서 URL 접근
3. **예상 결과**: 로그인 없이 추억 상세 정보 열람 가능

## ⚠️ 주의사항

### 보안 관련
- 공개 설정은 가족 계정만 변경 가능
- 공개 추억도 수정/삭제는 로그인 필요
- 댓글 작성은 로그인 사용자만 가능

### 성능 관련
- 공개 추억이 많아질 경우 인덱스 확인
- 이미지 최적화 및 CDN 설정 권장

### UX 관련
- 공개 추억에는 🌍 아이콘 표시
- 로그인하지 않은 사용자에게 제한된 기능 안내

## 🔄 롤백 방법

문제 발생 시 롤백:

### 데이터베이스 롤백
```sql
-- 공개 설정 비활성화 (데이터는 유지)
UPDATE memories SET is_public = false;

-- 또는 컬럼 제거 (데이터 손실)
ALTER TABLE memories DROP COLUMN is_public;
ALTER TABLE memories DROP COLUMN public_share_id;
ALTER TABLE albums DROP COLUMN is_public;
```

### 코드 롤백
```bash
# 이전 커밋으로 되돌리기
git revert HEAD
git push origin main
```

## 📊 모니터링 포인트

1. **Supabase Dashboard**
   - RLS 정책 동작 확인
   - 쿼리 성능 모니터링

2. **프론트엔드 로그**
   - 공개/비공개 필터링 동작
   - 인증 오류 확인

3. **사용자 피드백**
   - 접근성 문제
   - 성능 이슈

## 🎯 향후 개선사항

1. **공유 기능 강화**
   - 카카오톡/SNS 공유 버튼
   - 공개 링크 QR코드 생성
   - 공유 횟수 추적

2. **접근 제어 세분화**
   - 특정 사람에게만 공개
   - 시간 제한 공개
   - 비밀번호 보호 공개

3. **관리 기능**
   - 공개 추억 일괄 관리
   - 공개 통계 대시보드
   - 접근 로그 확인

## 📞 문제 발생 시

1. Supabase 콘솔에서 로그 확인
2. 브라우저 개발자 도구 콘솔 확인
3. 네트워크 탭에서 API 응답 확인

---

*작성일: 2024-11-04*
*작성자: Claude Code Assistant*