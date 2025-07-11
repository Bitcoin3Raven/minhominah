// 알림 시스템 관리 클래스
class NotificationSystem {
    constructor() {
        this.supabase = null;
        this.notifications = [];
        this.unreadCount = 0;
        this.notificationPanel = null;
        this.notificationBell = null;
        this.pushSubscription = null;
        // init()을 나중에 호출하도록 변경
    }

    async init() {
        // Supabase 클라이언트가 초기화되었는지 확인
        if (!window.supabaseClient) {
            console.error('Supabase 클라이언트가 초기화되지 않았습니다.');
            return;
        }
        
        this.supabase = window.supabaseClient;
        
        // 현재 사용자 정보 가져오기
        const { data: { user } } = await this.supabase.auth.getUser();
        if (!user) {
            console.log('로그인된 사용자가 없습니다.');
            return;
        }
        this.userId = user.id;
        
        // 알림 UI 생성
        this.createNotificationUI();
        
        // 알림 설정 로드
        await this.loadNotificationSettings();
        
        // 알림 목록 로드
        await this.loadNotifications();
        
        // 실시간 구독 설정
        this.subscribeToNotifications();
        
        // 푸시 알림 초기화
        await this.initPushNotifications();
        
        // 이벤트 리스너 설정
        this.bindEvents();
        
        // 알림 카운트 업데이트
        this.updateUnreadCount();
    }

    // 알림 UI 생성
    createNotificationUI() {
        // 알림 벨 아이콘 (헤더에 추가될 예정)
        const bellHTML = `
            <div id="notificationBell" class="relative">
                <button class="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors p-2">
                    <i class="fas fa-bell text-xl"></i>
                    <span id="notificationCount" class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center hidden">0</span>
                </button>
            </div>
        `;

        // 알림 패널
        const panelHTML = `
            <div id="notificationPanel" class="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 hidden z-50">
                <div class="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div class="flex items-center justify-between">
                        <h3 class="text-lg font-semibold text-gray-800 dark:text-white">알림</h3>
                        <button id="notificationSettings" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                            <i class="fas fa-cog"></i>
                        </button>
                    </div>
                </div>
                <div id="notificationList" class="max-h-96 overflow-y-auto">
                    <!-- 알림 목록이 여기에 표시됩니다 -->
                </div>
                <div class="p-3 border-t border-gray-200 dark:border-gray-700">
                    <button id="markAllRead" class="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                        모두 읽음으로 표시
                    </button>
                </div>
            </div>
        `;

        // 알림 설정 모달
        const settingsModalHTML = `
            <div id="notificationSettingsModal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-[70] flex items-center justify-center p-4">
                <div class="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
                    <h3 class="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
                        <i class="fas fa-bell mr-2"></i><span data-lang="notification_settings_title">알림 설정</span>
                    </h3>
                    
                    <div class="space-y-4">
                        <!-- 알림 유형별 설정 -->
                        <div class="space-y-3">
                            <h4 class="font-semibold text-gray-700 dark:text-gray-300" data-lang="notification_type_section">알림 유형</h4>
                            
                            <label class="flex items-center justify-between">
                                <span class="text-gray-600 dark:text-gray-400" data-lang="notification_anniversary">기념일 알림</span>
                                <input type="checkbox" id="anniversaryEnabled" class="form-checkbox">
                            </label>
                            
                            <label class="flex items-center justify-between">
                                <span class="text-gray-600 dark:text-gray-400" data-lang="notification_comment">댓글 알림</span>
                                <input type="checkbox" id="commentEnabled" class="form-checkbox">
                            </label>
                            
                            <label class="flex items-center justify-between">
                                <span class="text-gray-600 dark:text-gray-400" data-lang="notification_new_memory">새 추억 알림</span>
                                <input type="checkbox" id="memoryAddedEnabled" class="form-checkbox">
                            </label>
                            
                            <label class="flex items-center justify-between">
                                <span class="text-gray-600 dark:text-gray-400" data-lang="notification_family_invite">가족 초대 알림</span>
                                <input type="checkbox" id="familyInviteEnabled" class="form-checkbox">
                            </label>
                            
                            <label class="flex items-center justify-between">
                                <span class="text-gray-600 dark:text-gray-400" data-lang="notification_share_view">공유 조회 알림</span>
                                <input type="checkbox" id="shareViewEnabled" class="form-checkbox">
                            </label>
                        </div>
                        
                        <!-- 알림 방법 -->
                        <div class="space-y-3">
                            <h4 class="font-semibold text-gray-700 dark:text-gray-300" data-lang="notification_method_section">알림 방법</h4>
                            
                            <label class="flex items-center justify-between">
                                <span class="text-gray-600 dark:text-gray-400" data-lang="notification_browser_push">브라우저 푸시 알림</span>
                                <input type="checkbox" id="browserPushEnabled" class="form-checkbox">
                            </label>
                        </div>
                        
                        <!-- 기념일 사전 알림 -->
                        <div>
                            <label class="block text-gray-700 dark:text-gray-300 mb-2" data-lang="notification_anniversary_days">
                                기념일 사전 알림 (일)
                            </label>
                            <input type="number" id="anniversaryReminderDays" min="1" max="30" value="7" 
                                class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                        </div>
                    </div>
                    
                    <div class="flex gap-3 mt-6">
                        <button onclick="notificationSystem.saveSettings()" 
                            class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                            <span data-lang="notification_save">저장</span>
                        </button>
                        <button onclick="notificationSystem.closeSettingsModal()" 
                            class="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-700 transition-colors">
                            <span data-lang="notification_cancel">취소</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // 기존 요소에 추가하지 않고 나중에 추가할 예정
        this.bellHTML = bellHTML;
        this.panelHTML = panelHTML;
        
        // 설정 모달은 body에 추가
        document.body.insertAdjacentHTML('beforeend', settingsModalHTML);
        
        // 번역 시스템 적용
        if (window.languageManager) {
            window.languageManager.applyLanguage(window.languageManager.currentLang);
        }
    }

    // 헤더에 알림 벨 추가
    addNotificationBellToHeader() {
        const headerRight = document.querySelector('header .flex.items-center.gap-4');
        if (headerRight && !document.getElementById('notificationBell')) {
            // 알림 벨을 다크모드 토글 버튼 앞에 추가
            const darkModeToggle = headerRight.querySelector('#darkModeToggle').parentElement;
            darkModeToggle.insertAdjacentHTML('beforebegin', this.bellHTML);
            
            // 알림 패널을 벨 아이콘 안에 추가
            const notificationBell = document.getElementById('notificationBell');
            notificationBell.insertAdjacentHTML('beforeend', this.panelHTML);
            
            this.notificationBell = notificationBell;
            this.notificationPanel = document.getElementById('notificationPanel');
        }
    }

    // 이벤트 바인딩
    bindEvents() {
        // 알림 벨 클릭
        document.addEventListener('click', (e) => {
            const bell = e.target.closest('#notificationBell button');
            if (bell) {
                this.toggleNotificationPanel();
            }
        });

        // 패널 외부 클릭 시 닫기
        document.addEventListener('click', (e) => {
            // notificationPanel이 존재하는 경우에만 처리
            if (this.notificationPanel && !e.target.closest('#notificationBell') && !e.target.closest('#notificationPanel')) {
                this.closeNotificationPanel();
            }
        });

        // 설정 버튼 클릭
        const settingsBtn = document.getElementById('notificationSettings');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.openSettingsModal();
            });
        }

        // 모두 읽음 처리
        const markAllReadBtn = document.getElementById('markAllRead');
        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', () => {
                this.markAllAsRead();
            });
        }
    }

    // 알림 목록 로드
    async loadNotifications() {
        try {
            const { data, error } = await this.supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;

            this.notifications = data || [];
            this.renderNotifications();
            this.updateUnreadCount();
        } catch (error) {
            console.error('알림 로드 실패:', error);
        }
    }

    // 알림 렌더링
    renderNotifications() {
        const notificationList = document.getElementById('notificationList');
        if (!notificationList) return;

        if (this.notifications.length === 0) {
            notificationList.innerHTML = `
                <div class="p-8 text-center text-gray-500 dark:text-gray-400">
                    <i class="fas fa-bell-slash text-4xl mb-3"></i>
                    <p>새로운 알림이 없습니다</p>
                </div>
            `;
            return;
        }

        notificationList.innerHTML = this.notifications.map(notification => `
            <div class="notification-item p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 ${!notification.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}"
                data-id="${notification.id}"
                onclick="notificationSystem.handleNotificationClick('${notification.id}')">
                <div class="flex items-start gap-3">
                    <div class="flex-shrink-0">
                        <i class="fas fa-${notification.icon || 'bell'} text-lg ${!notification.is_read ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}"></i>
                    </div>
                    <div class="flex-1">
                        <h4 class="font-semibold text-gray-800 dark:text-white text-sm">${notification.title}</h4>
                        <p class="text-gray-600 dark:text-gray-400 text-sm mt-1">${notification.message}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">${this.formatTime(notification.created_at)}</p>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 알림 클릭 처리
    async handleNotificationClick(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (!notification) return;

        // 읽음 처리
        if (!notification.is_read) {
            await this.markAsRead(notificationId);
        }

        // 관련 항목으로 이동
        if (notification.link) {
            window.location.href = notification.link;
        } else if (notification.related_item_type === 'memory' && notification.related_item_id) {
            // 추억 상세 보기
            if (typeof viewMemoryDetail === 'function') {
                viewMemoryDetail(notification.related_item_id);
            }
        }

        // 패널 닫기
        this.closeNotificationPanel();
    }

    // 읽음 처리
    async markAsRead(notificationId) {
        try {
            const { error } = await this.supabase
                .from('notifications')
                .update({ 
                    is_read: true,
                    read_at: new Date().toISOString()
                })
                .eq('id', notificationId);

            if (error) throw error;

            // 로컬 상태 업데이트
            const notification = this.notifications.find(n => n.id === notificationId);
            if (notification) {
                notification.is_read = true;
                this.renderNotifications();
                this.updateUnreadCount();
            }
        } catch (error) {
            console.error('읽음 처리 실패:', error);
        }
    }

    // 모두 읽음 처리
    async markAllAsRead() {
        try {
            const unreadIds = this.notifications
                .filter(n => !n.is_read)
                .map(n => n.id);

            if (unreadIds.length === 0) return;

            const { error } = await this.supabase
                .from('notifications')
                .update({ 
                    is_read: true,
                    read_at: new Date().toISOString()
                })
                .in('id', unreadIds);

            if (error) throw error;

            // 로컬 상태 업데이트
            this.notifications.forEach(n => {
                if (!n.is_read) n.is_read = true;
            });
            
            this.renderNotifications();
            this.updateUnreadCount();
        } catch (error) {
            console.error('모두 읽음 처리 실패:', error);
        }
    }

    // 읽지 않은 알림 수 업데이트
    updateUnreadCount() {
        this.unreadCount = this.notifications.filter(n => !n.is_read).length;
        const countElement = document.getElementById('notificationCount');
        
        if (countElement) {
            if (this.unreadCount > 0) {
                countElement.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
                countElement.classList.remove('hidden');
            } else {
                countElement.classList.add('hidden');
            }
        }
    }

    // 알림 패널 토글
    toggleNotificationPanel() {
        if (this.notificationPanel.classList.contains('hidden')) {
            this.openNotificationPanel();
        } else {
            this.closeNotificationPanel();
        }
    }

    // 알림 패널 열기
    openNotificationPanel() {
        this.notificationPanel.classList.remove('hidden');
        // 패널이 열릴 때 알림 목록 새로고침
        this.loadNotifications();
    }

    // 알림 패널 닫기
    closeNotificationPanel() {
        if (this.notificationPanel) {
            this.notificationPanel.classList.add('hidden');
        }
    }

    // 시간 포맷팅
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return '방금 전';
        if (minutes < 60) return `${minutes}분 전`;
        if (hours < 24) return `${hours}시간 전`;
        if (days < 7) return `${days}일 전`;
        
        return date.toLocaleDateString('ko-KR');
    }

    // 알림 설정 로드
    async loadNotificationSettings() {
        try {
            const { data, error } = await this.supabase
                .from('notification_settings')
                .select('*')
                .eq('user_id', this.userId)
                .maybeSingle();

            if (error) throw error;

            this.settings = data || {
                anniversary_enabled: true,
                comment_enabled: true,
                memory_added_enabled: true,
                family_invite_enabled: true,
                share_view_enabled: true,
                browser_push_enabled: false,
                anniversary_reminder_days: 7
            };

            // UI에 설정 반영
            this.applySettingsToUI();
        } catch (error) {
            console.error('알림 설정 로드 실패:', error);
        }
    }

    // 설정을 UI에 반영
    applySettingsToUI() {
        if (!this.settings) return;

        document.getElementById('anniversaryEnabled').checked = this.settings.anniversary_enabled;
        document.getElementById('commentEnabled').checked = this.settings.comment_enabled;
        document.getElementById('memoryAddedEnabled').checked = this.settings.memory_added_enabled;
        document.getElementById('familyInviteEnabled').checked = this.settings.family_invite_enabled;
        document.getElementById('shareViewEnabled').checked = this.settings.share_view_enabled;
        document.getElementById('browserPushEnabled').checked = this.settings.browser_push_enabled;
        document.getElementById('anniversaryReminderDays').value = this.settings.anniversary_reminder_days;
    }

    // 설정 모달 열기
    openSettingsModal() {
        document.getElementById('notificationSettingsModal').classList.remove('hidden');
        this.closeNotificationPanel();
    }

    // 설정 모달 닫기
    closeSettingsModal() {
        document.getElementById('notificationSettingsModal').classList.add('hidden');
    }

    // 설정 저장
    async saveSettings() {
        try {
            const settings = {
                anniversary_enabled: document.getElementById('anniversaryEnabled').checked,
                comment_enabled: document.getElementById('commentEnabled').checked,
                memory_added_enabled: document.getElementById('memoryAddedEnabled').checked,
                family_invite_enabled: document.getElementById('familyInviteEnabled').checked,
                share_view_enabled: document.getElementById('shareViewEnabled').checked,
                browser_push_enabled: document.getElementById('browserPushEnabled').checked,
                anniversary_reminder_days: parseInt(document.getElementById('anniversaryReminderDays').value)
            };

            const { error } = await this.supabase
                .from('notification_settings')
                .upsert(settings);

            if (error) throw error;

            this.settings = settings;
            this.closeSettingsModal();

            // 푸시 알림 설정 변경 처리
            if (settings.browser_push_enabled) {
                await this.enablePushNotifications();
            } else {
                await this.disablePushNotifications();
            }

            alert('알림 설정이 저장되었습니다.');
        } catch (error) {
            console.error('설정 저장 실패:', error);
            alert('설정 저장에 실패했습니다.');
        }
    }

    // 푸시 알림 초기화
    async initPushNotifications() {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.log('푸시 알림이 지원되지 않는 브라우저입니다.');
            return;
        }

        // 서비스 워커 등록
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('서비스 워커 등록 완료');

            // 푸시 알림 권한 상태 확인
            if (this.settings?.browser_push_enabled) {
                await this.enablePushNotifications();
            }
        } catch (error) {
            console.error('서비스 워커 등록 실패:', error);
        }
    }

    // 푸시 알림 활성화
    async enablePushNotifications() {
        try {
            const permission = await Notification.requestPermission();
            
            if (permission !== 'granted') {
                console.log('푸시 알림 권한이 거부되었습니다.');
                return;
            }

            const registration = await navigator.serviceWorker.ready;
            
            // 푸시 구독
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(
                    'YOUR_VAPID_PUBLIC_KEY' // 실제 VAPID 키로 교체 필요
                )
            });

            // 구독 정보 저장
            await this.savePushSubscription(subscription);
            this.pushSubscription = subscription;
        } catch (error) {
            console.error('푸시 알림 활성화 실패:', error);
        }
    }

    // 푸시 알림 비활성화
    async disablePushNotifications() {
        try {
            if (this.pushSubscription) {
                await this.pushSubscription.unsubscribe();
                this.pushSubscription = null;
            }
        } catch (error) {
            console.error('푸시 알림 비활성화 실패:', error);
        }
    }

    // 푸시 구독 정보 저장
    async savePushSubscription(subscription) {
        try {
            const { error } = await this.supabase
                .from('push_subscriptions')
                .upsert({
                    endpoint: subscription.endpoint,
                    p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')))),
                    auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')))),
                    user_agent: navigator.userAgent
                });

            if (error) throw error;
        } catch (error) {
            console.error('푸시 구독 정보 저장 실패:', error);
        }
    }

    // Base64 URL을 Uint8Array로 변환
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    // 실시간 알림 구독
    subscribeToNotifications() {
        const userId = this.supabase.auth.getUser().then(({ data }) => data.user?.id);
        if (!userId) return;

        // 실시간 구독 설정
        this.supabase
            .channel('notifications')
            .on('postgres_changes', 
                { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    this.handleNewNotification(payload.new);
                }
            )
            .subscribe();
    }

    // 새 알림 처리
    handleNewNotification(notification) {
        // 알림 목록에 추가
        this.notifications.unshift(notification);
        
        // UI 업데이트
        this.renderNotifications();
        this.updateUnreadCount();
        
        // 브라우저 알림 표시
        if (this.settings?.browser_push_enabled && Notification.permission === 'granted') {
            this.showBrowserNotification(notification);
        }
        
        // 알림음 재생 (선택적)
        this.playNotificationSound();
    }

    // 브라우저 알림 표시
    showBrowserNotification(notification) {
        const options = {
            body: notification.message,
            icon: '/assets/images/icon-192.png',
            badge: '/assets/images/badge-72.png',
            tag: notification.id,
            data: {
                notificationId: notification.id,
                link: notification.link
            }
        };

        // 서비스 워커를 통해 알림 표시
        navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(notification.title, options);
        });
    }

    // 알림음 재생
    playNotificationSound() {
        // 간단한 알림음 재생
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE');
        audio.volume = 0.3;
        audio.play().catch(() => {
            // 자동 재생이 차단된 경우 무시
        });
    }

    // 기념일 관리
    async createAnniversary(data) {
        try {
            const { error } = await this.supabase
                .from('anniversaries')
                .insert(data);

            if (error) throw error;

            alert('기념일이 추가되었습니다.');
            return true;
        } catch (error) {
            console.error('기념일 추가 실패:', error);
            alert('기념일 추가에 실패했습니다.');
            return false;
        }
    }

    // 기념일 목록 로드
    async loadAnniversaries() {
        try {
            const { data, error } = await this.supabase
                .from('anniversaries')
                .select(`
                    *,
                    people(name)
                `)
                .order('anniversary_date', { ascending: true });

            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('기념일 로드 실패:', error);
            return [];
        }
    }

    // 기념일 알림 생성 (Edge Function 호출)
    async checkAndCreateAnniversaryNotifications() {
        try {
            const { data, error } = await this.supabase.functions.invoke('create-anniversary-notifications');
            
            if (error) throw error;
            
            console.log('기념일 알림 확인 완료');
        } catch (error) {
            console.error('기념일 알림 생성 실패:', error);
        }
    }
}

// 전역 인스턴스 생성
let notificationSystem;

// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', async () => {
    // Supabase 클라이언트가 초기화될 때까지 잠시 대기
    if (!window.supabaseClient) {
        await new Promise(resolve => {
            const checkInterval = setInterval(() => {
                if (window.supabaseClient) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
        });
    }
    
    notificationSystem = new NotificationSystem();
    await notificationSystem.init();
    
    // 페이지가 로드된 후 헤더에 알림 벨 추가
    setTimeout(() => {
        notificationSystem.addNotificationBellToHeader();
    }, 100);
});

// 알림 생성 헬퍼 함수 (다른 시스템에서 사용)
async function createNotification(type, title, message, relatedItemId = null, relatedItemType = null) {
    try {
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) return;

        const { error } = await window.supabase
            .from('notifications')
            .insert({
                user_id: user.id,
                type,
                title,
                message,
                related_item_id: relatedItemId,
                related_item_type: relatedItemType,
                icon: getNotificationIcon(type)
            });

        if (error) throw error;
    } catch (error) {
        console.error('알림 생성 실패:', error);
    }
}

// 알림 타입별 아이콘 반환
function getNotificationIcon(type) {
    const icons = {
        'anniversary': 'calendar-check',
        'comment': 'comment',
        'memory_added': 'image',
        'family_invite': 'users',
        'share_view': 'share-alt'
    };
    
    return icons[type] || 'bell';
}
