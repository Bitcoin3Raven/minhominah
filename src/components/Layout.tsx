import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { FiMenu, FiX, FiSun, FiMoon, FiUser, FiUsers, FiLogOut, FiLogIn, FiHome, FiImage, FiPlusCircle, FiFolder, FiBarChart2, FiActivity, FiTrash2, FiUserPlus, FiSettings, FiTrendingUp, FiBook, FiDatabase } from 'react-icons/fi';
import { useLegacyStyles } from '../hooks/useLegacyStyles';
import PWAInstallPrompt from './PWAInstallPrompt';
import { LanguageSelector } from './LanguageSelector';
import { useLanguage } from '../contexts/LanguageContext';
import { useDarkMode } from '../contexts/DarkModeContext';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mainDropdownOpen, setMainDropdownOpen] = useState(false);
  const [familyDropdownOpen, setFamilyDropdownOpen] = useState(false);
  const legacyStyles = useLegacyStyles();

  // 전체 너비를 사용해야 하는 페이지들
  const fullWidthPages = ['/', '/growth', '/statistics'];
  const isFullWidth = fullWidthPages.includes(location.pathname);

  // 사용자 프로필 가져오기
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Profile fetch error:', error);
        // profiles 테이블이 없거나 접근 불가한 경우 기본값 반환
        return { id: user.id, role: 'viewer' };
      }
      return data;
    },
    enabled: !!user,
    retry: false, // 오류 시 재시도하지 않음
  });

  useEffect(() => {
    // 드롭다운 외부 클릭 감지
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-dropdown="main"]')) {
        setMainDropdownOpen(false);
      }
      if (!target.closest('[data-dropdown="family"]')) {
        setFamilyDropdownOpen(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // 메뉴 아이템 클릭 핸들러
  const handleMenuItemClick = (item: any, closeDropdown: () => void) => {
    // 로그인이 필요한 메뉴이고 로그인하지 않은 경우
    if (item.authRequired && !user) {
      navigate('/login');
      closeDropdown();
      return;
    }
    
    // 정상적으로 이동
    navigate(item.path);
    closeDropdown();
  };

  // 메뉴 구조 정의
  const mainMenuItems = [
    { path: '/upload', label: t('nav_add_memory'), icon: <FiPlusCircle className="w-4 h-4 text-green-500" />, authRequired: true },
    { path: '/memories', label: t('nav_memories'), icon: <FiImage className="w-4 h-4 text-blue-500" /> },
    { path: '/growth', label: t('nav_growth'), icon: <FiTrendingUp className="w-4 h-4 text-pink-500" /> },
    { path: '/statistics', label: t('nav_statistics'), icon: <FiBarChart2 className="w-4 h-4 text-purple-500" /> },
    { path: '/albums', label: t('nav_albums'), icon: <FiFolder className="w-4 h-4 text-orange-500" /> },
    { path: '/photobook-creator', label: t('nav_photobook'), icon: <FiBook className="w-4 h-4 text-indigo-500" />, authRequired: true },
  ];
  
  const familyMenuItems = [
    { path: '/activity-log', label: t('nav_activity_log'), icon: <FiActivity className="w-4 h-4 text-blue-500" /> },
    { path: '/trash', label: t('nav_trash'), icon: <FiTrash2 className="w-4 h-4 text-green-500" /> },
    { path: '/backup', label: t('nav_backup'), icon: <FiDatabase className="w-4 h-4 text-indigo-500" /> },
    { path: '/invite', label: t('nav_invite'), icon: <FiUserPlus className="w-4 h-4 text-gray-500" />, authRequired: true, roleRequired: 'parent' },
    { path: '/admin', label: t('nav_admin'), icon: <FiSettings className="w-4 h-4 text-gray-500" />, authRequired: true, roleRequired: 'parent' },
  ];

  // 필터링 함수 - 로그인 전에도 authRequired 메뉴를 보여주도록 수정
  const filterMenuItems = (items: any[]) => {
    return items.filter(item => {
      // roleRequired가 있고 사용자의 role이 맞지 않으면 숨김
      if (item.roleRequired && userProfile?.role !== item.roleRequired) return false;
      return true;
    });
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-gradient-to-b dark:from-gray-900 dark:to-background-dark transition-colors">
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-white/90 dark:from-slate-900/95 dark:to-blue-900/95 dark:bg-gradient-to-r shadow-md dark:border-b dark:border-blue-800/50">
        <div className={legacyStyles.container}>
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center hover:opacity-80 transition-opacity flex-shrink-0">
              <img 
                src="/assets/images/logo.png" 
                alt="민호민아닷컴" 
                className="h-10 w-auto"
              />
            </Link>
            
            {/* 데스크톱 네비게이션 */}
            <nav className="hidden md:flex items-center space-x-4">
              {/* 홈 링크 */}
              <Link
                to="/"
                className={`nav-item flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors hover:text-gray-900 dark:hover:text-white ${
                  location.pathname === '/'
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                <FiHome className="w-4 h-4" />
                <span>{t('nav_home')}</span>
              </Link>
              
              {/* 주요 메뉴 드롭다운 */}
              <div className="relative" data-dropdown="main">
                <button
                  onClick={() => setMainDropdownOpen(!mainDropdownOpen)}
                  className="nav-item flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <FiFolder className="w-4 h-4" />
                  <span>{t('nav_main_menu')}</span>
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                <AnimatePresence>
                  {mainDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 mt-2 w-48 bg-white dark:from-slate-800/95 dark:to-blue-900/95 dark:bg-gradient-to-br rounded-lg shadow-lg border border-gray-200 dark:border-blue-700 dark:shadow-xl z-50"
                    >
                      {filterMenuItems(mainMenuItems).map((item) => (
                        <button
                          key={item.path}
                          onClick={() => handleMenuItemClick(item, () => setMainDropdownOpen(false))}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-blue-800/50 transition-colors first:rounded-t-lg last:rounded-b-lg text-left"
                        >
                          {item.icon}
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* 가족 메뉴 드롭다운 */}
              <div className="relative" data-dropdown="family">
                <button
                  onClick={() => setFamilyDropdownOpen(!familyDropdownOpen)}
                  className="nav-item flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <FiUsers className="w-4 h-4" />
                  <span>{t('nav_family')}</span>
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                <AnimatePresence>
                  {familyDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 mt-2 w-48 bg-white dark:from-slate-800/95 dark:to-blue-900/95 dark:bg-gradient-to-br rounded-lg shadow-lg border border-gray-200 dark:border-blue-700 dark:shadow-xl z-50"
                    >
                      {filterMenuItems(familyMenuItems).map((item) => (
                        <button
                          key={item.path}
                          onClick={() => handleMenuItemClick(item, () => setFamilyDropdownOpen(false))}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-blue-800/50 transition-colors first:rounded-t-lg last:rounded-b-lg text-left"
                        >
                          {item.icon}
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>
            
            {/* 오른쪽 메뉴 */}
            <div className="flex items-center gap-3 flex-shrink min-w-0">
              {/* 언어 선택기 */}
              <LanguageSelector />
              
              {/* 다크모드 토글 */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  <FiSun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <FiMoon className="w-5 h-5 text-gray-600" />
                )}
              </button>
              
              {/* 사용자 메뉴 */}
              {user ? (
                <>
                  <Link
                    to="/profile"
                    className="hidden md:block relative p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <FiUser className="w-5 h-5" />
                  </Link>
                  
                  <button
                    onClick={() => signOut()}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-pink-400 to-rose-400 rounded-full hover:shadow-lg transition-all duration-300"
                  >
                    <FiLogOut className="w-5 h-5" />
                    <span className="hidden md:inline whitespace-nowrap">{t('nav_logout')}</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-400 rounded-full hover:shadow-lg transition-all duration-300"
                >
                  {/* 모바일: 로그인 아이콘 (들어오는 화살표) */}
                  <FiLogIn className="w-5 h-5 md:hidden" />
                  {/* 데스크톱: 텍스트 */}
                  <span className="hidden md:inline whitespace-nowrap">{t('nav_login')}</span>
                </Link>
              )}
              
              {/* 모바일 메뉴 토글 */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {mobileMenuOpen ? (
                  <FiX className="w-6 h-6" />
                ) : (
                  <FiMenu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* 모바일 메뉴 */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed top-16 left-0 right-0 z-40 bg-white dark:from-slate-900 dark:to-blue-900 dark:bg-gradient-to-br border-b border-gray-200 dark:border-blue-800 md:hidden"
          >
            <nav className="p-4">
              <ul className="space-y-2">
                {/* 홈 */}
                <li>
                  <Link
                    to="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      location.pathname === '/'
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-blue-800/50'
                    }`}
                  >
                    <FiHome className="w-4 h-4" />
                    <span>{t('nav_home')}</span>
                  </Link>
                </li>
                
                {/* 주요 메뉴 아이템들 */}
                <li className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase">{t('nav_main_menu')}</li>
                {filterMenuItems(mainMenuItems).map((item) => (
                  <li key={item.path}>
                    <button
                      onClick={() => handleMenuItemClick(item, () => setMobileMenuOpen(false))}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        location.pathname === item.path
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-blue-800/50'
                      } text-left`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  </li>
                ))}
                
                {/* 가족 메뉴 아이템들 */}
                {filterMenuItems(familyMenuItems).length > 0 && (
                  <>
                    <li className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase">{t('nav_family')}</li>
                    {filterMenuItems(familyMenuItems).map((item) => (
                      <li key={item.path}>
                        <button
                          onClick={() => handleMenuItemClick(item, () => setMobileMenuOpen(false))}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                            location.pathname === item.path
                              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-blue-800/50'
                          } text-left`}
                        >
                          {item.icon}
                          <span>{item.label}</span>
                        </button>
                      </li>
                    ))}
                  </>
                )}
                
                {/* 프로필 */}
                {user && (
                  <>
                    <li className="border-t border-gray-200 dark:border-gray-700 pt-2">
                      <Link
                        to="/profile"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          location.pathname === '/profile'
                            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-blue-800/50'
                        }`}
                      >
                        <FiUser className="w-4 h-4" />
                        <span>{t('nav_profile')}</span>
                      </Link>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          signOut();
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 w-full text-left"
                      >
                        <FiLogOut className="w-4 h-4" />
                        <span>{t('nav_logout')}</span>
                      </button>
                    </li>
                  </>
                )}
              </ul>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 메인 컨텐츠 */}
      <main className={`pt-16 ${isFullWidth ? '' : 'container mx-auto px-4 py-8'}`}>
        {children}
      </main>
      
      {/* PWA 설치 프롬프트 */}
      <PWAInstallPrompt />
    </div>
  );
};

export default Layout;