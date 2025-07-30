// 브라우저 확장 프로그램 에러 무시 스크립트
// 가볍고 빠른 구현
if (typeof window !== 'undefined') {
  // 오류 이벤트 핸들러
  window.addEventListener('error', function(e) {
    // UUID 패턴 확인
    if (e.filename && e.filename.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)) {
      e.preventDefault();
      return true;
    }
  }, true);
}