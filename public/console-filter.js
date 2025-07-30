// 콘솔 에러 필터링 스크립트
// 브라우저 확장 프로그램 관련 에러 메시지를 필터링합니다

(function() {
  // 원본 console 메서드 저장
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalLog = console.log;

  // 필터링할 패턴
  const filterPatterns = [
    /pocket.*universe/i,
    /phantom.*solana/i,
    /window\.ethereum not found/i,
    /Failed to load resource.*404/i,
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i, // UUID
    /chrome-extension:\/\//i,
    /extension:\/\//i
  ];

  // 메시지 필터링 함수
  function shouldFilter(args) {
    const message = args.map(arg => String(arg)).join(' ');
    return filterPatterns.some(pattern => pattern.test(message));
  }

  // console.error 오버라이드
  console.error = function(...args) {
    if (!shouldFilter(args)) {
      originalError.apply(console, args);
    }
  };

  // console.warn 오버라이드
  console.warn = function(...args) {
    if (!shouldFilter(args)) {
      originalWarn.apply(console, args);
    }
  };

  // console.log 오버라이드 (확장 프로그램 메시지용)
  console.log = function(...args) {
    if (!shouldFilter(args)) {
      originalLog.apply(console, args);
    }
  };
})();