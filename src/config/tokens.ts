import type { Address } from 'viem';
import { assetUrls } from '../core/assets';
import type { TokenConfig, TokenSymbol, WalletKitConfig } from '../core/types';
import { bsc } from './chains';

const zeroAddress = '0x0000000000000000000000000000000000000000' as Address;

export const tokens: Record<TokenSymbol, TokenConfig> = {
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    address: (import.meta.env.VITE_USDT_TOKEN_ADDRESS || import.meta.env.bscusdtToken || zeroAddress) as Address,
    decimals: 18,
    icon: assetUrls.usdt
  },
  MT: {
    symbol: 'MT',
    name: 'MT Token',
    address: (import.meta.env.VITE_MT_TOKEN_ADDRESS || import.meta.env.supermtToken || zeroAddress) as Address,
    decimals: 18,
    icon: assetUrls.mt
  }
};

export const walletKitConfig: WalletKitConfig = {
  chain: bsc,
  tokens,
  receiver: (import.meta.env.VITE_PAYMENT_RECEIVER || zeroAddress) as Address,
  priceProxyUrl: import.meta.env.VITE_PRICE_PROXY_URL || undefined
};
