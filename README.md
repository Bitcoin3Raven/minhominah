# 🌟 민호와 민아의 성장 앨범

민호와 민아의 소중한 성장 과정을 담는 디지털 앨범입니다.

## 🚀 기술 스택
- **Frontend**: HTML, JavaScript, Tailwind CSS
- **Backend**: Supabase (Database, Storage, Authentication)  
- **Hosting**: Vercel
- **실시간 기능**: Supabase Realtime

## 📁 프로젝트 구조
```
minhominah/
├── index.html          # 메인 갤러리 페이지
├── add-memory.html     # 추억 추가 페이지
├── css/               
│   └── style.css       # 커스텀 스타일
├── js/
│   ├── main.js         # 메인 JavaScript
│   └── supabase.js     # Supabase 설정
├── assets/             # 이미지, 아이콘 등
├── vercel.json         # Vercel 설정
├── package.json        # 프로젝트 정보
└── .gitignore          # Git 무시 파일
```

## ✨ 주요 기능

### 구현 완료
- ✅ 민호와 민아의 추억 갤러리
- ✅ 인물별 필터링 (민호/민아/전체)
- ✅ 추억 통계 대시보드
- ✅ 새로운 추억 추가
- ✅ 이미지 업로드 및 미리보기
- ✅ 날짜별 자동 정렬
- ✅ 로그인/인증 시스템
- ✅ 실시간 업데이트
- ✅ 다크모드 지원
- ✅ 검색 기능 (제목/설명/장소)
- ✅ 좋아요 기능
- ✅ 날짜 범위 필터
- ✅ 전체화면 슬라이드쇼

### 구현 예정
- 🔲 타임라인 뷰
- 🔲 댓글 시스템
- 🔲 태그 기능
- 🔲 SNS 공유
- 🔲 성장 기록 차트
- 🔲 PDF 내보내기

## 🚀 Vercel 배포 가이드

### 1. Git 저장소 생성
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/minhominah.git
git push -u origin main
```

### 2. Vercel 연동
1. [vercel.com](https://vercel.com) 가입
2. "Import Project" 클릭
3. GitHub 저장소 선택
4. 환경변수 설정:
   - `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Anon Key

### 3. 배포 완료
- Vercel이 자동으로 빌드 및 배포
- `https://minhominah.vercel.app` 형태의 URL 생성
- 커스텀 도메인 연결 가능

## 🔐 환경 설정

### Supabase 설정
1. [app.supabase.com](https://app.supabase.com)에서 프로젝트 생성
2. `js/supabase.js` 파일에 URL과 Key 입력:
```javascript
const SUPABASE_URL = 'your-project-url';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

### 로컬 개발
```bash
# 패키지 설치
npm install

# 개발 서버 시작 (live-server)
npm run dev
```

## 🎨 디자인 특징
- 분홍색-파란색 좌우 그라데이션
- 부드러운 플로팅 애니메이션
- 글라스모피즘 효과
- 다크모드 완벽 지원

## 📱 모바일 지원
- 반응형 디자인으로 모든 기기에서 완벽하게 작동
- PWA 지원 예정

## 🔒 보안
- Row Level Security (RLS) 적용
- 인증된 사용자만 추억 추가 가능
- 이미지 업로드 크기 제한 (50MB)

## 📊 데이터베이스 구조
- `people` - 민호, 민아 정보
- `memories` - 추억 정보  
- `media_files` - 사진/동영상 파일
- `memory_people` - 추억과 인물 연결
- `profiles` - 사용자 프로필
- `tags` - 태그 시스템

---
Made with ❤️ for 민호 & 민아