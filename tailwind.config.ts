import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '0rem',
        sm: '2rem',
        md: '3rem',
      },
    },
    colors: {
      black: '#050400',
      white: '#FFFFFF',
      gray: '#F5F4F1',
      beige: {
        100: '#F5F4F1',
        200: '#E6E3DB',
        300: '#CEC8BA',
        400: '#B2A692',
        500: '#8C7B66',
        600: '#786656',
        700: '#615047',
        800: '#54453F',
        900: '#4A3D39',
      },
      yellow: {
        100: '#FFF2D8',
        200: '#FFEBC5',
        300: '#FFE5B2',
        400: '#FFDE9E',
        500: '#FFD88B',
        600: '#FFD277',
        700: '#FFCB63',
        800: '#FFC54D',
        900: '#FCBA0E',
      },
    },
    extend: {
      maxWidth: {
        '3/4': '75%',
      },
      fontSize: {
        xs: '1rem',
        sm: '1.375rem',
        md: '2rem',
        lg: '2.75rem',
        xl: '3.5rem',
        xxl: '4rem',
      },
      fontFamily: {
        space: ['var(--font-space-grotesk)'],
        poppins: ['var(--font-poppins)'],
      },
      screens: {
        xs: '375px',
      },
    },
  },
  plugins: [],
} satisfies Config;
