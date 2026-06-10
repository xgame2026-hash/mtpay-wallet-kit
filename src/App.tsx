import {
  ApiOutlined,
  CheckCircleOutlined,
  CloudServerOutlined,
  CodeOutlined,
  CreditCardOutlined,
  ExperimentOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  WalletOutlined
} from '@ant-design/icons';
import { ChevronRight, X } from 'lucide-react';
import { type CSSProperties, useEffect, useMemo, useState } from 'react';
import bannerImage from '../banner.png';
import { walletKitConfig } from './config/tokens';
import { assetUrls } from './core/assets';
import type { ConnectedWallet } from './core/types';
import { PaymentSheet } from './ui/PaymentSheet';
import { WalletModal } from './ui/WalletModal';
import { WalletManager } from './wallet/walletManager';

const responseFields = ['ok', 'chainId', 'receiver', 'wallet', 'token', 'invoiceAmountUsdt', 'tokenAmount', 'price', 'hash', 'status'];

const routes = [
  { path: '/about', label: '关于我们', icon: <SafetyCertificateOutlined /> },
  { path: '/mtpay', label: 'MT支付', icon: <CreditCardOutlined /> },
  { path: '/wallet-connect', label: '钱包链接', icon: <WalletOutlined /> }
];

const productModules = [
  {
    title: '专业钱包连接',
    text: '统一接入 OKX Wallet、TokenPocket、Binance Wallet、MetaMask，兼容桌面插件、移动端钱包浏览器和 BSC EIP-1193 Provider。',
    icon: <WalletOutlined />
  },
  {
    title: 'USDT / MT 支付',
    text: '业务只传入标价金额和收款地址，用户选择 USDT 或 MT，MTPAY 负责生成链上转账并返回确认结果。',
    icon: <CreditCardOutlined />
  },
  {
    title: '接入指南与测试',
    text: '提供前端组件、调用参数、返回 JSON、交易哈希、链上确认和测试流程，便于业务系统快速集成。',
    icon: <CodeOutlined />
  },
  {
    title: '高速 BSC RPC',
    text: '内置 https://rpc.supermt-quick.com 作为优先 RPC，并保留公开 BSC 节点 fallback，提高查询和确认稳定性。',
    icon: <CloudServerOutlined />
  }
];

const paymentFlow = [
  '业务传入 invoiceAmountUsdt 与 receiver',
  '用户选择 USDT 或 MT',
  'MT 通过配置的报价接口计算支付数量',
  '钱包签名 ERC20 transfer',
  '等待 BSC 链上确认并返回标准 JSON'
];

function getCurrentRoute() {
  const path = window.location.pathname;
  if (path === '/') return '/';
  return routes.some((route) => route.path === path) ? path : '/';
}

export function App() {
  const manager = useMemo(() => new WalletManager(walletKitConfig.chain), []);
  const [wallet, setWallet] = useState<ConnectedWallet>();
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [route, setRoute] = useState(getCurrentRoute);

  useEffect(() => {
    const handlePopstate = () => setRoute(getCurrentRoute());
    window.addEventListener('popstate', handlePopstate);
    return () => window.removeEventListener('popstate', handlePopstate);
  }, []);

  function navigate(path: string) {
    window.history.pushState(null, '', path);
    setRoute(path);
  }

  return (
    <main className="app-shell">
      <nav className="topbar">
        <button className="brand-mark" type="button" onClick={() => navigate('/')} aria-label="Go to MTPAY home">
          <img src={assetUrls.mtpay} alt="MT Pay" />
        </button>
        <div className="topnav" aria-label="Primary navigation">
          {routes.map((item) => (
            <button className={route === item.path ? 'active' : ''} type="button" key={item.path} onClick={() => navigate(item.path)}>
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {route === '/' && <HomePage onNavigate={navigate} onConnect={() => setWalletModalOpen(true)} />}
      {route === '/mtpay' && <PaymentPage wallet={wallet} onConnect={() => setWalletModalOpen(true)} />}
      {route === '/wallet-connect' && <WalletPage wallet={wallet} onConnect={() => setWalletModalOpen(true)} />}
      {route === '/about' && <AboutPage />}
      {route === '/usage' && <UsagePage />}

      <footer className="site-footer">© 2026 SuperMT. MTPAY wallet connection, payment, quote and RPC middleware.</footer>

      <WalletModal open={walletModalOpen} manager={manager} onClose={() => setWalletModalOpen(false)} onConnected={setWallet} />
    </main>
  );
}

function HomePage({ onNavigate, onConnect }: { onNavigate: (path: string) => void; onConnect: () => void }) {
  return (
    <>
      <section className="home-hero" style={{ '--hero-banner': `url(${bannerImage})` } as CSSProperties} aria-label="MTPAY banner" />

      <section className="home-intro">
        <div className="hero-copy">
          <span className="eyebrow">MTPAY for BSC Business Systems</span>
          <h1>让业务收款像一次签名一样清晰。</h1>
          <p>MTPAY 把钱包连接、USDT/MT 支付、链上确认和标准返回封装成一条可复用的收款路径，让业务系统专注订单本身。</p>
        </div>

        <div className="hero-action-panel">
          <div className="hero-signal-row" aria-label="MTPAY service signals">
            <span>
              <WalletOutlined />
              Wallet
            </span>
            <span>
              <ThunderboltOutlined />
              On-chain
            </span>
            <span>
              <SafetyCertificateOutlined />
              Confirmed
            </span>
          </div>
          <div className="hero-actions">
            <button className="primary-action" type="button" onClick={() => onNavigate('/mtpay')}>
              <CreditCardOutlined />
              测试 MT 支付
            </button>
            <button className="secondary-action" type="button" onClick={onConnect}>
              <WalletOutlined />
              Connect Wallet
            </button>
          </div>
        </div>
      </section>

      <section className="module-grid" aria-label="MTPAY core modules">
        {productModules.map((module) => (
          <article className="module-card" key={module.title}>
            <span>{module.icon}</span>
            <h2>{module.title}</h2>
            <p>{module.text}</p>
          </article>
        ))}
      </section>
    </>
  );
}

function PaymentPage({ wallet, onConnect }: { wallet?: ConnectedWallet; onConnect: () => void }) {
  return (
    <>
      <section className="workspace">
        <div className="product-panel">
          <span className="eyebrow">MT / USDT Payment</span>
          <h1>一笔订单，一次签名，收款直达链上。</h1>
          <p>
            业务系统传入标价金额和 receiver。用户选择 USDT 或 MT 后，MTPAY 完成数量计算、钱包签名、ERC20 转账和确认结果返回。
          </p>
          <div className="flow-list">
            {paymentFlow.map((item) => (
              <span key={item}>
                <CheckCircleOutlined />
                {item}
              </span>
            ))}
          </div>
        </div>

        <PaymentSheet wallet={wallet} onConnect={onConnect} />
      </section>

      <section className="developer-panel" aria-label="Developer calling instructions">
        <div>
          <span className="info-kicker">
            <ApiOutlined />
            API
          </span>
          <h3>Payment Call</h3>
        </div>
        <pre>{`const result = await mtpay.payMtAndConfirm(
  wallet,
  '100',              // invoiceAmountUsdt
  receiverAddress     // BSC receiver
)`}</pre>
        <div className="response-fields">
          {responseFields.map((field) => (
            <code key={field}>{field}</code>
          ))}
        </div>
      </section>
    </>
  );
}

const walletExamples = {
  react: {
    title: 'React 调用',
    text: '按下面三步接入，业务页面就能直接弹出 MTPAY 钱包选择框。',
    fileName: 'CheckoutWallet.tsx',
    steps: [
      { title: 'install', code: 'npm install mtpay-wallet-kit' },
      { title: 'import', code: `import { WalletManager, WalletModal, WalletButton } from 'mtpay-wallet-kit';
import 'mtpay-wallet-kit/style.css';` },
      { title: 'connect', code: '<WalletButton wallet={wallet} onClick={() => setOpen(true)} />' }
    ],
    code: `import { useMemo, useState } from 'react';
import { WalletManager, WalletModal, WalletButton } from 'mtpay-wallet-kit';
import 'mtpay-wallet-kit/style.css';
import { walletKitConfig } from './config/tokens';

export function CheckoutWallet() {
  const manager = useMemo(() => new WalletManager(walletKitConfig.chain), []);
  const [wallet, setWallet] = useState();
  const [open, setOpen] = useState(false);

  return (
    <>
      <WalletButton
        wallet={wallet}
        onClick={() => setOpen(true)}
        variant="solid"
        size="md"
      />
      <WalletModal
        open={open}
        manager={manager}
        size="md"
        variant="default"
        placement="center"
        labels={{ title: 'Connect Wallet', footerBrand: 'MTPAY' }}
        theme={{ accentColor: '#63e6be' }}
        onClose={() => setOpen(false)}
        onConnected={setWallet}
      />
    </>
  );
}`
  },
  vue: {
    title: 'Vue3 调用',
    text: 'Vue3 项目使用 SDK API 连接钱包，可自行渲染钱包列表或封装成业务弹框。',
    fileName: 'CheckoutWallet.vue',
    steps: [
      { title: 'install', code: 'npm install mtpay-wallet-kit' },
      { title: 'import', code: `import { WalletManager, detectWallets } from 'mtpay-wallet-kit';` },
      { title: 'connect', code: 'wallet.value = await manager.connect(selectedWallet);' }
    ],
    code: `<script setup lang="ts">
import { ref } from 'vue';
import { WalletManager, detectWallets } from 'mtpay-wallet-kit';
import { walletKitConfig } from './config/tokens';

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
  <button
    v-for="item in wallets"
    :key="item.id"
    @click="connect(item)"
  >
    {{ item.name }}
  </button>
</template>`
  }
};

function WalletPage({ wallet, onConnect }: { wallet?: ConnectedWallet; onConnect: () => void }) {
  const [activeExample, setActiveExample] = useState<'react' | 'vue'>('react');
  const currentExample = walletExamples[activeExample];

  return (
    <section className="page-panel wallet-connect-panel">
      <div className="wallet-connect-copy">
        <span className="info-kicker">
          <WalletOutlined />
          Wallet Connection
        </span>
        <h1>专业钱包链接服务</h1>

        <div className="guide-stack wallet-call-guide">
          <article className="wallet-example-card">
            <div className="code-workbench">
              <div className="wallet-example-tabs" role="tablist" aria-label="Wallet kit framework examples">
                <button
                  className={activeExample === 'react' ? 'active' : ''}
                  type="button"
                  role="tab"
                  aria-selected={activeExample === 'react'}
                  onClick={() => setActiveExample('react')}
                >
                  <CodeOutlined />
                  React
                </button>
                <button
                  className={activeExample === 'vue' ? 'active' : ''}
                  type="button"
                  role="tab"
                  aria-selected={activeExample === 'vue'}
                  onClick={() => setActiveExample('vue')}
                >
                  <ThunderboltOutlined />
                  Vue3
                </button>
              </div>

              <div className="code-window">
                <div className="code-window-bar">
                  <span className="window-dots" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                  <strong>{currentExample.fileName}</strong>
                  <em>{currentExample.title}</em>
                </div>

                <p>{currentExample.text}</p>

                <div className="snippet-grid">
                  {currentExample.steps.map((step, index) => (
                    <section className="snippet-card" key={step.title}>
                      <header>
                        <span>{String(index + 1).padStart(2, '0')}</span>
                        <strong>{step.title}</strong>
                      </header>
                      <pre className={index === 0 ? 'terminal-snippet' : ''}>{index === 0 ? `$ ${step.code}` : step.code}</pre>
                    </section>
                  ))}
                </div>

                <pre className="main-code-block">{currentExample.code}</pre>
              </div>
            </div>
          </article>
          <article>
            <h2>连接成功后如何使用</h2>
            <p>返回对象可以直接交给支付、签名、授权等后续业务。模块会在连接阶段校验 BNB Smart Chain。</p>
            <pre>{`const { address, chainId, wallet, provider } = connected;

await provider.request({
  method: 'eth_signTypedData_v4',
  params: [address, typedData]
});`}</pre>
            <div className="page-fields">
              {['address', 'chainId', 'wallet', 'provider'].map((field) => (
                <code key={field}>{field}</code>
              ))}
            </div>
          </article>
        </div>

        <button className="wallet-button primary" type="button" onClick={onConnect}>
          <WalletOutlined />
          {wallet ? wallet.address : '测试连接钱包'}
        </button>
      </div>

      <WalletConnectPreview />
    </section>
  );
}

function WalletConnectPreview() {
  const previewWallets = [
    { name: 'TokenPocket', icon: assetUrls.tokenPocket, status: 'INSTALLED' },
    { name: 'OKX Wallet', icon: assetUrls.okx, status: 'INSTALLED' },
    { name: 'MetaMask', icon: assetUrls.metamask, status: 'INSTALLED' },
    { name: 'Binance Wallet', icon: assetUrls.binance, status: 'APP' }
  ];

  return (
    <aside className="wallet-preview-pane" aria-label="Wallet modal preview">
      <div className="wallet-modal wallet-preview-card">
        <div className="modal-titlebar">
          <h2>Connect Wallet</h2>
          <span className="icon-button" aria-hidden="true">
            <X size={20} />
          </span>
        </div>

        <div className="wallet-list">
          {previewWallets.map((preview) => (
            <div className="wallet-row" key={preview.name}>
              <img src={preview.icon} alt="" />
              <span>{preview.name}</span>
              {preview.status === 'APP' ? <em>APP</em> : <strong>INSTALLED</strong>}
              <ChevronRight size={24} />
            </div>
          ))}
        </div>

        <footer className="wallet-footer">
          <span>UX by</span>
          <i>.</i>
          <i>/</i>
          <b>MTPAY</b>
        </footer>
      </div>
    </aside>
  );
}

function AboutPage() {
  return (
    <section className="page-panel">
      <span className="info-kicker">About MTPAY</span>
      <h1>面向 BSC 业务系统的支付与钱包中间件</h1>
      <p>
        MTPAY 的核心定位不是单个 DApp 页面，而是可被多个业务系统调用的基础设施组件。它把钱包连接、支付报价、交易发起、链上确认和结果返回封装成稳定流程。
      </p>
      <div className="detail-grid">
        <article>
          <h2>业务边界清晰</h2>
          <p>支付组件只接收 invoice amount 和 receiver，不绑定具体业务订单逻辑，不写死国库地址，不替业务系统决定订单状态。</p>
        </article>
        <article>
          <h2>链上记录完整</h2>
          <p>每笔支付都通过 ERC20 transfer 上链，返回 hash、blockNumber、status、tokenAmount 和 receiver，业务系统可自行保存和二次核验。</p>
        </article>
        <article>
          <h2>可扩展</h2>
          <p>当前支持 USDT 和 MT，后续可以扩展更多 token、swap、OTC 与独立收银台模式。</p>
        </article>
      </div>
    </section>
  );
}

function UsagePage() {
  return (
    <section className="page-panel usage-page">
      <span className="info-kicker">
        <ExperimentOutlined />
        Integration Guide
      </span>
      <h1>接入指南与测试说明</h1>
      <p>业务方接入 MTPAY 时，不需要处理钱包列表、报价接口、RPC fallback 或交易确认细节。调用方只需要准备金额、收款地址和业务订单号。</p>

      <div className="guide-stack">
        <article>
          <h2>1. 支付调用</h2>
          <pre>{`const result = await mtpay.payMtAndConfirm(
  wallet,
  '100',
  '0xReceiverAddress'
)`}</pre>
        </article>
        <article>
          <h2>2. 返回 JSON</h2>
          <pre>{`{
  ok: true,
  chainId: 56,
  receiver: '0x...',
  wallet: '0x...',
  token: 'MT',
  invoiceAmountUsdt: '100',
  tokenAmount: '1.704...',
  price: { source: 'quote-api', price: '58.68' },
  hash: '0x...',
  status: 'confirmed'
}`}</pre>
        </article>
        <article>
          <h2>3. 环境与 RPC</h2>
          <pre>{`VITE_BSC_RPC_URLS=https://rpc.supermt-quick.com,https://bsc-dataseed.binance.org
VITE_PRICE_PROXY_URL=/api/mt-price
supermtToken=0x...
PRICE_API_KEY=...`}</pre>
        </article>
      </div>

      <div className="module-grid compact">
        <article className="module-card">
          <span>
            <ThunderboltOutlined />
          </span>
          <h2>RPC 优先级</h2>
          <p>优先使用 SuperMT Quick RPC，失败后自动切到 BSC dataseed，支付确认和余额查询都使用同一策略。</p>
        </article>
        <article className="module-card">
          <span>
            <SafetyCertificateOutlined />
          </span>
          <h2>测试策略</h2>
          <p>先测试钱包连接，再测试 MT 报价，最后用小额 USDT/MT 完成链上 transfer，核对 hash 与 receiver。</p>
        </article>
      </div>
    </section>
  );
}
