// 최종 이미지 문제 해결 스크립트
(function() {
    // 강력한 이미지 수정 함수
    window.fixImagesNow = function() {
        console.log('=== 최종 이미지 수정 시작 ===');
        
        // 1. 모든 메모리 카드의 이미지 찾기
        const memoryCards = document.querySelectorAll('.memory-card');
        console.log(`발견된 메모리 카드: ${memoryCards.length}개`);
        
        memoryCards.forEach((card, cardIndex) => {
            // 이미지 래퍼 찾기
            const wrapper = card.querySelector('.image-wrapper');
            const img = card.querySelector('img');
            
            if (!wrapper || !img) {
                console.warn(`카드 ${cardIndex + 1}: 이미지 래퍼 또는 이미지 없음`);
                return;
            }
            
            // 현재 상태 로그
            console.log(`카드 ${cardIndex + 1} 분석:`, {
                wrapper: {
                    display: window.getComputedStyle(wrapper).display,
                    position: window.getComputedStyle(wrapper).position,
                    width: wrapper.offsetWidth,
                    height: wrapper.offsetHeight,
                    overflow: window.getComputedStyle(wrapper).overflow,
                    zIndex: window.getComputedStyle(wrapper).zIndex
                },
                image: {
                    src: img.src,
                    display: window.getComputedStyle(img).display,
                    position: window.getComputedStyle(img).position,
                    opacity: window.getComputedStyle(img).opacity,
                    visibility: window.getComputedStyle(img).visibility,
                    width: img.offsetWidth,
                    height: img.offsetHeight,
                    naturalWidth: img.naturalWidth,
                    naturalHeight: img.naturalHeight,
                    complete: img.complete,
                    zIndex: window.getComputedStyle(img).zIndex
                }
            });
            
            // 강제 스타일 적용
            // 래퍼 스타일
            wrapper.style.cssText = `
                position: relative !important;
                width: 100% !important;
                height: 200px !important;
                overflow: hidden !important;
                background-color: #f3f4f6 !important;
                display: block !important;
            `;
            
            // 이미지 스타일
            img.style.cssText = `
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                object-fit: cover !important;
                opacity: 1 !important;
                visibility: visible !important;
                display: block !important;
                z-index: 1 !important;
                max-width: none !important;
                min-width: 100% !important;
                min-height: 100% !important;
            `;
            
            // 이미지가 아직 로드되지 않았다면 재로드
            if (!img.complete || img.naturalWidth === 0) {
                console.log(`카드 ${cardIndex + 1}: 이미지 재로드 시도`);
                const src = img.src;
                img.src = '';
                img.src = src;
            }
        });
        
        // 2. 오버레이 z-index 조정
        document.querySelectorAll('.memory-card .overlay').forEach(overlay => {
            overlay.style.zIndex = '10';
        });
        
        // 3. 가능한 방해 요소 확인
        console.log('\n=== 높은 z-index 요소 확인 ===');
        const allElements = document.querySelectorAll('*');
        const highZIndexElements = [];
        
        allElements.forEach(el => {
            const zIndex = window.getComputedStyle(el).zIndex;
            if (zIndex !== 'auto' && parseInt(zIndex) > 100) {
                highZIndexElements.push({
                    element: el,
                    zIndex: parseInt(zIndex),
                    className: el.className,
                    tagName: el.tagName
                });
            }
        });
        
        if (highZIndexElements.length > 0) {
            console.log('높은 z-index를 가진 요소들:', highZIndexElements);
        }
        
        console.log('=== 이미지 수정 완료 ===');
    };
    
    // 이미지 상태 모니터링
    window.monitorImages = function() {
        console.log('=== 이미지 모니터링 시작 ===');
        
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.classList && node.classList.contains('memory-card')) {
                            console.log('새 메모리 카드 추가됨');
                            setTimeout(() => fixImagesNow(), 100);
                        }
                    });
                }
            });
        });
        
        const container = document.getElementById('memoriesContainer');
        if (container) {
            observer.observe(container, {
                childList: true,
                subtree: true
            });
            console.log('메모리 컨테이너 모니터링 시작');
        }
    };
    
    // 페이지 로드 완료 후 실행
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(fixImagesNow, 1000);
            monitorImages();
        });
    } else {
        setTimeout(fixImagesNow, 1000);
        monitorImages();
    }
    
    // 윈도우 로드 후에도 한 번 더 실행
    window.addEventListener('load', () => {
        setTimeout(fixImagesNow, 2000);
    });
})();

// 전역에서 바로 실행할 수 있는 함수
window.debugImageIssue = function() {
    console.clear();
    console.log('%c=== 이미지 문제 디버깅 시작 ===', 'color: blue; font-size: 16px; font-weight: bold');
    
    // 1. CSS 파일 로드 확인
    console.log('\n1. CSS 파일 로드 상태:');
    const cssFiles = ['style.css', 'style-improved.css', 'image-fix.css', 'image-fix-v2.css'];
    const loadedCSS = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
        .map(link => link.href);
    
    cssFiles.forEach(file => {
        const isLoaded = loadedCSS.some(href => href.includes(file));
        console.log(`   ${file}: ${isLoaded ? '✅ 로드됨' : '❌ 로드 안됨'}`);
    });
    
    // 2. 메모리 카드 구조 확인
    console.log('\n2. 메모리 카드 구조:');
    const firstCard = document.querySelector('.memory-card');
    if (firstCard) {
        console.log('   첫 번째 카드 HTML:');
        console.log(firstCard.outerHTML.substring(0, 500) + '...');
    }
    
    // 3. 이미지 실제 렌더링 확인
    console.log('\n3. 이미지 렌더링 상태:');
    const images = document.querySelectorAll('.memory-card img');
    images.forEach((img, index) => {
        const rect = img.getBoundingClientRect();
        console.log(`   이미지 ${index + 1}:`, {
            visible: rect.width > 0 && rect.height > 0,
            position: `${rect.top}, ${rect.left}`,
            size: `${rect.width}x${rect.height}`,
            inViewport: rect.top < window.innerHeight && rect.bottom > 0
        });
    });
    
    // 4. 즉시 수정 시도
    console.log('\n4. 즉시 수정 시도...');
    fixImagesNow();
};

console.log('이미지 수정 도구가 로드되었습니다. 다음 명령을 사용하세요:');
console.log('- fixImagesNow() : 즉시 이미지 수정');
console.log('- debugImageIssue() : 상세 디버깅 정보');
console.log('- monitorImages() : 이미지 모니터링 시작');
