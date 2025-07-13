// 이미지 로딩 디버깅 헬퍼
window.debugImages = function() {
    const images = document.querySelectorAll('.memory-card img');
    console.log(`총 ${images.length}개의 이미지 찾음`);
    
    images.forEach((img, index) => {
        console.log(`이미지 ${index + 1}:`, {
            src: img.src,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            complete: img.complete,
            display: window.getComputedStyle(img).display,
            opacity: window.getComputedStyle(img).opacity,
            visibility: window.getComputedStyle(img).visibility
        });
        
        // 이미지가 로드되지 않았다면 다시 시도
        if (!img.complete || img.naturalWidth === 0) {
            console.warn(`이미지 ${index + 1} 로드 실패, 다시 시도...`);
            const newSrc = img.src;
            img.src = '';
            setTimeout(() => {
                img.src = newSrc;
            }, 100);
        }
    });
};

// 페이지 로드 후 자동 실행
window.addEventListener('load', function() {
    setTimeout(window.debugImages, 2000);
});

// 수동으로 실행하려면 콘솔에서: debugImages()
