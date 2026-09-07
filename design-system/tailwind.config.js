/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html"],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)'], // 接管默认无衬线字体链
      },
      fontSize: {
        // 流体字号映射
        xs: 'var(--text-xs)',
        sm: 'var(--text-sm)',
        base: 'var(--text-base)',
        lg: 'var(--text-lg)',
        xl: 'var(--text-xl)',
        '2xl': 'var(--text-2xl)',
        '3xl': 'var(--text-3xl)',
      },
      colors: {
        // 1. 语义化颜色 (Semantic Colors)
        bg: {
          default: 'var(--bg-default)',
          surface: 'var(--bg-surface)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
        },
        border: {
          default: 'var(--border-default)',
        },
        brand: {
          solid: 'var(--brand-solid)',
          hover: 'var(--brand-hover)',
          muted: 'var(--brand-muted)',
        },

        // 2. 全色阶映射 (Core Scales 50-900)
        primary: {
          50: 'var(--primary-50)', 100: 'var(--primary-100)', 200: 'var(--primary-200)',
          300: 'var(--primary-300)', 400: 'var(--primary-400)', 500: 'var(--primary-500)',
          600: 'var(--primary-600)', 700: 'var(--primary-700)', 800: 'var(--primary-800)', 900: 'var(--primary-900)',
        },
        secondary: {
          50: 'var(--secondary-50)', 100: 'var(--secondary-100)', 200: 'var(--secondary-200)',
          300: 'var(--secondary-300)', 400: 'var(--secondary-400)', 500: 'var(--secondary-500)',
          600: 'var(--secondary-600)', 700: 'var(--secondary-700)', 800: 'var(--secondary-800)', 900: 'var(--secondary-900)',
        },
        success: {
          50: 'var(--success-50)', 100: 'var(--success-100)', 200: 'var(--success-200)',
          300: 'var(--success-300)', 400: 'var(--success-400)', 500: 'var(--success-500)',
          600: 'var(--success-600)', 700: 'var(--success-700)', 800: 'var(--success-800)', 900: 'var(--success-900)',
        },
        info: {
          50: 'var(--info-50)', 100: 'var(--info-100)', 200: 'var(--info-200)',
          300: 'var(--info-300)', 400: 'var(--info-400)', 500: 'var(--info-500)',
          600: 'var(--info-600)', 700: 'var(--info-700)', 800: 'var(--info-800)', 900: 'var(--info-900)',
        },
        danger: {
          50: 'var(--danger-50)', 100: 'var(--danger-100)', 200: 'var(--danger-200)',
          300: 'var(--danger-300)', 400: 'var(--danger-400)', 500: 'var(--danger-500)',
          600: 'var(--danger-600)', 700: 'var(--danger-700)', 800: 'var(--danger-800)', 900: 'var(--danger-900)',
        },
        warning: {
          50: 'var(--warning-50)', 100: 'var(--warning-100)', 200: 'var(--warning-200)',
          300: 'var(--warning-300)', 400: 'var(--warning-400)', 500: 'var(--warning-500)',
          600: 'var(--warning-600)', 700: 'var(--warning-700)', 800: 'var(--warning-800)', 900: 'var(--warning-900)',
        },
        neutral: {
          50: 'var(--neutral-50)', 100: 'var(--neutral-100)', 200: 'var(--neutral-200)',
          300: 'var(--neutral-300)', 400: 'var(--neutral-400)', 500: 'var(--neutral-500)',
          600: 'var(--neutral-600)', 700: 'var(--neutral-700)', 800: 'var(--neutral-800)', 900: 'var(--neutral-900)',
        },
      }
    },
  },
  plugins: [],
}
