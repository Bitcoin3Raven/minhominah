import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser } from 'react-icons/fi';
import { motion } from 'framer-motion';

const LoginPage = () => {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const { t } = useLanguage();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isSignUp) {
        // 회원가입 로직
        if (password !== confirmPassword) {
          setError(t('login.passwordMismatch'));
          setLoading(false);
          return;
        }
        
        if (password.length < 6) {
          setError(t('login.passwordTooShort'));
          setLoading(false);
          return;
        }

        await signUp(email, password);
        setSuccess(t('login.signupSuccess'));
        
        // 회원가입 후 자동 로그인
        setTimeout(async () => {
          try {
            await signIn(email, password);
            navigate('/');
          } catch (err) {
            setIsSignUp(false); // 로그인 모드로 전환
          }
        }, 2000);
      } else {
        // 로그인 로직
        await signIn(email, password);
        navigate('/');
      }
    } catch (err: any) {
      if (isSignUp) {
        if (err.message?.includes('already registered')) {
          setError(t('login.emailAlreadyExists'));
        } else {
          setError(t('login.signupError'));
        }
      } else {
        setError(t('login.loginError'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center relative overflow-hidden">
      {/* 배경 그라데이션 - 라이트/다크 모드 대응 */}
      <div className="absolute inset-0 -z-10">
        {/* 라이트 모드 배경 */}
        <div className="absolute inset-0 dark:opacity-0 transition-opacity duration-300"
          style={{
            background: `
              radial-gradient(circle at 20% 20%, rgba(255, 182, 193, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(135, 206, 235, 0.3) 0%, transparent 50%),
              linear-gradient(135deg, #fef3f5 0%, #f0f9ff 100%)
            `
          }}
        />
        {/* 다크 모드 배경 */}
        <div className="absolute inset-0 opacity-0 dark:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
        
        {/* 애니메이션 효과 */}
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-pink-300 dark:bg-purple-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-blue-300 dark:bg-indigo-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-gray-200/50 dark:border-gray-700/50">
          <h1 className="text-3xl font-bold text-center mb-2">
            <span className="bg-gradient-to-r from-pink-500 to-blue-500 text-transparent bg-clip-text">
              {isSignUp ? t('login.signupTitle') : t('login.title')}
            </span>
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-400 text-sm mb-8">
            {t('login.subtitle')}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm border border-red-200 dark:border-red-800"
              >
                {error}
              </motion.div>
            )}
            
            {success && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-sm border border-green-200 dark:border-green-800"
              >
                {success}
              </motion.div>
            )}

            {isSignUp && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('login.name')}
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder={t('login.namePlaceholder')}
                    required={isSignUp}
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('login.email')}
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder={t('login.emailPlaceholder')}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('login.password')}
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder={t('login.passwordPlaceholder')}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('login.confirmPassword')}
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder={t('login.passwordPlaceholder')}
                    required={isSignUp}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            >
              {loading ? (isSignUp ? t('login.signingUp') : t('login.loggingIn')) : (isSignUp ? t('login.signupButton') : t('login.loginButton'))}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isSignUp ? t('login.haveAccount') : t('login.noAccount')}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                  setSuccess('');
                  setPassword('');
                  setConfirmPassword('');
                }}
                className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-medium transition-all duration-200"
              >
                {isSignUp ? t('login.loginButton') : t('login.signupButton')}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;