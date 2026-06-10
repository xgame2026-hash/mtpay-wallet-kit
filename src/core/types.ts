import type { Address, Chain, Hash } from 'viem';

export type TokenSymbol = 'USDT' | 'MT';

export interface TokenConfig {
  symbol: TokenSymbol;
  name: string;
  address: Address;
  decimals: number;
  icon: string;
}

export interface WalletProviderInfo {
  id: string;
  name: string;
  icon: string;
  rdns?: string;
  provider?: EthereumProvider;
  installed: boolean;
  mobileDeepLink?: string;
}

export interface ConnectedWallet {
  address: Address;
  chainId: number;
  wallet: WalletProviderInfo;
  provider: EthereumProvider;
}

export interface WalletKitConfig {
  chain: Chain;
  tokens: Record<TokenSymbol, TokenConfig>;
  receiver: Address;
  priceProxyUrl?: string;
}

export interface PriceQuote {
  pair: `${TokenSymbol}/${TokenSymbol}`;
  price: string;
  source: 'ave.ai' | 'quote-api' | 'proxy' | 'manual' | 'fallback';
  updatedAt: number;
  ttlSeconds: number;
  tokenId?: string;
  priceChange24h?: number | null;
  tvl?: number | null;
  volume24h?: number | null;
}

export interface PaymentQuote {
  invoiceAmountUsdt: string;
  payToken: TokenSymbol;
  tokenAmount: string;
  price?: PriceQuote;
  expiresAt: number;
}

export type TransactionStatus =
  | 'idle'
  | 'checking-wallet'
  | 'checking-balance'
  | 'quoting'
  | 'waiting-signature'
  | 'broadcasting'
  | 'confirming'
  | 'success'
  | 'failed';

export interface PaymentRequest {
  amountUsdt: string;
  payToken?: TokenSymbol;
  receiver?: Address;
  orderId?: string;
}

export interface PaymentResult {
  hash: Hash;
  quote: PaymentQuote;
}

export interface PaymentJson {
  ok: boolean;
  chainId: number;
  network: string;
  receiver: Address;
  wallet: Address;
  token: TokenSymbol;
  tokenAddress: Address;
  invoiceAmountUsdt: string;
  tokenAmount: string;
  price?: PriceQuote;
  hash: Hash;
  blockNumber: string;
  status: 'confirmed' | 'failed';
  explorerUrl?: string;
  confirmedAt: number;
}

export interface PaymentRecord {
  hash: Hash;
  blockNumber?: bigint;
  status: 'submitted' | 'confirmed' | 'failed';
  wallet: Address;
  receiver: Address;
  token: TokenSymbol;
  tokenAddress: Address;
  amount: string;
  invoiceAmountUsdt: string;
  quote: PaymentQuote;
  createdAt: number;
  confirmedAt?: number;
}
