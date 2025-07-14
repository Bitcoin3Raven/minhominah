# 사진 관리 고급 기능 설치 가이드

## 1. 데이터베이스 설정

Supabase 대시보드에서 SQL Editor를 열고 다음 파일의 내용을 실행하세요:

1. `database-photo-management-schema.sql` 파일의 전체 내용을 복사하여 실행
   - 휴지통 (trash) 테이블
   - 활동 로그 (activity_logs) 테이블
   - 일괄 작업 (bulk_operations) 테이블
   - 워터마크 설정 (watermark_settings) 테이블
   - 앨범 (albums) 테이블
   - 앨범-추억 연결 (album_memories) 테이블

## 2. 필요한 파일들

### JavaScript 파일
- `js/trash-manager.js` - 휴지통 관리 기능
- `js/activity-log.js` - 활동 로그 기능
- `js/bulk-operations.js` - 일괄 작업 기능
- `js/photo-manager.js` - 사진 관리 통합 기능

### HTML 파일
- `trash.html` - 휴지통 페이지
- `activity-log.html` - 활동 로그 페이지

### CSS 파일
- `css/photo-manager.css` - 사진 관리 스타일

## 3. 언어 파일 업데이트

다음 언어 파일들이 이미 업데이트되었습니다:
- `js/lang/ko.js` - 한국어
- `js/lang/en.js` - 영어
- `js/lang/th.js` - 태국어

## 4. 기능 활성화

1. 메인 페이지(`index.html`)에 다음 스크립트 추가:
   ```html
   <script src="js/trash-manager.js"></script>
   <script src="js/bulk-operations.js"></script>
   ```

2. 네비게이션에 메뉴 추가 (이미 추가됨):
   - 휴지통 링크
   - 활동 로그 링크

## 5. 주요 기능

### 휴지통 기능
- 삭제된 항목 30일간 보관
- 복원 기능
- 영구 삭제 기능
- 자동 비우기 (30일 후)

### 활동 로그
- 모든 사용자 활동 기록
- 필터링 기능 (기간, 활동 유형, 리소스 유형)
- 활동 통계
- 로그 내보내기

### 일괄 작업
- 여러 항목 선택
- 일괄 삭제
- 일괄 태그 추가
- 일괄 앨범 추가
- 일괄 내보내기

### 워터마크
- 사용자별 워터마크 설정
- 위치, 투명도, 폰트 설정
- 자동 적용 옵션

### 앨범
- 추억 그룹화
- 공개/비공개 설정
- 비밀번호 보호
- 조회수 추적
