import { ChevronDown, Wallet } from 'lucide-react';
import { type CSSProperties } from 'react';
import { shortAddress } from '../core/format';
import type { ConnectedWallet } from '../core/types';

export type WalletButtonVariant = 'default' | 'solid' | 'minimal';
export type WalletButtonSize = 'sm' | 'md' | 'lg';

export interface WalletButtonProps {
  wallet?: ConnectedWallet;
  onClick: () => void;
  label?: string;
  variant?: WalletButtonVariant;
  size?: WalletButtonSize;
  className?: string;
  style?: CSSProperties;
}

export function WalletButton({ wallet, onClick, label = 'Connect Wallet', variant = 'default', size = 'md', className, style }: WalletButtonProps) {
  return (
    <button className={`wallet-button wallet-button--${variant} wallet-button--${size} ${className ?? ''}`} type="button" onClick={onClick} style={style}>
      {wallet ? <img src={wallet.wallet.icon} alt="" /> : <Wallet size={18} />}
      <span>{wallet ? shortAddress(wallet.address) : label}</span>
      <ChevronDown size={16} />
    </button>
  );
}
