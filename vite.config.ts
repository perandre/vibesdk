// import { sentryVitePlugin } from '@sentry/vite-plugin';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';
import fs from 'fs';

/**
 * Checks src/custom/overrides/ for a matching file before falling back to core.
 * To override @/components/foo/bar, create src/custom/overrides/components/foo/bar.tsx
 */
function customOverridesPlugin(): Plugin {
	const overridesDir = path.resolve(__dirname, 'src/custom/overrides');
	const extensions = ['.tsx', '.ts', '.jsx', '.js'];
	return {
		name: 'custom-overrides',
		resolveId(source) {
			if (!source.startsWith('@/')) return null;
			const rel = source.slice(2);
			const base = path.join(overridesDir, rel);
			if (fs.existsSync(base)) return base;
			for (const ext of extensions) {
				const candidate = base + ext;
				if (fs.existsSync(candidate)) return candidate;
			}
			return null;
		},
	};
}

import { cloudflare } from '@cloudflare/vite-plugin';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
	optimizeDeps: {
		exclude: ['format', 'editor.all'],
		include: ['monaco-editor/esm/vs/editor/editor.api'],
		force: true,
	},

	// build: {
	//     rollupOptions: {
	//       output: {
	//             advancedChunks: {
	//                 groups: [{name: 'vendor', test: /node_modules/}]
	//             }
	//         }
	//     }
	// },
	plugins: [
		customOverridesPlugin(),
		react(),
		svgr(),
		cloudflare({
			configPath: process.env.WRANGLER_CONFIG_PATH ?? 'wrangler.jsonc',
		}),
		tailwindcss(),
		// sentryVitePlugin({
		// 	org: 'cloudflare-0u',
		// 	project: 'javascript-react',
		// }),
	],

	resolve: {
		alias: {
			debug: 'debug/src/browser',
			'@': path.resolve(__dirname, './src'),
			'shared': path.resolve(__dirname, './shared'),
			'worker': path.resolve(__dirname, './worker'),
		},
	},

	// Configure for Prisma + Cloudflare Workers compatibility
	define: {
		// Ensure proper module definitions for Cloudflare Workers context
		'process.env.NODE_ENV': JSON.stringify(
			process.env.NODE_ENV || 'development',
		),
		global: 'globalThis',
		// '__filename': '""',
		// '__dirname': '""',
	},

	worker: {
		// Handle Prisma in worker context for development
		format: 'es',
	},

	server: {
		allowedHosts: true,
	},

	// Clear cache more aggressively
	cacheDir: 'node_modules/.vite',
});
