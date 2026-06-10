import { ChevronRight, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { WalletProviderInfo } from '../core/types';
import { WalletManager } from '../wallet/walletManager';

interface WalletModalProps {
  open: boolean;
  manager: WalletManager;
  onClose: () => void;
  onConnected: Awaited<ReturnType<WalletManager['connect']>> extends infer T ? (wallet: T) => void : never;
}

export function WalletModal({ open, manager, onClose, onConnected }: WalletModalProps) {
  const [wallets, setWallets] = useState<WalletProviderInfo[]>([]);
  const [error, setError] = useState('');
  const [connectingId, setConnectingId] = useState<string>();

  useEffect(() => {
    if (!open) return;
    setError('');
    manager.listWallets().then(setWallets).catch((reason) => setError(reason instanceof Error ? reason.message : String(reason)));
  }, [manager, open]);

  if (!open) return null;

  async function connect(wallet: WalletProviderInfo) {
    try {
      setError('');
      setConnectingId(wallet.id);
      const connected = await manager.connect(wallet);
      onConnected(connected);
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setConnectingId(undefined);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="wallet-modal" role="dialog" aria-modal="true" aria-label="Connect wallet">
        <div className="modal-titlebar">
          <h2>Connect Wallet</h2>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close">
            <X size={24} />
          </button>
        </div>

        <div className="wallet-list">
          {wallets.map((wallet) => (
            <button className="wallet-row" type="button" key={`${wallet.id}-${wallet.rdns || ''}`} onClick={() => connect(wallet)}>
              <img src={wallet.icon} alt="" />
              <span>{wallet.name}</span>
              {wallet.installed && <strong>INSTALLED</strong>}
              {!wallet.installed && wallet.mobileDeepLink && <em>APP</em>}
              {connectingId === wallet.id ? <span className="spinner" /> : <ChevronRight size={24} />}
            </button>
          ))}
        </div>

        {error && <p className="modal-error">{error}</p>}

        <footer className="wallet-footer">
          <span>UX by</span>
          <i>.</i>
          <i>/</i>
          <b>MTPAY</b>
        </footer>
      </section>
    </div>
  );
}
