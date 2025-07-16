import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { DarkModeProvider } from './contexts/DarkModeContext';

// Lazy load pages for code splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const MemoriesPage = lazy(() => import('./pages/MemoriesPage'));
const MemoryDetailPage = lazy(() => import('./pages/MemoryDetailPage'));
const UploadPage = lazy(() => import('./pages/UploadPage'));
const AlbumsPage = lazy(() => import('./pages/AlbumsPage'));
const AlbumDetailPage = lazy(() => import('./pages/AlbumDetailPage'));
const StatisticsPage = lazy(() => import('./pages/StatisticsPage'));
const ActivityLogPage = lazy(() => import('./pages/ActivityLogPage'));
const TrashPage = lazy(() => import('./pages/TrashPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const InvitePage = lazy(() => import('./pages/InvitePage'));
const AcceptInvitePage = lazy(() => import('./pages/AcceptInvitePage'));
const GrowthPage = lazy(() => import('./pages/GrowthPage'));
const PhotobookCreatorPage = lazy(() => import('./pages/PhotobookCreatorPage'));
const BackupPage = lazy(() => import('./pages/Backup'));

// Loading component
const PageLoader = () => (
  <div className="flex justify-center items-center min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10분 (기존 5분에서 연장)
      gcTime: 30 * 60 * 1000, // 30분 (기존 10분에서 연장)
      refetchOnWindowFocus: false,
      retry: 3, // 실패 시 3번 재시도
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // 지수 백오프
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <LanguageProvider>
          <DarkModeProvider>
            <AuthProvider>
              <Layout>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/accept-invite" element={<AcceptInvitePage />} />
                  <Route path="/memories" element={
                    <PrivateRoute>
                      <MemoriesPage />
                    </PrivateRoute>
                  } />
                  <Route path="/memories/:id" element={
                    <PrivateRoute>
                      <MemoryDetailPage />
                    </PrivateRoute>
                  } />
                  <Route path="/upload" element={
                    <PrivateRoute>
                      <UploadPage />
                    </PrivateRoute>
                  } />
                  <Route path="/albums" element={
                    <PrivateRoute>
                      <AlbumsPage />
                    </PrivateRoute>
                  } />
                  <Route path="/albums/:id" element={
                    <PrivateRoute>
                      <AlbumDetailPage />
                    </PrivateRoute>
                  } />
                  <Route path="/statistics" element={
                    <PrivateRoute>
                      <StatisticsPage />
                    </PrivateRoute>
                  } />
                  <Route path="/activity-log" element={
                    <PrivateRoute>
                      <ActivityLogPage />
                    </PrivateRoute>
                  } />
                  <Route path="/trash" element={
                    <PrivateRoute>
                      <TrashPage />
                    </PrivateRoute>
                  } />
                  <Route path="/profile" element={
                    <PrivateRoute>
                      <ProfilePage />
                    </PrivateRoute>
                  } />
                  <Route path="/admin" element={
                    <PrivateRoute>
                      <AdminPage />
                    </PrivateRoute>
                  } />
                  <Route path="/invite" element={
                    <PrivateRoute>
                      <InvitePage />
                    </PrivateRoute>
                  } />
                  <Route path="/growth" element={
                    <GrowthPage />
                  } />
                  <Route path="/photobook-creator" element={
                    <PrivateRoute>
                      <PhotobookCreatorPage />
                    </PrivateRoute>
                  } />
                  <Route path="/backup" element={
                    <PrivateRoute>
                      <BackupPage />
                    </PrivateRoute>
                  } />
                </Routes>
              </Suspense>
            </Layout>
          </AuthProvider>
        </DarkModeProvider>
      </LanguageProvider>
      </Router>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
