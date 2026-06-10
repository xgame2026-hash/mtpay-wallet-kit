import { assetUrls } from '../core/assets';
import type { WalletProviderInfo } from '../core/types';
import { discoverEip6963Providers } from './eip6963';

const dappUrl = typeof window === 'undefined' ? '' : encodeURIComponent(window.location.href);

const knownWallets: WalletProviderInfo[] = [
  {
    id: 'tokenpocket',
    name: 'TokenPocket',
    icon: assetUrls.tokenPocket,
    installed: false,
    mobileDeepLink: `tpdapp://open?params=${encodeURIComponent(JSON.stringify({ url: typeof window === 'undefined' ? '' : window.location.href }))}`
  },
  {
    id: 'okx',
    name: 'OKX Wallet',
    icon: assetUrls.okx,
    installed: false,
    mobileDeepLink: `okx://wallet/dapp/url?dappUrl=${dappUrl}`
  },
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: assetUrls.metamask,
    installed: false,
    mobileDeepLink: `https://metamask.app.link/dapp/${typeof window === 'undefined' ? '' : window.location.host + window.location.pathname}`
  },
  {
    id: 'binance',
    name: 'Binance Wallet',
    icon: assetUrls.binance,
    installed: false,
    mobileDeepLink: `bnc://app.binance.com/cedefi/dapp?url=${dappUrl}`
  }
];

function candidateProviders(): EthereumProvider[] {
  if (typeof window === 'undefined') return [];

  const candidates = [
    window.okxwallet,
    window.tokenpocket?.ethereum,
    window.BinanceChain,
    window.ethereum,
    ...(window.ethereum?.providers || [])
  ];

  return candidates.filter(Boolean) as EthereumProvider[];
}

function matchKnownWallet(wallet: WalletProviderInfo, provider: EthereumProvider): boolean {
  if (wallet.id === 'okx') return Boolean(provider.isOkxWallet || provider.isOKExWallet);
  if (wallet.id === 'tokenpocket') return Boolean(provider.isTokenPocket);
  if (wallet.id === 'binance') return Boolean(provider.isBinance || provider === window.BinanceChain);
  if (wallet.id === 'metamask') return Boolean(provider.isMetaMask);
  return false;
}

export async function detectWallets(): Promise<WalletProviderInfo[]> {
  const eip6963 = await discoverEip6963Providers();
  const providers = candidateProviders();

  return knownWallets.map((wallet) => {
    const provider =
      providers.find((candidate) => matchKnownWallet(wallet, candidate)) ||
      eip6963.find((candidate) => {
        const rdns = candidate.rdns?.toLowerCase() || '';
        return rdns.includes(wallet.id) || candidate.name.toLowerCase().includes(wallet.name.toLowerCase().split(' ')[0]);
      })?.provider;

    return {
      ...wallet,
      provider,
      installed: Boolean(provider)
    };
  });
}
