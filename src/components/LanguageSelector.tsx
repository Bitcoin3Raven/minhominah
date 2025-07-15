import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import type { Language } from '../locales';

interface LanguageOption {
  code: Language;
  name: string;
  flag: string;
}

const languages: LanguageOption[] = [
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'th', name: 'ไทย', flag: '🇹🇭' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
];

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = languages.find(lang => lang.code === language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-700 
                   hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 
                   text-sm border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow
                   font-medium"
      >
        <span className="text-lg">{currentLang.flag}</span>
        <span className="hidden sm:inline text-gray-700 dark:text-gray-200">
          {currentLang.name}
        </span>
        <svg 
          className={`w-4 h-4 text-gray-400 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-700 rounded-lg 
                        shadow-lg border border-gray-200 dark:border-gray-600 z-50 
                        overflow-hidden py-1 animate-slideIn">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 
                         transition-colors flex items-center gap-3 text-sm
                         ${language === lang.code ? 'bg-gray-100 dark:bg-gray-600 font-semibold' : ''}`}
            >
              <span className="text-lg">{lang.flag}</span>
              <span className="text-gray-700 dark:text-gray-200">{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};