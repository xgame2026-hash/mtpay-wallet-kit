import http from 'node:http';

const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 5174);
const apiBaseUrl = process.env.PRICE_API_BASE_URL;
const apiKey = process.env.PRICE_API_KEY;
const mtToken = process.env.supermtToken || process.env.VITE_MT_TOKEN_ADDRESS;

function sendJson(response, status, payload) {
  const body = JSON.stringify(payload);

  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'access-control-allow-origin': '*'
  });
  response.end(body);
}

async function fetchMtPrice() {
  if (!apiKey) throw new Error('Missing PRICE_API_KEY');
  if (!apiBaseUrl) throw new Error('Missing PRICE_API_BASE_URL');
  if (!mtToken) throw new Error('Missing supermtToken or VITE_MT_TOKEN_ADDRESS');

  const tokenId = `${mtToken.toLowerCase()}-bsc`;
  const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/v2/tokens/price`, {
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

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Price API ${response.status}: ${text.slice(0, 180)}`);
  }

  const payload = await response.json();
  const tokenPrice = payload?.data?.[tokenId] || payload?.data?.[mtToken] || Object.values(payload?.data || {})[0];
  const price = tokenPrice?.current_price_usd;

  if (!price || Number(price) <= 0) throw new Error('Price API returned invalid MT price');

  return {
    price,
    source: 'quote-api',
    tokenId,
    updatedAt: Math.floor(Date.now() / 1000),
    ttlSeconds: 15,
    priceChange24h: tokenPrice?.price_change_24h ?? null,
    tvl: tokenPrice?.tvl ?? null,
    volume24h: tokenPrice?.volume_24h ?? null
  };
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);

    if (request.method === 'OPTIONS') {
      response.writeHead(204, {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET, OPTIONS',
        'access-control-allow-headers': 'content-type, accept'
      });
      response.end();
      return;
    }

    if (request.method === 'GET' && url.pathname === '/health') {
      sendJson(response, 200, { ok: true, service: 'mtpay-api' });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/mt-price') {
      sendJson(response, 200, await fetchMtPrice());
      return;
    }

    sendJson(response, 404, { ok: false, error: 'Not found' });
  } catch (error) {
    sendJson(response, 502, {
      ok: false,
      error: error instanceof Error ? error.message : 'Price service failed'
    });
  }
});

server.listen(port, host, () => {
  console.log(`mtpay-api listening on http://${host}:${port}`);
});
