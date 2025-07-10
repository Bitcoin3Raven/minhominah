# 나이별 필터 버튼 미출력 문제 해결 가이드

## 문제 상황
나이별 보기 UI에서 [전체보기]와 [상세보기] 버튼만 표시되고, 1세, 2세, 3세 등의 나이별 버튼들이 표시되지 않는 문제가 발생했습니다.

## 원인 분석

### 1. Supabase 클라이언트 초기화 실패
- **문제**: `supabaseClient is not defined` 에러 발생
- **원인**: 
  - index.html에서 잘못된 경로 (`config/supabase.js`)를 참조
  - 실제 파일은 `js/supabase.js`에 위치

### 2. 변수명 불일치
- **문제**: js/supabase.js에서는 `supabase` 변수를 사용하지만, index.html에서는 `supabaseClient`를 사용
- **원인**: 변수명 통일이 되지 않음

### 3. Supabase 설정값 미입력
- **문제**: SUPABASE_URL과 SUPABASE_ANON_KEY가 기본값으로 설정됨
- **원인**: 실제 Supabase 프로젝트 값이 입력되지 않음

## 해결 방법

### 1. 스크립트 경로 수정
```html
<!-- 변경 전 -->
<script src="config/supabase.js"></script>

<!-- 변경 후 -->
<script src="js/supabase.js"></script>
```

### 2. 변수명 통일
js/supabase.js 파일에서 모든 `supabase` 변수를 `supabaseClient`로 변경:
```javascript
// 변경 전
let supabase;
if (window.supabase) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// 변경 후
let supabaseClient;
if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.supabaseClient = supabaseClient; // 전역 변수로 설정
}
```

### 3. 테스트 모드 추가
Supabase 연결 없이도 나이별 필터를 테스트할 수 있도록 index.html에 테스트 모드 추가:
```javascript
window.addEventListener('DOMContentLoaded', async function() {
    // 테스트를 위한 더미 데이터 설정
    if (!window.supabaseClient) {
        console.log('Supabase 클라이언트가 없어 테스트 모드로 실행합니다.');
        
        // 테스트용 생년월일 설정
        childrenInfo.minho.birthdate = '2018-03-15';
        childrenInfo.mina.birthdate = '2020-07-22';
        
        // 나이별 필터 초기화
        initializeAgeFilters();
        
        // 테스트 데이터로 UI 업데이트
        document.getElementById('totalMemories').textContent = '0';
        document.getElementById('minhoMemories').textContent = '0';
        document.getElementById('minaMemories').textContent = '0';
        document.getElementById('totalPhotos').textContent = '0';
    } else {
        // 실제 데이터 로드
        await loadPeople();
        await loadMemories();
        await loadChildrenInfo();
        updateStats();
        
        // 나이별 필터 초기화
        initializeAgeFilters();
    }
});
```

## 결과
- 나이별 필터 버튼들이 정상적으로 생성됨
- 민호 (2018년생): 0세~7세 버튼 생성
- 민아 (2020년생): 최대 나이에 포함되어 표시

## 추가 개선사항 (2025-07-09)
### 20세까지 확장
- 아이들이 성장하면서 계속 사용할 수 있도록 0세부터 20세까지 버튼 미리 생성
- 현재 나이 표시 기능 추가:
  - 민호 현재 나이 (7세): 👦 아이콘과 파란색 배경으로 표시
  - 민아 현재 나이 (4세): 👧 아이콘과 분홍색 배경으로 표시
  - 같은 나이일 경우: 🎉 아이콘으로 표시

### 테스트 결과
- 민호 (2018년 3월 15일생): 현재 7세로 정확히 계산됨
- 민아 (2020년 7월 22일생): 현재 4세로 정확히 계산됨 (5세 생일 전)
- 0세부터 20세까지 총 21개의 버튼 생성 확인

### UI 개선
- 많은 버튼을 효율적으로 표시하기 위해 가로 스크롤 추가
- 커스텀 스크롤바 스타일 적용
- 현재 나이 버튼 강조 스타일 추가

### CSS 추가
```css
/* 현재 나이 강조 스타일 */
.age-filter-btn.current-age.minho {
    background: #e0f2fe;
    border-color: #60a5fa;
    color: #1e40af;
}

.age-filter-btn.current-age.mina {
    background: #fce7f3;
    border-color: #f472b6;
    color: #be185d;
}
```

## 추가 작업 필요사항
1. 실제 Supabase 프로젝트 생성 및 연동
2. SUPABASE_URL과 SUPABASE_ANON_KEY 값 설정
3. 환경 변수 관리 방안 마련 (보안상 중요)

## 참고사항
- 테스트 모드는 개발 중에만 사용하고, 프로덕션에서는 반드시 실제 Supabase 연동 필요
- 생년월일 정보는 people 테이블의 birth_date 필드에서 관리
- 나이 계산은 현재 날짜 기준으로 동적으로 계산됨
