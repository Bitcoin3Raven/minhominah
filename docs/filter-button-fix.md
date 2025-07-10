# 필터 버튼 문제 해결 가이드

## 문제
필터 버튼(전체보기, 민호, 민아, 민호민아)을 클릭해도 active 상태가 전환되지 않는 문제

## 가능한 원인들

1. **이벤트 리스너 등록 타이밍 문제**
   - DOM이 완전히 로드되기 전에 이벤트 리스너가 등록되려고 시도

2. **JavaScript 에러**
   - 다른 JavaScript 에러로 인해 이벤트 리스너 등록이 중단

3. **CSS 로드 문제**
   - active 클래스 스타일이 제대로 적용되지 않음

## 즉시 해결 방법

### 방법 1: 브라우저 콘솔에서 직접 실행
```javascript
// 브라우저 개발자 도구 콘솔(F12)에 다음 코드를 복사해서 실행
document.querySelectorAll('.filter-tag').forEach(btn => {
    btn.onclick = function() {
        document.querySelectorAll('.filter-tag').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentFilter = this.dataset.person;
        displayMemories();
    };
});
```

### 방법 2: HTML 파일 수정
index.html 파일의 맨 아래 </body> 태그 바로 위에 다음 코드 추가:

```html
<script>
// 필터 버튼 이벤트 강제 재등록
setTimeout(() => {
    document.querySelectorAll('.filter-tag').forEach(btn => {
        btn.onclick = function() {
            document.querySelectorAll('.filter-tag').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.person;
            displayMemories();
        };
    });
    console.log('Filter buttons re-initialized');
}, 1000);
</script>
```

### 방법 3: 이벤트 위임 사용
필터 섹션 전체에 이벤트를 등록하는 방법:

```javascript
document.addEventListener('click', function(e) {
    if (e.target.closest('.filter-tag')) {
        const btn = e.target.closest('.filter-tag');
        document.querySelectorAll('.filter-tag').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.person;
        displayMemories();
    }
});
```

## 영구적 해결 방법

1. **이벤트 리스너 재등록 함수 추가**
```javascript
function initFilterButtons() {
    document.querySelectorAll('.filter-tag').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('.filter-tag').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.person;
            displayMemories();
        });
    });
}

// 페이지 로드 시와 필요할 때마다 호출
window.addEventListener('load', initFilterButtons);
```

2. **디버깅을 위한 체크**
- 브라우저 개발자 도구(F12) 콘솔에서 에러 확인
- `console.log(document.querySelectorAll('.filter-tag'))` 실행해서 버튼들이 제대로 선택되는지 확인
- `console.log(currentFilter)` 실행해서 현재 필터 상태 확인

## 테스트 방법
1. 페이지 새로고침 (Ctrl+F5)
2. 브라우저 개발자 도구 열기 (F12)
3. Console 탭에서 에러 확인
4. 필터 버튼 클릭해보기
5. Console에 로그가 출력되는지 확인
