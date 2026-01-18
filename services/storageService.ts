import { Asset, INITIAL_ASSETS } from '../types';

const STORAGE_KEY = 'titan_terminal_assets';

export const loadAssets = (): Asset[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load assets from storage", e);
  }
  return INITIAL_ASSETS;
};

export const saveAssets = (assets: Asset[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
  } catch (e) {
    console.error("Failed to save assets to storage", e);
  }
};

export const calculateSummary = (assets: Asset[]) => {
  let totalValue = 0;
  let totalCost = 0;

  const typeMap = new Map<string, number>();

  assets.forEach(asset => {
    const value = asset.quantity * asset.currentPrice;
    const cost = asset.quantity * asset.avgPrice;
    totalValue += value;
    totalCost += cost;

    const currentTypeTotal = typeMap.get(asset.type) || 0;
    typeMap.set(asset.type, currentTypeTotal + value);
  });

  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

  const allocation = Array.from(typeMap.entries()).map(([name, value]) => ({
    name,
    value
  }));

  return {
    totalValue,
    totalCost,
    totalGainLoss,
    totalGainLossPercent,
    allocation
  };
};