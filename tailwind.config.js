import typography from '@tailwindcss/typography'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', 'Georgia', 'serif'],
      },
      colors: {
        cream: '#f5f5f0',
        slate: {
          deep: '#1a1f2e',
        },
        focus: {
          left: '#2d2d2d',
          right: '#f5f5f0',
        },
      },
      boxShadow: {
        glass: '0 20px 56px rgba(26, 22, 32, 0.07), 0 2px 8px rgba(26, 22, 32, 0.04)',
        'glass-dark': '0 28px 70px rgba(0, 0, 0, 0.5)',
        'card-hover': '0 24px 56px rgba(31, 27, 36, 0.11)',
      },
      transitionDuration: {
        theme: '420ms',
      },
    },
  },
  plugins: [typography],
}
