import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { useLegacyStyles } from '../hooks/useLegacyStyles';
import { usePhotobookCreator } from '../hooks/usePhotobookCreator';
import { useTranslation } from '../hooks/useTranslation';

const PhotobookCreatorPage: React.FC = () => {
  const styles = useLegacyStyles();
  const { t } = useTranslation();
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
    <Layout>
      {/* Hero Section */}
      <section className="relative -mt-16 -mx-4 px-4 overflow-hidden" style={{
        paddingTop: '120px',
        paddingBottom: '3rem',
        background: 'radial-gradient(circle at 10% 10%, rgba(255, 182, 193, 0.8) 0%, rgba(255, 192, 203, 0.5) 25%, transparent 50%), radial-gradient(circle at 90% 90%, rgba(135, 206, 235, 0.8) 0%, rgba(135, 206, 235, 0.5) 25%, transparent 50%), linear-gradient(135deg, #ffe0e6 0%, #fff5f7 50%, #e6f3ff 100%)'
      }}>
        <div className="container mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            <span className="bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent">
              {t('photobook_title')}
            </span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-600 max-w-2xl mx-auto"
          >
            {t('photobook_subtitle')}
          </motion.p>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Settings Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8"
        >
          <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
            <i className="fas fa-cog mr-2 text-blue-500"></i>
            {t('photobook_settings')}
          </h2>

          {/* Template Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
              {t('template_selection')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  <div className="border-2 border-gray-300 peer-checked:border-blue-500 rounded-lg p-4 transition hover:shadow-lg">
                    <div className={`w-full h-32 rounded-lg mb-3 ${templateStyles[tmpl as keyof typeof templateStyles]}`}></div>
                    <p className="text-center font-medium text-gray-800 dark:text-white">
                      {t(`photobook_template_${tmpl}`)}
                    </p>
                    <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                      {t(`photobook_template_${tmpl}_desc`)}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Period Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
              {t('period_to_include')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-600 dark:text-gray-400">
                  {t('start_date')}
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-600 dark:text-gray-400">
                  {t('end_date')}
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
              {t('options')}
            </h3>
            <div className="space-y-3">
              {[
                { id: 'includeTitle', label: 'include_cover_page', state: includeTitle, setState: setIncludeTitle },
                { id: 'includeStats', label: 'include_stats_page', state: includeStats, setState: setIncludeStats },
                { id: 'includeIndex', label: 'include_index_page', state: includeIndex, setState: setIncludeIndex },
                { id: 'includeTimeline', label: 'include_timeline', state: includeTimeline, setState: setIncludeTimeline }
              ].map(({ id, label, state, setState }) => (
                <label key={id} className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={state}
                    onChange={(e) => setState(e.target.checked)}
                    className="mr-3 w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300 group-hover:text-blue-600 transition">
                    {t(label)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Person Filter */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
              {t('people_to_include')}
            </h3>
            <div className="flex flex-wrap gap-3">
              {[
                { value: 'all', label: 'all' },
                { value: 'minho', label: 'minho_only' },
                { value: 'mina', label: 'mina_only' },
                { value: 'both', label: 'minho_mina_together' }
              ].map(({ value, label }) => (
                <label key={value} className="inline-flex items-center cursor-pointer whitespace-nowrap">
                  <input
                    type="radio"
                    name="personFilter"
                    value={value}
                    checked={personFilter === value}
                    onChange={(e) => setPersonFilter(e.target.value)}
                    className="mr-2 text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">{t(label)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <button
              onClick={handlePreview}
              className="px-8 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg font-semibold hover:shadow-lg transition flex items-center gap-2"
            >
              <i className="fas fa-eye"></i>
              {t('preview')}
            </button>
            <button
              onClick={handleGenerate}
              className="px-8 py-3 bg-gradient-to-r from-pink-500 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg transition flex items-center gap-2"
            >
              <i className="fas fa-download"></i>
              {t('generate_photobook')}
            </button>
          </div>
        </motion.div>

        {/* Preview Section */}
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8"
          >
            <h3 className="text-xl font-bold mb-6 text-gray-800 dark:text-white">
              <i className="fas fa-book-open mr-2 text-purple-500"></i>
              {t('photobook_preview')}
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
                  className="text-blue-500"
                  strokeDasharray={226}
                  strokeDashoffset={226 - (226 * progress) / 100}
                  style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-semibold">{progress}%</span>
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2">{t('creating_photobook')}</h3>
            <p className="text-gray-600 dark:text-gray-400">{t('preparing')}</p>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default PhotobookCreatorPage;
