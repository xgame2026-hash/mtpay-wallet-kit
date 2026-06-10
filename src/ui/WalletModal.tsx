import { ChevronRight, X } from 'lucide-react';
import { type CSSProperties, useEffect, useState } from 'react';
import type { WalletProviderInfo } from '../core/types';
import { WalletManager } from '../wallet/walletManager';

export type WalletModalVariant = 'default' | 'compact' | 'minimal';
export type WalletModalSize = 'sm' | 'md' | 'lg';
export type WalletModalPlacement = 'center' | 'bottom';

export interface WalletModalTheme {
  background?: string;
  borderColor?: string;
  accentColor?: string;
  textColor?: string;
  mutedColor?: string;
  rowHoverBackground?: string;
}

export interface WalletModalLabels {
  title?: string;
  installed?: string;
  app?: string;
  footerPrefix?: string;
  footerBrand?: string;
  close?: string;
}

export interface WalletModalProps {
  open: boolean;
  manager: WalletManager;
  onClose: () => void;
  onConnected: Awaited<ReturnType<WalletManager['connect']>> extends infer T ? (wallet: T) => void : never;
  variant?: WalletModalVariant;
  size?: WalletModalSize;
  placement?: WalletModalPlacement;
  labels?: WalletModalLabels;
  theme?: WalletModalTheme;
  className?: string;
  style?: CSSProperties;
  backdropClassName?: string;
  backdropStyle?: CSSProperties;
  showFooter?: boolean;
  showWalletStatus?: boolean;
}

function isMobileRuntime() {
  return typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function WalletModal({
  open,
  manager,
  onClose,
  onConnected,
  variant = 'default',
  size = 'md',
  placement = 'center',
  labels,
  theme,
  className,
  style,
  backdropClassName,
  backdropStyle,
  showFooter = true,
  showWalletStatus = true
}: WalletModalProps) {
  const [wallets, setWallets] = useState<WalletProviderInfo[]>([]);
  const [error, setError] = useState('');
  const [connectingId, setConnectingId] = useState<string>();
  const modalLabels: Required<WalletModalLabels> = {
    title: labels?.title ?? 'Connect Wallet',
    installed: labels?.installed ?? 'INSTALLED',
    app: labels?.app ?? 'APP',
    footerPrefix: labels?.footerPrefix ?? 'UX by',
    footerBrand: labels?.footerBrand ?? 'MTPAY',
    close: labels?.close ?? 'Close'
  };
  const themedStyle = {
    '--mtpay-wallet-bg': theme?.background,
    '--mtpay-wallet-border': theme?.borderColor,
    '--mtpay-wallet-accent': theme?.accentColor,
    '--mtpay-wallet-text': theme?.textColor,
    '--mtpay-wallet-muted': theme?.mutedColor,
    '--mtpay-wallet-row-hover': theme?.rowHoverBackground,
    ...style
  } as CSSProperties;

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
    <div className={`modal-backdrop modal-backdrop--${placement} ${backdropClassName ?? ''}`} role="presentation" style={backdropStyle}>
      <section
        className={`wallet-modal wallet-modal--${variant} wallet-modal--${size} ${className ?? ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={modalLabels.title}
        style={themedStyle}
      >
        <div className="modal-titlebar">
          <h2>{modalLabels.title}</h2>
          <button className="icon-button" type="button" onClick={onClose} aria-label={modalLabels.close}>
            <X size={24} />
          </button>
        </div>

        <div className="wallet-list">
          {wallets.map((wallet) => {
            const canOpenApp = isMobileRuntime() && Boolean(wallet.mobileDeepLink);

            return (
              <button className="wallet-row" type="button" key={`${wallet.id}-${wallet.rdns || ''}`} onClick={() => connect(wallet)}>
                <img src={wallet.icon} alt="" />
                <span>{wallet.name}</span>
                {showWalletStatus && wallet.installed && <strong>{modalLabels.installed}</strong>}
                {showWalletStatus && !wallet.installed && canOpenApp && <em>{modalLabels.app}</em>}
                {connectingId === wallet.id ? <span className="spinner" /> : <ChevronRight size={24} />}
              </button>
            );
          })}
        </div>

        {error && <p className="modal-error">{error}</p>}

        {showFooter && (
          <footer className="wallet-footer">
            <span>{modalLabels.footerPrefix}</span>
            <i>.</i>
            <i>/</i>
            <b>{modalLabels.footerBrand}</b>
          </footer>
        )}
      </section>
    </div>
  );
}
