import React, { useState, useRef } from 'react';
import { useLegacyStyles } from '../hooks/useLegacyStyles';
import { useLanguage } from '../contexts/LanguageContext';
import '../styles/legacy-styles.css';

const Backup: React.FC = () => {
  const styles = useLegacyStyles();
  const { t } = useLanguage();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [backupFrequency, setBackupFrequency] = useState('daily');
  const [backupTime, setBackupTime] = useState('02:00');
  const [maxBackups, setMaxBackups] = useState(5);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.json') || file.name.endsWith('.zip'))) {
      setSelectedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // 백업 처리 함수들 (실제 구현시 Supabase 연동 필요)
  const handleFullBackup = () => {
    alert(t('backup_full_download') + ' - 준비 중입니다.');
  };

  const handleMemoriesBackup = () => {
    alert(t('backup_memories_download') + ' - 준비 중입니다.');
  };

  const handleSettingsBackup = () => {
    alert(t('backup_settings_download') + ' - 준비 중입니다.');
  };

  const handleRestore = () => {
    if (!selectedFile) {
      alert(t('backup_restore_desc'));
      return;
    }
    alert(t('backup_restore_btn') + ' - 준비 중입니다.');
  };

  const handleSaveAutoBackup = () => {
    alert(t('backup_save_settings') + ' - 준비 중입니다.');
  };

  return (
    <div className="pt-32 pb-12">
      <div className="container mx-auto px-6">
        {/* 페이지 헤더 */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-4">
            {t('backup_title')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {t('backup_subtitle')}
          </p>
        </div>

        {/* 백업 옵션 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* 전체 백업 */}
          <div className={`${styles.card} rounded-2xl shadow-xl p-8 transition-all hover:shadow-2xl`}>
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-database text-3xl text-blue-500"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                {t('backup_full')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('backup_full_desc')}
              </p>
            </div>
            <button 
              onClick={handleFullBackup}
              className={`w-full py-3 ${styles.primaryButton} rounded-lg font-semibold transition-colors`}
            >
              <i className="fas fa-download mr-2"></i>{t('backup_full_download')}
            </button>
          </div>

          {/* 추억 백업 */}
          <div className={`${styles.card} rounded-2xl shadow-xl p-8 transition-all hover:shadow-2xl`}>
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-pink-100 dark:bg-pink-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-images text-3xl text-pink-500"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                {t('backup_memories')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('backup_memories_desc')}
              </p>
            </div>
            <button 
              onClick={handleMemoriesBackup}
              className="w-full py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-semibold transition-colors"
            >
              <i className="fas fa-download mr-2"></i>{t('backup_memories_download')}
            </button>
          </div>

          {/* 설정 백업 */}
          <div className={`${styles.card} rounded-2xl shadow-xl p-8 transition-all hover:shadow-2xl`}>
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-cog text-3xl text-green-500"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                {t('backup_settings')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('backup_settings_desc')}
              </p>
            </div>
            <button 
              onClick={handleSettingsBackup}
              className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors"
            >
              <i className="fas fa-download mr-2"></i>{t('backup_settings_download')}
            </button>
          </div>
        </div>

        {/* 백업 복원 */}
        <div className={`${styles.card} rounded-2xl shadow-xl p-8 mb-12`}>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
            <i className="fas fa-upload mr-3 text-purple-500"></i>{t('backup_restore')}
          </h3>
          
          <div 
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              className="hidden" 
              accept=".json,.zip"
              onChange={handleFileSelect}
            />
            <i className="fas fa-cloud-upload-alt text-5xl text-gray-400 mb-4"></i>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              {t('backup_restore_desc')}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              {t('backup_restore_formats')}
            </p>
            {selectedFile && (
              <p className="mt-4 text-sm text-blue-600 dark:text-blue-400">
                선택된 파일: {selectedFile.name}
              </p>
            )}
          </div>
          
          <button 
            onClick={handleRestore}
            className={`mt-6 px-6 py-3 ${styles.secondaryButton} rounded-lg font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed`}
            disabled={!selectedFile}
          >
            <i className="fas fa-redo mr-2"></i>{t('backup_restore_btn')}
          </button>
        </div>

        {/* 자동 백업 설정 */}
        <div className={`${styles.card} rounded-2xl shadow-xl p-8`}>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
            <i className="fas fa-clock mr-3 text-orange-500"></i>{t('backup_auto')}
          </h3>
          
          <div className="space-y-4">
            <label className="flex items-center">
              <input 
                type="checkbox" 
                checked={autoBackupEnabled}
                onChange={(e) => setAutoBackupEnabled(e.target.checked)}
                className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500"
              />
              <span className="ml-3 text-gray-700 dark:text-gray-300">
                {t('backup_auto_enable')}
              </span>
            </label>
            
            {autoBackupEnabled && (
              <div className="ml-8 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('backup_frequency')}
                  </label>
                  <select 
                    value={backupFrequency}
                    onChange={(e) => setBackupFrequency(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="daily">{t('backup_daily')}</option>
                    <option value="weekly">{t('backup_weekly')}</option>
                    <option value="monthly">{t('backup_monthly')}</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('backup_time')}
                  </label>
                  <input 
                    type="time" 
                    value={backupTime}
                    onChange={(e) => setBackupTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('backup_max_count')}
                  </label>
                  <input 
                    type="number" 
                    value={maxBackups}
                    onChange={(e) => setMaxBackups(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min="1" 
                    max="10"
                  />
                </div>
              </div>
            )}
            
            <button 
              onClick={handleSaveAutoBackup}
              className="mt-4 px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors"
            >
              <i className="fas fa-save mr-2"></i>{t('backup_save_settings')}
            </button>
          </div>
        </div>

        {/* 백업 기록 */}
        <div className="mt-12">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
            <i className="fas fa-history mr-3 text-indigo-500"></i>{t('backup_history')}
          </h3>
          
          <div className="space-y-4">
            {/* 백업 기록이 여기에 동적으로 표시됩니다 */}
            <div className={`${styles.card} p-4 rounded-lg`}>
              <p className="text-gray-500 dark:text-gray-400 text-center">
                아직 백업 기록이 없습니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Backup;
