import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function avePriceProxy(): Plugin {
  return {
    name: 'mt-ave-price-proxy',
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), '');
      const apiBaseUrl = env.AVE_API_BASE_URL || 'https://prod.ave-api.com';
      const apiKey = env.aveapiKey || env.AVE_API_KEY;
      const mtToken = env.VITE_MT_TOKEN_ADDRESS || env.supermtToken;

      server.middlewares.use('/api/ave/mt-price', async (_request, response) => {
        response.setHeader('content-type', 'application/json');

        try {
          if (!apiKey) throw new Error('Missing aveapiKey or AVE_API_KEY in .env');
          if (!mtToken) throw new Error('Missing supermtToken or VITE_MT_TOKEN_ADDRESS in .env');

          const tokenId = `${mtToken.toLowerCase()}-bsc`;
          const aveResponse = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/v2/tokens/price`, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'X-API-KEY': apiKey
            },
            body: JSON.stringify({
              token_ids: [tokenId],
              tvl_min: 0,
              tx_24h_volume_min: 0
            }),
            signal: AbortSignal.timeout(7000)
          });

          if (!aveResponse.ok) {
            throw new Error(`Ave.ai HTTP ${aveResponse.status}`);
          }

          const body = (await aveResponse.json()) as Record<string, unknown>;
          const data = body.data && typeof body.data === 'object' ? (body.data as Record<string, unknown>) : {};
          const record = data[tokenId] && typeof data[tokenId] === 'object' ? (data[tokenId] as Record<string, unknown>) : {};
          const price = Number(record.current_price_usd);

          if (!Number.isFinite(price) || price <= 0) {
            throw new Error('Ave.ai returned an invalid MT price');
          }

          response.end(
            JSON.stringify({
              pair: 'MT/USDT',
              price: String(price),
              source: 'Ave.ai',
              tokenId,
              updatedAt: Number(record.updated_at) || Math.floor(Date.now() / 1000),
              ttlSeconds: 15,
              priceChange24h: Number(record.price_change_24h) || null,
              tvl: Number(record.tvl) || null,
              volume24h: Number(record.tx_volume_u_24h) || null
            })
          );
        } catch (error) {
          response.statusCode = 502;
          response.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
        }
      });
    }
  };
}

export default defineConfig({
  envPrefix: ['VITE_', 'supermtToken', 'bscusdtToken'],
  plugins: [avePriceProxy(), react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          antd: ['antd', '@ant-design/icons'],
          viem: ['viem']
        }
      }
    }
  }
});
