// 민호민아 성장앨범 - Service Worker
// PWA 기능: 오프라인 지원, 푸시 알림, 백그라운드 동기화

const CACHE_VERSION = 'v1';
const CACHE_NAME = `minhominah-${CACHE_VERSION}`;
const API_CACHE_NAME = `minhominah-api-${CACHE_VERSION}`;
const IMAGE_CACHE_NAME = `minhominah-images-${CACHE_VERSION}`;

// 캐시할 정적 리소스 목록
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/assets/images/logo.png',
  // Vite 빌드 후 생성되는 파일들은 동적으로 캐시됩니다
];

// 캐시하지 않을 URL 패턴
const CACHE_EXCLUDE_PATTERNS = [
  /\/api\//,
  /hot-update/,
  /\.hot-update\./,
  /\/@vite\//,
  /\/__vite_ping/,
  /node_modules/
];

// 설치 이벤트 - 정적 리소스 캐싱
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS.map(url => new Request(url, { cache: 'no-cache' })));
      })
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error('[SW] Cache installation failed:', error);
      })
  );
});

// 활성화 이벤트 - 이전 캐시 정리
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName.startsWith('minhominah-') && 
                     ![CACHE_NAME, API_CACHE_NAME, IMAGE_CACHE_NAME].includes(cacheName);
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch 이벤트 - 네트워크 요청 처리
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 지원하지 않는 스킴은 무시 (chrome-extension:// 등)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // POST, HEAD 등 캐시할 수 없는 메서드는 무시
  if (request.method !== 'GET') {
    return;
  }

  // 캐시 제외 패턴 확인
  if (CACHE_EXCLUDE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return;
  }

  // Supabase Storage 이미지 처리
  if (url.hostname.includes('supabase.co') && url.pathname.includes('/storage/')) {
    event.respondWith(handleImageRequest(request));
    return;
  }

  // API 요청 처리 (Network First)
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase.co')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // 정적 리소스 처리 (Cache First)
  event.respondWith(handleStaticRequest(request));
});

// 정적 리소스 요청 처리 (Cache First)
async function handleStaticRequest(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Static request failed:', error);
    
    // 오프라인 페이지 반환
    const cache = await caches.open(CACHE_NAME);
    const offlineResponse = await cache.match('/');
    return offlineResponse || new Response('오프라인 상태입니다', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain; charset=utf-8'
      })
    });
  }
}

// API 요청 처리 (Network First)
async function handleApiRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] API request failed:', error);
    
    // 캐시된 응답 반환
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response(JSON.stringify({ error: '네트워크 오류' }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'application/json; charset=utf-8'
      })
    });
  }
}

// 이미지 요청 처리 (Cache First with Expiration)
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE_NAME);
  
  try {
    const cachedResponse = await cache.match(request);
    
    // 캐시된 이미지가 있으면 반환
    if (cachedResponse) {
      const cachedDate = new Date(cachedResponse.headers.get('date'));
      const now = new Date();
      const ageInDays = (now - cachedDate) / (1000 * 60 * 60 * 24);
      
      // 30일 이내의 캐시는 그대로 사용
      if (ageInDays < 30) {
        return cachedResponse;
      }
    }
    
    // 네트워크에서 가져오기
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Image request failed:', error);
    
    // 캐시된 이미지 반환 (오래된 것이라도)
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // 기본 이미지 반환
    return new Response(null, { status: 404 });
  }
}

// 푸시 알림 수신
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || '새로운 소식이 있습니다.',
    icon: '/assets/images/icon-192x192.png',
    badge: '/assets/images/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'view',
        title: '보기'
      },
      {
        action: 'close',
        title: '닫기'
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

  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // 이미 열려있는 탭이 있으면 포커스
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        // 없으면 새 탭 열기
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// 백그라운드 동기화
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-uploads') {
    event.waitUntil(syncPendingUploads());
  }
});

// 대기 중인 업로드 동기화
async function syncPendingUploads() {
  try {
    // IndexedDB에서 대기 중인 업로드 가져오기
    const pendingUploads = await getPendingUploads();
    
    for (const upload of pendingUploads) {
      try {
        // 업로드 재시도
        await retryUpload(upload);
        // 성공하면 대기 목록에서 제거
        await removePendingUpload(upload.id);
      } catch (error) {
        console.error('[SW] Upload sync failed:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

// 메시지 수신 처리
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CACHE_URLS') {
    cacheUrls(event.data.urls);
  }
});

// URL 목록 캐싱
async function cacheUrls(urls) {
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(urls);
}

// 헬퍼 함수들 (실제 구현 필요)
async function getPendingUploads() {
  // IndexedDB에서 대기 중인 업로드 목록 가져오기
  return [];
}

async function retryUpload(upload) {
  // 업로드 재시도 로직
}

async function removePendingUpload(id) {
  // IndexedDB에서 업로드 항목 제거
}

console.log('[SW] Service Worker loaded');
