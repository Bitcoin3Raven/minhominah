// 모든 HTML 파일에 새로운 네비게이션 시스템을 적용하는 스크립트
// Node.js 환경에서 실행하거나, 브라우저 콘솔에서 수동으로 적용

const updateInstructions = `
=== 네비게이션 업데이트 가이드 ===

1. 각 HTML 파일의 <head> 섹션에 다음 스크립트 추가:
   <script src="js/navigation.js"></script>

2. 기존 헤더 (<header> 태그) 전체 제거

3. 페이지별 수정사항:
   - index.html
   - growth.html
   - statistics.html
   - family-settings.html
   - backup.html
   - photobook-creator.html
   - share.html
   - add-memory.html (완료)

4. 각 파일에서 다음 코드 제거:
   - 다크모드 토글 관련 코드
   - 언어 선택기 관련 코드
   - 기존 네비게이션 메뉴

5. navigation.js가 자동으로 처리하는 기능:
   - 반응형 네비게이션 메뉴
   - 드롭다운 메뉴
   - 모바일 햄버거 메뉴
   - 언어 선택기
   - 다크모드 토글

=== 주의사항 ===
- 기존 themeToggle 관련 이벤트 리스너 제거 필요
- languageSelector div는 navigation.js가 자동 생성하므로 제거
- 헤더 영역 완전히 비워두기 (navigation.js가 자동 삽입)
`;

console.log(updateInstructions);

// 브라우저에서 실행할 경우 사용할 함수
function removeOldHeader() {
    // 기존 헤더 제거
    const oldHeader = document.querySelector('header');
    if (oldHeader) {
        oldHeader.remove();
        console.log('기존 헤더가 제거되었습니다.');
    }
    
    // 다크모드 관련 이벤트 리스너 제거
    const oldThemeToggle = document.getElementById('themeToggle');
    if (oldThemeToggle) {
        oldThemeToggle.replaceWith(oldThemeToggle.cloneNode(true));
        console.log('기존 다크모드 이벤트 리스너가 제거되었습니다.');
    }
}

// 사용 방법:
// 1. 각 HTML 파일을 열고
// 2. 브라우저 콘솔에서 removeOldHeader() 실행
// 3. navigation.js 스크립트 태그 추가