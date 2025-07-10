# 언어 시스템 기술 문서 (Language System Documentation)

## 개요
민호민아 성장앨범은 다국어를 지원하여 한국어, 태국어, 영어 사용자가 편리하게 이용할 수 있습니다.

## 지원 언어
- **한국어 (ko)** - 기본 언어
- **태국어 (th)** - 완전 지원
- **영어 (en)** - 완전 지원
- **일본어 (jp)** - 준비 중
- **중국어 (cn)** - 준비 중

## 파일 구조
```
js/
├── language.js          # 언어 시스템 핵심 로직
└── lang/
    ├── ko.js           # 한국어 번역
    ├── th.js           # 태국어 번역
    └── en.js           # 영어 번역

assets/images/flags/
├── ko.svg              # 한국 국기
├── th.svg              # 태국 국기
├── en.svg              # 영국 국기
├── jp.svg              # 일본 국기
└── cn.svg              # 중국 국기
```

## 언어 선택기 UI

### 특징
- 깔끔하고 현대적인 드롭다운 디자인
- 국기 이미지를 활용한 시각적 구분
- 선택된 언어는 배경색으로 표시
- 부드러운 애니메이션 효과
- 모바일 반응형 디자인

### 디자인 원칙
1. **간결함**: 체크마크 대신 배경색으로 선택 표시
2. **일관성**: 모든 언어 옵션이 동일한 레이아웃
3. **접근성**: 명확한 색상 대비와 hover 효과
4. **확장성**: 새로운 언어 추가가 용이한 구조

## 사용 방법

### HTML에서 번역 키 설정
```html
<!-- 텍스트 번역 -->
<span data-lang="nav_home">홈</span>

<!-- placeholder 번역 -->
<input data-lang-placeholder="search_placeholder" placeholder="검색...">

<!-- title 속성 번역 -->
<button data-lang-title="save_tooltip" title="저장">
```

### JavaScript에서 동적 번역
```javascript
// 번역 텍스트 가져오기
const text = languageManager.translate('welcome_message');

// 언어 변경 이벤트 리스닝
window.addEventListener('languageChanged', (e) => {
    const newLang = e.detail.lang;
    // 언어별 처리
});
```

## 새로운 언어 추가 가이드

### 1. 번역 파일 생성
`js/lang/새언어코드.js` 파일을 생성하고 다음 형식으로 작성:

```javascript
const 새언어코드 = {
    // 네비게이션
    nav_home: "번역된 텍스트",
    nav_growth: "번역된 텍스트",
    // ... 모든 키 번역
};

// 전역 변수로 노출
window.새언어코드 = 새언어코드;
```

### 2. 국기 이미지 추가
`assets/images/flags/새언어코드.svg` 파일로 국기 SVG 이미지 추가

### 3. language.js 수정
```javascript
// getLanguageName 함수에 추가
const names = {
    // ...
    '새언어코드': '언어명'
};

// createLanguageSelector 함수에 버튼 추가
<button class="..." onclick="languageManager.changeLanguage('새언어코드')">
    <img src="assets/images/flags/새언어코드.svg" alt="언어명">
    <span>언어명</span>
</button>
```

### 4. 모든 HTML 파일에 스크립트 추가
```html
<script src="js/lang/새언어코드.js"></script>
```

## 언어별 특수 처리

### 텍스트 방향
- 한국어, 태국어, 영어, 일본어, 중국어: LTR (왼쪽에서 오른쪽)
- 아랍어 등 RTL 언어 추가 시 별도 처리 필요

### 폰트 고려사항
- 한국어: 기본 시스템 폰트
- 태국어: 태국어 특수 문자 지원 필요
- 일본어/중국어: CJK 폰트 지원 필요

## 성능 최적화
- localStorage를 활용한 언어 설정 저장
- 번역 파일은 페이지 로드 시 한 번만 로드
- 언어 변경 시 페이지 새로고침 없이 즉시 적용

## 접근성
- 언어 선택기는 키보드로 완전히 탐색 가능
- 스크린 리더 지원을 위한 적절한 ARIA 레이블
- 충분한 색상 대비로 시각적 접근성 확보

## 향후 개선 사항
- [ ] 일본어 번역 추가
- [ ] 중국어 번역 추가
- [ ] 언어별 날짜/시간 형식 지원
- [ ] 언어별 숫자 형식 지원
- [ ] 더 많은 언어 지원
