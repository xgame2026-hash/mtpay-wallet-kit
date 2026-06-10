import type { PriceQuote, WalletKitConfig } from '../core/types';

interface ProxyPriceResponse {
  price: string | number;
  updatedAt?: number;
  ttlSeconds?: number;
  source?: string;
  tokenId?: string;
  priceChange24h?: number | null;
  tvl?: number | null;
  volume24h?: number | null;
}

export class PriceService {
  constructor(private readonly config: WalletKitConfig) {}

  async getMtUsdtPrice(): Promise<PriceQuote> {
    const now = Math.floor(Date.now() / 1000);

    if (this.config.priceProxyUrl) {
      const response = await fetch(this.config.priceProxyUrl, {
        headers: { accept: 'application/json' }
      });

      if (!response.ok) throw new Error(`Price proxy failed: ${response.status}`);

      const data = (await response.json()) as ProxyPriceResponse;
      if (!data.price || Number(data.price) <= 0) throw new Error('Price proxy returned an invalid MT price');

      return {
        pair: 'MT/USDT',
        price: String(data.price),
        source: data.source ? 'quote-api' : 'proxy',
        updatedAt: data.updatedAt || now,
        ttlSeconds: data.ttlSeconds || 15,
        tokenId: data.tokenId,
        priceChange24h: data.priceChange24h ?? null,
        tvl: data.tvl ?? null,
        volume24h: data.volume24h ?? null
      };
    }

    const manualPrice = import.meta.env.VITE_MT_USDT_PRICE;
    if (manualPrice && Number(manualPrice) > 0) {
      return {
        pair: 'MT/USDT',
        price: manualPrice,
        source: 'manual',
        updatedAt: now,
        ttlSeconds: 15
      };
    }

    return {
      pair: 'MT/USDT',
      price: '1',
      source: 'fallback',
      updatedAt: now,
      ttlSeconds: 10
    };
  }
}
