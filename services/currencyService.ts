import { CurrencyCode } from '../types';

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, { symbol: string; locale: string; rate: number; name: string }> = {
  USD: { symbol: '$', locale: 'en-US', rate: 1, name: 'US Dollar' },
  EUR: { symbol: '€', locale: 'de-DE', rate: 0.92, name: 'Euro' },
  GBP: { symbol: '£', locale: 'en-GB', rate: 0.79, name: 'British Pound' },
  JPY: { symbol: '¥', locale: 'ja-JP', rate: 150.5, name: 'Japanese Yen' },
  CNY: { symbol: '¥', locale: 'zh-CN', rate: 7.21, name: 'Chinese Yuan' },
};

export const convertValue = (amount: number, toCurrency: CurrencyCode): number => {
  return amount * SUPPORTED_CURRENCIES[toCurrency].rate;
};

export const formatValue = (amount: number, currency: CurrencyCode): string => {
  const { locale } = SUPPORTED_CURRENCIES[currency];
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};