import type { Hash } from 'viem';
import type { PaymentRecord } from '../core/types';

const storageKey = 'mt-wallet-kit-payment-records';

type StoredPaymentRecord = Omit<PaymentRecord, 'blockNumber'> & {
  blockNumber?: string;
};

function serialize(record: PaymentRecord): StoredPaymentRecord {
  return {
    ...record,
    blockNumber: record.blockNumber?.toString()
  };
}

function deserialize(record: StoredPaymentRecord): PaymentRecord {
  return {
    ...record,
    blockNumber: record.blockNumber ? BigInt(record.blockNumber) : undefined
  };
}

export class PaymentRecordService {
  list(): PaymentRecord[] {
    if (typeof window === 'undefined') return [];

    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as StoredPaymentRecord[];
      return parsed.map(deserialize);
    } catch {
      return [];
    }
  }

  upsert(record: PaymentRecord): PaymentRecord[] {
    if (typeof window === 'undefined') return [record];

    const records = this.list();
    const index = records.findIndex((item) => item.hash.toLowerCase() === record.hash.toLowerCase());
    const nextRecords =
      index >= 0 ? records.map((item, itemIndex) => (itemIndex === index ? record : item)) : [record, ...records].slice(0, 50);

    window.localStorage.setItem(storageKey, JSON.stringify(nextRecords.map(serialize)));
    return nextRecords;
  }

  update(hash: Hash, patch: Partial<PaymentRecord>): PaymentRecord[] {
    const records = this.list();
    const current = records.find((item) => item.hash.toLowerCase() === hash.toLowerCase());
    if (!current) return records;
    return this.upsert({ ...current, ...patch });
  }
}
