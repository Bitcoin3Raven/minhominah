/**
 * 스마트 태그 시스템
 * AI 대신 사용자 친화적인 수동 태깅 시스템
 */

class SmartTagSystem {
    constructor() {
        this.selectedTags = new Set();
        this.allTags = [];
        this.popularTags = ['첫경험', '생일', '가족나들이', '일상', '성장기록', '웃는얼굴', '외출', '집에서'];
        
        // 태그 템플릿 (상황별)
        this.tagTemplates = {
            birthday: {
                name: '🎂 생일',
                tags: ['생일', '파티', '케이크', '축하', '선물', '가족모임']
            },
            outdoor: {
                name: '🌳 야외활동',
                tags: ['나들이', '공원', '자연', '야외활동', '소풍', '놀이터']
            },
            milestone: {
                name: '👶 성장기록',
                tags: ['첫걸음', '첫말', '100일', '돌잔치', '뒤집기', '기어다니기']
            },
            daily: {
                name: '🏠 일상',
                tags: ['일상', '집에서', '놀이시간', '목욕시간', '식사시간', '잠자기']
            },
            family: {
                name: '👨‍👩‍👧‍👦 가족',
                tags: ['가족모임', '엄마와', '아빠와', '조부모님', '형제자매', '가족사진']
            },
            emotion: {
                name: '😊 감정',
                tags: ['웃는얼굴', '행복', '즐거움', '놀람', '집중', '호기심']
            }
        };
        
        // 나이별 추천 태그
        this.ageBasedTags = {
            '0-3개월': ['신생아', '100일준비', '첫목욕', '수유시간', '낮잠'],
            '4-6개월': ['100일', '뒤집기', '이유식시작', '첫이유식', '기어다니기준비'],
            '7-12개월': ['기어다니기', '첫걸음준비', '돌준비', '첫니', '잡고서기'],
            '1-2세': ['첫걸음', '첫말', '돌잔치', '걷기', '뛰기', '말하기'],
            '2-3세': ['두돌', '어린이집', '친구', '자전거', '그림그리기'],
            '3-4세': ['세돌', '유치원준비', '한글공부', '숫자놀이', '역할놀이'],
            '4-5세': ['네돌', '유치원', '친구들', '운동', '악기'],
            '5세이상': ['학교준비', '초등학교', '방과후', '학원', '특별활동']
        };
        
        this.init();
    }
    
    async init() {
        await this.loadExistingTags();
        this.setupUI();
    }
    
    async loadExistingTags() {
        try {
            const { data, error } = await supabase
                .from('tags')
                .select('*')
                .order('name');
                
            if (error) throw error;
            
            this.allTags = data || [];
        } catch (error) {
            console.error('태그 로드 실패:', error);
        }
    }
    
    setupUI() {
        // 태그 컨테이너가 있는지 확인
        const tagContainer = document.getElementById('tagContainer');
        if (!tagContainer) return;
        
        tagContainer.innerHTML = `
            <div class="space-y-4">
                <!-- 인기 태그 -->
                <div>
                    <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        <i class="fas fa-fire text-orange-500 mr-1"></i> 인기 태그
                    </h4>
                    <div id="popularTags" class="flex flex-wrap gap-2"></div>
                </div>
                
                <!-- 태그 템플릿 -->
                <div>
                    <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        <i class="fas fa-layer-group text-blue-500 mr-1"></i> 상황별 태그
                    </h4>
                    <div id="tagTemplates" class="grid grid-cols-2 md:grid-cols-3 gap-2"></div>
                </div>
                
                <!-- 나이별 추천 태그 -->
                <div id="ageBasedTagsContainer" class="hidden">
                    <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        <i class="fas fa-baby text-pink-500 mr-1"></i> 나이별 추천
                    </h4>
                    <div id="ageBasedTags" class="flex flex-wrap gap-2"></div>
                </div>
                
                <!-- 태그 검색/입력 -->
                <div>
                    <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        <i class="fas fa-search text-gray-500 mr-1"></i> 태그 검색 또는 추가
                    </h4>
                    <div class="relative">
                        <input type="text" 
                               id="tagSearchInput" 
                               placeholder="태그를 입력하세요..."
                               class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600">
                        <div id="tagSuggestions" class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border rounded-lg shadow-lg hidden"></div>
                    </div>
                </div>
                
                <!-- 선택된 태그 -->
                <div>
                    <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        <i class="fas fa-check-circle text-green-500 mr-1"></i> 선택된 태그
                    </h4>
                    <div id="selectedTags" class="flex flex-wrap gap-2 min-h-[40px] p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"></div>
                </div>
            </div>
        `;
        
        this.renderPopularTags();
        this.renderTagTemplates();
        this.setupTagSearch();
        this.setupAgeBasedTags();
    }
    
    renderPopularTags() {
        const container = document.getElementById('popularTags');
        container.innerHTML = this.popularTags.map(tag => `
            <button type="button"
                    class="tag-button px-3 py-1 rounded-full text-sm font-medium transition-all
                           bg-gray-100 hover:bg-gray-200 text-gray-700
                           dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
                    onclick="tagSystem.toggleTag('${tag}')">
                ${tag}
            </button>
        `).join('');
    }
    
    renderTagTemplates() {
        const container = document.getElementById('tagTemplates');
        container.innerHTML = Object.entries(this.tagTemplates).map(([key, template]) => `
            <button type="button"
                    class="p-3 rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-all
                           dark:border-gray-600 dark:hover:border-blue-500"
                    onclick="tagSystem.applyTemplate('${key}')">
                <div class="text-left">
                    <div class="font-medium text-gray-800 dark:text-gray-200">${template.name}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        ${template.tags.slice(0, 3).join(', ')}...
                    </div>
                </div>
            </button>
        `).join('');
    }
    
    setupAgeBasedTags() {
        // 현재 선택된 인물의 나이를 기반으로 추천 태그 표시
        const forMinho = document.getElementById('forMinho');
        const forMina = document.getElementById('forMina');
        
        if (!forMinho || !forMina) return;
        
        // 인물 선택 시 나이별 태그 업데이트
        [forMinho, forMina].forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updateAgeBasedTags());
        });
    }
    
    updateAgeBasedTags() {
        const forMinho = document.getElementById('forMinho');
        const forMina = document.getElementById('forMina');
        const container = document.getElementById('ageBasedTagsContainer');
        const tagsContainer = document.getElementById('ageBasedTags');
        
        if (!forMinho?.checked && !forMina?.checked) {
            container.classList.add('hidden');
            return;
        }
        
        container.classList.remove('hidden');
        
        // 현재 날짜 기준으로 나이 계산
        const currentDate = new Date();
        const ages = [];
        
        if (forMinho?.checked) {
            const minhoAge = this.calculateAge(new Date('2018-03-15'), currentDate);
            ages.push(minhoAge);
        }
        
        if (forMina?.checked) {
            const minaAge = this.calculateAge(new Date('2020-07-22'), currentDate);
            ages.push(minaAge);
        }
        
        // 해당 나이대의 태그 표시
        const relevantTags = new Set();
        ages.forEach(age => {
            const ageGroup = this.getAgeGroup(age);
            if (this.ageBasedTags[ageGroup]) {
                this.ageBasedTags[ageGroup].forEach(tag => relevantTags.add(tag));
            }
        });
        
        tagsContainer.innerHTML = Array.from(relevantTags).map(tag => `
            <button type="button"
                    class="tag-button px-3 py-1 rounded-full text-sm font-medium transition-all
                           bg-purple-100 hover:bg-purple-200 text-purple-700
                           dark:bg-purple-900 dark:hover:bg-purple-800 dark:text-purple-200"
                    onclick="tagSystem.toggleTag('${tag}')">
                ${tag}
            </button>
        `).join('');
    }
    
    calculateAge(birthDate, currentDate) {
        const years = currentDate.getFullYear() - birthDate.getFullYear();
        const months = currentDate.getMonth() - birthDate.getMonth() + (years * 12);
        
        if (months < 12) {
            return { years: 0, months: months };
        } else {
            return { years: Math.floor(months / 12), months: months % 12 };
        }
    }
    
    getAgeGroup(age) {
        const totalMonths = age.years * 12 + age.months;
        
        if (totalMonths <= 3) return '0-3개월';
        if (totalMonths <= 6) return '4-6개월';
        if (totalMonths <= 12) return '7-12개월';
        if (age.years < 2) return '1-2세';
        if (age.years < 3) return '2-3세';
        if (age.years < 4) return '3-4세';
        if (age.years < 5) return '4-5세';
        return '5세이상';
    }
    
    setupTagSearch() {
        const searchInput = document.getElementById('tagSearchInput');
        const suggestionsDiv = document.getElementById('tagSuggestions');
        
        if (!searchInput) return;
        
        let debounceTimer;
        
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                this.showSuggestions(e.target.value);
            }, 300);
        });
        
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.value.trim()) {
                e.preventDefault();
                this.addCustomTag(e.target.value.trim());
                e.target.value = '';
                suggestionsDiv.classList.add('hidden');
            }
        });
        
        // 클릭 외부 영역 시 제안 숨기기
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#tagSearchInput') && !e.target.closest('#tagSuggestions')) {
                suggestionsDiv.classList.add('hidden');
            }
        });
    }
    
    showSuggestions(query) {
        const suggestionsDiv = document.getElementById('tagSuggestions');
        
        if (!query) {
            suggestionsDiv.classList.add('hidden');
            return;
        }
        
        const suggestions = this.allTags
            .filter(tag => tag.name.toLowerCase().includes(query.toLowerCase()))
            .filter(tag => !this.selectedTags.has(tag.name))
            .slice(0, 5);
        
        if (suggestions.length === 0 && query.length > 1) {
            suggestionsDiv.innerHTML = `
                <div class="p-3 text-sm text-gray-600 dark:text-gray-400">
                    <i class="fas fa-plus-circle mr-2"></i>
                    Enter 키를 눌러 "${query}" 태그 추가
                </div>
            `;
        } else {
            suggestionsDiv.innerHTML = suggestions.map(tag => `
                <button type="button"
                        class="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                        onclick="tagSystem.toggleTag('${tag.name}')">
                    <span class="inline-block w-3 h-3 rounded-full mr-2" 
                          style="background-color: ${tag.color || '#3B82F6'}"></span>
                    ${tag.name}
                </button>
            `).join('');
        }
        
        suggestionsDiv.classList.remove('hidden');
    }
    
    toggleTag(tagName) {
        if (this.selectedTags.has(tagName)) {
            this.selectedTags.delete(tagName);
        } else {
            this.selectedTags.add(tagName);
        }
        this.updateSelectedTagsDisplay();
        this.updateTagButtons();
    }
    
    applyTemplate(templateKey) {
        const template = this.tagTemplates[templateKey];
        if (!template) return;
        
        template.tags.forEach(tag => {
            this.selectedTags.add(tag);
        });
        
        this.updateSelectedTagsDisplay();
        this.updateTagButtons();
        
        // 피드백 애니메이션
        const button = event.target.closest('button');
        button.classList.add('ring-2', 'ring-blue-400', 'ring-offset-2');
        setTimeout(() => {
            button.classList.remove('ring-2', 'ring-blue-400', 'ring-offset-2');
        }, 1000);
    }
    
    async addCustomTag(tagName) {
        // 이미 존재하는지 확인
        const existing = this.allTags.find(tag => 
            tag.name.toLowerCase() === tagName.toLowerCase()
        );
        
        if (existing) {
            this.toggleTag(existing.name);
            return;
        }
        
        // 새 태그 생성
        try {
            const { data, error } = await supabase
                .from('tags')
                .insert({
                    name: tagName,
                    color: this.generateTagColor()
                })
                .select()
                .single();
                
            if (error) throw error;
            
            this.allTags.push(data);
            this.toggleTag(tagName);
            
        } catch (error) {
            console.error('태그 생성 실패:', error);
            alert('태그 생성에 실패했습니다.');
        }
    }
    
    generateTagColor() {
        const colors = [
            '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
            '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    updateSelectedTagsDisplay() {
        const container = document.getElementById('selectedTags');
        
        if (this.selectedTags.size === 0) {
            container.innerHTML = '<span class="text-gray-400 text-sm">선택된 태그가 없습니다</span>';
            return;
        }
        
        container.innerHTML = Array.from(this.selectedTags).map(tag => `
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                         bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                ${tag}
                <button type="button" 
                        onclick="tagSystem.toggleTag('${tag}')"
                        class="ml-2 hover:text-blue-900 dark:hover:text-blue-100">
                    <i class="fas fa-times"></i>
                </button>
            </span>
        `).join('');
    }
    
    updateTagButtons() {
        // 모든 태그 버튼의 선택 상태 업데이트
        document.querySelectorAll('.tag-button').forEach(button => {
            const tagName = button.textContent.trim();
            if (this.selectedTags.has(tagName)) {
                button.classList.add('ring-2', 'ring-blue-400', 'bg-blue-100', 'dark:bg-blue-900');
            } else {
                button.classList.remove('ring-2', 'ring-blue-400', 'bg-blue-100', 'dark:bg-blue-900');
            }
        });
    }
    
    getSelectedTags() {
        return Array.from(this.selectedTags);
    }
    
    clearTags() {
        this.selectedTags.clear();
        this.updateSelectedTagsDisplay();
        this.updateTagButtons();
    }
}

// 전역 변수로 태그 시스템 초기화
let tagSystem;
