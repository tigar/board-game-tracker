import { defineConfig } from 'vite';

export default defineConfig({
	root: '.',
	publicDir: 'static',
	build: {
		outDir: 'dist',
		emptyOutDir: true,
	},
	server: {
		port: 5173,
		strictPort: false,
	},
	preview: {
		port: 4173,
		strictPort: false,
	},
});
