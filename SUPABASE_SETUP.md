# Supabase 설정 가이드

## 📋 빠른 시작 가이드

### 1. Supabase 프로젝트 생성
1. [https://supabase.com](https://supabase.com) 접속
2. "Start your project" 클릭 후 GitHub 계정으로 로그인
3. "New Project" 클릭
4. 프로젝트 정보 입력:
   - Name: `minhominah`
   - Database Password: 안전한 비밀번호 설정
   - Region: `Northeast Asia (Seoul)`
5. "Create new project" 클릭

### 2. API 키 확인
1. 프로젝트 대시보드에서 Settings > API 메뉴 이동
2. 다음 정보 복사:
   - `Project URL`: https://xxxxx.supabase.co
   - `anon public`: 공개 키 (클라이언트용)
   - `service_role`: 서비스 키 (서버용, 보안 주의!)

### 3. 설정 파일 업데이트
#### `/config/supabase.js` 수정:
```javascript
const SUPABASE_URL = 'https://xxxxx.supabase.co';  // 여기에 Project URL 입력
const SUPABASE_ANON_KEY = 'eyJhbG...';  // 여기에 anon public 키 입력
```

#### `/config/supabase-config.php` 수정:
```php
define('SUPABASE_URL', 'https://xxxxx.supabase.co');
define('SUPABASE_ANON_KEY', 'eyJhbG...');
define('SUPABASE_SERVICE_KEY', 'eyJhbG...');  // service_role 키 (선택사항)
```

### 4. 데이터베이스 테이블 생성
Supabase 대시보드 > SQL Editor에서 다음 쿼리 실행:

```sql
-- 프로필 테이블 (auth.users와 연동)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  role TEXT CHECK (role IN ('parent', 'family', 'viewer')) DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 추억/메모리 테이블
CREATE TABLE memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  memory_date DATE NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 메모리를 조회할 수 있도록 정책 설정
CREATE POLICY "누구나 메모리 조회 가능" ON memories
  FOR SELECT USING (true);

-- 로그인한 사용자만 메모리 생성 가능
CREATE POLICY "로그인 사용자만 메모리 생성" ON memories
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 자신이 만든 메모리만 수정/삭제 가능
CREATE POLICY "본인 메모리만 수정" ON memories
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "본인 메모리만 삭제" ON memories
  FOR DELETE USING (auth.uid() = created_by);

-- 댓글 시스템 테이블 (선택사항)
-- database-comments-schema.sql 파일 참조
-- 댓글, 좋아요, 알림 기능 포함
```

### 5. Storage 버킷 생성 (이미지/동영상용)
1. Supabase 대시보드 > Storage 메뉴
2. "New bucket" 클릭
3. 버킷 이름: `media`
4. Public bucket 체크 (공개 이미지용)
5. "Create bucket" 클릭

### 6. 실시간 기능 활성화 (댓글 시스템용)
1. Supabase 대시보드 > Database > Replication 메뉴
2. 다음 테이블들의 실시간 구독 활성화:
   - `comments` (댓글 실시간 업데이트)
   - `comment_likes` (좋아요 실시간 업데이트)
3. "Enable replication" 클릭

### 7. 테스트 방법
1. `/test/test.html` 파일을 웹브라우저로 열기
2. Supabase 연결 상태 확인
3. 회원가입 테스트
4. 로그인 테스트
5. 메모리 생성 및 조회 테스트

## 🚀 배포 옵션

### 옵션 1: Cafe24 호스팅 활용 (권장)
**장점:**
- 이미 보유한 호스팅 활용
- PHP 지원으로 서버사이드 처리 가능
- 파일 업로드 등 서버 기능 활용 가능

**배포 방법:**
1. FTP로 `minhominah` 폴더 전체 업로드
2. `config/supabase-config.php`의 보안 강화 (파일 권한 설정)
3. `.htaccess` 파일로 config 폴더 접근 차단

### 옵션 2: 정적 호스팅 (Vercel/Netlify)
**장점:**
- 무료 티어 제공
- 자동 HTTPS
- CDN 기본 제공
- Git 연동 자동 배포

**단점:**
- PHP 미지원 (JavaScript만 사용)
- 서버사이드 기능 제한

### 옵션 3: 하이브리드 방식
- 프론트엔드: Vercel/Netlify (빠른 CDN)
- API/업로드: Cafe24 PHP (서버 기능)
- 데이터베이스: Supabase

## 🔒 보안 주의사항
1. `service_role` 키는 절대 클라이언트에 노출하지 마세요
2. Cafe24 배포시 config 폴더는 웹에서 접근 불가하도록 설정
3. HTTPS 사용 권장
4. 환경변수 사용 고려

## 📝 다음 단계
1. 실제 Supabase 키로 설정 파일 업데이트
2. 테스트 페이지로 연동 확인
3. 기본 기능 개발 시작
4. UI/UX 디자인 적용