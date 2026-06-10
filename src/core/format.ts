import { formatUnits, parseUnits } from 'viem';

export function shortAddress(address?: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function decimalToUnits(value: string, decimals: number): bigint {
  if (!value || Number(value) <= 0) return 0n;
  return parseUnits(value, decimals);
}

export function unitsToDecimal(value: bigint, decimals: number, precision = 4): string {
  const formatted = formatUnits(value, decimals);
  const [whole, fraction = ''] = formatted.split('.');
  if (!fraction) return whole;
  return `${whole}.${fraction.slice(0, precision)}`.replace(/\.?0+$/, '');
}

export function multiplyDecimal(value: string, multiplier: string, precision = 18): string {
  const scaledValue = parseUnits(value || '0', precision);
  const scaledMultiplier = parseUnits(multiplier || '0', precision);
  return formatUnits((scaledValue * scaledMultiplier) / 10n ** BigInt(precision), precision);
}

export function divideDecimal(value: string, divisor: string, precision = 18): string {
  const scaledValue = parseUnits(value || '0', precision);
  const scaledDivisor = parseUnits(divisor || '1', precision);
  if (scaledDivisor === 0n) throw new Error('Cannot divide by zero');
  return formatUnits((scaledValue * 10n ** BigInt(precision)) / scaledDivisor, precision);
}
