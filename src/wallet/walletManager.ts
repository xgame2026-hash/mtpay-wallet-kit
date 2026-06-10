import { createWalletClient, custom, numberToHex, type Address, type Chain, type WalletClient } from 'viem';
import type { ConnectedWallet, WalletProviderInfo } from '../core/types';
import { detectWallets } from './adapters';

export class WalletManager {
  private connected?: ConnectedWallet;

  constructor(private readonly chain: Chain) {}

  async listWallets(): Promise<WalletProviderInfo[]> {
    return detectWallets();
  }

  getConnectedWallet(): ConnectedWallet | undefined {
    return this.connected;
  }

  async connect(wallet: WalletProviderInfo): Promise<ConnectedWallet> {
    if (!wallet.provider) {
      if (wallet.mobileDeepLink && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        window.location.href = wallet.mobileDeepLink;
        throw new Error(`Opening ${wallet.name}. Continue inside the wallet browser.`);
      }
      throw new Error(`${wallet.name} is not installed`);
    }

    const accounts = await wallet.provider.request<string[]>({ method: 'eth_requestAccounts' });
    const chainHex = await wallet.provider.request<string>({ method: 'eth_chainId' });
    const address = accounts[0] as Address | undefined;

    if (!address) throw new Error('No wallet account returned');

    this.connected = {
      address,
      chainId: Number(chainHex),
      wallet,
      provider: wallet.provider
    };

    return this.connected;
  }

  async ensureChain(provider: EthereumProvider): Promise<void> {
    const targetChainId = numberToHex(this.chain.id);
    const currentChainId = await provider.request<string>({ method: 'eth_chainId' });
    if (currentChainId.toLowerCase() === targetChainId.toLowerCase()) return;

    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainId }]
      });
    } catch (error) {
      const code = typeof error === 'object' && error && 'code' in error ? Number(error.code) : undefined;
      if (code !== 4902) throw error;
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: targetChainId,
            chainName: this.chain.name,
            nativeCurrency: this.chain.nativeCurrency,
            rpcUrls: this.chain.rpcUrls.default.http,
            blockExplorerUrls: this.chain.blockExplorers?.default ? [this.chain.blockExplorers.default.url] : []
          }
        ]
      });
    }
  }

  createClient(provider: EthereumProvider): WalletClient {
    return createWalletClient({
      account: this.connected?.address,
      chain: this.chain,
      transport: custom(provider)
    });
  }
}
