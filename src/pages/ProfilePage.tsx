import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { FiUser, FiMail, FiShield, FiEdit2, FiSave, FiX } from 'react-icons/fi';
import { motion } from 'framer-motion';

interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  role: 'parent' | 'family' | 'viewer';
  created_at: string;
  updated_at: string;
}

const ProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // 편집 폼 상태
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setFormData({
        username: data.username || '',
        full_name: data.full_name || '',
      });
    } catch (err: any) {
      console.error('Error loading profile:', err);
      setError('프로필을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: formData.username || null,
          full_name: formData.full_name || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user!.id);

      if (error) throw error;

      setSuccess('프로필이 업데이트되었습니다.');
      setEditing(false);
      await loadProfile();
    } catch (err: any) {
      setError('프로필 업데이트 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const badges = {
      parent: { bg: 'bg-purple-100 dark:bg-purple-900', text: 'text-purple-700 dark:text-purple-300', label: '부모' },
      family: { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-700 dark:text-blue-300', label: '가족' },
      viewer: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300', label: '방문자' },
    };

    const badge = badges[role as keyof typeof badges] || badges.viewer;

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
        <FiShield className="inline-block w-4 h-4 mr-1" />
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg p-4">
          프로필을 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">내 프로필</h1>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg"
        >
          {error}
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg"
        >
          {success}
        </motion.div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        {/* 기본 정보 섹션 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">기본 정보</h2>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              >
                <FiEdit2 className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="space-y-4">
            {/* 이메일 (수정 불가) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <FiMail className="inline-block w-4 h-4 mr-1" />
                이메일
              </label>
              <p className="text-gray-900 dark:text-white">{user?.email}</p>
            </div>

            {/* 사용자명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <FiUser className="inline-block w-4 h-4 mr-1" />
                사용자명
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="사용자명 입력"
                />
              ) : (
                <p className="text-gray-900 dark:text-white">
                  {profile.username || '설정되지 않음'}
                </p>
              )}
            </div>

            {/* 이름 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                이름
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="이름 입력"
                />
              ) : (
                <p className="text-gray-900 dark:text-white">
                  {profile.full_name || '설정되지 않음'}
                </p>
              )}
            </div>

            {/* 역할 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                역할
              </label>
              <div className="mt-1">
                {getRoleBadge(profile.role)}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {profile.role === 'parent' && '모든 기능에 접근할 수 있습니다.'}
                {profile.role === 'family' && '추억을 보고 댓글을 달 수 있습니다.'}
                {profile.role === 'viewer' && '추억을 볼 수만 있습니다.'}
              </p>
            </div>
          </div>

          {/* 편집 버튼 */}
          {editing && (
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setEditing(false);
                  setFormData({
                    username: profile.username || '',
                    full_name: profile.full_name || '',
                  });
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FiX className="inline-block w-4 h-4 mr-1" />
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiSave className="inline-block w-4 h-4 mr-1" />
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          )}
        </div>

        {/* 계정 정보 */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">계정 정보</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            가입일: {new Date(profile.created_at).toLocaleDateString('ko-KR')}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            마지막 수정: {new Date(profile.updated_at).toLocaleDateString('ko-KR')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
