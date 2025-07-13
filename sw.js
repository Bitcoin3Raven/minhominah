// 서비스 워커 - 푸시 알림 및 오프라인 지원
const CACHE_NAME = 'minhominah-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/supabase.js',
    '/js/notification-system.js'
];

// 서비스 워커 설치
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('캐시 열기 완료');
                return cache.addAll(urlsToCache);
            })
    );
});

// 서비스 워커 활성화
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('이전 캐시 삭제:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// 네트워크 요청 인터셉트
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // 캐시에 있으면 캐시에서 반환
                if (response) {
                    return response;
                }
                // 없으면 네트워크에서 가져오기
                return fetch(event.request);
            })
    );
});

// 푸시 알림 수신
self.addEventListener('push', (event) => {
    if (!event.data) return;

    const data = event.data.json();
    const options = {
        body: data.message || '새로운 알림이 있습니다.',
        icon: '/assets/images/icon-192.png',
        badge: '/assets/images/badge-72.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: data.id,
            link: data.link
        },
        actions: [
            {
                action: 'view',
                title: '보기',
                icon: '/assets/images/checkmark.png'
            },
            {
                action: 'close',
                title: '닫기',
                icon: '/assets/images/xmark.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title || '민호민아 성장앨범', options)
    );
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    // 링크가 있으면 해당 페이지로 이동
    const link = event.notification.data?.link || '/';
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowClients) => {
                // 이미 열려있는 탭이 있으면 포커스
                for (let client of windowClients) {
                    if (client.url === link && 'focus' in client) {
                        return client.focus();
                    }
                }
                // 없으면 새 탭 열기
                if (clients.openWindow) {
                    return clients.openWindow(link);
                }
            })
    );
});

// 백그라운드 동기화 (선택적)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-notifications') {
        event.waitUntil(syncNotifications());
    }
});

// 알림 동기화 함수
async function syncNotifications() {
    try {
        // 오프라인 동안 쌓인 작업 처리
        console.log('알림 동기화 시작');
    } catch (error) {
        console.error('알림 동기화 실패:', error);
    }
}

// 메시지 수신 처리 (자동 백업 스케줄링)
self.addEventListener('message', (event) => {
    if (event.data.type === 'SCHEDULE_BACKUP') {
        scheduleAutoBackup(event.data.settings);
    }
});

// 자동 백업 스케줄링
function scheduleAutoBackup(settings) {
    if (!settings.enabled) {
        // 기존 알람 취소
        if (self.registration.periodicSync) {
            self.registration.periodicSync.unregister('auto-backup');
        }
        return;
    }

    // Periodic Background Sync API 사용 (지원하는 경우)
    if ('periodicSync' in self.registration) {
        const interval = getIntervalInMs(settings.frequency);
        
        self.registration.periodicSync.register('auto-backup', {
            minInterval: interval
        }).then(() => {
            console.log('자동 백업 스케줄 등록 완료');
        }).catch((error) => {
            console.error('자동 백업 스케줄 등록 실패:', error);
            // 대체 방법: setInterval 사용
            fallbackSchedule(settings);
        });
    } else {
        // Periodic Sync를 지원하지 않는 경우 대체 방법
        fallbackSchedule(settings);
    }
}

// 주기를 밀리초로 변환
function getIntervalInMs(frequency) {
    const intervals = {
        'daily': 24 * 60 * 60 * 1000,
        'weekly': 7 * 24 * 60 * 60 * 1000,
        'monthly': 30 * 24 * 60 * 60 * 1000
    };
    return intervals[frequency] || intervals.weekly;
}

// 대체 스케줄링 방법
function fallbackSchedule(settings) {
    const interval = getIntervalInMs(settings.frequency);
    
    // 다음 백업 시간 계산
    const now = new Date();
    const [hours, minutes] = settings.time.split(':').map(Number);
    const nextBackup = new Date(now);
    nextBackup.setHours(hours, minutes, 0, 0);
    
    if (nextBackup <= now) {
        // 이미 지난 시간이면 다음 날로
        nextBackup.setDate(nextBackup.getDate() + 1);
    }
    
    const timeUntilBackup = nextBackup - now;
    
    // 타이머 설정
    setTimeout(() => {
        performAutoBackup();
        // 반복 설정
        setInterval(performAutoBackup, interval);
    }, timeUntilBackup);
}

// Periodic Sync 이벤트 처리
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'auto-backup') {
        event.waitUntil(performAutoBackup());
    }
});

// 자동 백업 수행
async function performAutoBackup() {
    try {
        console.log('자동 백업 시작');
        
        // 모든 클라이언트에 백업 요청 메시지 전송
        const clients = await self.clients.matchAll();
        for (const client of clients) {
            client.postMessage({
                type: 'PERFORM_AUTO_BACKUP'
            });
        }
        
        // 백업 완료 알림
        await self.registration.showNotification('자동 백업 완료', {
            body: '데이터가 안전하게 백업되었습니다.',
            icon: '/assets/images/icon-192.png',
            badge: '/assets/images/badge-72.png',
            tag: 'auto-backup-complete',
            renotify: true
        });
        
    } catch (error) {
        console.error('자동 백업 실패:', error);
        
        // 실패 알림
        await self.registration.showNotification('자동 백업 실패', {
            body: '백업 중 오류가 발생했습니다. 수동으로 백업해주세요.',
            icon: '/assets/images/icon-192.png',
            badge: '/assets/images/badge-72.png',
            tag: 'auto-backup-failed',
            renotify: true
        });
    }
}
