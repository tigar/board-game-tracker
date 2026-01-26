import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		port: 5173,
		strictPort: false,
		fs: {
			allow: ['..'],
		},
	},
	preview: {
		port: 4173,
		strictPort: false,
	},
});
