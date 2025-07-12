// Kakao SDK 초기화
// 실제 JavaScript 키로 교체해주세요
const KAKAO_JAVASCRIPT_KEY = '0b78a2dcb8c47ed1c1c4ae06062d3004';

// Kakao SDK 초기화 함수
function initializeKakao() {
    if (typeof Kakao !== 'undefined' && !Kakao.isInitialized()) {
        Kakao.init(KAKAO_JAVASCRIPT_KEY);
        console.log('Kakao SDK initialized');
    }
}

// DOM 로드 시 자동 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeKakao);
} else {
    initializeKakao();
}