import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

// 개발 환경에서만 Supabase 연결 테스트
if (import.meta.env.DEV) {
  import('./lib/supabase-test');
}

// Service Worker 등록 (최소한의 기능만 활성화)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    try {
      // 기존 Service Worker 정리
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
      
      // 모든 캐시 삭제
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      
      // 새로운 Service Worker 등록
      const registration = await navigator.serviceWorker.register('/sw.js', {
        updateViaCache: 'none'
      });
      
      console.log('Service Worker registered with minimal caching');
      
      // 주기적으로 업데이트 체크 (1시간마다)
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);
      
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
