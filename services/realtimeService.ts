import { Asset } from '../types';

const API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;
const WS_URL = `wss://ws.finnhub.io?token=${API_KEY}`;

type Subscriber = (data: any) => void;

class RealtimeService {
  private socket: WebSocket | null = null;
  private subscribers: Subscriber[] = [];
  private reconnectAttempts = 0;
  private activeSubscriptions: Set<string> = new Set();
  
  // Rate limit protection
  private lastUpdate = 0;
  private updateThreshold = 1000; // 1 second throttle

  connect() {
    if (this.socket?.readyState === WebSocket.OPEN) return;

    this.socket = new WebSocket(WS_URL);

    this.socket.onopen = () => {
      console.log('⚡ TITAN.OS: Secure Uplink Established');
      this.reconnectAttempts = 0;
      this.resubscribeAll();
    };

    this.socket.onmessage = (event) => {
      // Finnhub sends data like: {"data":[{"p":178.35,"s":"AAPL","t":1634567890,"v":100}],"type":"trade"}
      const data = JSON.parse(event.data);
      this.notifySubscribers(data);
    };

    this.socket.onclose = () => {
      console.warn('⚡ TITAN.OS: Uplink Severed. Retrying...');
      this.reconnectAttempts++;
      const timeout = Math.min(1000 * (2 ** this.reconnectAttempts), 30000); // Exponential backoff
      setTimeout(() => this.connect(), timeout);
    };
  }

  // Subscribe to a specific ticker (works for Stocks 'AAPL', Forex 'BINANCE:BTCUSDT', etc.)
  subscribeTicker(symbol: string) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        // If not connected, just add to active set so it handles on open
        this.activeSubscriptions.add(symbol);
        return;
    }
    
    // Finnhub format example
    this.socket.send(JSON.stringify({ type: 'subscribe', symbol: symbol }));
    this.activeSubscriptions.add(symbol);
  }

  // Handle Forex pairs (e.g. "OANDA:EUR_USD")
  subscribeForex(from: string, to: string) {
    // Provider specific mapping needed here if sticking strictly to Finnhub forex symbols
    // detailed mapping might be needed, but sticking to the user's placeholder for now
    const symbol = `IC MARKETS:1`; // Example mapping from user request
    this.subscribeTicker(symbol); 
  }

  subscribe(callback: Subscriber) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== callback);
    };
  }

  private notifySubscribers(data: any) {
    // Throttle high-frequency trading data to prevent UI freezes
    const now = Date.now();
    if (now - this.lastUpdate < this.updateThreshold && data.type !== 'news') return;
    
    this.subscribers.forEach(sub => sub(data));
    this.lastUpdate = now;
  }

  private resubscribeAll() {
    this.activeSubscriptions.forEach(symbol => {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
             this.socket.send(JSON.stringify({ type: 'subscribe', symbol: symbol }));
        }
    });
  }
}

export const realtimeGateway = new RealtimeService();
