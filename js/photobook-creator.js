// 포토북 생성 모듈
const photobookCreator = {
    memories: [],
    currentTemplate: 'classic',
    options: {
        includeTitle: true,
        includeStats: true,
        includeIndex: false,
        includeTimeline: false,
        personFilter: 'all',
        startDate: null,
        endDate: null
    },

    // 초기화
    init() {
        this.setupEventListeners();
        this.setDefaultDates();
        this.loadMemories();
    },

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 템플릿 선택
        document.querySelectorAll('input[name="template"]').forEach(input => {
            input.addEventListener('change', (e) => {
                this.currentTemplate = e.target.value;
            });
        });

        // 옵션 체크박스
        ['includeTitle', 'includeStats', 'includeIndex', 'includeTimeline'].forEach(id => {
            const checkbox = document.getElementById(id);
            if (checkbox) {
                checkbox.addEventListener('change', (e) => {
                    this.options[id] = e.target.checked;
                });
            }
        });

        // 인물 필터
        document.querySelectorAll('input[name="personFilter"]').forEach(input => {
            input.addEventListener('change', (e) => {
                this.options.personFilter = e.target.value;
            });
        });

        // 날짜 입력
        document.getElementById('photobookStartDate')?.addEventListener('change', (e) => {
            this.options.startDate = e.target.value;
        });

        document.getElementById('photobookEndDate')?.addEventListener('change', (e) => {
            this.options.endDate = e.target.value;
        });
    },

    // 기본 날짜 설정 (최근 6개월)
    setDefaultDates() {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 6);

        document.getElementById('photobookStartDate').value = this.formatDate(startDate);
        document.getElementById('photobookEndDate').value = this.formatDate(endDate);
        
        this.options.startDate = this.formatDate(startDate);
        this.options.endDate = this.formatDate(endDate);
    },

    // 날짜 포맷
    formatDate(date) {
        return date.toISOString().split('T')[0];
    },

    // 추억 데이터 로드
    async loadMemories() {
        try {
            console.log('Supabase에서 추억 데이터 로드 시도...');
            
            // Supabase가 초기화되어 있는지 확인
            if (!window.supabaseClient) {
                console.error('Supabase가 초기화되지 않았습니다.');
                this.memories = [];
                return;
            }
            
            const { data, error } = await window.supabaseClient
                .from('memories')
                .select(`
                    *,
                    media_files(*),
                    memory_people(
                        person_id,
                        people(*)
                    ),
                    memory_tags(
                        tag_id,
                        tags(*)
                    )
                `)
                .order('memory_date', { ascending: false });
            
            if (error) throw error;
            
            this.memories = data || [];
            console.log(`${this.memories.length}개의 추억을 로드했습니다.`);
            
            // 디버깅: 첫 번째 메모리 확인
            if (this.memories.length > 0) {
                console.log('첫 번째 메모리:', this.memories[0]);
            }
        } catch (error) {
            console.error('추억 로드 오류:', error);
            this.memories = [];
        }
    },

    // 필터링된 추억 가져오기
    getFilteredMemories() {
        let filtered = [...this.memories];

        // 날짜 필터
        if (this.options.startDate) {
            filtered = filtered.filter(m => {
                const memoryDate = m.memory_date ? m.memory_date.split('T')[0] : '';
                return memoryDate >= this.options.startDate;
            });
        }
        if (this.options.endDate) {
            filtered = filtered.filter(m => {
                const memoryDate = m.memory_date ? m.memory_date.split('T')[0] : '';
                return memoryDate <= this.options.endDate;
            });
        }

        // 인물 필터
        switch (this.options.personFilter) {
            case 'minho':
                filtered = filtered.filter(m => {
                    const people = m.memory_people || [];
                    const hasMinHo = people.some(mp => mp.people && mp.people.name === '민호');
                    const hasMinA = people.some(mp => mp.people && mp.people.name === '민아');
                    return hasMinHo && !hasMinA;
                });
                break;
            case 'mina':
                filtered = filtered.filter(m => {
                    const people = m.memory_people || [];
                    const hasMinHo = people.some(mp => mp.people && mp.people.name === '민호');
                    const hasMinA = people.some(mp => mp.people && mp.people.name === '민아');
                    return hasMinA && !hasMinHo;
                });
                break;
            case 'both':
                filtered = filtered.filter(m => {
                    const people = m.memory_people || [];
                    const hasMinHo = people.some(mp => mp.people && mp.people.name === '민호');
                    const hasMinA = people.some(mp => mp.people && mp.people.name === '민아');
                    return hasMinHo && hasMinA;
                });
                break;
        }

        // 날짜순 정렬
        filtered.sort((a, b) => new Date(a.memory_date) - new Date(b.memory_date));

        return filtered;
    },

    // PDF 미리보기
    async previewPDF() {
        const filtered = this.getFilteredMemories();
        
        if (filtered.length === 0) {
            alert('선택한 기간에 추억이 없습니다.');
            return;
        }

        // 미리보기 영역 표시
        const previewSection = document.getElementById('pdfPreview');
        const previewPages = document.getElementById('previewPages');
        
        previewSection.classList.remove('hidden');
        previewPages.innerHTML = '';

        // 표지 페이지
        if (this.options.includeTitle) {
            previewPages.appendChild(this.createTitlePagePreview(filtered));
        }

        // 통계 페이지
        if (this.options.includeStats) {
            previewPages.appendChild(this.createStatsPagePreview(filtered));
        }

        // 목차 페이지
        if (this.options.includeIndex) {
            previewPages.appendChild(this.createIndexPagePreview(filtered));
        }

        // 추억 페이지들 (처음 4개만 미리보기)
        const previewMemories = filtered.slice(0, 4);
        previewMemories.forEach(memory => {
            previewPages.appendChild(this.createMemoryPagePreview(memory));
        });

        // 더 있으면 표시
        if (filtered.length > 4) {
            const moreDiv = document.createElement('div');
            moreDiv.className = 'col-span-full text-center py-8 text-gray-500';
            moreDiv.innerHTML = `<i class="fas fa-ellipsis-h text-2xl"></i><p class="mt-2">그리고 ${filtered.length - 4}개의 추억이 더 있습니다</p>`;
            previewPages.appendChild(moreDiv);
        }

        // 스크롤
        previewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    // 표지 페이지 미리보기 생성
    createTitlePagePreview(memories) {
        const div = document.createElement('div');
        div.className = 'preview-page';
        
        const template = this.getTemplateStyles();
        
        div.innerHTML = `
            <div class="h-full flex flex-col justify-center items-center text-center p-8" style="background: ${template.background}">
                <h1 class="text-3xl font-bold mb-4" style="color: ${template.titleColor}">민호민아 성장앨범</h1>
                <p class="text-lg mb-8" style="color: ${template.subtitleColor}">소중한 추억들</p>
                <div class="text-sm" style="color: ${template.textColor}">
                    <p>${this.options.startDate} ~ ${this.options.endDate}</p>
                    <p class="mt-2">총 ${memories.length}개의 추억</p>
                </div>
                <div class="mt-8">
                    <i class="fas fa-heart text-4xl" style="color: ${template.accentColor}"></i>
                </div>
            </div>
        `;
        
        return div;
    },

    // 통계 페이지 미리보기 생성
    createStatsPagePreview(memories) {
        const div = document.createElement('div');
        div.className = 'preview-page';
        
        const stats = this.calculateStats(memories);
        const template = this.getTemplateStyles();
        
        div.innerHTML = `
            <div class="h-full p-8" style="background: ${template.pageBackground}">
                <h2 class="text-2xl font-bold mb-6" style="color: ${template.titleColor}">추억 통계</h2>
                <div class="space-y-4">
                    <div class="flex justify-between">
                        <span style="color: ${template.textColor}">총 추억 수:</span>
                        <span class="font-bold" style="color: ${template.accentColor}">${stats.totalMemories}개</span>
                    </div>
                    <div class="flex justify-between">
                        <span style="color: ${template.textColor}">민호 등장:</span>
                        <span class="font-bold" style="color: ${template.accentColor}">${stats.minhoCount}회</span>
                    </div>
                    <div class="flex justify-between">
                        <span style="color: ${template.textColor}">민아 등장:</span>
                        <span class="font-bold" style="color: ${template.accentColor}">${stats.minaCount}회</span>
                    </div>
                    <div class="flex justify-between">
                        <span style="color: ${template.textColor}">함께 등장:</span>
                        <span class="font-bold" style="color: ${template.accentColor}">${stats.togetherCount}회</span>
                    </div>
                    <div class="flex justify-between">
                        <span style="color: ${template.textColor}">가장 많은 태그:</span>
                        <span class="font-bold" style="color: ${template.accentColor}">${stats.topTag || '없음'}</span>
                    </div>
                </div>
            </div>
        `;
        
        return div;
    },

    // 목차 페이지 미리보기 생성
    createIndexPagePreview(memories) {
        const div = document.createElement('div');
        div.className = 'preview-page';
        
        const template = this.getTemplateStyles();
        const monthGroups = this.groupByMonth(memories);
        
        div.innerHTML = `
            <div class="h-full p-8" style="background: ${template.pageBackground}">
                <h2 class="text-2xl font-bold mb-6" style="color: ${template.titleColor}">목차</h2>
                <div class="space-y-2">
                    ${Object.entries(monthGroups).map(([month, items]) => `
                        <div class="flex justify-between">
                            <span style="color: ${template.textColor}">${month}</span>
                            <span style="color: ${template.subtitleColor}">${items.length}개의 추억</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        return div;
    },

    // 추억 페이지 미리보기 생성
    createMemoryPagePreview(memory) {
        const div = document.createElement('div');
        div.className = 'preview-page';
        
        const template = this.getTemplateStyles();
        
        div.innerHTML = `
            <div class="h-full p-6" style="background: ${template.pageBackground}">
                <div class="mb-4">
                    <h3 class="text-xl font-bold" style="color: ${template.titleColor}">${memory.title}</h3>
                    <p class="text-sm" style="color: ${template.subtitleColor}">${this.formatDateKorean(memory.memory_date)}</p>
                </div>
                ${memory.media_files && memory.media_files.length > 0 ? `
                    <div class="mb-4">
                        <img src="${this.getMediaUrl(memory.media_files[0])}" alt="${memory.title}" 
                             class="w-full h-48 object-cover rounded-lg">
                    </div>
                ` : ''}
                <p class="text-sm leading-relaxed" style="color: ${template.textColor}">${memory.description || ''}</p>
                <div class="mt-4 flex flex-wrap gap-2">
                    ${(memory.memory_people || []).map(mp => mp.people ? `
                        <span class="px-2 py-1 text-xs rounded-full" 
                              style="background: ${template.tagBackground}; color: ${template.tagColor}">
                            ${mp.people.name}
                        </span>
                    ` : '').join('')}
                    ${(memory.memory_tags || []).map(mt => mt.tags ? `
                        <span class="px-2 py-1 text-xs rounded-full" 
                              style="background: ${template.tagBackground}; color: ${template.tagColor}">
                            #${mt.tags.name}
                        </span>
                    ` : '').join('')}
                </div>
            </div>
        `;
        
        return div;
    },

    // 템플릿 스타일 가져오기
    getTemplateStyles() {
        const styles = {
            classic: {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                pageBackground: '#f8f9fa',
                titleColor: '#2d3748',
                subtitleColor: '#718096',
                textColor: '#4a5568',
                accentColor: '#667eea',
                tagBackground: '#e9d8fd',
                tagColor: '#553c9a'
            },
            modern: {
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                pageBackground: '#ffffff',
                titleColor: '#1a202c',
                subtitleColor: '#e53e3e',
                textColor: '#2d3748',
                accentColor: '#f5576c',
                tagBackground: '#fed7d7',
                tagColor: '#c53030'
            },
            minimal: {
                background: 'linear-gradient(135deg, #e0e0e0 0%, #f5f5f5 100%)',
                pageBackground: '#ffffff',
                titleColor: '#000000',
                subtitleColor: '#666666',
                textColor: '#333333',
                accentColor: '#000000',
                tagBackground: '#f0f0f0',
                tagColor: '#666666'
            }
        };
        
        return styles[this.currentTemplate] || styles.classic;
    },

    // 통계 계산
    calculateStats(memories) {
        const stats = {
            totalMemories: memories.length,
            minhoCount: 0,
            minaCount: 0,
            togetherCount: 0,
            tagCounts: {},
            topTag: null
        };

        memories.forEach(memory => {
            const people = memory.memory_people || [];
            const hasMinho = people.some(mp => mp.people && mp.people.name === '민호');
            const hasMina = people.some(mp => mp.people && mp.people.name === '민아');
            
            if (hasMinho) stats.minhoCount++;
            if (hasMina) stats.minaCount++;
            if (hasMinho && hasMina) stats.togetherCount++;
            
            if (memory.memory_tags) {
                memory.memory_tags.forEach(mt => {
                    if (mt.tags) {
                        const tagName = mt.tags.name;
                        stats.tagCounts[tagName] = (stats.tagCounts[tagName] || 0) + 1;
                    }
                });
            }
        });

        // 가장 많이 사용된 태그 찾기
        if (Object.keys(stats.tagCounts).length > 0) {
            stats.topTag = Object.entries(stats.tagCounts)
                .sort((a, b) => b[1] - a[1])[0][0];
        }

        return stats;
    },

    // 월별 그룹화
    groupByMonth(memories) {
        const groups = {};
        
        memories.forEach(memory => {
            const date = new Date(memory.memory_date);
            const monthKey = `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
            
            if (!groups[monthKey]) {
                groups[monthKey] = [];
            }
            groups[monthKey].push(memory);
        });
        
        return groups;
    },
    
    // 미디어 URL 가져오기
    getMediaUrl(mediaFile) {
        if (!mediaFile || !mediaFile.file_path) return '';
        
        // Supabase storage URL 생성
        if (window.supabase) {
            const { data } = supabase.storage
                .from('media')
                .getPublicUrl(mediaFile.file_path);
            return data.publicUrl;
        }
        
        return '';
    },

    // 한국어 날짜 포맷
    formatDateKorean(dateStr) {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
        const weekday = weekdays[date.getDay()];
        
        return `${year}년 ${month}월 ${day}일 (${weekday})`;
    },

    // PDF 생성
    async generatePDF() {
        console.log('포토북 생성 시작...');
        
        const filtered = this.getFilteredMemories();
        console.log('필터링된 추억 수:', filtered.length);
        
        if (filtered.length === 0) {
            alert('선택한 기간에 추억이 없습니다.');
            return;
        }

        // 오버레이 표시
        const overlay = document.getElementById('pdfOverlay');
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        const progressCircle = document.querySelector('.progress-ring-circle');
        
        overlay.classList.remove('hidden');
        overlay.classList.add('show');
        
        try {
            // jsPDF 확인
            if (!window.jspdf) {
                throw new Error('jsPDF 라이브러리가 로드되지 않았습니다.');
            }
            
            // jsPDF 인스턴스 생성
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            let currentPage = 0;
            const totalPages = filtered.length + (this.options.includeTitle ? 1 : 0) + 
                               (this.options.includeStats ? 1 : 0) + 
                               (this.options.includeIndex ? 1 : 0);

            const updateProgress = (page, text) => {
                const progress = (page / totalPages) * 100;
                progressBar.style.width = `${progress}%`;
                progressText.textContent = text;
                
                // 원형 프로그레스
                const offset = 251.2 - (251.2 * progress / 100);
                progressCircle.style.strokeDashoffset = offset;
            };

            // 표지 페이지
            if (this.options.includeTitle) {
                updateProgress(currentPage++, '표지 페이지 생성 중...');
                await this.addTitlePageToPDF(pdf, filtered);
                if (currentPage < totalPages) pdf.addPage();
            }

            // 통계 페이지
            if (this.options.includeStats) {
                updateProgress(currentPage++, '통계 페이지 생성 중...');
                await this.addStatsPageToPDF(pdf, filtered);
                if (currentPage < totalPages) pdf.addPage();
            }

            // 목차 페이지
            if (this.options.includeIndex) {
                updateProgress(currentPage++, '목차 페이지 생성 중...');
                await this.addIndexPageToPDF(pdf, filtered);
                if (currentPage < totalPages) pdf.addPage();
            }

            // 타임라인 페이지
            if (this.options.includeTimeline) {
                updateProgress(currentPage++, '타임라인 생성 중...');
                await this.addTimelinePageToPDF(pdf, filtered);
                if (currentPage < totalPages) pdf.addPage();
            }

            // 추억 페이지들
            for (let i = 0; i < filtered.length; i++) {
                updateProgress(currentPage++, `추억 페이지 ${i + 1}/${filtered.length} 생성 중...`);
                await this.addMemoryPageToPDF(pdf, filtered[i]);
                
                if (currentPage < totalPages) {
                    pdf.addPage();
                }
            }

            // PDF 저장
            updateProgress(totalPages, '포토북 저장 중...');
            const filename = `민호민아_포토북_${this.options.startDate}_${this.options.endDate}.pdf`;
            pdf.save(filename);

            // 완료 후 오버레이 숨기기
            setTimeout(() => {
                overlay.classList.add('hidden');
                overlay.classList.remove('show');
                alert('포토북이 생성되었습니다!');
            }, 1000);

        } catch (error) {
            console.error('PDF 생성 오류:', error);
            console.error('오류 상세:', error.message, error.stack);
            alert('PDF 생성 중 오류가 발생했습니다.\n\n' + error.message);
            overlay.classList.add('hidden');
            overlay.classList.remove('show');
        }
    },

    // PDF에 표지 페이지 추가
    async addTitlePageToPDF(pdf, memories) {
        const template = this.getTemplateStyles();
        
        try {
            // 배경색
            pdf.setFillColor(...this.hexToRgb(template.accentColor));
            pdf.rect(0, 0, 210, 297, 'F');
            
            // 제목
            pdf.setTextColor(...this.hexToRgb('#ffffff'));
            pdf.setFontSize(36);
            
            // 한글 폰트 문제 회피를 위해 영문으로 대체하거나 이미지 사용
            // 임시로 영문 사용
            pdf.text('MinhoMina Growth Album', 105, 100, { align: 'center' });
            
            // 부제목
            pdf.setFontSize(20);
            pdf.text('Precious Memories', 105, 120, { align: 'center' });
            
            // 기간
            pdf.setFontSize(14);
            pdf.text(`${this.options.startDate} ~ ${this.options.endDate}`, 105, 150, { align: 'center' });
            pdf.text(`Total ${memories.length} memories`, 105, 160, { align: 'center' });
            
            // 하트 아이콘 (텍스트로 대체)
            pdf.setFontSize(48);
            pdf.text('♥', 105, 200, { align: 'center' });
        } catch (error) {
            console.error('표지 페이지 추가 오류:', error);
            throw error;
        }
    },

    // PDF에 통계 페이지 추가
    async addStatsPageToPDF(pdf, memories) {
        const stats = this.calculateStats(memories);
        const template = this.getTemplateStyles();
        
        // 제목
        pdf.setTextColor(...this.hexToRgb(template.titleColor));
        pdf.setFontSize(24);
        pdf.text('Memory Statistics', 20, 30);
        
        // 통계 내용
        pdf.setFontSize(12);
        pdf.setTextColor(...this.hexToRgb(template.textColor));
        
        let yPos = 60;
        const lineHeight = 15;
        
        pdf.text(`Total memories: ${stats.totalMemories}`, 20, yPos);
        yPos += lineHeight;
        
        pdf.text(`Minho appears: ${stats.minhoCount} times`, 20, yPos);
        yPos += lineHeight;
        
        pdf.text(`Mina appears: ${stats.minaCount} times`, 20, yPos);
        yPos += lineHeight;
        
        pdf.text(`Together: ${stats.togetherCount} times`, 20, yPos);
        yPos += lineHeight;
        
        if (stats.topTag) {
            pdf.text(`Most used tag: ${stats.topTag}`, 20, yPos);
        }
    },

    // PDF에 목차 페이지 추가
    async addIndexPageToPDF(pdf, memories) {
        const template = this.getTemplateStyles();
        const monthGroups = this.groupByMonth(memories);
        
        // 제목
        pdf.setTextColor(...this.hexToRgb(template.titleColor));
        pdf.setFontSize(24);
        pdf.text('Index', 20, 30);
        
        // 목차 내용
        pdf.setFontSize(12);
        pdf.setTextColor(...this.hexToRgb(template.textColor));
        
        let yPos = 60;
        const lineHeight = 10;
        
        Object.entries(monthGroups).forEach(([month, items]) => {
            // 월 정보를 영문으로 변환
            const monthStr = month.replace(/년/, '').replace(/월/, '');
            pdf.text(`${monthStr} - ${items.length} memories`, 20, yPos);
            yPos += lineHeight;
            
            if (yPos > 270) {
                pdf.addPage();
                yPos = 30;
            }
        });
    },

    // PDF에 타임라인 페이지 추가
    async addTimelinePageToPDF(pdf, memories) {
        const template = this.getTemplateStyles();
        
        // 제목
        pdf.setTextColor(...this.hexToRgb(template.titleColor));
        pdf.setFontSize(24);
        pdf.text('Growth Timeline', 20, 30);
        
        // 타임라인 그리기
        pdf.setDrawColor(...this.hexToRgb(template.accentColor));
        pdf.setLineWidth(2);
        pdf.line(30, 50, 30, 250);
        
        let yPos = 50;
        const step = 200 / Math.min(memories.length, 10);
        
        memories.slice(0, 10).forEach((memory, index) => {
            // 점
            pdf.setFillColor(...this.hexToRgb(template.accentColor));
            pdf.circle(30, yPos, 3, 'F');
            
            // 텍스트
            pdf.setFontSize(10);
            pdf.setTextColor(...this.hexToRgb(template.textColor));
            // 날짜를 영문으로 표시
            const dateStr = new Date(memory.memory_date).toLocaleDateString('en-US');
            pdf.text(`${dateStr} - ${memory.title || 'Memory'}`, 40, yPos + 1);
            
            yPos += step;
        });
    },

    // PDF에 추억 페이지 추가
    async addMemoryPageToPDF(pdf, memory) {
        const template = this.getTemplateStyles();
        
        // 제목
        pdf.setTextColor(...this.hexToRgb(template.titleColor));
        pdf.setFontSize(18);
        pdf.text(memory.title, 20, 30);
        
        // 날짜
        pdf.setFontSize(12);
        pdf.setTextColor(...this.hexToRgb(template.subtitleColor));
        const dateStr = new Date(memory.date).toLocaleDateString('en-US');
        pdf.text(dateStr, 20, 40);
        
        let yPos = 50;
        
        // 이미지가 있으면 추가
        if (memory.media_files && memory.media_files.length > 0) {
            try {
                // 이미지 URL 가져오기
                const imgUrl = this.getMediaUrl(memory.media_files[0]);
                if (imgUrl) {
                    // 주의: jsPDF에서 외부 이미지를 직접 사용하려면 CORS 설정이 필요합니다
                    // 여기서는 이미지 추가를 스킵하거나 다른 방법을 사용해야 합니다
                    console.log('이미지 URL:', imgUrl);
                    // pdf.addImage(imgData, 'JPEG', 20, yPos, 170, 100);
                    // yPos += 110;
                }
            } catch (error) {
                console.error('이미지 추가 오류:', error);
            }
        }
        
        // 설명
        pdf.setFontSize(11);
        pdf.setTextColor(...this.hexToRgb(template.textColor));
        const lines = pdf.splitTextToSize(memory.description || '', 170);
        pdf.text(lines, 20, yPos);
        yPos += lines.length * 5 + 10;
        
        // 태그
        const peopleNames = (memory.memory_people || []).map(mp => mp.people ? mp.people.name : '').filter(n => n);
        const tagNames = (memory.memory_tags || []).map(mt => mt.tags ? `#${mt.tags.name}` : '').filter(t => t);
        if (peopleNames.length > 0 || tagNames.length > 0) {
            pdf.setFontSize(10);
            const tags = [...peopleNames, ...tagNames];
            pdf.text(tags.join(' · '), 20, yPos);
        }
    },

    // 헥스 색상을 RGB로 변환
    hexToRgb(hex) {
        // gradient인 경우 첫 번째 색상만 추출
        if (hex.includes('gradient')) {
            hex = '#667eea'; // 기본값
        }
        
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : [0, 0, 0];
    }
};

// window 객체에 할당
window.photobookCreator = photobookCreator;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    // photobookCreatorContainer가 있는 페이지에서만 실행
    if (document.getElementById('photobookCreatorContainer')) {
        console.log('포토북 생성기 초기화 중...');
        window.photobookCreator.init();
    }
});