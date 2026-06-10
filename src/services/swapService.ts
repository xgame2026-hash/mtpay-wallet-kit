import type { Address } from 'viem';
import type { TokenSymbol } from '../core/types';

export interface SwapRequest {
  tokenIn: TokenSymbol;
  tokenOut: TokenSymbol;
  amountIn: string;
  slippageBps: number;
  recipient: Address;
}

export interface SwapQuote {
  tokenIn: TokenSymbol;
  tokenOut: TokenSymbol;
  amountIn: string;
  amountOut: string;
  minimumReceived: string;
  route: string[];
  expiresAt: number;
}

export class SwapService {
  async quote(_request: SwapRequest): Promise<SwapQuote> {
    throw new Error('Swap adapter is not configured yet. Add PancakeSwap or an internal router adapter.');
  }

  async swap(_request: SwapRequest): Promise<never> {
    throw new Error('Swap adapter is not configured yet. Add PancakeSwap or an internal router adapter.');
  }
}
