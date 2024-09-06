import type { Config } from 'tailwindcss'
const { fontFamily } = require('tailwindcss/defaultTheme');


const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
			fontFamily: {
				sans: ['var(--font-manrope)', ...fontFamily.sans]
			},
			colors: {
				cyan: {
					200: '#7B80FE',
					600: '#020AD4',
					800: '#03088D'
				},
        solanaPurple: '#592FAE',
			}
		}
    // extend: {
    //   backgroundImage: {
    //     'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
    //     'gradient-conic':
    //       'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
    //   },
    // },
  },
  plugins: [require('@tailwindcss/forms')],
}
export default config
