/** @type {import('tailwindcss').Config} */
export default {
	content: ['./index.html', './src/**/*.{js,ts}'],
	theme: {
		// Nothing in this design is rounded or raised. Replacing these scales
		// outright means no utility can reintroduce either by accident.
		borderRadius: {
			none: '0',
			sm: '0',
			DEFAULT: '0',
			md: '0',
			lg: '0',
			xl: '0',
			'2xl': '0',
			'3xl': '0',
			full: '0',
		},
		boxShadow: {
			none: 'none',
			sm: 'none',
			DEFAULT: 'none',
			md: 'none',
			lg: 'none',
			xl: 'none',
			'2xl': 'none',
			inner: 'none',
		},
		extend: {
			colors: {
				paper: '#DAD7D0', // page ground, warmed toward the accent
				raised: '#E8E5DE', // one step up, used in place of a shadow
				ink: '#000000', // type and every rule
				muted: '#6B665C', // metadata
				accent: '#FF5A00', // selected, primary action, first place
				ok: '#14632B', // co-op won
				bad: '#A31200', // co-op lost
			},
			fontFamily: {
				// Archivo carries a width axis, so long game titles hold one line.
				sans: ['Archivo', 'Helvetica Neue', 'Arial', 'sans-serif'],
				display: ['Archivo', 'Helvetica Neue', 'Arial', 'sans-serif'],
				mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
			},
		},
	},
	plugins: [],
};
