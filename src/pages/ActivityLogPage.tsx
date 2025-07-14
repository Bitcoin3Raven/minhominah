import { useState } from 'react';
import { FiActivity, FiFilter, FiDownload } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

const ActivityLogPage = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [filter, setFilter] = useState('all');

  const getActionIcon = (action: string) => {
    const icons = {
      create: '➕',
      update: '✏️',
      delete: '🗑️',
      restore: '♻️',
      share: '🔗',
      download: '⬇️',
    };
    return icons[action] || '📝';
  };

  const getActionColor = (action: string) => {
    const colors = {
      create: 'text-green-600',
      update: 'text-blue-600',
      delete: 'text-red-600',
      restore: 'text-yellow-600',
      share: 'text-purple-600',
      download: 'text-gray-600',
    };
    return colors[action] || 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">활동 로그</h1>
        <div className="flex items-center space-x-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">모든 활동</option>
            <option value="create">생성</option>
            <option value="update">수정</option>
            <option value="delete">삭제</option>
            <option value="share">공유</option>
          </select>
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <FiDownload className="w-5 h-5" />
            <span>내보내기</span>
          </button>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-20">
          <FiActivity className="w-24 h-24 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
            활동 기록이 없습니다
          </h2>
          <p className="text-gray-500 dark:text-gray-500">
            추억을 추가하거나 수정하면 여기에 기록됩니다.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {activities.map((activity) => (
              <div key={activity.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-start space-x-4">
                  <div className={`text-2xl ${getActionColor(activity.action)}`}>
                    {getActionIcon(activity.action)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.resourceTitle}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(activity.createdAt).toLocaleString('ko-KR')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {activity.action === 'create' && '새로운 추억을 추가했습니다'}
                      {activity.action === 'update' && '추억을 수정했습니다'}
                      {activity.action === 'delete' && '추억을 삭제했습니다'}
                      {activity.action === 'restore' && '추억을 복원했습니다'}
                      {activity.action === 'share' && '추억을 공유했습니다'}
                      {activity.action === 'download' && '추억을 다운로드했습니다'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLogPage;