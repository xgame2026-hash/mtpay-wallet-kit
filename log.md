# MTPAY Changelog

## 2026-06-10
- Added BSC RPC fallback transport with `https://rpc.supermt-quick.com` as the first RPC endpoint and Binance dataseed as fallback.
- Published mtpay.ai with Caddy release path `/var/www/mtpay.ai/current`, added `mtpay-api.service`, and exposed `/api/ave/mt-price` for same-domain Ave.ai MT pricing.
- Split top navigation into independent frontend pages: `/about`, `/usage`, `/mtpay`, and `/wallet-connect`; logo click now returns to `/mtpay`.
- Updated MT payment UI to accept only invoice amount and receiver address from the caller instead of relying on a hardcoded treasury receiver.

- Built the first reusable MTPAY wallet/payment middleware demo.
- Added self-developed wallet connection UI for TokenPocket, OKX Wallet, MetaMask, and Binance Wallet.
- Integrated Ave.ai price proxy for live MT/USDT pricing without exposing the API key to the browser.
- Added USDT and MT payment flow to a configurable BSC receiver address.
- Added confirmed transaction JSON output support through `PaymentService.payAndConfirm()`.
- Added MTPAY title, favicon, iPad/apple touch icon, and web manifest assets from `MT_logo.png`.
- Added compact wallet modal styling, mobile responsive layout, and animated payment button border fallback.
- Added About, Usage, and Changelog sections to the local demo page.
- Reframed the demo as a technical middleware page focused on two modules: MT Payment and Wallet Connect.
- Added developer calling instructions and standard JSON response field references to the page.
- Added Ant Design as the third-party style foundation and Ant Design Icons for technical module labels.
