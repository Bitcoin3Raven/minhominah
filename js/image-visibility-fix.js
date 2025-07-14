// 이미지 가시성 문제 완벽 해결 스크립트
// 이 스크립트는 AOS와 관계없이 모든 이미지가 항상 표시되도록 보장합니다

(function() {
    'use strict';
    
    console.log('🚀 이미지 가시성 문제 해결 스크립트 시작');
    
    // 1. 강제 스타일 주입 (최우선순위)
    function injectCriticalStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* 모든 이미지와 메모리 카드 강제 표시 */
            img, 
            [data-aos], 
            .memory-card,
            .bg-white.dark\\:bg-gray-800,
            .overflow-hidden {
                opacity: 1 !important;
                visibility: visible !important;
                transform: none !important;
                filter: none !important;
            }
            
            /* AOS 애니메이션 클래스 무효화 */
            [data-aos="fade-up"],
            [data-aos="fade-down"],
            [data-aos="fade-left"],
            [data-aos="fade-right"],
            [data-aos="zoom-in"],
            [data-aos="zoom-out"] {
                opacity: 1 !important;
                transform: none !important;
            }
            
            /* 이미지 컨테이너 보장 */
            .aspect-w-16,
            .aspect-h-9,
            .aspect-video {
                position: relative !important;
                opacity: 1 !important;
            }
            
            /* 이미지 자체 스타일 */
            img {
                display: block !important;
                max-width: 100% !important;
                height: auto !important;
                opacity: 1 !important;
            }
        `;
        
        // 가장 높은 우선순위로 추가
        document.head.insertBefore(style, document.head.firstChild);
        console.log('✅ 강제 스타일 주입 완료');
    }
    
    // 2. AOS 완전 비활성화
    function disableAOS() {
        // AOS 존재 여부 확인 후 비활성화
        if (typeof AOS !== 'undefined') {
            try {
                AOS.init({
                    disable: true,
                    once: true
                });
                console.log('✅ AOS 비활성화 완료');
            } catch (e) {
                console.log('⚠️ AOS 비활성화 중 오류:', e);
            }
        }
        
        // data-aos 속성 제거
        document.querySelectorAll('[data-aos]').forEach(el => {
            el.removeAttribute('data-aos');
            el.removeAttribute('data-aos-duration');
            el.removeAttribute('data-aos-delay');
            el.removeAttribute('data-aos-offset');
        });
    }
    
    // 3. 모든 요소 강제 표시
    function forceShowElements() {
        // 모든 이미지 확인
        document.querySelectorAll('img').forEach(img => {
            img.style.opacity = '1';
            img.style.visibility = 'visible';
            img.style.display = 'block';
            
            // 부모 요소들도 확인
            let parent = img.parentElement;
            while (parent && parent !== document.body) {
                const computed = window.getComputedStyle(parent);
                if (computed.opacity === '0' || computed.visibility === 'hidden') {
                    parent.style.opacity = '1';
                    parent.style.visibility = 'visible';
                }
                parent = parent.parentElement;
            }
        });
        
        // 메모리 카드 확인
        document.querySelectorAll('.memory-card, .bg-white.dark\\:bg-gray-800').forEach(card => {
            card.style.opacity = '1';
            card.style.visibility = 'visible';
            card.classList.add('aos-animate'); // 혹시 필요한 경우를 위해
        });
        
        console.log('✅ 모든 요소 강제 표시 완료');
    }
    
    // 4. 이미지 로드 보장
    function ensureImageLoading() {
        document.querySelectorAll('img').forEach(img => {
            // 이미지가 아직 로드되지 않았다면
            if (!img.complete) {
                img.addEventListener('load', function() {
                    this.style.opacity = '1';
                    console.log('✅ 이미지 로드 완료:', this.src);
                });
                
                img.addEventListener('error', function() {
                    console.error('❌ 이미지 로드 실패:', this.src);
                });
            }
            
            // 로딩 속성 최적화
            img.loading = 'eager'; // lazy loading 비활성화
        });
    }
    
    // 5. MutationObserver로 새로운 이미지 감시
    function watchForNewImages() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        // 새로 추가된 이미지 처리
                        if (node.tagName === 'IMG') {
                            node.style.opacity = '1';
                            node.loading = 'eager';
                        }
                        
                        // 자식 이미지들 처리
                        const images = node.querySelectorAll ? node.querySelectorAll('img') : [];
                        images.forEach(img => {
                            img.style.opacity = '1';
                            img.loading = 'eager';
                        });
                        
                        // AOS 요소 처리
                        if (node.hasAttribute && node.hasAttribute('data-aos')) {
                            node.removeAttribute('data-aos');
                            node.style.opacity = '1';
                        }
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('✅ 이미지 감시자 활성화');
    }
    
    // 6. 주기적 체크 (failsafe)
    function periodicCheck() {
        let checkCount = 0;
        const interval = setInterval(() => {
            const hiddenImages = Array.from(document.querySelectorAll('img'))
                .filter(img => {
                    const computed = window.getComputedStyle(img);
                    return computed.opacity === '0' || computed.visibility === 'hidden';
                });
            
            if (hiddenImages.length > 0) {
                console.log(`🔧 ${hiddenImages.length}개의 숨겨진 이미지 발견, 수정 중...`);
                hiddenImages.forEach(img => {
                    img.style.opacity = '1';
                    img.style.visibility = 'visible';
                });
            }
            
            checkCount++;
            if (checkCount > 20) { // 10초간 체크
                clearInterval(interval);
                console.log('✅ 주기적 체크 완료');
            }
        }, 500);
    }
    
    // 7. 캐시 버스팅을 위한 메타 태그 추가
    function addCacheBustingMeta() {
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Cache-Control';
        meta.content = 'no-cache, no-store, must-revalidate';
        document.head.appendChild(meta);
    }
    
    // 실행 순서
    // 1. 즉시 실행
    injectCriticalStyles();
    addCacheBustingMeta();
    
    // 2. DOM 준비 시
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            disableAOS();
            forceShowElements();
            ensureImageLoading();
            watchForNewImages();
        });
    } else {
        // 이미 로드된 경우
        disableAOS();
        forceShowElements();
        ensureImageLoading();
        watchForNewImages();
    }
    
    // 3. 페이지 완전 로드 후
    window.addEventListener('load', function() {
        setTimeout(() => {
            forceShowElements();
            periodicCheck();
        }, 100);
    });
    
    // 4. 글로벌 함수 제공
    window.fixImageVisibility = function() {
        disableAOS();
        forceShowElements();
        ensureImageLoading();
        console.log('✅ 수동 이미지 가시성 수정 완료');
    };
    
    console.log('✅ 이미지 가시성 문제 해결 스크립트 초기화 완료');
    
})();
