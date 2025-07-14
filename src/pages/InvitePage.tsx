import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiMail, FiSend, FiCopy, FiCheck, FiClock, FiUser, FiTrash2 } from 'react-icons/fi';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Invitation {
  id: string;
  email: string;
  role: 'parent' | 'family' | 'viewer';
  invited_by: string;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

const InvitePage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'family' | 'viewer'>('family');
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // 현재 사용자의 프로필 확인
  const { data: currentUserProfile, isLoading: isCheckingRole } = useQuery({
    queryKey: ['current-user-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // 초대 목록 가져오기
  const { data: invitations, isLoading: isLoadingInvitations } = useQuery({
    queryKey: ['invitations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Invitation[];
    },
    enabled: currentUserProfile?.role === 'parent',
  });

  // 초대 생성
  const createInvitationMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('create_invitation', {
        p_email: email,
        p_role: role,
        p_expires_in_days: expiresInDays,
      });
      
      if (error) throw error;
      return data[0];
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      toast.success('초대장이 생성되었습니다.');
      setEmail('');
      
      // 초대 링크 복사
      const inviteUrl = `${window.location.origin}/accept-invite?token=${data.invitation_token}`;
      navigator.clipboard.writeText(inviteUrl);
      setCopiedToken(data.invitation_token);
      setTimeout(() => setCopiedToken(null), 3000);
    },
    onError: (error: any) => {
      if (error.message.includes('already exists')) {
        toast.error('이미 가입했거나 유효한 초대장이 있는 이메일입니다.');
      } else {
        toast.error('초대 생성 실패: ' + error.message);
      }
    },
  });

  // 초대 삭제
  const deleteInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      toast.success('초대가 삭제되었습니다.');
    },
    onError: () => {
      toast.error('초대 삭제 실패');
    },
  });

  const copyInviteLink = (token: string) => {
    const inviteUrl = `${window.location.origin}/accept-invite?token=${token}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 3000);
    toast.success('초대 링크가 복사되었습니다.');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('이메일 주소를 입력해주세요.');
      return;
    }
    createInvitationMutation.mutate();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'parent':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'family':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'viewer':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800';
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

  if (isCheckingRole) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentUserProfile || currentUserProfile.role !== 'parent') {
    return (
      <div className="text-center py-20">
        <FiMail className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          접근 권한이 없습니다
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          이 페이지는 관리자(parent)만 접근할 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          가족 구성원 초대
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          이메일로 가족이나 친구를 초대하여 추억을 공유하세요.
        </p>
      </div>

      {/* 초대 폼 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8"
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          새 초대 만들기
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                이메일 주소
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                역할
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'family' | 'viewer')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="family">가족 (추억 추가/수정 가능)</option>
                <option value="viewer">일반 (보기만 가능)</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              유효 기간
            </label>
            <select
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={1}>1일</option>
              <option value={3}>3일</option>
              <option value={7}>7일</option>
              <option value={14}>14일</option>
              <option value={30}>30일</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={createInvitationMutation.isPending}
            className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {createInvitationMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>초대 생성 중...</span>
              </>
            ) : (
              <>
                <FiSend className="w-4 h-4" />
                <span>초대하기</span>
              </>
            )}
          </button>
        </form>
      </motion.div>

      {/* 초대 목록 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            초대 목록
          </h2>
        </div>

        {isLoadingInvitations ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : invitations && invitations.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {invitations.map((invitation) => {
              const isExpired = new Date(invitation.expires_at) < new Date();
              const isAccepted = !!invitation.accepted_at;
              
              return (
                <div
                  key={invitation.id}
                  className={`p-6 ${isExpired || isAccepted ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <FiMail className="w-5 h-5 text-gray-400" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {invitation.email}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getRoleBadgeColor(invitation.role)}`}>
                          {getRoleLabel(invitation.role)}
                        </span>
                        {isAccepted && (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            수락됨
                          </span>
                        )}
                        {isExpired && !isAccepted && (
                          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            만료됨
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <FiClock className="w-3 h-3" />
                          <span>
                            생성: {formatDistanceToNow(new Date(invitation.created_at), { addSuffix: true, locale: ko })}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FiUser className="w-3 h-3" />
                          <span>
                            만료: {format(new Date(invitation.expires_at), 'yyyy-MM-dd HH:mm', { locale: ko })}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {!isExpired && !isAccepted && (
                        <button
                          onClick={() => copyInviteLink(invitation.token)}
                          className="p-2 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900 rounded-lg transition-colors"
                          title="초대 링크 복사"
                        >
                          {copiedToken === invitation.token ? (
                            <FiCheck className="w-5 h-5" />
                          ) : (
                            <FiCopy className="w-5 h-5" />
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => deleteInvitationMutation.mutate(invitation.id)}
                        className="p-2 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900 rounded-lg transition-colors"
                        title="초대 삭제"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <FiMail className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              아직 초대한 사람이 없습니다.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default InvitePage;