import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLegacyStyles } from '../hooks/useLegacyStyles';
import { usePhotobookCreator } from '../hooks/usePhotobookCreator';
import { useLanguage } from '../contexts/LanguageContext';

const PhotobookCreatorPage: React.FC = () => {
  const styles = useLegacyStyles();
  const { t } = useLanguage();
  const { previewPDF, generatePDF, isGenerating, progress } = usePhotobookCreator();

  // State for settings
  const [template, setTemplate] = useState('classic');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [includeTitle, setIncludeTitle] = useState(true);
  const [includeStats, setIncludeStats] = useState(true);
  const [includeIndex, setIncludeIndex] = useState(false);
  const [includeTimeline, setIncludeTimeline] = useState(false);
  const [personFilter, setPersonFilter] = useState('all');
  const [showPreview, setShowPreview] = useState(false);

  // Template preview styles
  const templateStyles = {
    classic: 'bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600',
    modern: 'bg-gradient-to-br from-pink-400 via-pink-500 to-red-500',
    minimal: 'bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400'
  };

  const handlePreview = async () => {
    const settings = {
      template,
      startDate,
      endDate,
      includeTitle,
      includeStats,
      includeIndex,
      includeTimeline,
      personFilter
    };
    await previewPDF(settings);
    setShowPreview(true);
  };

  const handleGenerate = async () => {
    const settings = {
      template,
      startDate,
      endDate,
      includeTitle,
      includeStats,
      includeIndex,
      includeTimeline,
      personFilter
    };
    await generatePDF(settings);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section - Full width */}
      <section className="relative" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold mb-4 text-white"
            >
              {t('photobook.title')}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-white/90 max-w-2xl mx-auto"
            >
              {t('photobook.subtitle')}
            </motion.p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Settings Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
        >
          <h2 className="text-2xl font-bold mb-8 text-gray-800 dark:text-white">
            <i className="fas fa-cog mr-2 text-purple-500"></i>
            {t('photobook.settings')}
          </h2>

          {/* Template Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
              {t('photobook.template_selection')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['classic', 'modern', 'minimal'].map((tmpl) => (
                <label key={tmpl} className="cursor-pointer">
                  <input
                    type="radio"
                    name="template"
                    value={tmpl}
                    checked={template === tmpl}
                    onChange={(e) => setTemplate(e.target.value)}
                    className="hidden peer"
                  />
                  <div className="border-2 border-gray-200 dark:border-gray-600 peer-checked:border-purple-500 peer-checked:bg-purple-50 dark:peer-checked:bg-purple-900/20 rounded-xl p-4 transition-all hover:shadow-md">
                    <div className={`w-full h-24 rounded-lg mb-3 ${templateStyles[tmpl as keyof typeof templateStyles]}`}></div>
                    <p className="text-center font-medium text-gray-800 dark:text-white">
                      {t(`photobook.template_${tmpl}`)}
                    </p>
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                      {t(`photobook.template_${tmpl}_desc`)}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Period Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
              {t('photobook.period_to_include')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-600 dark:text-gray-400">
                  {t('photobook.start_date')}
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-600 dark:text-gray-400">
                  {t('photobook.end_date')}
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
              {t('photobook.options')}
            </h3>
            <div className="space-y-3">
              {[
                { id: 'includeTitle', label: 'photobook.include_cover_page', state: includeTitle, setState: setIncludeTitle },
                { id: 'includeStats', label: 'photobook.include_stats_page', state: includeStats, setState: setIncludeStats },
                { id: 'includeIndex', label: 'photobook.include_index_page', state: includeIndex, setState: setIncludeIndex },
                { id: 'includeTimeline', label: 'photobook.include_timeline', state: includeTimeline, setState: setIncludeTimeline }
              ].map(({ id, label, state, setState }) => (
                <label key={id} className="flex items-center cursor-pointer group p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={state}
                    onChange={(e) => setState(e.target.checked)}
                    className="mr-3 w-5 h-5 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:bg-gray-600 dark:border-gray-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {t(label)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Person Filter */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
              {t('photobook.people_to_include')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: 'all', label: 'photobook.all' },
                { value: 'minho', label: 'photobook.minho_only' },
                { value: 'mina', label: 'photobook.mina_only' },
                { value: 'both', label: 'photobook.minho_mina_together' }
              ].map(({ value, label }) => (
                <label key={value} className="relative">
                  <input
                    type="radio"
                    name="personFilter"
                    value={value}
                    checked={personFilter === value}
                    onChange={(e) => setPersonFilter(e.target.value)}
                    className="hidden peer"
                  />
                  <div className="px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-center cursor-pointer transition-all hover:border-purple-400 peer-checked:border-purple-500 peer-checked:bg-purple-50 dark:peer-checked:bg-purple-900/20">
                    <span className="text-gray-700 dark:text-gray-300">{t(label)}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 pt-4">
            <button
              onClick={handlePreview}
              className="px-8 py-3 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-700 hover:shadow-md transition-all flex items-center gap-2"
            >
              <i className="fas fa-eye"></i>
              {t('photobook.preview')}
            </button>
            <button
              onClick={handleGenerate}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 hover:shadow-md transition-all flex items-center gap-2"
            >
              <i className="fas fa-download"></i>
              {t('photobook.generate_photobook')}
            </button>
          </div>
        </motion.div>

        {/* Preview Section */}
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mt-8"
          >
            <h3 className="text-xl font-bold mb-6 text-gray-800 dark:text-white">
              <i className="fas fa-book-open mr-2 text-purple-500"></i>
              {t('photobook.photobook_preview')}
            </h3>
            <div id="previewPages" className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Preview pages will be rendered here */}
            </div>
          </motion.div>
        )}
      </div>

      {/* PDF Generation Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center min-w-[300px]">
            <div className="w-20 h-20 mx-auto mb-4 relative">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  className="text-gray-300 dark:text-gray-600"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  className="text-purple-600"
                  strokeDasharray={226}
                  strokeDashoffset={226 - (226 * progress) / 100}
                  style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-semibold">{progress}%</span>
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2">{t('photobook.creating_photobook')}</h3>
            <p className="text-gray-600 dark:text-gray-400">{t('photobook.preparing')}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotobookCreatorPage;
