// 언어 변환 시스템
class LanguageManager {
    constructor() {
        this.currentLang = localStorage.getItem('selectedLanguage') || 'ko';
        this.translations = { ko, th, en: {} }; // 영어는 동적으로 로드
        
        // 영어 번역이 이미 로드되었다면 사용
        if (typeof en !== 'undefined') {
            this.translations.en = en;
        }
        
        this.init();
    }

    getLanguageName(lang) {
        const names = {
            ko: '한국어',
            th: 'ไทย',
            en: 'English',
            jp: '日本語',
            cn: '中文'
        };
        return names[lang] || lang;
    }

    init() {
        // 페이지 로드 시 저장된 언어 적용
        this.applyLanguage(this.currentLang);
        
        // 언어 선택 드롭다운 초기화
        this.initLanguageSelector();
    }

    initLanguageSelector() {
        // 모든 페이지의 헤더에 언어 선택 드롭다운 추가
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle && themeToggle.parentElement) {
            const langSelector = this.createLanguageSelector();
            themeToggle.parentElement.insertBefore(langSelector, themeToggle);
            
            // 언어 선택기와 다크모드 버튼 사이 간격 조정
            langSelector.classList.add('mr-2', 'sm:mr-3');
        }
    }

    createLanguageSelector() {
        const container = document.createElement('div');
        container.className = 'relative';
        container.innerHTML = `
            <button id="langToggle" class="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 text-sm border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow">
                <img id="currentLangFlag" src="assets/images/flags/${this.currentLang}.svg" alt="${this.currentLang}" class="w-5 h-4 rounded-sm object-cover">
                <span class="text-gray-700 dark:text-gray-200 font-medium hidden sm:inline" id="currentLangName">
                    ${this.getLanguageName(this.currentLang)}
                </span>
                <svg class="w-4 h-4 text-gray-400 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            </button>
            
            <div id="langDropdown" class="hidden absolute right-0 mt-2 w-36 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-50 overflow-hidden py-1">
                <button class="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center space-x-3 ${this.currentLang === 'ko' ? 'bg-gray-100 dark:bg-gray-600' : ''}" 
                        onclick="languageManager.changeLanguage('ko')">
                    <img src="assets/images/flags/ko.svg" alt="한국어" class="w-5 h-4 rounded-sm object-cover">
                    <span class="text-sm text-gray-700 dark:text-gray-200 font-medium">한국어</span>
                </button>
                <button class="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center space-x-3 ${this.currentLang === 'th' ? 'bg-gray-100 dark:bg-gray-600' : ''}" 
                        onclick="languageManager.changeLanguage('th')">
                    <img src="assets/images/flags/th.svg" alt="ไทย" class="w-5 h-4 rounded-sm object-cover">
                    <span class="text-sm text-gray-700 dark:text-gray-200 font-medium">ไทย</span>
                </button>
                <button class="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center space-x-3 ${this.currentLang === 'en' ? 'bg-gray-100 dark:bg-gray-600' : ''}" 
                        onclick="languageManager.changeLanguage('en')">
                    <img src="assets/images/flags/en.svg" alt="English" class="w-5 h-4 rounded-sm object-cover">
                    <span class="text-sm text-gray-700 dark:text-gray-200 font-medium">English</span>
                </button>
                <button class="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center space-x-3 opacity-50 cursor-not-allowed" disabled>
                    <img src="assets/images/flags/jp.svg" alt="日本語" class="w-5 h-4 rounded-sm object-cover opacity-60">
                    <span class="text-sm text-gray-500 dark:text-gray-400 font-medium">日本語</span>
                </button>
                <button class="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center space-x-3 opacity-50 cursor-not-allowed" disabled>
                    <img src="assets/images/flags/cn.svg" alt="中文" class="w-5 h-4 rounded-sm object-cover opacity-60">
                    <span class="text-sm text-gray-500 dark:text-gray-400 font-medium">中文</span>
                </button>
            </div>
        `;

        // 드롭다운 토글 이벤트
        container.querySelector('#langToggle').addEventListener('click', (e) => {
            e.stopPropagation();
            const dropdown = container.querySelector('#langDropdown');
            const isHidden = dropdown.classList.contains('hidden');
            
            if (isHidden) {
                dropdown.classList.remove('hidden');
                setTimeout(() => {
                    dropdown.classList.add('show');
                }, 10);
            } else {
                dropdown.classList.remove('show');
                setTimeout(() => {
                    dropdown.classList.add('hidden');
                }, 300);
            }
        });

        // 외부 클릭 시 드롭다운 닫기
        document.addEventListener('click', () => {
            const dropdown = container.querySelector('#langDropdown');
            if (dropdown && !dropdown.classList.contains('hidden')) {
                dropdown.classList.remove('show');
                setTimeout(() => {
                    dropdown.classList.add('hidden');
                }, 300);
            }
        });

        // CSS 애니메이션 스타일 추가
        if (!document.querySelector('#langDropdownStyles')) {
            const style = document.createElement('style');
            style.id = 'langDropdownStyles';
            style.textContent = `
                /* 폰트 통일 - 상단 메뉴와 동일하게 적용 */
                #langToggle,
                #langDropdown button {
                    font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Malgun Gothic', sans-serif;
                    font-weight: 500;
                    letter-spacing: -0.01em;
                }
                
                #langToggle span,
                #langDropdown button span {
                    font-size: 0.875rem; /* 14px */
                    line-height: 1.25rem; /* 20px */
                }
                
                /* 언어 선택 버튼 호버 효과 개선 */
                #langToggle:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                }
                
                #langToggle:active {
                    transform: translateY(0);
                    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                }
                
                /* 드롭다운 스타일 */
                #langDropdown {
                    opacity: 0;
                    transform: translateY(-8px);
                    transition: opacity 0.2s ease, transform 0.2s ease;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                }
                #langDropdown.show {
                    opacity: 1;
                    transform: translateY(0);
                }
                
                /* 국기 이미지 스타일 */
                #langDropdown button img,
                #langToggle img {
                    border: 1px solid rgba(0, 0, 0, 0.08);
                    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                }
                .dark #langDropdown button img,
                .dark #langToggle img {
                    border-color: rgba(255, 255, 255, 0.08);
                }
                
                /* 모바일 반응형 */
                @media (max-width: 640px) {
                    #langToggle {
                        padding: 0.5rem 0.75rem;
                    }
                    #langToggle svg {
                        display: none;
                    }
                }
                
                /* 드롭다운 버튼 호버 및 선택 상태 */
                #langDropdown button {
                    transition: all 0.15s ease;
                    position: relative;
                }
                
                #langDropdown button:hover {
                    padding-left: 14px;
                }
                
                #langDropdown button.bg-gray-100,
                #langDropdown button.dark\\:bg-gray-600 {
                    font-weight: 600;
                }
                
                #langDropdown button[disabled] {
                    cursor: not-allowed;
                }
                
                #langDropdown button[disabled]:hover {
                    padding-left: 12px;
                }
            `;
            document.head.appendChild(style);
        }

        return container;
    }

    changeLanguage(lang) {
        // 영어 번역이 아직 로드되지 않았다면 로드
        if (lang === 'en' && (!this.translations.en || !this.translations.en.nav_home)) {
            // 영어 번역이 이미 전역 변수로 존재하는지 확인
            if (typeof en !== 'undefined') {
                this.translations.en = en;
            } else {
                console.warn('English translations not loaded yet');
                return;
            }
        }
        
        this.currentLang = lang;
        localStorage.setItem('selectedLanguage', lang);
        this.applyLanguage(lang);
        
        // 드롭다운 부드럽게 닫기
        const dropdown = document.querySelector('#langDropdown');
        if (dropdown) {
            dropdown.classList.remove('show');
            setTimeout(() => {
                dropdown.classList.add('hidden');
            }, 300);
        }
        
        // 현재 언어 표시 업데이트
        this.updateLanguageDisplay();
        
        // 드롭다운 내 선택된 언어 하이라이트 업데이트
        this.updateDropdownHighlight();
    }

    updateDropdownHighlight() {
        const buttons = document.querySelectorAll('#langDropdown button:not([disabled])');
        buttons.forEach(button => {
            const onclickAttr = button.getAttribute('onclick');
            if (onclickAttr) {
                const langMatch = onclickAttr.match(/changeLanguage\('(\w+)'\)/);
                if (langMatch) {
                    const buttonLang = langMatch[1];
                    if (buttonLang === this.currentLang) {
                        button.classList.add('bg-gray-100', 'dark:bg-gray-600');
                    } else {
                        button.classList.remove('bg-gray-100', 'dark:bg-gray-600');
                    }
                }
            }
        });
    }

    updateLanguageDisplay() {
        const flag = document.querySelector('#currentLangFlag');
        const name = document.querySelector('#currentLangName');
        
        if (flag) flag.src = `assets/images/flags/${this.currentLang}.svg`;
        if (name) name.textContent = this.getLanguageName(this.currentLang);
    }

    applyLanguage(lang) {
        const translations = this.translations[lang];
        if (!translations) return;

        // data-lang 속성을 가진 모든 요소의 텍스트 변경
        document.querySelectorAll('[data-lang]').forEach(element => {
            const key = element.getAttribute('data-lang');
            if (translations[key]) {
                element.textContent = translations[key];
            }
        });

        // data-lang-placeholder 속성을 가진 모든 요소의 placeholder 변경
        document.querySelectorAll('[data-lang-placeholder]').forEach(element => {
            const key = element.getAttribute('data-lang-placeholder');
            if (translations[key]) {
                element.placeholder = translations[key];
            }
        });

        // data-lang-title 속성을 가진 모든 요소의 title 변경
        document.querySelectorAll('[data-lang-title]').forEach(element => {
            const key = element.getAttribute('data-lang-title');
            if (translations[key]) {
                element.title = translations[key];
            }
        });

        // data-lang-key 속성을 가진 모든 요소의 title 변경 (네비게이션용)
        document.querySelectorAll('[data-lang-key]').forEach(element => {
            const key = element.getAttribute('data-lang-key');
            if (translations[key]) {
                element.title = translations[key];
            }
        });

        // HTML lang 속성 변경
        document.documentElement.lang = lang === 'th' ? 'th' : (lang === 'en' ? 'en' : 'ko');
        
        // 페이지별 특수 처리
        this.applyPageSpecificTranslations(lang, translations);
    }

    applyPageSpecificTranslations(lang, translations) {
        // 현재 페이지 확인
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        // 페이지별 특수 번역 처리
        switch(currentPage) {
            case 'index.html':
                this.translateIndexPage(translations);
                break;
            case 'growth.html':
                this.translateGrowthPage(translations);
                break;
            case 'statistics.html':
                this.translateStatisticsPage(translations);
                break;
            case 'family-settings.html':
                this.translateFamilyPage(translations);
                break;
            case 'backup.html':
                this.translateBackupPage(translations);
                break;
            case 'add-memory.html':
                this.translateAddMemoryPage(translations);
                break;
        }
    }

    translateIndexPage(translations) {
        // 히어로 섹션
        const heroTitle = document.querySelector('.hero-section h1');
        if (heroTitle) {
            if (this.currentLang === 'en') {
                heroTitle.innerHTML = `${translations.hero_title}<br><span class="text-gradient">${translations.hero_subtitle}</span>`;
            } else {
                heroTitle.innerHTML = `${translations.hero_title}<br><span class="text-gradient">${translations.hero_subtitle}</span>`;
            }
        }
        
        const heroDesc = document.querySelector('.hero-section p');
        if (heroDesc) {
            heroDesc.textContent = translations.hero_description;
        }

        // 통계 카드 레이블
        const statLabels = document.querySelectorAll('.stat-label');
        const statKeys = ['stat_total_posts', 'stat_photos', 'stat_videos', 'stat_milestones'];
        statLabels.forEach((label, index) => {
            if (translations[statKeys[index]]) {
                label.textContent = translations[statKeys[index]];
            }
        });
        
        // 나이별 필터 재렌더링을 위한 이벤트 발생
        if (typeof initializeAgeFilters === 'function') {
            // 약간의 지연을 두어 번역이 완료된 후 실행
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: this.currentLang } }));
            }, 100);
        }
    }

    translateGrowthPage(translations) {
        // 차트 레이블 등 동적 콘텐츠 번역
        // 차트가 렌더링될 때 번역 적용하도록 이벤트 발생
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: this.currentLang } }));
    }

    translateStatisticsPage(translations) {
        // 통계 페이지의 동적 콘텐츠 번역
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: this.currentLang } }));
    }

    translateFamilyPage(translations) {
        // 가족 설정 페이지의 동적 콘텐츠 번역
    }

    translateBackupPage(translations) {
        // 백업 페이지의 동적 콘텐츠 번역
    }

    translateAddMemoryPage(translations) {
        // 추억 추가 페이지의 폼 라벨 번역
    }

    // 동적으로 생성되는 콘텐츠를 위한 번역 함수
    translate(key) {
        return this.translations[this.currentLang][key] || key;
    }
}

// 전역 인스턴스 생성
let languageManager;

// DOM 로드 완료 후 초기화
document.addEventListener('DOMContentLoaded', () => {
    languageManager = new LanguageManager();
    window.languageManager = languageManager; // 전역에서 접근 가능하도록 설정
});

// 다른 스크립트에서 사용할 수 있도록 전역 함수 제공
window.getLang = (key) => {
    if (languageManager) {
        return languageManager.translate(key);
    }
    return key;
};