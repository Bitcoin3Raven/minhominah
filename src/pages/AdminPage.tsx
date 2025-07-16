import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUsers, FiShield, FiActivity, FiTrash2, FiEdit2, FiMail, FiTag, FiUserPlus } from 'react-icons/fi';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { ko, enUS, th } from 'date-fns/locale';

interface Profile {
  id: string;
  username: string;
  full_name: string;
  role: 'parent' | 'family' | 'viewer';
  created_at: string;
  updated_at: string;
  email?: string;
}

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: any;
  created_at: string;
  profiles: {
    username: string;
    full_name: string;
  };
}

const AdminPage = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState<'users' | 'activity' | 'tags' | 'people'>('users');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [editProfileModal, setEditProfileModal] = useState<{
    isOpen: boolean;
    userId: string | null;
    username: string;
    fullName: string;
    email: string;
  }>({
    isOpen: false,
    userId: null,
    username: '',
    fullName: '',
    email: ''
  });

  // 현재 사용자의 프로필 확인 (parent 역할인지)
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
      return data as Profile;
    },
    enabled: !!user,
  });

  // 모든 사용자 목록 가져오기 (이메일 포함)
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      try {
        // RPC 함수 사용 가능한지 시도
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('get_users_with_email');
        
        if (!rpcError && rpcData) {
          return rpcData as (Profile & { email: string })[];
        }
      } catch (e) {
        console.log('RPC function not available, using fallback');
      }
      
      // RPC 함수가 없으면 기존 방식 사용
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (profilesError) throw profilesError;
      
      return profiles as Profile[];
    },
    enabled: currentUserProfile?.role === 'parent',
  });

  // 최근 활동 로그 가져오기
  const { data: activities, isLoading: isLoadingActivities } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: async () => {
      try {
        // 먼저 activity_logs 가져오기
        const { data: logs, error: logsError } = await supabase
          .from('activity_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (logsError) throw logsError;
        
        // 각 로그의 사용자 정보 가져오기
        const logsWithProfiles = await Promise.all(
          (logs || []).map(async (log) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('username, full_name')
              .eq('id', log.user_id)
              .single();
            
            return {
              ...log,
              profiles: profile || { username: null, full_name: null }
            };
          })
        );
        
        return logsWithProfiles as ActivityLog[];
      } catch (error) {
        console.error('Activity logs error:', error);
        return [];
      }
    },
    enabled: currentUserProfile?.role === 'parent',
  });

  // 사용자 역할 업데이트
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      const { error } = await supabase.rpc('update_user_role', {
        user_id: userId,
        new_role: newRole,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast.success(t('admin.roleUpdated'));
      setEditingUserId(null);
      setSelectedRole('');
    },
    onError: (error: any) => {
      toast.error(error.message || t('admin.roleUpdateFailed'));
    },
  });

  // 프로필 정보 업데이트
  const updateProfileMutation = useMutation({
    mutationFn: async ({ userId, username, fullName }: { 
      userId: string; 
      username: string; 
      fullName: string;
    }) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: username || null,
          full_name: fullName || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast.success(t('admin.profileModal.updated'));
      setEditProfileModal({
        isOpen: false,
        userId: null,
        username: '',
        fullName: '',
        email: ''
      });
    },
    onError: (error: any) => {
      toast.error(error.message || t('admin.profileModal.updateFailed'));
    },
  });

  // 태그 목록 가져오기 (메모리 사용 개수 포함)
  const { data: tags, isLoading: isLoadingTags, refetch: refetchTags } = useQuery({
    queryKey: ['admin-tags'],
    queryFn: async () => {
      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select('*')
        .order('name');
      
      if (tagsError) throw tagsError;
      
      // 각 태그의 사용 개수 조회
      const tagsWithCount = await Promise.all(
        tagsData.map(async (tag) => {
          const { count } = await supabase
            .from('memory_tags')
            .select('*', { count: 'exact', head: true })
            .eq('tag_id', tag.id);
          
          return { ...tag, usageCount: count || 0 };
        })
      );
      
      return tagsWithCount;
    },
    enabled: currentUserProfile?.role === 'parent',
  });

  // 인물 목록 가져오기 (메모리 사용 개수 포함)
  const { data: people, isLoading: isLoadingPeople, refetch: refetchPeople } = useQuery({
    queryKey: ['admin-people'],
    queryFn: async () => {
      const { data: peopleData, error: peopleError } = await supabase
        .from('people')
        .select('*')
        .order('name');
      
      if (peopleError) throw peopleError;
      
      // 각 인물의 사용 개수 조회
      const peopleWithCount = await Promise.all(
        peopleData.map(async (person) => {
          const { count } = await supabase
            .from('memory_people')
            .select('*', { count: 'exact', head: true })
            .eq('person_id', person.id);
          
          return { ...person, usageCount: count || 0 };
        })
      );
      
      return peopleWithCount;
    },
    enabled: currentUserProfile?.role === 'parent',
  });

  // 태그 삭제
  const deleteTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tags'] });
      toast.success(t('admin.tags.deleted'));
    },
    onError: (error: any) => {
      toast.error(error.message || t('admin.tags.deleteFailed'));
    },
  });

  // 인물 삭제
  const deletePersonMutation = useMutation({
    mutationFn: async (personId: string) => {
      const { error } = await supabase
        .from('people')
        .delete()
        .eq('id', personId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-people'] });
      toast.success(t('admin.people.deleted'));
    },
    onError: (error: any) => {
      toast.error(error.message || t('admin.people.deleteFailed'));
    },
  });

  // 권한 체크
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
        <FiShield className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('admin.accessDenied')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t('admin.accessDeniedDesc')}
        </p>
      </div>
    );
  }

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
        return t('admin.roleBadge.parent');
      case 'family':
        return t('admin.roleBadge.family');
      case 'viewer':
        return t('admin.roleBadge.viewer');
      default:
        return role;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'created':
        return t('admin.activity.created');
      case 'updated':
        return t('admin.activity.updated');
      case 'deleted':
        return t('admin.activity.deleted');
      default:
        return action;
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('admin.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t('admin.subtitle')}
        </p>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setSelectedTab('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              selectedTab === 'users'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <FiUsers className="inline-block w-5 h-5 mr-2" />
            {t('admin.userManagement')}
          </button>
          <button
            onClick={() => setSelectedTab('activity')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              selectedTab === 'activity'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <FiActivity className="inline-block w-5 h-5 mr-2" />
            {t('admin.activityLog')}
          </button>
          <button
            onClick={() => setSelectedTab('tags')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              selectedTab === 'tags'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <FiTag className="inline-block w-5 h-5 mr-2" />
            {t('admin.tagManagement')}
          </button>
          <button
            onClick={() => setSelectedTab('people')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              selectedTab === 'people'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <FiUserPlus className="inline-block w-5 h-5 mr-2" />
            {t('admin.peopleManagement')}
          </button>
        </nav>
      </div>

      {/* 사용자 관리 탭 */}
      {selectedTab === 'users' && (
        <div>
          {isLoadingUsers ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('admin.user')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('admin.email')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('admin.role')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('admin.joinedDate')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('admin.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {users?.map((user) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.full_name || t('admin.notSet')}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            @{user.username || t('admin.notSet')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {user.email || t('admin.notSet')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingUserId === user.id ? (
                          <select
                            value={selectedRole || user.role}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                          >
                            <option value="viewer">{t('admin.roleBadge.viewer')}</option>
                            <option value="family">{t('admin.roleBadge.family')}</option>
                            <option value="parent">{t('admin.roleBadge.parent')}</option>
                          </select>
                        ) : (
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                            {getRoleLabel(user.role)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(user.created_at), 'yyyy-MM-dd', { 
                          locale: language === 'ko' ? ko : language === 'th' ? th : enUS 
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {editingUserId === user.id ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                updateRoleMutation.mutate({
                                  userId: user.id,
                                  newRole: selectedRole || user.role,
                                });
                              }}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            >
                              {t('admin.profileModal.save')}
                            </button>
                            <button
                              onClick={() => {
                                setEditingUserId(null);
                                setSelectedRole('');
                              }}
                              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                            >
                              {t('admin.profileModal.cancel')}
                            </button>
                          </div>
                        ) : (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setEditProfileModal({
                                  isOpen: true,
                                  userId: user.id,
                                  username: user.username || '',
                                  fullName: user.full_name || '',
                                  email: user.email || ''
                                });
                              }}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                              title={t('admin.profileModal.title')}
                            >
                              <FiMail className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingUserId(user.id);
                                setSelectedRole(user.role);
                              }}
                              disabled={user.id === currentUserProfile.id}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed"
                              title={t('admin.updateRole')}
                            >
                              <FiEdit2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 활동 로그 탭 */}
      {selectedTab === 'activity' && (
        <div>
          {isLoadingActivities ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {activities && activities.length > 0 ? (
                activities.map((activity) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {activity.profiles?.full_name || activity.profiles?.username}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {getActionLabel(activity.action)}
                        </span>
                        <span className="text-gray-700 dark:text-gray-300">
                          {activity.entity_type === 'memory' ? t('memories.title') : activity.entity_type}
                        </span>
                        {activity.details?.title && (
                          <span className="text-gray-600 dark:text-gray-400">
                            "{activity.details.title}"
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(activity.created_at), 
                          language === 'ko' ? 'yyyy년 MM월 dd일 HH:mm' : 'MMM dd, yyyy HH:mm', 
                          { locale: language === 'ko' ? ko : language === 'th' ? th : enUS }
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
                ))
              ) : (
                <div className="text-center py-12">
                  <FiActivity className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {t('admin.activity.noData')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* 태그 관리 탭 */}
      {selectedTab === 'tags' && (
        <div>
          {isLoadingTags ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('admin.tags.name')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('admin.tags.usageCount')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('admin.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {tags?.map((tag) => (
                    <motion.tr
                      key={tag.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiTag className="w-4 h-4 mr-2 text-purple-500" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            #{tag.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {tag.usageCount} {t('admin.tags.memories')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            if (tag.usageCount > 0) {
                              if (window.confirm(t('admin.tags.deleteConfirmWithUsage').replace('{count}', tag.usageCount.toString()))) {
                                deleteTagMutation.mutate(tag.id);
                              }
                            } else {
                              if (window.confirm(t('admin.tags.deleteConfirm'))) {
                                deleteTagMutation.mutate(tag.id);
                              }
                            }
                          }}
                          disabled={deleteTagMutation.isPending}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 인물 관리 탭 */}
      {selectedTab === 'people' && (
        <div>
          {isLoadingPeople ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('admin.people.name')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('admin.people.usageCount')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('admin.people.birthdate')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('admin.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {people?.map((person) => (
                    <motion.tr
                      key={person.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiUserPlus className="w-4 h-4 mr-2 text-blue-500" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {person.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {person.usageCount} {t('admin.people.memories')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {person.birthdate ? format(new Date(person.birthdate), 'yyyy-MM-dd') : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            if (person.usageCount > 0) {
                              if (window.confirm(t('admin.people.deleteConfirmWithUsage').replace('{count}', person.usageCount.toString()))) {
                                deletePersonMutation.mutate(person.id);
                              }
                            } else {
                              if (window.confirm(t('admin.people.deleteConfirm'))) {
                                deletePersonMutation.mutate(person.id);
                              }
                            }
                          }}
                          disabled={deletePersonMutation.isPending}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      {/* 프로필 편집 모달 */}
      <AnimatePresence>
        {editProfileModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setEditProfileModal({ isOpen: false, userId: null, username: '', fullName: '', email: '' })}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('admin.profileModal.title')}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('admin.profileModal.email')}
                  </label>
                  <input
                    type="email"
                    value={editProfileModal.email}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {language === 'ko' ? '이메일은 변경할 수 없습니다.' : language === 'th' ? 'ไม่สามารถเปลี่ยนอีเมลได้' : 'Email cannot be changed.'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('admin.profileModal.fullName')}
                  </label>
                  <input
                    type="text"
                    value={editProfileModal.fullName}
                    onChange={(e) => setEditProfileModal({ ...editProfileModal, fullName: e.target.value })}
                    placeholder={language === 'ko' ? '이름을 입력하세요' : language === 'th' ? 'กรอกชื่อ' : 'Enter full name'}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('admin.profileModal.username')}
                  </label>
                  <input
                    type="text"
                    value={editProfileModal.username}
                    onChange={(e) => setEditProfileModal({ ...editProfileModal, username: e.target.value })}
                    placeholder={language === 'ko' ? '사용자명을 입력하세요' : language === 'th' ? 'กรอกชื่อผู้ใช้' : 'Enter username'}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {language === 'ko' ? '@username 형식으로 표시됩니다.' : language === 'th' ? 'จะแสดงในรูปแบบ @username' : 'Will be displayed as @username.'}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setEditProfileModal({ isOpen: false, userId: null, username: '', fullName: '', email: '' })}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  {t('admin.profileModal.cancel')}
                </button>
                <button
                  onClick={() => {
                    if (editProfileModal.userId) {
                      updateProfileMutation.mutate({
                        userId: editProfileModal.userId,
                        username: editProfileModal.username,
                        fullName: editProfileModal.fullName
                      });
                    }
                  }}
                  disabled={updateProfileMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateProfileMutation.isPending ? t('admin.profileModal.saving') : t('admin.profileModal.save')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPage;