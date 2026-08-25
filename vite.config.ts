import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { gerarPlanoComGemini } from './api/gerar-plano.ts';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiKey = env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY || '';

  return {
    plugins: [
      react(),
      {
        name: 'api-serverless-middleware',
        configureServer(server) {
          server.middlewares.use('/api/gerar-plano', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Método não permitido. Utilize POST.' }));
              return;
            }

            let body = '';
            req.on('data', (chunk: any) => {
              body += chunk;
            });

            req.on('end', async () => {
              try {
                const parsed = body ? JSON.parse(body) : {};
                const { dadosPaciente } = parsed;
                if (!dadosPaciente) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Dados do paciente não fornecidos.' }));
                  return;
                }

                const resultado = await gerarPlanoComGemini(dadosPaciente, apiKey);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(resultado));
              } catch (err: any) {
                console.error('Erro na rota /api/gerar-plano:', err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err.message || 'Erro ao gerar plano alimentar.' }));
              }
            });
          });
        },
      },
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'icons/*.png'],
        manifest: {
          name: 'NuFey — Gestão Nutricional',
          short_name: 'NuFey',
          description:
            'Plataforma moderna e inteligente para gestão de nutricionistas, pacientes e planos alimentares.',
          start_url: '/',
          display: 'standalone',
          background_color: '#060D19',
          theme_color: '#10B981',
          orientation: 'portrait-primary',
          lang: 'pt-BR',
          categories: ['health', 'productivity', 'medical'],
          icons: [
            { src: '/icons/icon-72x72.png', sizes: '72x72', type: 'image/png' },
            { src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
            { src: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
            { src: '/icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
            { src: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
            {
              src: '/icons/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable',
            },
            { src: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
            {
              src: '/icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
          shortcuts: [
            {
              name: 'Dashboard',
              short_name: 'Dashboard',
              description: 'Abrir o painel principal',
              url: '/',
              icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
            },
          ],
        },
        workbox: {
          // Cache de páginas e assets estáticos
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          // Cache de chamadas de API usando StaleWhileRevalidate
          runtimeCaching: [
            {
              // Google Fonts
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              // Google Fonts static
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              // Neon Auth API — NetworkFirst para dados em tempo real
              urlPattern: /^https:\/\/.*\.neonauth\..*\/.*$/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'neon-auth-cache',
                expiration: { maxEntries: 20, maxAgeSeconds: 60 * 5 },
                networkTimeoutSeconds: 10,
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    server: {
      host: true,
      port: 5173,
    },
  };
});

