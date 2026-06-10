import { ArrowDownUp, CheckCircle2, CircleAlert, Loader2, ReceiptText } from 'lucide-react';
import { useMemo, useState } from 'react';
import { isAddress, type Address } from 'viem';
import { walletKitConfig } from '../config/tokens';
import { shortAddress } from '../core/format';
import type { ConnectedWallet, PaymentQuote, PaymentRecord, TokenSymbol, TransactionStatus } from '../core/types';
import { PaymentRecordService } from '../services/paymentRecordService';
import { PaymentService } from '../services/paymentService';

interface PaymentSheetProps {
  wallet?: ConnectedWallet;
  onConnect: () => void;
}

const service = new PaymentService(walletKitConfig);
const recordService = new PaymentRecordService();

const statusText: Record<TransactionStatus, string> = {
  idle: 'Ready',
  'checking-wallet': 'Checking wallet',
  'checking-balance': 'Checking balance',
  quoting: 'Getting quote',
  'waiting-signature': 'Waiting signature',
  broadcasting: 'Broadcasting',
  confirming: 'Confirming',
  success: 'Payment confirmed',
  failed: 'Payment failed'
};

export function PaymentSheet({ wallet, onConnect }: PaymentSheetProps) {
  const [amountUsdt, setAmountUsdt] = useState('20');
  const [receiver, setReceiver] = useState('');
  const [payToken, setPayToken] = useState<TokenSymbol>('USDT');
  const [quote, setQuote] = useState<PaymentQuote>();
  const [status, setStatus] = useState<TransactionStatus>('idle');
  const [hash, setHash] = useState('');
  const [error, setError] = useState('');
  const [records, setRecords] = useState<PaymentRecord[]>(() => recordService.list());

  const token = walletKitConfig.tokens[payToken];
  const normalizedReceiver = receiver.trim();
  const canSubmit = useMemo(() => Number(amountUsdt) > 0, [amountUsdt]);

  async function refreshQuote(nextToken = payToken) {
    try {
      setStatus('quoting');
      setError('');
      const nextQuote = await service.quote({ amountUsdt, payToken: nextToken });
      setQuote(nextQuote);
      setStatus('idle');
    } catch (reason) {
      setStatus('failed');
      setError(reason instanceof Error ? reason.message : String(reason));
    }
  }

  async function submitPayment() {
    if (!wallet) {
      onConnect();
      return;
    }

    try {
      setError('');
      setHash('');
      setStatus('checking-wallet');
      setStatus('checking-balance');
      if (!isAddress(normalizedReceiver)) throw new Error('Please enter a valid BSC receiver address.');
      const receiverAddress = normalizedReceiver as Address;
      const result = await service.pay(wallet, { amountUsdt, payToken, receiver: receiverAddress });
      setQuote(result.quote);
      setHash(result.hash);
      setRecords(
        recordService.upsert({
          hash: result.hash,
          status: 'submitted',
          wallet: wallet.address,
          receiver: receiverAddress,
          token: payToken,
          tokenAddress: walletKitConfig.tokens[payToken].address,
          amount: result.quote.tokenAmount,
          invoiceAmountUsdt: result.quote.invoiceAmountUsdt,
          quote: result.quote,
          createdAt: Math.floor(Date.now() / 1000)
        })
      );
      setStatus('confirming');
      const receipt = await service.waitForConfirmation(result.hash);
      setRecords(
        recordService.update(result.hash, {
          status: receipt.status === 'success' ? 'confirmed' : 'failed',
          blockNumber: receipt.blockNumber,
          confirmedAt: Math.floor(Date.now() / 1000)
        })
      );
      setStatus(receipt.status === 'success' ? 'success' : 'failed');
      if (receipt.status !== 'success') {
        setError('Transaction was included on-chain but failed.');
      }
    } catch (reason) {
      setStatus('failed');
      setError(reason instanceof Error ? reason.message : String(reason));
    }
  }

  async function chooseToken(nextToken: TokenSymbol) {
    setPayToken(nextToken);
    await refreshQuote(nextToken);
  }

  return (
    <section className="payment-sheet">
      <div className="sheet-header">
        <div>
          <span className="eyebrow">MT Pay</span>
          <h1>Checkout</h1>
        </div>
        <div className={`status-pill ${status}`}>
          {status === 'success' ? <CheckCircle2 size={16} /> : status === 'failed' ? <CircleAlert size={16} /> : <Loader2 size={16} />}
          <span>{statusText[status]}</span>
        </div>
      </div>

      <div className="amount-panel">
        <label>Invoice amount</label>
        <div className="amount-input">
          <input value={amountUsdt} onChange={(event) => setAmountUsdt(event.target.value)} inputMode="decimal" />
          <span>USDT</span>
        </div>
      </div>

      <div className="receiver-panel">
        <label>Receiver address</label>
        <input value={receiver} onChange={(event) => setReceiver(event.target.value)} placeholder="0x..." spellCheck={false} />
      </div>

      <div className="token-tabs" role="tablist" aria-label="Payment token">
        {service.getPaymentTokenOptions().map((symbol) => (
          <button className={payToken === symbol ? 'active' : ''} type="button" key={symbol} onClick={() => chooseToken(symbol)}>
            <img src={walletKitConfig.tokens[symbol].icon} alt="" />
            <span>{symbol}</span>
          </button>
        ))}
      </div>

      <div className="quote-panel">
        <div>
          <span>Pay with</span>
          <strong>
            {quote?.tokenAmount || amountUsdt} {payToken}
          </strong>
        </div>
        <button className="icon-button" type="button" onClick={() => refreshQuote()} aria-label="Refresh quote">
          <ArrowDownUp size={18} />
        </button>
      </div>

      <div className="detail-list">
        <div>
          <span>Price</span>
          <strong>{quote?.price ? `1 MT = ${quote.price.price} USDT` : payToken === 'USDT' ? '1 USDT = 1 USDT' : 'Refresh quote'}</strong>
        </div>
        <div>
          <span>Price source</span>
          <strong>{quote?.price?.source || (payToken === 'USDT' ? 'Pegged' : 'Quote API')}</strong>
        </div>
        <div>
          <span>Receiver</span>
          <strong>{isAddress(normalizedReceiver) ? shortAddress(normalizedReceiver) : 'Required'}</strong>
        </div>
        <div>
          <span>Network</span>
          <strong>{walletKitConfig.chain.name}</strong>
        </div>
        {wallet && (
          <div>
            <span>Wallet</span>
            <strong>{shortAddress(wallet.address)}</strong>
          </div>
        )}
      </div>

      {hash && (
        <a className="tx-link" href={`${walletKitConfig.chain.blockExplorers?.default.url}/tx/${hash}`} target="_blank" rel="noreferrer">
          <ReceiptText size={16} />
          <span>{shortAddress(hash)}</span>
        </a>
      )}

      {error && <p className="sheet-error">{error}</p>}

      {records.length > 0 && (
        <div className="record-list">
          <span>Recent on-chain payments</span>
          {records.slice(0, 3).map((record) => (
            <a
              className="record-row"
              href={`${walletKitConfig.chain.blockExplorers?.default.url}/tx/${record.hash}`}
              target="_blank"
              rel="noreferrer"
              key={record.hash}
            >
              <strong>
                {record.amount} {record.token}
              </strong>
              <em>{record.status}</em>
              <small>{shortAddress(record.hash)}</small>
            </a>
          ))}
        </div>
      )}

      <button className={`pay-button ${payToken.toLowerCase()}`} type="button" disabled={!canSubmit || status === 'confirming'} onClick={submitPayment}>
        <img src={token.icon} alt="" />
        <span>{wallet ? `Pay ${payToken}` : 'Connect Wallet'}</span>
      </button>
    </section>
  );
}
