# MTPAY Wallet Kit

MTPAY Wallet Kit is a wallet connection and payment SDK for BNB Smart Chain apps. It includes React UI components and framework-neutral APIs that can be used from Vue3 or other frontends.

## Install

```bash
npm install mtpay-wallet-kit
```

React projects should also import the bundled styles:

```ts
import 'mtpay-wallet-kit/style.css';
```

## React Usage

```tsx
import { useMemo, useState } from 'react';
import { WalletButton, WalletManager, WalletModal, walletKitConfig } from 'mtpay-wallet-kit';
import 'mtpay-wallet-kit/style.css';

export function CheckoutWallet() {
  const manager = useMemo(() => new WalletManager(walletKitConfig.chain), []);
  const [wallet, setWallet] = useState();
  const [open, setOpen] = useState(false);

  return (
    <>
      <WalletButton wallet={wallet} onClick={() => setOpen(true)} />
      <WalletModal open={open} manager={manager} onClose={() => setOpen(false)} onConnected={setWallet} />
    </>
  );
}
```

## Vue3 Usage

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { WalletManager, detectWallets, walletKitConfig } from 'mtpay-wallet-kit';

const manager = new WalletManager(walletKitConfig.chain);
const wallet = ref();
const wallets = ref([]);

async function openWallets() {
  wallets.value = await detectWallets();
}

async function connect(selectedWallet) {
  wallet.value = await manager.connect(selectedWallet);
}
</script>

<template>
  <button @click="openWallets">
    {{ wallet?.address || 'Connect Wallet' }}
  </button>

  <button v-for="item in wallets" :key="item.id" @click="connect(item)">
    {{ item.name }}
  </button>
</template>
```

## Payment Usage

```ts
import { PaymentService, walletKitConfig } from 'mtpay-wallet-kit';

const service = new PaymentService(walletKitConfig);

const result = await service.payMtAndConfirm(
  wallet,
  '100',
  '0xReceiverAddress'
);
```

Successful payment JSON includes `ok`, `chainId`, `receiver`, `wallet`, `token`, `invoiceAmountUsdt`, `tokenAmount`, `price`, `hash`, `blockNumber`, `status`, and `confirmedAt`.

## Environment

Configure BSC RPC and token addresses in the host app:

```bash
VITE_BSC_CHAIN_ID=56
VITE_BSC_RPC_URLS=https://rpc.supermt-quick.com,https://bsc-dataseed.binance.org
VITE_MT_TOKEN_ADDRESS=0x...
VITE_USDT_TOKEN_ADDRESS=0x...
VITE_PRICE_PROXY_URL=/api/mt-price
```

Keep price provider API keys on your backend. Do not expose private API keys through frontend `VITE_` variables.

## Local Development

```bash
npm install
npm run dev
npm run build
npm pack --dry-run
```

## License

MIT
