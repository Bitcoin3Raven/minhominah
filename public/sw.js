// 민호민아 성장앨범 - Service Worker (Simplified Version)
// 간소화된 버전으로 404 에러 방지

const CACHE_VERSION = 'v4-2025-07-30';
const CACHE_NAME = `minhominah-${CACHE_VERSION}`;

// 설치 이벤트 - 최소한의 캐싱만 수행
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  // 즉시 활성화
  self.skipWaiting();
});

// 활성화 이벤트 - 이전 캐시 정리
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName.startsWith('minhominah-') && cacheName !== CACHE_NAME;
          })
          .map((cacheName) => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// fetch 이벤트 - Network First 전략만 사용
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 외부 도메인, 확장 프로그램, UUID 패턴은 무시
  if (!url.origin.includes(self.location.origin) || 
      url.pathname.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i) ||
      url.protocol === 'chrome-extension:') {
    return;
  }

  // POST, PUT 등은 캐싱하지 않음
  if (request.method !== 'GET') {
    return;
  }

  // API 요청은 캐싱하지 않음
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase')) {
    return;
  }

  // 개발 환경 파일은 캐싱하지 않음
  if (url.pathname.includes('/@vite') || 
      url.pathname.includes('node_modules') ||
      url.pathname.includes('.hot-update')) {
    return;
  }

  // Network First 전략 - 네트워크 우선, 실패 시에만 캐시
  event.respondWith(
    fetch(request)
      .then((response) => {
        // 성공적인 응답만 캐싱
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // 이미지와 폰트만 캐싱
        const shouldCache = url.pathname.match(/\.(png|jpg|jpeg|gif|svg|woff|woff2|ttf|otf)$/i);
        
        if (shouldCache) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }

        return response;
      })
      .catch(() => {
        // 네트워크 실패 시 캐시에서 찾기
        return caches.match(request).then((response) => {
          if (response) {
            return response;
          }
          
          // 오프라인 페이지 반환 (HTML 요청인 경우)
          if (request.destination === 'document') {
            return caches.match('/');
          }
          
          // 그 외에는 204 No Content 반환
          return new Response('', { status: 204 });
        });
      })
  );
});

// 메시지 처리 - 캐시 정리 명령
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            return caches.delete(cacheName);
          })
        );
      })
    );
  }
});