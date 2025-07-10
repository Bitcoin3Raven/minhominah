# 언어 변환 시스템 구현 가이드

## 1. 현재 구현 상태

### 완료된 작업
- ✅ 언어 시스템 코어 구현 (js/language.js)
- ✅ 한국어 번역 파일 생성 (js/lang/ko.js)
- ✅ 태국어 번역 파일 생성 (js/lang/th.js)
- ✅ 언어 선택 드롭다운 UI 구현
- ✅ localStorage를 통한 언어 설정 저장
- ✅ index.html 부분 적용 (헤더, 히어로, 통계 카드)

### 미완료 작업
- 나머지 페이지 언어 시스템 적용
- 동적 콘텐츠 번역 지원
- 날짜 형식 현지화

## 2. HTML 요소에 언어 적용 방법

### 2.1 일반 텍스트
```html
<span data-lang="key_name">기본 텍스트</span>
```

### 2.2 Placeholder
```html
<input data-lang-placeholder="search_placeholder" placeholder="검색...">
```

### 2.3 Title 속성
```html
<button data-lang-title="save_button" title="저장">
```

### 2.4 네비게이션 (title + 내부 텍스트)
```html
<a data-lang-key="nav_home" title="홈">
    <i class="fas fa-home"></i>
    <span data-lang="nav_home">홈</span>
</a>
```

## 3. JavaScript에서 동적 번역

```javascript
// 현재 언어로 번역된 텍스트 가져오기
const translatedText = languageManager.translate('key_name');

// 또는 전역 함수 사용
const text = getLang('key_name');
```

## 4. 새로운 번역 추가 방법

1. `js/lang/ko.js`에 한국어 번역 추가
2. `js/lang/th.js`에 태국어 번역 추가
3. HTML에 data-lang 속성 추가

## 5. 페이지별 특수 처리

언어 변경 시 차트나 동적 콘텐츠를 업데이트해야 하는 경우:

```javascript
window.addEventListener('languageChanged', (e) => {
    const newLang = e.detail.lang;
    // 차트 레이블 업데이트
    // 동적 콘텐츠 재렌더링
});
```

## 6. 주의사항

- 번역 키는 의미를 명확히 나타내도록 작성
- 태국어 폰트 렌더링 확인 필요
- 긴 텍스트의 경우 레이아웃 깨짐 주의
- 숫자와 날짜 형식도 현지화 고려

## 7. 테스트 방법

1. 브라우저에서 페이지 열기
2. 헤더의 언어 드롭다운 클릭
3. 원하는 언어 선택
4. 모든 텍스트가 변경되는지 확인
5. 페이지 새로고침 후에도 언어 설정 유지되는지 확인
