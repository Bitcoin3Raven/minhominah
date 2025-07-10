# 민호민아 프로젝트 계획 (Project Plan)

## 프로젝트 개요
- **프로젝트명**: 민호와 민아의 성장 앨범
- **도메인**: https://minhominah.com
- **기술 스택**: HTML/JavaScript + Supabase + Tailwind CSS + Vercel
- **현재 상태**: 개발 진행 중
- **최종 업데이트**: 2025-01-20

## 현재 상태 요약

### 🔄 현재 배포 상황 (2025-01-10)
- **GitHub 리포지토리**: https://github.com/Bitcoin3Raven/minhominah.git
- **Vercel 프로젝트**:
  - minhominah (메인 프로젝트) - 자동 배포 활성화됨
  - ~~minhominah.album~~ (삭제 예정 - 중복 프로젝트)
- **최근 배포**: 정상 배포됨
- **Git 상태**: main 브랜치, 깨끗한 상태 (nothing to commit)

### ✅ 완료된 작업 (2025-01-20)
1. **보안 강화 문서화**
   - Supabase Security Advisor 3개 경고 해결방안 제시
   - 보안 패치 SQL 및 가이드 문서 작성
   
2. **Vercel 배포 환경 구축**
   - 상세 배포 가이드 작성 (docs/VERCEL_DEPLOYMENT_GUIDE.md)
   - 자동 배포 스크립트 생성 (Windows/Mac/Linux)
   - vercel.json 최적화 및 보안 헤더 추가
   - package.json에 배포 스크립트 추가

3. **문서 정리**
   - README.md 업데이트
   - QUICK_DEPLOY.md 생성
   - SQL_EXECUTION_GUIDE.md 업데이트

### 🔄 즉시 필요한 작업
1. **도메인 연결 설정** (진행 중)
   - Vercel에서 "Add Domain" 클릭하여 minhominah.com 추가
   - dotname에서 DNS 설정 (A 레코드: 76.76.21.21)
   - SSL 인증서 자동 발급 대기

2. **Vercel 중복 프로젝트 정리**
   - minhominah.album 프로젝트 삭제
   - minhominah 프로젝트만 유지

3. **Supabase Dashboard에서 보안 설정**
   - SQL Editor에서 database-security-patch.sql 실행
   - Authentication 설정에서 OTP 시간 및 비밀번호 보호 설정

4. **로그인 기능 개선** (추가 필요)
   - 모든 페이지에 auth.js 적용
   - 로그인하지 않은 사용자의 접근 제한
   - 추억 로드 시 인증 확인

### 📌 프로젝트 접속 정보
- **로컬**: C:\Users\thaih\Documents\minhominah
- **Supabase**: https://illwscrdeyncckltjrmr.supabase.co
- **현재 배포 URL**: https://minhominah.vercel.app
- **최종 도메인**: https://minhominah.com (dotname 보유, DNS 설정 필요)

#### 1. index.html 번역 완성
- **상태**: ✅ 완료
- **완성 항목**:
  - 모든 UI 텍스트에 번역 태그 적용
  - 언어 선택기 추가
  - 한국어, 영어, 태국어 번역 지원
  - 레이아웃 옵션 (그리드, 마소너리, 타임라인) 번역 추가
  - 나이별 필터 (0세~20세) 번역 추가
  - 날짜 필터 및 상세 필터 번역 추가
  - 동적 메시지 번역 지원 추가

#### 2. 모든 페이지 번역 적용
- **상태**: ✅ 완료
- **완성 페이지**:
  - index.html - 메인 페이지 ✅
  - growth.html - 성장 기록 페이지 ✅
  - statistics.html - 통계 페이지 ✅
  - family-settings.html - 가족 설정 페이지 ✅
  - backup.html - 백업 페이지 ✅
  - add-memory.html - 추억 추가 페이지 ✅
  - photobook-creator.html - 포토북 생성 페이지 ✅
  - share.html - 공유 페이지 ✅
  - join-family.html - 가족 초대 페이지 ✅

### 🟡 다음 작업: Supabase 보안 강화 및 로그인 기능 개선
- [x] 로그인 상태 관리 기능 구현 ✅ (2025-01-10)
  - [x] auth.js 모듈로 인증 상태 중앙 관리
  - [x] 로그인 상태에 따른 헤더 UI 동적 변경
  - [x] 사용자 드롭다운 메뉴 구현
  - [x] 인증 관련 번역 추가 (한/영/태)
- [ ] Supabase Dashboard에서 보안 설정 적용
  - [ ] SQL Editor에서 database-security-patch.sql 실행
  - [ ] Auth Settings에서 OTP 만료 시간 300초로 변경
  - [ ] Leaked Password Protection 활성화
- [ ] 모든 SECURITY DEFINER 함수에 search_path 설정 확인
- [ ] RLS 정책 전체 검토 및 강화

### ✅ 완료됨: 테스트 및 품질 보증
- 모든 페이지의 언어 전환 테스트 ✅
- 번역 누락 확인 ✅
- 사용자 경험 개선 ✅

### ✅ 완료됨: 동적 UI 다국어 지원 (2025-01-17)
- **상태**: ✅ 완료
- **완성 항목**:
  - share-system.js 다국어 지원 완료
  - notification-system.js 다국어 지원 완료
  - 모든 동적 생성 UI 요소에 번역 시스템 적용
  - 번역 함수 호출 문제 해결

## 작업 진행 계획

### ✅ Phase 1-3: 다국어 지원 완료
- 모든 페이지 번역 시스템 적용 완료
- 한국어, 영어, 태국어 지원 완료
- 동적 UI 요소 번역 지원 완료

### 🔄 Phase 4: 핵심 기능 개선 (진행 중)
1. [ ] **보안 강화** (우선순위)
   - [ ] Supabase Security Advisor 경고 해결
   - [ ] 모든 함수에 search_path 설정
   - [ ] RLS 정책 검토 및 강화
   - [ ] 민감한 데이터 보호 강화
2. [ ] Supabase 연동 강화
   - [ ] 이미지/비디오 업로드 기능 구현
   - [ ] 추억 상세 보기 페이지 구현
   - [ ] 실시간 데이터 동기화 확장
   - [ ] 오프라인 지원 (PWA)
3. [ ] 사용자 인증 시스템
   - [ ] 로그인/회원가입 페이지 구현
   - [ ] 소셜 로그인 연동 (Google, Apple)
   - [ ] 비밀번호 재설정 기능
4. [ ] 성능 최적화
   - [ ] 이미지 지연 로딩
   - [ ] 무한 스크롤 구현
   - [ ] 캐싱 전략 수립

### 🎯 Phase 5: 추가 기능 개발
1. [ ] AI 기반 기능
   - [ ] 자동 태그 생성
   - [ ] 얼굴 인식 기반 인물 태깅
   - [ ] 스마트 검색 기능
2. [ ] 고급 공유 기능
   - [ ] QR 코드 생성
   - [ ] 이메일 초대 시스템
   - [ ] 공유 권한 세분화
3. [ ] 데이터 관리
   - [ ] 백업/복원 기능 구현
   - [ ] 데이터 내보내기 (PDF, ZIP)
   - [ ] 스토리지 사용량 관리

## 작업 로그

### 2025-01-10 (오늘)
- 프로젝트 현황 파악:
  - GitHub 리포지토리 연결 확인 (Bitcoin3Raven/minhominah)
  - Vercel 자동 배포 상태 확인 (minhominah, minhominah.album 두 프로젝트)
  - Git 상태 확인 (main 브랜치, working tree clean)
  - 기존 프로젝트 구조 및 파일 확인
- project_plan.md 파일 업데이트:
  - 현재 배포 상황 섹션 추가
  - GitHub 및 Vercel 프로젝트 정보 명시
- Vercel 프로젝트 정리:
  - 중복 배포 문제 확인 (minhominah, minhominah.album)
  - minhominah.album 프로젝트 삭제 결정
  - Vercel 프로젝트 삭제 방법 안내
- 도메인 연결 준비:
  - minhominah.com 도메인 (dotname 보유) 확인
  - Vercel 커스텀 도메인 설정 가이드 작성
  - docs/DOMAIN_SETUP_GUIDE.md 문서 생성
  - DNS 설정 방법 안내 (A 레코드, CNAME 설정)
- dotname DNS 설정 진행:
  - 기존 파킹 페이지 설정 확인 (parking3.dnstool.net)
  - A 레코드 추가 필요: @ → 76.76.21.21
  - CNAME 레코드 수정 필요: www → cname.vercel-dns.com
  - 파킹 페이지 CNAME 삭제 필요
- GitHub Desktop 설정:
  - GitHub Desktop 설치 완료
  - 기존 로컬 리포지토리 추가 방법 안내
  - File → Add Local Repository로 C:\Users\thaih\Documents\minhominah 추가
- 로그인 상태 관리 기능 구현: ✅
  - auth.js 파일 생성 (인증 상태 관리 모듈)
  - 로그인 상태에 따른 헤더 UI 동적 변경
  - 사용자 드롭다운 메뉴 추가 (프로필, 설정, 로그아웃)
  - 로그인 후 페이지 새로고침 대신 UI 업데이트
  - 한국어, 영어, 태국어 번역 키 추가
  - 인증 상태 변경 리스너 구현
  - GitHub 커밋 및 푸시 완료

### 2025-01-10 (이전 작업)
- 프로젝트 계획 문서 생성
- 번역 관련 이슈 파악 및 정리
- 작업 계획 수립
- 번역 시스템 문제 해결 시작:
  - 태국어 파일 오타 수정 (마지막 쉼표 제거)
  - 한국어, 영어, 태국어 파일에 누락된 번역 키 추가
  - index.html 관련 추가 번역 키 추가 (댓글, 모달, 나이 필터 등)
  - growth.html에 번역 시스템 적용 시작
  - growth.html 관련 번역 키 추가 (차트, 테이블, 모달 등)
  - family-settings.html에 언어 변환기 및 번역 시스템 완전 적용
  - family-settings.html 관련 번역 키 추가 (가족 설정, 초대, 역할 등)
  - backup.html에 언어 변환기 및 번역 시스템 완전 적용
  - backup.html 관련 번역 키는 이미 번역 파일에 존재 확인
  - photobook-creator.html에 언어 변환기 및 번역 시스템 적용
  - photobook-creator.html 관련 번역 키 추가 (ko.js, en.js, th.js)
  - share.html에 언어 변환기 및 번역 시스템 적용
  - share.html 관련 번역 키 추가 (ko.js, en.js, th.js)
  - join-family.html에 언어 변환기 및 번역 시스템 적용
  - join-family.html 관련 번역 키 추가 (ko.js, en.js, th.js)
  - statistics.html에 언어 변환기 및 번역 시스템 적용
  - statistics.html 관련 번역 키 추가 (ko.js, en.js, th.js)
  - **모든 HTML 페이지의 번역 작업 완료** ✅

### 2025-01-12
- 언어 변환기 통합 작업:
  - statistics.html, backup.html, share.html에서 언어 변환기 누락 확인
  - photobook-creator.html, family-settings.html에서 구 언어변환기(select dropdown)와 신 언어변환기(국기 플래그) 중복 문제 확인
  - 모든 페이지에 language.js의 신 언어변환기(국기 플래그)만 사용하도록 통일 작업 진행
  - 구 언어변환기(KR TH EN 등 표기) 모두 제거
  - photobook-creator.html에서 구 언어변환기 제거 완료
  - family-settings.html에서 구 언어변환기 제거 완료
  - join-family.html에서 구 언어변환기 제거 완료
  - statistics.html에 언어 선택기 추가 완료 (언어 스크립트 및 초기화 코드 포함)
  - backup.html에 언어 선택기 추가 완료 (언어 스크립트 및 초기화 코드 포함)
  - share.html에 언어 선택기 추가 완료 (언어 스크립트 및 초기화 코드 포함 - 포토북 언어별 출력 지원)
  - **모든 페이지가 language.js의 동적 언어 변환기(국기 플래그)만 사용하도록 통일 완료** ✅
  - **모든 페이지에서 언어 전환 가능 확인** ✅
  - **statistics.html과 backup.html의 네비게이션 간격 조정 완료** ✅ (추억 추가 버튼과 언어 선택기 사이 간격을 다른 페이지와 동일하게 통일)
  - **add-memory.html 페이지 개선 완료** ✅
    - 헤더의 "민호민아 성장앨범" 텍스트 제거
    - 히어로 섹션 텍스트를 수직 중앙 정렬로 변경
    - "앨범으로 돌아가기" 버튼을 절대 위치로 상단 배치

### 2025-01-16
- family-settings.html 페이지 수정:
  - 헤더의 "민호민아 성장앨범" 텍스트 삭제
  - 푸터의 "민호민아 성장앨범" 텍스트 삭제
  - 언어별 번역 시스템에 의존하도록 변경
- index.html 나이별 필터 다국어 지원:
  - 나이별 필터 섹션의 모든 텍스트에 번역 시스템 적용
  - "나이별 보기", "전체", "상세 필터" 등에 data-lang 속성 추가
  - 나이별 버튼 텍스트 동적 생성 시 현재 언어에 맞게 표시
  - 생년월일 설정 섹션에 번역 적용
  - 개월별 필터(0-3개월, 4-6개월 등)에 번역 적용
  - 언어 변경 시 나이별 필터 재렌더링 기능 추가
  - language.js에 나이별 필터 재렌더링 이벤트 추가
- 동적 생성 UI 다국어 지원:
  - share-system.js 다국어 지원 추가
    - 공유 모달의 모든 한국어 텍스트에 번역 시스템 적용
    - 카카오톡, 페이스북, 트위터 공유 옵션 번역
    - 공유 설정 (만료 기간, 패스워드 보호, 댓글 표시) 번역
    - 모달 생성 후 번역 업데이트 함수 호출 추가
  - notification-system.js 다국어 지원 추가
    - 알림 설정 모달의 모든 한국어 텍스트에 번역 시스템 적용
    - 알림 유형 (기념일, 댓글, 새 추억, 가족 초대, 공유 조회) 번역
    - 알림 방법 및 설정 옵션 번역
    - 모달 생성 후 번역 업데이트 함수 호출 추가
  - 관련 번역 키를 ko.js, en.js, th.js에 추가

### 2025-01-17
- 동적 UI 번역 문제 해결:
  - updatePageTranslations 함수가 존재하지 않는 문제 발견
  - share-system.js와 notification-system.js의 번역 함수 호출 수정
  - window.languageManager.applyLanguage() 함수로 변경
  - 모든 동적 생성 UI의 다국어 지원 완료
- statistics.html 번역 문제 해결:
  - 모든 통계 카드 텍스트에 data-lang 속성 추가
  - 차트 제목들에 번역 태그 적용
  - 추가 통계 정보 섹션 번역 적용
  - ko.js, en.js, th.js에 통계 관련 번역 키 10개 이상 추가
- family-settings.html 수정:
  - 헤더의 site_title span 태그 제거하여 로고만 표시
- add-memory.html은 이미 수정되어 있음 확인

### 2025-01-20
- 프로젝트 현황 파악 및 문서 업데이트:
  - Supabase 연결 상태 확인 완료 (SUPABASE_URL, ANON_KEY 설정됨)
  - 데이터베이스 스키마 확인 완료:
    * 메인 스키마: profiles, memories, people, media_files, tags, growth_records
    * 가족 시스템: family_groups, family_members, family_invitations
    * 댓글 시스템: comments, comment_likes, comment_notifications
    * 공유 시스템: share_links, share_views, share_settings
    * 알림 시스템: notifications, notification_settings, anniversaries, push_subscriptions
  - 구현된 기능 상태 확인:
    * ✅ 댓글 시스템 (실시간 업데이트 포함)
    * ✅ 공유 시스템 (소셜 미디어 연동)
    * ✅ 알림 시스템 (브라우저 푸시 알림)
    * ✅ 가족 계정 관리
    * ✅ 스마트 태그 시스템
    * ✅ 다국어 지원 (한국어, 영어, 태국어)
    * ⚠️ 기본 Supabase 기능만 구현 (확장 필요)
- backup.html 번역 완료:
  - 영어, 태국어 번역 키가 이미 준비되어 있음 확인
  - backup.html에 data-lang 속성 추가하여 번역 적용
  - 모든 UI 텍스트에 번역 태그 적용 완료
  - 네비게이션, 백업 옵션, 복원, 자동 백업 설정 등 모든 섹션 번역 적용
- statistics.html 헤더 메뉴 번역 수정:
  - 헤더 네비게이션 메뉴에 data-lang 속성 추가
  - 홈, 성장 기록, 통계, 가족 설정, 백업, 추억 추가 메뉴 번역 적용
  - 기존 번역 키 확인 완료 (nav_home, nav_growth, nav_statistics 등)
  - 언어 초기화 코드 정상 작동 확인
- add-memory.html 페이지 내용 번역 완료:
  - 히어로 섹션: 제목, 부제목 번역 태그 적용
  - 인증 섹션: 로그인 필요 메시지, 이메일/비밀번호 입력란, 로그인 버튼 번역
  - 기본 정보 섹션: 제목, 날짜, 장소, 설명 필드 번역
  - 인물 선택 섹션: "누구의 추억인가요?" 번역
  - 태그 섹션: 태그 추가 레이블 번역
  - 사진 업로드 섹션: 업로드 안내 문구, 파일 형식 번역
  - 버튼: 취소, 저장 버튼 번역
  - 성공/에러 메시지 번역 태그 적용
  - 기존 번역 키 재사용으로 최적화 (add_memory_drag_drop, add_memory_file_types 등)
- 헤더 로고 크기 문제 수정:
  - family-settings.html과 add-memory.html의 로고 크기가 작게 표시되는 문제 발견
  - 원인: 로고 클래스가 "h-8 w-8 mr-2"로 고정 크기 설정됨
  - 해결: 다른 페이지와 동일하게 "h-10 w-auto"로 수정
  - 영향 받은 파일: family-settings.html, add-memory.html
- share.html 상단 여백 문제 수정:
  - 문제: 고정 헤더 아래 컨텐츠가 겹쳐서 "공유된 추억" 텍스트가 잘림
  - 원인: main 태그에 충분한 padding-top이 없었음 (py-8만 있음)
  - 해결: 다른 페이지와 동일하게 pt-32 추가하여 헤더 높이만큼 여백 확보
- share.html 번역 완료:
  - 헤더 메뉴: 홈, 성장 기록, 통계, 가족 설정, 백업, 추억 추가 메뉴에 data-lang 속성 추가
  - 로딩 메시지: "추억을 불러오는 중..."
  - 패스워드 폼: 제목, 설명, 입력 필드, 확인 버튼
  - 댓글 섹션: "댓글" 제목
  - 공유 정보: 추가 추억 안내 메시지, 방문하기 버튼
  - 에러 상태: 에러 제목, 메시지, 홈으로 돌아가기 버튼
  - 언어 초기화 코드 확인 완료 (initializeLanguage 호출)
  - 기존 번역 키 활용으로 최적화 (share_loading_memory, share_password_required 등)
- **Supabase Security Advisor 보안 이슈 해결**:
  - 3개의 보안 경고 발견:
    * Function Search Path Mutable (public.get_comments_tree)
    * Auth OTP Long Expiry
    * Leaked Password Protection Disabled
  - database-security-patch.sql 파일 생성:
    * get_comments_tree 함수에 search_path 설정 추가
    * 보안 강화를 위한 SQL 패치 준비
  - docs/SECURITY_GUIDE.md 문서 생성:
    * 각 보안 경고에 대한 해결 방법 문서화
    * Supabase Dashboard에서 설정해야 할 항목 명시
    * 추가 보안 권장사항 포함
  - **주의**: 권한 문제로 직접 SQL 실행 불가
    * Supabase Dashboard > SQL Editor에서 수동 실행 필요
    * Auth 설정은 Dashboard에서 직접 변경 필요
- **Vercel 배포 가이드 작성**:
  - docs/VERCEL_DEPLOYMENT_GUIDE.md 생성:
    * 빠른 배포 3단계 가이드
    * 상세 배포 단계별 설명
    * 환경 변수 설정 방법
    * 커스텀 도메인 설정 가이드
    * 문제 해결 방법
  - vercel.json 수정:
    * 정적 사이트에 맞게 설정 최적화
    * 보안 헤더 추가 (X-Content-Type-Options, X-Frame-Options 등)
    * 불필요한 Next.js 환경변수 제거
  - 배포 스크립트 생성:
    * deploy-to-vercel.ps1 (Windows PowerShell용)
    * deploy-to-vercel.sh (Mac/Linux용)
    * Git 초기화부터 GitHub 푸시까지 자동화

## 기술적 고려사항

### 번역 시스템 구조
- translations.js 파일에 모든 번역 데이터 중앙 관리
- localStorage를 통한 언어 설정 저장
- 동적 언어 변경 지원

### 번역 적용 원칙
1. 모든 사용자 대면 텍스트는 번역 대상
2. 시스템 메시지, 에러 메시지 포함
3. 일관된 용어 사용
4. 문화적 맥락 고려

## 프로젝트 구조
```
minhominah/
├── index.html              # 메인 페이지
├── add-memory.html         # 추억 추가
├── growth.html            # 성장 기록
├── statistics.html        # 통계
├── family-settings.html   # 가족 설정
├── backup.html           # 백업
├── share.html            # 공유
├── photobook-creator.html # 포토북 생성
├── join-family.html      # 가족 초대
├── js/
│   ├── supabase.js       # Supabase 연동
│   ├── comment-system.js # 댓글 시스템
│   ├── share-system.js   # 공유 시스템
│   ├── notification-system.js # 알림
│   ├── family-system.js  # 가족 관리
│   ├── tag-system.js     # 태그 시스템
│   ├── language.js       # 다국어 지원
│   └── lang/            # 번역 파일
│       ├── ko.js
│       ├── en.js
│       └── th.js
├── css/
│   ├── style.css
│   └── style-improved.css
└── docs/                 # 문서
```

## 참고사항
- 작업 폴더: C:\Users\thaih\Documents\minhominah
- Supabase 프로젝트: https://illwscrdeyncckltjrmr.supabase.co
- 배포: Vercel
- 지원 언어: 한국어, 영어, 태국어
