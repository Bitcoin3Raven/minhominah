/* ================================
   민호민아 성장앨범 - 통합 JavaScript
   ================================ */

// 전역 상태 관리
const AppState = {
    currentUser: null,
    memories: [],
    filters: {
        person: 'all',
        year: 'all',
        tag: null
    },
    theme: localStorage.getItem('theme') || 'light'
};

// 유틸리티 함수들
const Utils = {
    // 날짜 포맷
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    // 상대 시간 계산
    getRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) return `${minutes}분 전`;
        if (hours < 24) return `${hours}시간 전`;
        if (days < 7) return `${days}일 전`;
        return this.formatDate(dateString);
    },

    // 파일 크기 포맷
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
};

// 다크모드 관리
const ThemeManager = {
    init() {
        // 초기 테마 설정
        this.applyTheme(AppState.theme);
        
        // 토글 버튼 이벤트
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    },

    toggleTheme() {
        AppState.theme = AppState.theme === 'light' ? 'dark' : 'light';
        this.applyTheme(AppState.theme);
        localStorage.setItem('theme', AppState.theme);
    },

    applyTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.setAttribute('data-theme', 'light');
        }
        this.updateThemeIcon();
    },

    updateThemeIcon() {
        const sunIcon = document.getElementById('sunIcon');
        const moonIcon = document.getElementById('moonIcon');
        if (sunIcon && moonIcon) {
            if (AppState.theme === 'dark') {
                sunIcon.style.display = 'none';
                moonIcon.style.display = 'block';
            } else {
                sunIcon.style.display = 'block';
                moonIcon.style.display = 'none';
            }
        }
    }
};

// 추억 관리
const MemoryManager = {
    async loadMemories() {
        try {
            const { data, error } = await supabase
                .from('memories')
                .select(`
                    *,
                    media_files(*),
                    memory_people(people(*)),
                    memory_tags(tags(*))
                `)
                .order('memory_date', { ascending: false });

            if (error) throw error;
            AppState.memories = data || [];
            this.renderMemories();
        } catch (error) {
            console.error('추억 로드 실패:', error);
            this.showError('추억을 불러오는데 실패했습니다.');
        }
    },

    renderMemories() {
        const container = document.getElementById('memoriesContainer');
        if (!container) return;

        const filteredMemories = this.filterMemories(AppState.memories);
        
        if (filteredMemories.length === 0) {
            container.innerHTML = `
                <div class="text-center py-20">
                    <p class="text-gray-500">추억이 없습니다.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredMemories.map(memory => this.createMemoryCard(memory)).join('');
    },

    filterMemories(memories) {
        return memories.filter(memory => {
            // 인물 필터
            if (AppState.filters.person !== 'all') {
                const hasPerson = memory.memory_people?.some(mp => 
                    mp.people.id === AppState.filters.person
                );
                if (!hasPerson) return false;
            }

            // 연도 필터
            if (AppState.filters.year !== 'all') {
                const year = new Date(memory.memory_date).getFullYear();
                if (year !== parseInt(AppState.filters.year)) return false;
            }

            // 태그 필터
            if (AppState.filters.tag) {
                const hasTag = memory.memory_tags?.some(mt => 
                    mt.tags.id === AppState.filters.tag
                );
                if (!hasTag) return false;
            }

            return true;
        });
    },

    createMemoryCard(memory) {
        const firstImage = memory.media_files?.[0];
        const imageUrl = firstImage 
            ? supabase.storage.from('media').getPublicUrl(firstImage.file_path).data.publicUrl
            : '/assets/images/placeholder.svg';

        return `
            <div class="memory-card" data-memory-id="${memory.id}">
                <div class="memory-card-image">
                    <img src="${imageUrl}" alt="${memory.title}" loading="lazy">
                </div>
                <div class="card-content">
                    <h3>${memory.title || '제목 없음'}</h3>
                    <p class="date">${Utils.formatDate(memory.memory_date)}</p>
                    ${memory.description ? `<p class="description">${memory.description}</p>` : ''}
                </div>
            </div>
        `;
    },

    showError(message) {
        // 에러 메시지 표시 로직
        console.error(message);
    }
};

// 필터 관리
const FilterManager = {
    init() {
        // 인물 필터 초기화
        this.initPersonFilters();
        // 연도 필터 초기화
        this.initYearFilters();
    },

    initPersonFilters() {
        const filterButtons = document.querySelectorAll('.person-filter');
        filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const person = e.target.dataset.person;
                AppState.filters.person = person;
                
                // 활성 상태 업데이트
                filterButtons.forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                
                // 추억 다시 렌더링
                MemoryManager.renderMemories();
            });
        });
    },

    initYearFilters() {
        const yearSelect = document.getElementById('yearFilter');
        if (yearSelect) {
            yearSelect.addEventListener('change', (e) => {
                AppState.filters.year = e.target.value;
                MemoryManager.renderMemories();
            });
        }
    }
};

// 반응형 네비게이션
const NavigationManager = {
    init() {
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const mobileMenu = document.getElementById('mobileMenu');
        const menuOverlay = document.getElementById('menuOverlay');

        if (mobileMenuToggle && mobileMenu) {
            mobileMenuToggle.addEventListener('click', () => {
                mobileMenu.classList.toggle('active');
                menuOverlay?.classList.toggle('active');
                document.body.classList.toggle('menu-open');
            });

            menuOverlay?.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                menuOverlay.classList.remove('active');
                document.body.classList.remove('menu-open');
            });
        }

        // 스크롤 시 헤더 숨김/표시
        this.initScrollBehavior();
    },

    initScrollBehavior() {
        let lastScrollTop = 0;
        const header = document.querySelector('header');
        
        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (scrollTop > lastScrollTop && scrollTop > 100) {
                header?.classList.add('scroll-down');
                header?.classList.remove('scroll-up');
            } else {
                header?.classList.remove('scroll-down');
                header?.classList.add('scroll-up');
            }
            
            lastScrollTop = scrollTop;
        });
    }
};

// 이미지 최적화
const ImageOptimizer = {
    init() {
        // Lazy loading
        this.setupLazyLoading();
    },

    setupLazyLoading() {
        const images = document.querySelectorAll('img[loading="lazy"]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src || img.src;
                        img.classList.add('loaded');
                        observer.unobserve(img);
                    }
                });
            });

            images.forEach(img => imageObserver.observe(img));
        } else {
            // Fallback for browsers that don't support IntersectionObserver
            images.forEach(img => {
                img.src = img.dataset.src || img.src;
                img.classList.add('loaded');
            });
        }
    }
};

// 앱 초기화
const App = {
    async init() {
        console.log('민호민아 성장앨범 시작');
        
        // 다크모드 초기화
        ThemeManager.init();
        
        // 네비게이션 초기화
        NavigationManager.init();
        
        // 이미지 최적화 초기화
        ImageOptimizer.init();
        
        // 필터 초기화
        FilterManager.init();
        
        // 페이지별 초기화
        const currentPage = window.location.pathname;
        
        if (currentPage === '/' || currentPage === '/index.html') {
            // 메인 페이지
            await MemoryManager.loadMemories();
        } else if (currentPage === '/add-memory.html') {
            // 추억 추가 페이지
            // AddMemoryManager.init();
        } else if (currentPage === '/statistics.html') {
            // 통계 페이지
            // StatisticsManager.init();
        }
    }
};

// DOM 로드 완료 시 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// 전역 노출 (필요한 경우)
window.App = App;
window.Utils = Utils;