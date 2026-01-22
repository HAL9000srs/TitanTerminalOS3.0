import { CurrencyCode } from '../types';

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, { symbol: string; locale: string; rate: number; name: string }> = {
  USD: { symbol: '$', locale: 'en-US', rate: 1, name: 'US Dollar' },
  EUR: { symbol: '€', locale: 'en-US', rate: 0.92, name: 'Euro' },
  GBP: { symbol: '£', locale: 'en-US', rate: 0.79, name: 'British Pound' },
  JPY: { symbol: '¥', locale: 'en-US', rate: 150.5, name: 'Japanese Yen' },
  CNY: { symbol: '¥', locale: 'en-US', rate: 7.21, name: 'Chinese Yuan' },
};

export const convertValue = (amount: number, toCurrency: CurrencyCode): number => {
  const rawValue = amount * SUPPORTED_CURRENCIES[toCurrency].rate;
  // Fixes the number to 2 decimals strings, then turns it back into a Number
  return Number(rawValue.toFixed(2));
};

export const formatValue = (amount: number, currency: CurrencyCode): string => {
  const { locale } = SUPPORTED_CURRENCIES[currency];
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2, // Forces 2 decimals (e.g. $10 -> $10.00)
    maximumFractionDigits: 2, // Limits to 2 decimals (e.g. $10.555 -> $10.56)
  }).format(amount);
};