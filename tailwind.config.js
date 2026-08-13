/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './node_modules/streamdown/dist/**/*.{js,mjs}',
  ],
  safelist: ['w-6', 'w-7', 'w-8', 'w-9', 'w-10', 'w-11', 'w-12'],
  theme: {
    extend: {
      screens: {
        desktop: '936px',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif', 'system-ui'],
        mono: ['JetBrains Mono', 'monospace'],
        'dm-sans': ['DM Sans', 'sans-serif'],
        'kumbh-sans': ['Kumbh Sans', 'sans-serif'],
      },
      colors: {
        // 白色主题色板：保留原有类名（组件无需改动），仅重定义色值。
        // 命名沿用旧版设计稿，"dark" 后缀类现在承载浅色值。
        'adam-bg-dark': '#FFFFFF',
        'adam-background-light': '#1F1F1F',
        'adam-bg-secondary-dark': '#FFFFFF',
        'adam-bg-light': '#2A2A2A',
        'adam-bg-secondary-light': '#333332',
        'adam-blue': '#0087D4',
        'adam-blue-dark': '#0087D4',
        'adam-text-primary': '#1C1C1C',
        'adam-text-secondary': '#666666',
        'adam-text-tertiary': '#8F8F8F',
        'secondary-tan': '#2E2E2E',
        'background-color': '#FFFFFF',
        'white-16%': 'rgba(0,0,0,0.10)',
        'white-700': '#3B3B3B',
        'white-500': '#6B6B6B',
        'adam-background-1': '#F5F5F4',
        'adam-background-2': '#FFFFFF',
        'adam-neutral-950': '#FAFAFA',
        'adam-neutral-900': '#F4F4F3',
        'adam-neutral-800': '#E9E9E8',
        'adam-neutral-700': '#DEDEDD',
        'adam-neutral-500': '#9E9E9E',
        'adam-neutral-400': '#8A8A8A',
        'adam-neutral-300': '#6B6B6B',
        'adam-neutral-200': '#4D4D4D',
        'adam-neutral-100': '#2E2E2E',
        'adam-neutral-50': '#222222',
        'adam-neutral-10': '#1B1B1B',
        'adam-neutral-0': '#161616',
        pink: '#0087D4',
        'sidebar-color': '#F7F7F6',
        'bg-gray': 'rgba(245, 245, 244)',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        'dot-bounce-1': {
          '0%, 80%, 100%': { transform: 'translateY(0)' },
          '40%': { transform: 'translateY(-8px)' },
        },
        'dot-bounce-2': {
          '0%, 20%, 100%': { transform: 'translateY(0)' },
          '60%': { transform: 'translateY(-8px)' },
        },
        'dot-bounce-3': {
          '0%, 40%, 100%': { transform: 'translateY(0)' },
          '80%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'dot-bounce-1': 'dot-bounce-1 1.0s infinite ease-in-out',
        'dot-bounce-2': 'dot-bounce-2 1.0s infinite ease-in-out',
        'dot-bounce-3': 'dot-bounce-3 1.0s infinite ease-in-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
