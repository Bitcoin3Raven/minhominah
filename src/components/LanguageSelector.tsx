import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import type { Language } from '../locales';

interface LanguageOption {
  code: Language;
  name: string;
  flagPath: string;
}

const languages: LanguageOption[] = [
  { code: 'ko', name: '한국어', flagPath: '/assets/images/flags/ko.svg' },
  { code: 'th', name: 'ไทย', flagPath: '/assets/images/flags/th.svg' },
  { code: 'en', name: 'English', flagPath: '/assets/images/flags/en.svg' },
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
        className="flex items-center gap-2 px-3 py-1.5 rounded-md
                   hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 
                   text-sm"
        aria-label="Select language"
      >
        <img 
          src={currentLang.flagPath} 
          alt={currentLang.name}
          className="w-5 h-5 rounded-sm shadow-sm"
        />
        <span className="hidden sm:inline text-gray-700 dark:text-gray-200">
          {currentLang.code.toUpperCase()}
        </span>
        <svg 
          className={`w-3 h-3 text-gray-500 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 min-w-[120px] bg-white dark:bg-gray-800 rounded-md 
                        shadow-lg z-50 overflow-hidden animate-slideIn">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 
                         transition-colors flex items-center gap-2 text-sm
                         ${language === lang.code ? 'bg-gray-50 dark:bg-gray-700' : ''}`}
            >
              <img 
                src={lang.flagPath} 
                alt={lang.name}
                className="w-5 h-5 rounded-sm shadow-sm flex-shrink-0"
              />
              <span className="text-gray-700 dark:text-gray-200 whitespace-nowrap">{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};