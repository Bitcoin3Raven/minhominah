// 반응형 네비게이션 시스템
document.addEventListener('DOMContentLoaded', function() {
    // 햄버거 메뉴 토글
    const menuToggle = document.getElementById('menuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    
    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            mobileMenu.classList.toggle('active');
            if (menuOverlay) {
                menuOverlay.classList.toggle('active');
            }
            document.body.classList.toggle('menu-open');
        });
        
        // 오버레이 클릭시 메뉴 닫기
        if (menuOverlay) {
            menuOverlay.addEventListener('click', function() {
                mobileMenu.classList.remove('active');
                menuOverlay.classList.remove('active');
                document.body.classList.remove('menu-open');
            });
        }
        
        // 메뉴 링크 클릭시 메뉴 닫기
        const menuLinks = mobileMenu.querySelectorAll('a');
        menuLinks.forEach(link => {
            link.addEventListener('click', function() {
                mobileMenu.classList.remove('active');
                menuOverlay.classList.remove('active');
                document.body.classList.remove('menu-open');
            });
        });
    }
    
    // 드롭다운 메뉴 (데스크톱)
    const dropdownTriggers = document.querySelectorAll('[data-dropdown-trigger]');
    dropdownTriggers.forEach(trigger => {
        const dropdownId = trigger.getAttribute('data-dropdown-trigger');
        const dropdown = document.getElementById(dropdownId);
        
        if (dropdown) {
            // 호버 이벤트 (데스크톱)
            trigger.addEventListener('mouseenter', function() {
                if (window.innerWidth >= 768) {
                    dropdown.classList.add('active');
                }
            });
            
            trigger.addEventListener('mouseleave', function() {
                if (window.innerWidth >= 768) {
                    setTimeout(() => {
                        if (!dropdown.matches(':hover')) {
                            dropdown.classList.remove('active');
                        }
                    }, 100);
                }
            });
            
            dropdown.addEventListener('mouseleave', function() {
                if (window.innerWidth >= 768) {
                    dropdown.classList.remove('active');
                }
            });
            
            // 클릭 이벤트 (모바일)
            trigger.addEventListener('click', function(e) {
                if (window.innerWidth < 768) {
                    e.preventDefault();
                    dropdown.classList.toggle('active');
                }
            });
        }
    });
    
    // 윈도우 리사이즈 처리
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            if (window.innerWidth >= 768) {
                // 데스크톱 모드로 전환시 모바일 메뉴 닫기
                if (mobileMenu) mobileMenu.classList.remove('active');
                if (menuOverlay) menuOverlay.classList.remove('active');
                document.body.classList.remove('menu-open');
            }
        }, 250);
    });
    
    // 스크롤시 헤더 스타일 변경
    let lastScroll = 0;
    const header = document.querySelector('header');
    
    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll <= 0) {
            header.classList.remove('scroll-up');
            header.classList.remove('scroll-down');
            return;
        }
        
        if (currentScroll > lastScroll && !header.classList.contains('scroll-down')) {
            // 스크롤 다운
            header.classList.remove('scroll-up');
            header.classList.add('scroll-down');
        } else if (currentScroll < lastScroll && header.classList.contains('scroll-down')) {
            // 스크롤 업
            header.classList.remove('scroll-down');
            header.classList.add('scroll-up');
        }
        
        lastScroll = currentScroll;
    });
    
    // 현재 페이지 활성화 표시
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath) {
            link.classList.add('active');
        }
    });
});