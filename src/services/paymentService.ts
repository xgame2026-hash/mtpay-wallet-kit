import { createPublicClient, encodeFunctionData, type Address, type Hash } from 'viem';
import { erc20Abi } from '../config/abi';
import { createBscTransport } from '../config/rpc';
import { decimalToUnits, divideDecimal } from '../core/format';
import type { ConnectedWallet, PaymentJson, PaymentQuote, PaymentRequest, PaymentResult, TokenSymbol, WalletKitConfig } from '../core/types';
import { WalletManager } from '../wallet/walletManager';
import { BalanceService } from './balanceService';
import { PriceService } from './priceService';

export class PaymentService {
  private readonly priceService: PriceService;
  private readonly balanceService: BalanceService;
  private readonly walletManager: WalletManager;
  private readonly publicClient;

  constructor(private readonly config: WalletKitConfig) {
    this.priceService = new PriceService(config);
    this.balanceService = new BalanceService(config);
    this.walletManager = new WalletManager(config.chain);
    this.publicClient = createPublicClient({
      chain: config.chain,
      transport: createBscTransport()
    });
  }

  async quote(request: PaymentRequest): Promise<PaymentQuote> {
    const payToken = request.payToken || 'MT';

    if (payToken === 'USDT') {
      return {
        invoiceAmountUsdt: request.amountUsdt,
        payToken: 'USDT',
        tokenAmount: request.amountUsdt,
        expiresAt: Math.floor(Date.now() / 1000) + 30
      };
    }

    const price = await this.priceService.getMtUsdtPrice();
    const tokenAmount = divideDecimal(request.amountUsdt, price.price);

    return {
      invoiceAmountUsdt: request.amountUsdt,
      payToken: 'MT',
      tokenAmount,
      price,
      expiresAt: price.updatedAt + price.ttlSeconds
    };
  }

  async pay(wallet: ConnectedWallet, request: PaymentRequest): Promise<PaymentResult> {
    await this.walletManager.ensureChain(wallet.provider);

    const payToken = request.payToken || 'MT';
    const quote = await this.quote({ ...request, payToken });
    if (quote.expiresAt <= Math.floor(Date.now() / 1000)) throw new Error('Payment quote expired');

    const token = this.config.tokens[payToken];
    const receiver = request.receiver || this.config.receiver;
    if (receiver.toLowerCase() === '0x0000000000000000000000000000000000000000') {
      throw new Error('Payment receiver is not configured');
    }
    const balance = await this.balanceService.getTokenBalance(wallet.address, payToken);
    const amount = decimalToUnits(quote.tokenAmount, token.decimals);
    const balanceUnits = decimalToUnits(balance, token.decimals);

    if (balanceUnits < amount) throw new Error(`Insufficient ${payToken} balance`);

    const client = this.walletManager.createClient(wallet.provider);
    const data = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'transfer',
      args: [receiver, amount]
    });

    const hash = (await client.sendTransaction({
      account: wallet.address,
      to: token.address,
      data,
      chain: this.config.chain
    })) as Hash;

    return { hash, quote };
  }

  async payAndConfirm(wallet: ConnectedWallet, request: PaymentRequest): Promise<PaymentJson> {
    const payToken = request.payToken || 'MT';
    const result = await this.pay(wallet, { ...request, payToken });
    const receipt = await this.waitForConfirmation(result.hash);
    const token = this.config.tokens[payToken];
    const receiver = request.receiver || this.config.receiver;
    const status = receipt.status === 'success' ? 'confirmed' : 'failed';

    return {
      ok: status === 'confirmed',
      chainId: this.config.chain.id,
      network: this.config.chain.name,
      receiver,
      wallet: wallet.address,
      token: payToken,
      tokenAddress: token.address,
      invoiceAmountUsdt: result.quote.invoiceAmountUsdt,
      tokenAmount: result.quote.tokenAmount,
      price: result.quote.price,
      hash: result.hash,
      blockNumber: receipt.blockNumber.toString(),
      status,
      explorerUrl: this.config.chain.blockExplorers?.default ? `${this.config.chain.blockExplorers.default.url}/tx/${result.hash}` : undefined,
      confirmedAt: Math.floor(Date.now() / 1000)
    };
  }

  async waitForConfirmation(hash: Hash) {
    return this.publicClient.waitForTransactionReceipt({ hash });
  }

  async payMt(wallet: ConnectedWallet, amountUsdt: string, receiver: Address): Promise<PaymentResult> {
    return this.pay(wallet, { amountUsdt, receiver, payToken: 'MT' });
  }

  async payMtAndConfirm(wallet: ConnectedWallet, amountUsdt: string, receiver: Address): Promise<PaymentJson> {
    return this.payAndConfirm(wallet, { amountUsdt, receiver, payToken: 'MT' });
  }

  getPaymentTokenOptions(): TokenSymbol[] {
    return ['USDT', 'MT'];
  }
}
