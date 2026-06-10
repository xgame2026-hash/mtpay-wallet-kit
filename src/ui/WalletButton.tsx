import { ChevronDown, Wallet } from 'lucide-react';
import { shortAddress } from '../core/format';
import type { ConnectedWallet } from '../core/types';

interface WalletButtonProps {
  wallet?: ConnectedWallet;
  onClick: () => void;
}

export function WalletButton({ wallet, onClick }: WalletButtonProps) {
  return (
    <button className="wallet-button" type="button" onClick={onClick}>
      {wallet ? <img src={wallet.wallet.icon} alt="" /> : <Wallet size={18} />}
      <span>{wallet ? shortAddress(wallet.address) : 'Connect Wallet'}</span>
      <ChevronDown size={16} />
    </button>
  );
}
