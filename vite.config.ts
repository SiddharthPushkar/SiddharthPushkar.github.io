import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      // Copies src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." (e.g. generate_image output) still resolve
      // in production builds. Do not remove.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const srcAssets = path.resolve(__dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }
        },
      },
      // GitHub Pages has no SPA rewrites: give every route its own HTML file
      // (keeps the old /about.html-style URLs working) plus a 404 fallback.
      // Each file gets its page's SEO head tags from seo/<route>.html.
      {
        name: 'static-route-pages',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const indexHtml = path.resolve(distDir, 'index.html');
          if (!fs.existsSync(indexHtml)) {
            return;
          }
          const routes = [
            'playground',
            'about',
            'full-body-test',
            'ai-report-analysis',
            'welup',
            'budgetin',
            'zenze',
            'adhd-college-framework',
            '404',
          ];
          const template = fs.readFileSync(indexHtml, 'utf8');
          const seoBlock = /<!-- seo:start[\s\S]*?<!-- seo:end -->/;
          if (!seoBlock.test(template)) {
            throw new Error('index.html is missing the seo:start/seo:end markers');
          }
          for (const route of ['index', ...routes]) {
            const seo = fs.readFileSync(path.resolve(__dirname, 'seo', `${route}.html`), 'utf8').trim();
            const html = template.replace(seoBlock, () => seo);
            fs.writeFileSync(path.resolve(distDir, `${route}.html`), html);
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
