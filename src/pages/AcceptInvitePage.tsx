import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { FiMail, FiCheck, FiX, FiLoader } from 'react-icons/fi';

const AcceptInvitePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<'checking' | 'valid' | 'invalid' | 'accepted' | 'error'>('checking');
  const [invitationData, setInvitationData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    checkInvitation();
  }, [token]);

  const checkInvitation = async () => {
    if (!token) {
      setStatus('invalid');
      return;
    }

    try {
      // 초대 정보 확인
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('token', token)
        .single();

      if (error || !data) {
        setStatus('invalid');
        return;
      }

      setInvitationData(data);

      // 만료 확인
      if (new Date(data.expires_at) < new Date()) {
        setStatus('invalid');
        return;
      }

      // 이미 수락됨
      if (data.accepted_at) {
        setStatus('accepted');
        return;
      }

      setStatus('valid');
    } catch (error) {
      console.error('Error checking invitation:', error);
      setStatus('error');
    }
  };

  const acceptInvitation = async () => {
    if (!user || !token) {
      toast.error('로그인이 필요합니다.');
      navigate('/login', { state: { redirect: `/accept-invite?token=${token}` } });
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.rpc('accept_invitation', {
        p_token: token,
        p_user_id: user.id,
      });

      if (error) throw error;

      toast.success('초대가 수락되었습니다!');
      navigate('/');
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      if (error.message.includes('email does not match')) {
        toast.error('초대받은 이메일과 로그인한 이메일이 다릅니다.');
      } else {
        toast.error('초대 수락 실패: ' + error.message);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'parent':
        return '관리자';
      case 'family':
        return '가족';
      case 'viewer':
        return '일반';
      default:
        return role;
    }
  };

  if (status === 'checking') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">초대 정보를 확인하는 중...</p>
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <FiX className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          유효하지 않은 초대
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          초대 링크가 만료되었거나 유효하지 않습니다.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  if (status === 'accepted') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <FiCheck className="w-16 h-16 text-green-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          이미 수락된 초대
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          이 초대는 이미 수락되었습니다.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <FiX className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          오류 발생
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          초대 정보를 확인하는 중 오류가 발생했습니다.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <FiMail className="w-16 h-16 text-blue-600 mx-auto mb-6" />
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          민호민아 성장 앨범 초대
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          <span className="font-medium">{invitationData?.email}</span>님,
          <br />
          민호민아 성장 앨범에 초대되었습니다.
        </p>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            부여될 역할
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {getRoleLabel(invitationData?.role)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {invitationData?.role === 'family' 
              ? '추억을 추가하고 수정할 수 있습니다'
              : '추억을 볼 수 있습니다'}
          </p>
        </div>

        {!user ? (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              초대를 수락하려면 로그인이 필요합니다.
            </p>
            <button
              onClick={() => navigate('/login', { state: { redirect: `/accept-invite?token=${token}` } })}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              로그인하기
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              현재 <span className="font-medium">{user.email}</span>로 로그인되어 있습니다.
            </p>
            {user.email === invitationData?.email ? (
              <button
                onClick={acceptInvitation}
                disabled={isProcessing}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <FiLoader className="w-5 h-5 animate-spin" />
                    <span>처리 중...</span>
                  </>
                ) : (
                  <>
                    <FiCheck className="w-5 h-5" />
                    <span>초대 수락하기</span>
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-red-600 dark:text-red-400">
                  초대받은 이메일과 로그인한 이메일이 다릅니다.
                </p>
                <button
                  onClick={() => {
                    supabase.auth.signOut();
                    navigate('/login', { state: { redirect: `/accept-invite?token=${token}` } });
                  }}
                  className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  다른 계정으로 로그인
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AcceptInvitePage;