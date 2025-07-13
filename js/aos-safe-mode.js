// AOS 애니메이션 안전 모드
// 이 스크립트는 AOS가 opacity 문제를 일으키지 않도록 보장합니다

(function() {
    console.log('🔧 AOS 안전 모드 활성화 중...');
    
    // 1. AOS 초기화 전에 실행
    document.addEventListener('DOMContentLoaded', function() {
        // 모든 AOS 요소의 초기 opacity 설정
        document.querySelectorAll('[data-aos]').forEach(el => {
            el.style.transition = 'opacity 0.6s ease-in-out';
            el.style.opacity = '1';
        });
    });
    
    // 2. AOS 초기화 후 모니터링
    const originalAOSInit = window.AOS ? window.AOS.init : null;
    if (window.AOS) {
        window.AOS.init = function(options) {
            // 기본 옵션에 안전 설정 추가
            const safeOptions = {
                ...options,
                once: true, // 애니메이션은 한 번만
                duration: 600, // 짧은 애니메이션
                offset: 50 // 작은 오프셋
            };
            
            // 원래 init 호출
            if (originalAOSInit) {
                originalAOSInit.call(this, safeOptions);
            }
            
            // 초기화 후 안전 검사
            setTimeout(() => {
                document.querySelectorAll('[data-aos]').forEach(el => {
                    const opacity = window.getComputedStyle(el).opacity;
                    if (opacity === '0') {
                        console.log('⚠️ AOS 문제 감지:', el);
                        el.style.opacity = '1';
                        el.classList.add('aos-animate');
                    }
                });
            }, 1000);
        };
    }
    
    // 3. 주기적 검사 (failsafe)
    let checkCount = 0;
    const checkInterval = setInterval(() => {
        const hiddenElements = Array.from(document.querySelectorAll('[data-aos]'))
            .filter(el => window.getComputedStyle(el).opacity === '0');
        
        if (hiddenElements.length > 0) {
            console.log(`🔧 ${hiddenElements.length}개의 숨겨진 요소 수정 중...`);
            hiddenElements.forEach(el => {
                el.style.opacity = '1';
                el.classList.add('aos-animate');
            });
        }
        
        checkCount++;
        if (checkCount > 10) {
            clearInterval(checkInterval);
            console.log('✅ AOS 안전 모드 모니터링 완료');
        }
    }, 500);
    
    // 4. 이미지 로드 이벤트 처리
    document.addEventListener('load', function(e) {
        if (e.target.tagName === 'IMG') {
            const parent = e.target.closest('[data-aos]');
            if (parent && window.getComputedStyle(parent).opacity === '0') {
                parent.style.opacity = '1';
                parent.classList.add('aos-animate');
            }
        }
    }, true);
    
    console.log('✅ AOS 안전 모드 설정 완료');
})();
