import { fallback, http } from 'viem';
import { bsc } from './chains';

export function createBscTransport() {
  return fallback(
    bsc.rpcUrls.default.http.map((url: string) => http(url)),
    {
      retryCount: 2,
      retryDelay: 250
    }
  );
}
