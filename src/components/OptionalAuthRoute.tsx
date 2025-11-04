import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface OptionalAuthRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean; // true면 로그인 필수, false면 선택적
  fallbackPath?: string; // 로그인 필요시 리다이렉트할 경로
}

/**
 * 선택적 인증 라우트 컴포넌트
 * - requireAuth가 false면 로그인 없이도 접근 가능
 * - requireAuth가 true면 기존 PrivateRoute와 동일하게 동작
 * - 공개 콘텐츠와 비공개 콘텐츠를 같은 페이지에서 처리 가능
 */
const OptionalAuthRoute: React.FC<OptionalAuthRouteProps> = ({
  children,
  requireAuth = false,
  fallbackPath = '/login'
}) => {
  const { user, loading } = useAuth();

  // 인증 상태 확인 중
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 인증이 필수인데 로그인하지 않은 경우
  if (requireAuth && !user) {
    return <Navigate to={fallbackPath} replace />;
  }

  // 인증이 선택적이거나, 인증이 완료된 경우
  return <>{children}</>;
};

export default OptionalAuthRoute;