# 영어 번역 전체 적용 계획

## 현재 상황 분석

### 1. 언어 시스템 현황
- ✅ 언어 시스템 코어 구현 완료 (js/language.js)
- ✅ 한국어(ko.js), 태국어(th.js) 번역 완료
- ⚠️ 영어(en.js) 부분적 번역 (일부 키 누락)
- ❌ 일부 페이지에서 언어 시스템 미적용

### 2. 언어 시스템 적용 현황

#### 언어 시스템 적용 완료 페이지
- ✅ index.html
- ✅ growth.html
- ✅ statistics.html
- ✅ family-settings.html
- ✅ backup.html
- ✅ add-memory.html

#### 언어 시스템 미적용 페이지
- ❌ photobook-creator.html
- ❌ join-family.html
- ❌ family-invite.html
- ❌ share.html

## 작업 계획

### Phase 1: 영어 번역 파일 완성
1. **한국어 파일 전체 키 확인**
   - ko.js의 모든 번역 키 리스트 작성
   - 페이지별 특수 키 파악

2. **영어 번역 추가**
   - 누락된 번역 키 추가
   - 페이지별 특수 번역 추가

### Phase 2: 미적용 페이지 언어 시스템 통합

#### 1. photobook-creator.html
- [x] 언어 시스템 스크립트 추가
- [x] 헤더 언어 지원 추가
- [ ] 메인 콘텐츠 언어 지원
  - 템플릿 선택 섹션
  - 사진 선택 섹션
  - PDF 생성 관련 텍스트

#### 2. join-family.html
- [ ] 언어 시스템 스크립트 추가
- [ ] 초대 관련 텍스트 언어 지원
- [ ] 에러/성공 메시지 언어 지원

#### 3. family-invite.html  
- [ ] 언어 시스템 스크립트 추가
- [ ] 초대 코드 공유 텍스트 언어 지원
- [ ] 공유 방법 텍스트 언어 지원

#### 4. share.html
- [ ] 언어 시스템 스크립트 추가
- [ ] 공유 설정 텍스트 언어 지원
- [ ] 링크 복사 관련 텍스트 언어 지원

### Phase 3: 동적 콘텐츠 언어 지원

#### JavaScript 생성 콘텐츠
- [ ] 동적으로 생성되는 메시지 다국어 지원
- [ ] 날짜/시간 형식 현지화
- [ ] 숫자 형식 현지화

#### API 응답 메시지
- [ ] 에러 메시지 다국어 지원
- [ ] 성공 메시지 다국어 지원
- [ ] 유효성 검사 메시지 다국어 지원

## 구현 방법

### 1. HTML 요소 언어 적용
```html
<!-- 일반 텍스트 -->
<span data-lang="key_name">기본 텍스트</span>

<!-- Placeholder -->
<input data-lang-placeholder="search_placeholder" placeholder="검색...">

<!-- Title 속성 -->
<button data-lang-title="save_button" title="저장">

<!-- 복합 속성 (네비게이션) -->
<a data-lang-key="nav_home" title="홈">
    <span data-lang="nav_home">홈</span>
</a>
```

### 2. JavaScript 동적 번역
```javascript
// 현재 언어로 번역된 텍스트 가져오기
const text = languageManager.translate('key_name');

// 또는 전역 함수 사용
const text = getLang('key_name');

// 동적 메시지 예시
alert(getLang('msg_success'));
```

### 3. 언어별 형식 지정
```javascript
// 날짜 형식
const formatDate = (date, lang) => {
    const options = {
        ko: { year: 'numeric', month: 'long', day: 'numeric' },
        en: { year: 'numeric', month: 'long', day: 'numeric' },
        th: { year: 'numeric', month: 'long', day: 'numeric' }
    };
    return date.toLocaleDateString(lang, options[lang]);
};
```

## 테스트 체크리스트

### 언어 전환 테스트
- [ ] 모든 페이지에서 언어 전환 정상 작동
- [ ] 언어 설정 localStorage 저장 확인
- [ ] 페이지 새로고침 후 언어 유지

### 번역 완성도 테스트
- [ ] 모든 UI 텍스트 번역 확인
- [ ] 동적 메시지 번역 확인
- [ ] 날짜/시간 형식 확인

### 레이아웃 테스트
- [ ] 긴 번역 텍스트로 인한 레이아웃 깨짐 확인
- [ ] 반응형 디자인에서 번역 텍스트 표시 확인
- [ ] RTL 언어 대비 (향후)

## 예상 소요 시간
- Phase 1: 2시간 (영어 번역 완성)
- Phase 2: 3시간 (미적용 페이지 통합)
- Phase 3: 2시간 (동적 콘텐츠 지원)
- 테스트: 1시간

총 예상 시간: 8시간

## 주의사항
1. 기존 한국어/태국어 작업과 일관성 유지
2. 번역 키 네이밍 컨벤션 준수
3. 중복 작업 방지를 위한 체계적 진행
4. 모든 변경사항 문서화
