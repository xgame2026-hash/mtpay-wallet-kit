import { defineChain } from 'viem';

const defaultBscRpcUrls = ['https://rpc.supermt-quick.com', 'https://bsc-dataseed.binance.org'];
const bscRpcUrlSource = String(import.meta.env.VITE_BSC_RPC_URLS || import.meta.env.VITE_BSC_RPC_URL || '');
const bscRpcUrls = bscRpcUrlSource
  .split(',')
  .map((url: string) => url.trim())
  .filter(Boolean);

export const bsc = defineChain({
  id: Number(import.meta.env.VITE_BSC_CHAIN_ID || 56),
  name: 'BNB Smart Chain',
  nativeCurrency: {
    decimals: 18,
    name: 'BNB',
    symbol: 'BNB'
  },
  rpcUrls: {
    default: {
      http: bscRpcUrls.length > 0 ? bscRpcUrls : defaultBscRpcUrls
    }
  },
  blockExplorers: {
    default: {
      name: 'BscScan',
      url: 'https://bscscan.com'
    }
  }
});
