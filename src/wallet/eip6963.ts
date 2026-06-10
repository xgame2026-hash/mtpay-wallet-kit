import type { WalletProviderInfo } from '../core/types';

export async function discoverEip6963Providers(timeoutMs = 300): Promise<WalletProviderInfo[]> {
  if (typeof window === 'undefined') return [];

  const providers = new Map<string, WalletProviderInfo>();

  const onProvider = (event: Event) => {
    const detail = (event as EIP6963AnnounceProviderEvent).detail;
    if (!detail?.provider || !detail.info?.uuid) return;

    providers.set(detail.info.uuid, {
      id: detail.info.rdns || detail.info.uuid,
      name: detail.info.name,
      icon: detail.info.icon,
      rdns: detail.info.rdns,
      provider: detail.provider,
      installed: true
    });
  };

  window.addEventListener('eip6963:announceProvider', onProvider);
  window.dispatchEvent(new Event('eip6963:requestProvider'));

  await new Promise((resolve) => window.setTimeout(resolve, timeoutMs));
  window.removeEventListener('eip6963:announceProvider', onProvider);

  return [...providers.values()];
}
