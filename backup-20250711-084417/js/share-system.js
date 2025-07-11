// 공유 시스템 관리 클래스
class ShareSystem {
    constructor() {
        this.supabase = window.supabase;
        this.currentMemoryId = null;
        this.shareModal = null;
        this.shareOptionsModal = null;
        this.init();
    }

    init() {
        // 공유 모달 HTML 생성
        this.createShareModal();
        this.bindEvents();
    }

    createShareModal() {
        // 공유 옵션 모달
        const shareModalHTML = `
            <div id="shareModal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-[60] flex items-center justify-center p-4">
                <div class="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 transform transition-all">
                    <h3 class="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
                        <i class="fas fa-share-alt mr-2"></i><span data-lang="share_modal_title">추억 공유하기</span>
                    </h3>
                    
                    <!-- 공유 옵션들 -->
                    <div class="space-y-3">
                        <!-- 카카오톡 -->
                        <button onclick="shareSystem.shareToKakao()" class="w-full flex items-center justify-between p-4 bg-yellow-400 hover:bg-yellow-500 rounded-lg transition-colors">
                            <div class="flex items-center">
                                <img src="https://developers.kakao.com/assets/img/about/logos/kakaolink/kakaolink_btn_small.png" alt="카카오톡" class="w-6 h-6 mr-3">
                                <span class="font-medium text-gray-800" data-lang="share_kakao">카카오톡으로 공유</span>
                            </div>
                            <i class="fas fa-chevron-right text-gray-700"></i>
                        </button>

                        <!-- 페이스북 -->
                        <button onclick="shareSystem.shareToFacebook()" class="w-full flex items-center justify-between p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                            <div class="flex items-center">
                                <i class="fab fa-facebook-f w-6 text-center mr-3"></i>
                                <span class="font-medium" data-lang="share_facebook">페이스북으로 공유</span>
                            </div>
                            <i class="fas fa-chevron-right"></i>
                        </button>

                        <!-- 트위터 -->
                        <button onclick="shareSystem.shareToTwitter()" class="w-full flex items-center justify-between p-4 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors">
                            <div class="flex items-center">
                                <i class="fab fa-twitter w-6 text-center mr-3"></i>
                                <span class="font-medium" data-lang="share_twitter">트위터로 공유</span>
                            </div>
                            <i class="fas fa-chevron-right"></i>
                        </button>

                        <!-- 링크 복사 -->
                        <button onclick="shareSystem.copyLink()" class="w-full flex items-center justify-between p-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors">
                            <div class="flex items-center">
                                <i class="fas fa-link w-6 text-center mr-3 text-gray-700 dark:text-gray-300"></i>
                                <span class="font-medium text-gray-700 dark:text-gray-300" data-lang="share_copy_link">링크 복사</span>
                            </div>
                            <i class="fas fa-chevron-right text-gray-600 dark:text-gray-400"></i>
                        </button>
                    </div>

                    <!-- 공유 설정 -->
                    <div class="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <h4 class="font-medium text-gray-800 dark:text-white mb-3" data-lang="share_settings_section">공유 설정</h4>
                        
                        <div class="space-y-3">
                            <!-- 만료 기간 -->
                            <div class="flex items-center justify-between">
                                <label class="text-sm text-gray-600 dark:text-gray-300" data-lang="share_expire_period">만료 기간</label>
                                <select id="shareExpireDays" class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-300">
                                    <option value="1" data-lang="share_expire_1day">1일</option>
                                    <option value="7" selected data-lang="share_expire_7days">7일</option>
                                    <option value="30" data-lang="share_expire_30days">30일</option>
                                    <option value="0" data-lang="share_expire_unlimited">무제한</option>
                                </select>
                            </div>

                            <!-- 패스워드 보호 -->
                            <div class="flex items-center justify-between">
                                <label class="text-sm text-gray-600 dark:text-gray-300" data-lang="share_password_protect">패스워드 보호</label>
                                <input type="checkbox" id="shareRequirePassword" class="toggle-checkbox">
                            </div>

                            <!-- 패스워드 입력 (조건부) -->
                            <div id="sharePasswordContainer" class="hidden">
                                <input type="password" id="sharePassword" placeholder="패스워드 입력" data-lang-placeholder="share_password_input"
                                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-300">
                            </div>

                            <!-- 댓글 표시 -->
                            <div class="flex items-center justify-between">
                                <label class="text-sm text-gray-600 dark:text-gray-300" data-lang="share_show_comments">댓글 표시</label>
                                <input type="checkbox" id="shareShowComments" checked class="toggle-checkbox">
                            </div>
                        </div>
                    </div>

                    <!-- 생성된 링크 표시 영역 -->
                    <div id="generatedLinkContainer" class="hidden mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p class="text-sm text-green-800 dark:text-green-300 mb-2" data-lang="share_link_created">공유 링크가 생성되었습니다!</p>
                        <div class="flex items-center gap-2">
                            <input type="text" id="generatedShareLink" readonly 
                                class="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-green-300 dark:border-green-700 rounded-lg text-sm">
                            <button onclick="shareSystem.copyGeneratedLink()" 
                                class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                    </div>

                    <!-- 버튼 -->
                    <div class="flex gap-3 mt-6">
                        <button onclick="shareSystem.closeShareModal()" 
                            class="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors">
                            <span data-lang="share_modal_close">닫기</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // DOM에 추가
        document.body.insertAdjacentHTML('beforeend', shareModalHTML);
        this.shareModal = document.getElementById('shareModal');
        
        // 번역 시스템 적용
        if (window.languageManager) {
            window.languageManager.applyLanguage(window.languageManager.currentLang);
        }
    }

    bindEvents() {
        // 패스워드 보호 체크박스 이벤트
        const passwordCheckbox = document.getElementById('shareRequirePassword');
        const passwordContainer = document.getElementById('sharePasswordContainer');
        
        passwordCheckbox?.addEventListener('change', (e) => {
            if (e.target.checked) {
                passwordContainer.classList.remove('hidden');
            } else {
                passwordContainer.classList.add('hidden');
            }
        });

        // 모달 외부 클릭 시 닫기
        this.shareModal?.addEventListener('click', (e) => {
            if (e.target === this.shareModal) {
                this.closeShareModal();
            }
        });
    }

    // 공유 모달 열기
    async openShareModal(memoryId) {
        this.currentMemoryId = memoryId;
        
        // 기존 공유 링크 확인
        const existingLink = await this.getExistingShareLink(memoryId);
        if (existingLink) {
            this.showGeneratedLink(existingLink.share_code);
        } else {
            document.getElementById('generatedLinkContainer').classList.add('hidden');
        }
        
        this.shareModal.classList.remove('hidden');
    }

    // 공유 모달 닫기
    closeShareModal() {
        this.shareModal.classList.add('hidden');
        this.currentMemoryId = null;
    }

    // 기존 공유 링크 확인
    async getExistingShareLink(memoryId) {
        try {
            const { data, error } = await this.supabase
                .from('share_links')
                .select('*')
                .eq('memory_id', memoryId)
                .eq('is_active', true)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data;
        } catch (error) {
            console.error('기존 공유 링크 확인 실패:', error);
            return null;
        }
    }

    // 공유 링크 생성
    async createShareLink() {
        if (!this.currentMemoryId) return;

        const expireDays = parseInt(document.getElementById('shareExpireDays').value);
        const requirePassword = document.getElementById('shareRequirePassword').checked;
        const password = document.getElementById('sharePassword').value;
        const showComments = document.getElementById('shareShowComments').checked;

        try {
            // 만료일 계산
            let expiresAt = null;
            if (expireDays > 0) {
                const expireDate = new Date();
                expireDate.setDate(expireDate.getDate() + expireDays);
                expiresAt = expireDate.toISOString();
            }

            // 패스워드 해싱 (간단한 방법 - 실제로는 더 안전한 방법 사용 권장)
            let passwordHash = null;
            if (requirePassword && password) {
                passwordHash = btoa(password); // Base64 인코딩 (임시)
            }

            // 공유 링크 생성
            const { data, error } = await this.supabase
                .from('share_links')
                .insert({
                    memory_id: this.currentMemoryId,
                    expires_at: expiresAt,
                    require_password: requirePassword,
                    password_hash: passwordHash
                })
                .select()
                .single();

            if (error) throw error;

            // 공유 설정 저장
            await this.saveShareSettings(showComments);

            return data.share_code;
        } catch (error) {
            console.error('공유 링크 생성 실패:', error);
            alert('공유 링크 생성에 실패했습니다.');
            return null;
        }
    }

    // 공유 설정 저장
    async saveShareSettings(showComments) {
        try {
            const userId = (await this.supabase.auth.getUser()).data.user?.id;
            if (!userId) return;

            await this.supabase
                .from('share_settings')
                .upsert({
                    user_id: userId,
                    show_comments: showComments,
                    default_expire_days: parseInt(document.getElementById('shareExpireDays').value)
                });
        } catch (error) {
            console.error('공유 설정 저장 실패:', error);
        }
    }

    // 생성된 링크 표시
    showGeneratedLink(shareCode) {
        const baseUrl = window.location.origin;
        const shareUrl = `${baseUrl}/share.html?code=${shareCode}`;
        
        document.getElementById('generatedShareLink').value = shareUrl;
        document.getElementById('generatedLinkContainer').classList.remove('hidden');
    }

    // 카카오톡 공유
    async shareToKakao() {
        const shareCode = await this.getOrCreateShareLink();
        if (!shareCode) return;

        const shareUrl = `${window.location.origin}/share.html?code=${shareCode}`;
        
        // 추억 정보 가져오기
        const memory = await this.getMemoryInfo(this.currentMemoryId);
        if (!memory) return;

        // Kakao SDK 초기화 체크
        if (typeof Kakao === 'undefined') {
            window.open(`https://story.kakao.com/share?url=${encodeURIComponent(shareUrl)}`);
            return;
        }

        Kakao.Share.sendDefault({
            objectType: 'feed',
            content: {
                title: memory.title || '민호민아 성장앨범',
                description: memory.description || '소중한 추억을 공유합니다',
                imageUrl: memory.thumbnail || `${window.location.origin}/assets/images/default-share.jpg`,
                link: {
                    mobileWebUrl: shareUrl,
                    webUrl: shareUrl
                }
            },
            buttons: [{
                title: '추억 보기',
                link: {
                    mobileWebUrl: shareUrl,
                    webUrl: shareUrl
                }
            }]
        });
    }

    // 페이스북 공유
    async shareToFacebook() {
        const shareCode = await this.getOrCreateShareLink();
        if (!shareCode) return;

        const shareUrl = `${window.location.origin}/share.html?code=${shareCode}`;
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        
        window.open(facebookUrl, '_blank', 'width=600,height=400');
    }

    // 트위터 공유
    async shareToTwitter() {
        const shareCode = await this.getOrCreateShareLink();
        if (!shareCode) return;

        const memory = await this.getMemoryInfo(this.currentMemoryId);
        const shareUrl = `${window.location.origin}/share.html?code=${shareCode}`;
        const text = `${memory?.title || '민호민아의 소중한 추억'} - 민호민아 성장앨범`;
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
        
        window.open(twitterUrl, '_blank', 'width=600,height=400');
    }

    // 링크 복사
    async copyLink() {
        const shareCode = await this.getOrCreateShareLink();
        if (!shareCode) return;

        const shareUrl = `${window.location.origin}/share.html?code=${shareCode}`;
        await this.copyToClipboard(shareUrl);
        
        // 복사 완료 알림
        this.showCopyNotification();
    }

    // 생성된 링크 복사
    async copyGeneratedLink() {
        const shareUrl = document.getElementById('generatedShareLink').value;
        await this.copyToClipboard(shareUrl);
        this.showCopyNotification();
    }

    // 클립보드에 복사
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            // 폴백: 임시 textarea 사용
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }
    }

    // 복사 완료 알림
    showCopyNotification() {
        const notification = document.createElement('div');
        notification.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 translate-y-full';
        notification.innerHTML = '<i class="fas fa-check-circle mr-2"></i>링크가 복사되었습니다!';
        
        document.body.appendChild(notification);
        
        // 애니메이션
        setTimeout(() => {
            notification.classList.remove('translate-y-full');
        }, 100);
        
        // 3초 후 제거
        setTimeout(() => {
            notification.classList.add('translate-y-full');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // 공유 링크 가져오기 또는 생성
    async getOrCreateShareLink() {
        // 기존 링크 확인
        let existingLink = await this.getExistingShareLink(this.currentMemoryId);
        
        if (existingLink) {
            this.showGeneratedLink(existingLink.share_code);
            return existingLink.share_code;
        }
        
        // 새로 생성
        const shareCode = await this.createShareLink();
        if (shareCode) {
            this.showGeneratedLink(shareCode);
        }
        return shareCode;
    }

    // 추억 정보 가져오기
    async getMemoryInfo(memoryId) {
        try {
            const { data, error } = await this.supabase
                .from('memories')
                .select(`
                    *,
                    media_files(file_path)
                `)
                .eq('id', memoryId)
                .single();

            if (error) throw error;

            // 썸네일 URL 생성
            if (data.media_files && data.media_files.length > 0) {
                const { data: urlData } = this.supabase.storage
                    .from('media')
                    .getPublicUrl(data.media_files[0].file_path);
                
                data.thumbnail = urlData.publicUrl;
            }

            return data;
        } catch (error) {
            console.error('추억 정보 가져오기 실패:', error);
            return null;
        }
    }

    // 공유 통계 업데이트
    async updateShareStats(shareCode) {
        try {
            await this.supabase
                .from('share_views')
                .insert({
                    share_link_id: shareCode,
                    viewer_ip: await this.getClientIP(),
                    user_agent: navigator.userAgent,
                    referer: document.referrer
                });
        } catch (error) {
            console.error('공유 통계 업데이트 실패:', error);
        }
    }

    // 클라이언트 IP 가져오기 (간단한 방법)
    async getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            return null;
        }
    }
}

// 전역 인스턴스 생성
let shareSystem;

// DOM 로드 시 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        shareSystem = new ShareSystem();
    });
} else {
    shareSystem = new ShareSystem();
}
