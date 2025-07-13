// 강화된 이미지 디버깅 및 수정 스크립트
(function() {
    // 이미지 강제 표시 함수
    window.forceShowImages = function() {
        const images = document.querySelectorAll('.memory-card img, .memory-image');
        console.log(`이미지 강제 표시 시작: ${images.length}개 이미지`);
        
        images.forEach((img, index) => {
            // 현재 상태 로그
            console.log(`이미지 ${index + 1} 처리 중:`, {
                src: img.src,
                현재스타일: {
                    display: img.style.display,
                    opacity: img.style.opacity,
                    visibility: img.style.visibility,
                    position: img.style.position
                }
            });
            
            // 인라인 스타일 제거 (CSS 충돌 방지)
            img.style.cssText = '';
            
            // 강제 스타일 적용
            img.style.setProperty('display', 'block', 'important');
            img.style.setProperty('opacity', '1', 'important');
            img.style.setProperty('visibility', 'visible', 'important');
            img.style.setProperty('position', 'relative', 'important');
            img.style.setProperty('z-index', '10', 'important');
            img.style.setProperty('width', '100%', 'important');
            img.style.setProperty('height', '100%', 'important');
            img.style.setProperty('object-fit', 'cover', 'important');
            
            // 부모 요소들도 확인
            let parent = img.parentElement;
            while (parent && !parent.classList.contains('memory-card')) {
                if (window.getComputedStyle(parent).display === 'none' ||
                    window.getComputedStyle(parent).visibility === 'hidden' ||
                    window.getComputedStyle(parent).opacity === '0') {
                    console.warn(`부모 요소가 숨겨져 있습니다:`, parent);
                    parent.style.setProperty('display', 'block', 'important');
                    parent.style.setProperty('visibility', 'visible', 'important');
                    parent.style.setProperty('opacity', '1', 'important');
                }
                parent = parent.parentElement;
            }
        });
        
        console.log('이미지 강제 표시 완료');
    };
    
    // Z-index 충돌 확인
    window.checkZIndexConflicts = function() {
        const elements = document.querySelectorAll('*');
        const highZIndexElements = [];
        
        elements.forEach(el => {
            const zIndex = window.getComputedStyle(el).zIndex;
            if (zIndex !== 'auto' && parseInt(zIndex) > 10) {
                highZIndexElements.push({
                    element: el,
                    zIndex: parseInt(zIndex),
                    className: el.className,
                    id: el.id
                });
            }
        });
        
        highZIndexElements.sort((a, b) => b.zIndex - a.zIndex);
        console.log('높은 z-index를 가진 요소들:', highZIndexElements.slice(0, 10));
    };
    
    // 이미지 가시성 체크
    window.checkImageVisibility = function() {
        const images = document.querySelectorAll('.memory-card img');
        images.forEach((img, index) => {
            const rect = img.getBoundingClientRect();
            const isVisible = rect.width > 0 && rect.height > 0 && 
                             rect.top < window.innerHeight && rect.bottom > 0;
            
            console.log(`이미지 ${index + 1} 가시성:`, {
                visible: isVisible,
                크기: `${rect.width}x${rect.height}`,
                위치: `top: ${rect.top}, left: ${rect.left}`,
                부모요소: img.parentElement.className
            });
        });
    };
    
    // 페이지 로드 후 자동 실행
    window.addEventListener('DOMContentLoaded', function() {
        console.log('이미지 디버깅 v2 시작');
        
        // 2초 후 강제 표시
        setTimeout(() => {
            forceShowImages();
            checkZIndexConflicts();
            checkImageVisibility();
        }, 2000);
    });
    
    // 수동 실행을 위한 전역 함수
    window.fixImages = function() {
        forceShowImages();
        checkZIndexConflicts();
        checkImageVisibility();
    };
})();
