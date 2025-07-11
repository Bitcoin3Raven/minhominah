// 언어 변환 시스템 (개선된 버전)
class LanguageManager {
    constructor() {
        this.currentLang = localStorage.getItem('selectedLanguage') || 'ko';
        this.translations = { ko, th, en };
        this.init();
    }

    getLanguageName(lang) {
        const names = {
            ko: '한국어',
            th: 'ไทย',
            en: 'English'
        };
        return names[lang] || lang;
    }

    getLanguageFlag(lang) {
        const flags = {
            ko: '🇰🇷',
            th: '🇹🇭',
            en: '🇺🇸'
        };
        return flags[lang] || '🌐';
    }

    init() {
        // 페이지 로드 시 저장된 언어 적용
        this.applyLanguage(this.currentLang);
        
        // 언어 선택 드롭다운 초기화
        this.initLanguageSelector();
    }

    initLanguageSelector() {
        // languageSelector div에 언어 선택기 추가
        const languageSelectorDiv = document.getElementById('languageSelector');
        if (languageSelectorDiv) {
            languageSelectorDiv.innerHTML = this.createLanguageSelector();
            this.setupLanguageEvents();
        }
    }

    createLanguageSelector() {
        return `
            <div class="relative">
                <button id="langToggle" class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-all duration-300 flex items-center justify-center hover:scale-110 shadow-lg dark:shadow-xl border border-gray-300 dark:border-gray-500" title="${this.getLanguageName(this.currentLang)}">
                    <span id="currentLangFlag" class="text-2xl">${this.getLanguageFlag(this.currentLang)}</span>
                </button>
                
                <div id="langDropdown" class="hidden absolute right-0 mt-2 w-40 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-50 overflow-hidden py-1">
                    <button class="lang-option w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center space-x-3 ${this.currentLang === 'ko' ? 'bg-gray-100 dark:bg-gray-600' : ''}" data-lang="ko">
                        <span class="text-xl">${this.getLanguageFlag('ko')}</span>
                        <span class="text-sm text-gray-700 dark:text-gray-200 font-medium">한국어</span>
                    </button>
                    <button class="lang-option w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center space-x-3 ${this.currentLang === 'th' ? 'bg-gray-100 dark:bg-gray-600' : ''}" data-lang="th">
                        <span class="text-xl">${this.getLanguageFlag('th')}</span>
                        <span class="text-sm text-gray-700 dark:text-gray-200 font-medium">ไทย</span>
                    </button>
                    <button class="lang-option w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center space-x-3 ${this.currentLang === 'en' ? 'bg-gray-100 dark:bg-gray-600' : ''}" data-lang="en">
                        <span class="text-xl">${this.getLanguageFlag('en')}</span>
                        <span class="text-sm text-gray-700 dark:text-gray-200 font-medium">English</span>
                    </button>
                </div>
            </div>
        `;
    }

    setupLanguageEvents() {
        const langToggle = document.getElementById('langToggle');
        const langDropdown = document.getElementById('langDropdown');
        
        if (langToggle) {
            langToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                langDropdown.classList.toggle('hidden');
            });
        }

        // 언어 옵션 클릭 이벤트
        document.querySelectorAll('.lang-option').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const lang = button.dataset.lang;
                this.changeLanguage(lang);
                langDropdown.classList.add('hidden');
            });
        });

        // 외부 클릭 시 드롭다운 닫기
        document.addEventListener('click', () => {
            if (langDropdown) {
                langDropdown.classList.add('hidden');
            }
        });
    }

    changeLanguage(lang) {
        if (!this.translations[lang]) {
            console.warn(`Translation for ${lang} not available`);
            return;
        }

        this.currentLang = lang;
        localStorage.setItem('selectedLanguage', lang);
        
        // HTML lang 속성 변경
        document.documentElement.lang = lang;
        
        // 언어 적용
        this.applyLanguage(lang);
        
        // 현재 선택된 언어 플래그 업데이트
        const currentLangFlag = document.getElementById('currentLangFlag');
        const langToggle = document.getElementById('langToggle');
        if (currentLangFlag) {
            currentLangFlag.textContent = this.getLanguageFlag(lang);
        }
        if (langToggle) {
            langToggle.title = this.getLanguageName(lang);
        }

        // 드롭다운 메뉴의 선택 상태 업데이트
        document.querySelectorAll('.lang-option').forEach(button => {
            if (button.dataset.lang === lang) {
                button.classList.add('bg-gray-100', 'dark:bg-gray-600');
            } else {
                button.classList.remove('bg-gray-100', 'dark:bg-gray-600');
            }
        });
    }

    applyLanguage(lang) {
        const translation = this.translations[lang];
        if (!translation) return;

        // data-lang 속성을 가진 모든 요소의 텍스트 업데이트
        document.querySelectorAll('[data-lang]').forEach(element => {
            const key = element.getAttribute('data-lang');
            if (translation[key]) {
                element.textContent = translation[key];
            }
        });

        // data-lang-placeholder 속성을 가진 input 요소의 placeholder 업데이트
        document.querySelectorAll('[data-lang-placeholder]').forEach(element => {
            const key = element.getAttribute('data-lang-placeholder');
            if (translation[key]) {
                element.placeholder = translation[key];
            }
        });

        // data-lang-title 속성을 가진 요소의 title 업데이트
        document.querySelectorAll('[data-lang-title]').forEach(element => {
            const key = element.getAttribute('data-lang-title');
            if (translation[key]) {
                element.title = translation[key];
            }
        });

        // data-lang-text 속성을 가진 요소의 텍스트 업데이트 (내부 HTML 보존)
        document.querySelectorAll('[data-lang-text]').forEach(element => {
            const key = element.getAttribute('data-lang-text');
            if (translation[key]) {
                // 자식 요소들을 보존하면서 텍스트만 업데이트
                const children = Array.from(element.children);
                element.textContent = translation[key];
                children.forEach(child => element.appendChild(child));
            }
        });

        // 페이지별 특수 처리
        this.applyPageSpecificTranslations(lang, translation);
    }

    applyPageSpecificTranslations(lang, translation) {
        // 현재 페이지 확인
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        // 페이지별 특수 처리가 필요한 경우 여기에 추가
        if (currentPage === 'index.html') {
            // 연령대 필터 라벨 업데이트
            const ageLabels = document.querySelectorAll('.age-filter-label');
            ageLabels.forEach((label, index) => {
                const key = `age_${index}_label`;
                if (translation[key]) {
                    label.textContent = translation[key];
                }
            });
        }
    }

    // 번역 텍스트 가져오기
    getText(key) {
        return this.translations[this.currentLang]?.[key] || key;
    }
}

// 전역 인스턴스 생성
let languageManager;

// 언어 초기화 함수
function initLanguage() {
    if (!languageManager) {
        languageManager = new LanguageManager();
    }
    return languageManager;
}

// 현재 언어 가져오기
function getCurrentLanguage() {
    return languageManager?.currentLang || 'ko';
}

// 번역 텍스트 가져오기
function getTranslation(key) {
    return languageManager?.getText(key) || key;
}

// DOM 로드 완료 시 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLanguage);
} else {
    initLanguage();
}

// 전역 변수로 translations 노출 (레거시 코드 호환성)
window.translations = {
    ko: typeof ko !== 'undefined' ? ko : {},
    th: typeof th !== 'undefined' ? th : {},
    en: typeof en !== 'undefined' ? en : {}
};
window.currentLang = getCurrentLanguage();