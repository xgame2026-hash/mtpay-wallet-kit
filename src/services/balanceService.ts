import { createPublicClient, formatUnits, type Address } from 'viem';
import { erc20Abi } from '../config/abi';
import { createBscTransport } from '../config/rpc';
import type { TokenSymbol, WalletKitConfig } from '../core/types';

export class BalanceService {
  private readonly publicClient;

  constructor(private readonly config: WalletKitConfig) {
    this.publicClient = createPublicClient({
      chain: config.chain,
      transport: createBscTransport()
    });
  }

  async getTokenBalance(address: Address, tokenSymbol: TokenSymbol): Promise<string> {
    const token = this.config.tokens[tokenSymbol];
    const balance = await this.publicClient.readContract({
      address: token.address,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [address]
    });

    return formatUnits(balance, token.decimals);
  }

  async getBalances(address: Address): Promise<Record<TokenSymbol, string>> {
    const [usdt, mt] = await Promise.all([this.getTokenBalance(address, 'USDT'), this.getTokenBalance(address, 'MT')]);
    return {
      USDT: usdt,
      MT: mt
    };
  }
}
