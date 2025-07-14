/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 기존 디자인 색상
        primary: {
          DEFAULT: '#667eea',
          dark: '#764ba2',
          gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        },
        secondary: '#10B981',
        background: {
          light: '#f8f9fa',
          dark: '#1a1a1a',
          card: '#2a2a2a',
        },
        text: {
          primary: '#333333',
          secondary: '#666666',
          dark: '#f0f0f0',
        },
        // 파스텔 색상 추가
        pastel: {
          pink: '#FFC0CB',
          lightPink: 'rgba(255, 192, 203, 0.45)',
          blue: '#87CEEB',
          lightBlue: 'rgba(135, 206, 250, 0.45)',
        },
      },
      fontFamily: {
        sans: ['Pretendard', 'Malgun Gothic', 'Apple SD Gothic Neo', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        'sm': '0 2px 4px rgba(0,0,0,0.1)',
        'md': '0 4px 6px rgba(0,0,0,0.1)',
        'lg': '0 10px 15px rgba(0,0,0,0.1)',
        'xl': '0 20px 25px rgba(0,0,0,0.1)',
        'header': '0 2px 10px rgba(0,0,0,0.1)',
      },
      backgroundImage: {
        'primary-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'scale-hover': 'scaleHover 0.3s ease',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleHover: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.05)' },
        },
      },
    },
  },
  plugins: [],
}