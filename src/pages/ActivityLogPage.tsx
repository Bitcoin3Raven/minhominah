import { useState } from 'react';
import { FiActivity, FiFilter } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const ActivityLogPage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
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
    <div className="space-y-6 pt-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('activityLog.title')}</h1>
        <div className="flex items-center">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">{t('activityLog.allActivities')}</option>
            <option value="create">{t('activityLog.create')}</option>
            <option value="update">{t('activityLog.update')}</option>
            <option value="delete">{t('activityLog.delete')}</option>
            <option value="share">{t('activityLog.share')}</option>
          </select>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-20">
          <FiActivity className="w-24 h-24 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
            {t('activityLog.noActivities')}
          </h2>
          <p className="text-gray-500 dark:text-gray-500">
            {t('activityLog.noActivitiesDesc')}
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
                      {activity.action === 'create' && t('activityLog.action_create')}
                      {activity.action === 'update' && t('activityLog.action_update')}
                      {activity.action === 'delete' && t('activityLog.action_delete')}
                      {activity.action === 'restore' && t('activityLog.action_restore')}
                      {activity.action === 'share' && t('activityLog.action_share')}
                      {activity.action === 'download' && t('activityLog.action_download')}
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