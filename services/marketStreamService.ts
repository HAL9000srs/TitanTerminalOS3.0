import { MarketUpdate, MarketIndex } from '../types';

type MarketListener = (update: MarketUpdate) => void;

// Initial values for simulation including Indices and Major Stocks
const INITIAL_MARKET_DATA: Record<string, number> = {
  // Indices
  'S&P 500': 5088.80,
  'Dow Jones': 39131.53,
  'NASDAQ': 16041.62,
  'FTSE 100': 7706.28,
  'Nikkei 225': 39098.68,
  'DAX': 17419.33,
  // Tech / Major Stocks
  'AAPL': 178.35,
  'GOOGL': 140.50,
  'MSFT': 410.20,
  'AMZN': 175.30,
  'META': 485.10,
  'TSLA': 198.50,
  'NVDA': 850.25,
  'BTC': 64230.50,
  'ETH': 3450.00
};

const TRACKED_SYMBOLS = Object.keys(INITIAL_MARKET_DATA);

class MarketStreamService {
  private listeners: MarketListener[] = [];
  private intervalId: number | null = null;
  private currentPrices: Map<string, number> = new Map();
  private isConnected: boolean = false;

  constructor() {
    // Initialize base prices
    Object.entries(INITIAL_MARKET_DATA).forEach(([key, val]) => this.currentPrices.set(key, val));
  }

  // Simulate WebSocket Connection
  public connect() {
    if (this.isConnected) return;
    
    console.log("Establishling secure WebSocket connection to TITAN Market Feed...");
    this.isConnected = true;

    // Simulate incoming ticks
    this.intervalId = window.setInterval(() => {
      this.emitRandomTick();
    }, 400); // Increased frequency for more lively ticker (400ms)
  }

  public disconnect() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isConnected = false;
  }

  public subscribe(listener: MarketListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private emitRandomTick() {
    if (!this.isConnected) return;

    // Pick a random symbol to update
    const symbol = TRACKED_SYMBOLS[Math.floor(Math.random() * TRACKED_SYMBOLS.length)];
    
    const volatility = symbol === 'BTC' || symbol === 'ETH' ? 0.002 : 0.0005; 
    const changePercent = (Math.random() - 0.5) * volatility;
    
    let price = this.currentPrices.get(symbol) || 100;
    
    // Update price
    price = price * (1 + changePercent);
    this.currentPrices.set(symbol, price);

    const update: MarketUpdate = {
      symbol,
      price,
      change: price * changePercent,
      changePercent: changePercent * 100,
      timestamp: Date.now()
    };

    this.notifyListeners(update);
  }

  private notifyListeners(update: MarketUpdate) {
    this.listeners.forEach(listener => listener(update));
  }

  // Helper to initialize asset prices in the service so the walk starts correctly
  public registerAsset(symbol: string, initialPrice: number) {
    if (!this.currentPrices.has(symbol)) {
      this.currentPrices.set(symbol, initialPrice);
    }
  }
}

export const marketStream = new MarketStreamService();