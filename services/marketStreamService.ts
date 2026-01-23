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

  private newsInterval: any = null;

  connect() {
    if (this.socket?.readyState === WebSocket.OPEN) return;

    this.socket = new WebSocket(WS_URL);

    this.socket.onopen = () => {
      console.log('⚡ TITAN.OS: Secure Uplink Established');
      this.reconnectAttempts = 0;
      this.resubscribeAll();
      this.startNewsStream(); // Start the simulated news feed
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
      this.stopNewsStream();
    };
  }

  // Future Upgrade: To implement real-time news, you would replace this simulation
  // with a connection to Finnhub's General News endpoint (REST polling or distinct socket channel).
  // Endpoint: GET /news?category=general
  private startNewsStream() {
    if (this.newsInterval) return;
    
    // Simulate incoming financial wire
    this.newsInterval = setInterval(() => {
        const mockNews = [
            { headline: "Fed Chairman Powell Signals Possible Rate Cut in Q3", source: "Bloomberg", summary: "Federal Reserve officials discuss monetary easing strategies amid cooling inflation metrics." },
            { headline: "Tech Sector Rally Continues as AI Demand Surges", source: "Reuters", summary: "Major chipmakers see record volumes as data center expansion accelerates globally." },
            { headline: "Oil Prices Stabilize After Volatile Week", source: "CNBC", summary: "Crude futures find support near $80/barrel following OPEC+ production announcements." },
            { headline: "Bitcoin Breaks Key Resistance Level at $65k", source: "CoinDesk", summary: "Institutional inflows via ETFs drive crypto market sentiment higher." },
            { headline: "ECB President Lagarde Comments on Eurozone Growth", source: "Financial Times", summary: "European Central Bank maintains cautious outlook for fiscal year 2026." },
            { headline: "Tesla Gigafactory Expansion Plans Leaked", source: "The Verge", summary: "Internal documents suggest new manufacturing hub planned for Southeast Asia." },
            { headline: "Apple Unveils New Vision Pro Enterprise Features", source: "TechCrunch", summary: "Spatial computing platform targets corporate adoption with new software suite." },
            { headline: "Goldman Sachs Raises S&P 500 Year-End Target", source: "WSJ", summary: "Analysts cite resilient consumer spending and corporate earnings growth." }
        ];

        const randomNews = mockNews[Math.floor(Math.random() * mockNews.length)];
        
        // Broadcast as if it came from the socket
        this.notifySubscribers({
            type: 'news',
            id: crypto.randomUUID(),
            headline: randomNews.headline,
            summary: randomNews.summary,
            source: randomNews.source,
            url: '#', // Placeholder for real link
            datetime: Date.now() / 1000
        });

    }, 8000); // New headline every 8 seconds
  }

  private stopNewsStream() {
    if (this.newsInterval) {
        clearInterval(this.newsInterval);
        this.newsInterval = null;
    }
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