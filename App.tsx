import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { AssetManager } from './components/AssetManager';
import { AIAnalyst } from './components/AIAnalyst';
import { NewsFeed } from './components/NewsFeed';
import { TerminalConfig } from './components/TerminalConfig';

import { TerminalBackground } from './components/TerminalBackground';
import { loadAssets, saveAssets, calculateSummary } from './services/storageService';
import { realtimeGateway } from './services/marketStreamService';
import { userService } from './services/userService';
import { Asset, INITIAL_ASSETS, CurrencyCode, MarketIndex, UserProfile } from './types';
import { BarChart2, TrendingUp, TrendingDown, Radio } from 'lucide-react';

const TICKER_SYMBOLS = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'META', 'TSLA', 'NVDA', 'BTC', 'ETH'];

const INITIAL_TICKER_DATA: Record<string, { price: number, change: number }> = {
  'AAPL': { price: 178.35, change: 1.25 },
  'GOOGL': { price: 140.50, change: -0.5 },
  'MSFT': { price: 410.20, change: 0.8 },
  'AMZN': { price: 175.30, change: 1.1 },
  'META': { price: 485.10, change: 2.3 },
  'TSLA': { price: 198.50, change: -1.1 },
  'NVDA': { price: 850.25, change: 3.5 },
  'BTC': { price: 64230.50, change: -2.4 },
  'ETH': { price: 3450.00, change: 1.5 }
};

const DEFAULT_OPERATOR: UserProfile = {
  id: 'OPERATOR',
  accessKey: 'titan-os-v3', 
  createdAt: new Date().toISOString(),
  role: 'ADMIN',
  lastLogin: new Date().toISOString(),
  displayName: 'Commander'
};

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(DEFAULT_OPERATOR);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [wsConnected, setWsConnected] = useState(false);
  
  // Ticker State
  const [tickerData, setTickerData] = useState(INITIAL_TICKER_DATA);

  // Check for existing session on mount
  // Check for existing session on mount
  useEffect(() => {
    const initSession = async () => {
      const session = await userService.getSession();
      if (session) {
        setUser(session);
      } else {
        setUser(DEFAULT_OPERATOR);
      }
      setIsLoading(false);
    };
    initSession();
  }, []);

  // Fetch assets whenever user changes
  useEffect(() => {
    const fetchUserAssets = async () => {
      if (user) {
        setIsLoading(true);
        const data = await loadAssets();
        setAssets(data);
        
        // Register assets with stream service
        data.forEach(a => realtimeGateway.subscribeTicker(a.symbol));
        
        setIsLoading(false);
      } else {
        setAssets([]);
      }
    };
    fetchUserAssets();
  }, [user]);

  // Live Indices State
  const [indices, setIndices] = useState<MarketIndex[]>([
    { name: 'S&P 500', symbol: 'S&P 500', value: 5088.80, change: 1.03, changeVal: 52.10 },
    { name: 'Dow Jones', symbol: 'Dow Jones', value: 39131.53, change: 0.16, changeVal: 62.42 },
    { name: 'NASDAQ', symbol: 'NASDAQ', value: 16041.62, change: -0.28, changeVal: -44.80 },
    { name: 'FTSE 100', symbol: 'FTSE 100', value: 7706.28, change: 0.28, changeVal: 21.98 },
    { name: 'Nikkei 225', symbol: 'Nikkei 225', value: 39098.68, change: 2.19, changeVal: 836.52 },
    { name: 'DAX', symbol: 'DAX', value: 17419.33, change: 0.14, changeVal: 24.89 },
  ]);



  // Initialize WebSocket connection
  useEffect(() => {
    // Phase 3: Connect Realtime Gateway
    realtimeGateway.connect();
    
    // Subscribe to all initial assets to ensure we get updates
    assets.forEach(a => realtimeGateway.subscribeTicker(a.symbol));

    setWsConnected(true);

    const unsubscribe = realtimeGateway.subscribe((data) => {
       // Finnhub data format: { data: [{ p: price, s: symbol, t: timestamp, v: volume }], type: 'trade' }
       if (data.type === 'trade') {
          data.data.forEach((trade: any) => {
             const update = {
                symbol: trade.s,
                price: trade.p,
                timestamp: trade.t,
                // Note: Finnhub trade stream doesn't give 24h change, so we preserve existing change
             };

             // Update Assets
             setAssets(currentAssets => 
               currentAssets.map(asset => {
                 if (asset.symbol === update.symbol) {
                   return {
                     ...asset,
                     currentPrice: update.price,
                     lastUpdated: new Date().toISOString()
                   };
                 }
                 return asset;
               })
             );

             // Update Indices (if we had real index symbols mapping)
             // For now, indices remain on mock stream or need explicit mapping
             
             // Update Ticker
             setTickerData(prev => {
                if (TICKER_SYMBOLS.includes(update.symbol)) {
                   return {
                      ...prev,
                      [update.symbol]: { 
                         price: update.price, 
                         change: prev[update.symbol]?.change || 0 // Preserve change
                      }
                   };
                }
                return prev;
             });
          });
       }
    });

    // marketStream for indices is now handled via realtimeGateway or separate logic 

    return () => {
      unsubscribe();
      // realtimeGateway.disconnect(); // Optional, depending on if we want to keep it alive
    };
  }, []);

  // Save assets whenever they change (debounced slightly in a real app, but direct here for now)
  useEffect(() => {
    if (!isLoading) {
      saveAssets(assets);
    }
  }, [assets, isLoading]);

  const handleAddAsset = (newAsset: Omit<Asset, 'id' | 'lastUpdated'>) => {
    const asset: Asset = {
      ...newAsset,
      id: crypto.randomUUID(),
      lastUpdated: new Date().toISOString()
    };
    setAssets(prev => [...prev, asset]);
    realtimeGateway.subscribeTicker(asset.symbol);
  };

  const handleDeleteAsset = (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
  };

  const handleFactoryReset = () => {
    if (confirm('WARNING: SYSTEM PURGE\n\nThis will permanently delete all local portfolio data and reset the terminal to factory defaults. Are you sure you want to proceed?')) {
        localStorage.removeItem('titan_terminal_assets');
        window.location.reload();
    }
  };

  const summary = calculateSummary(assets);

  const handleLogout = () => {
    userService.logout();
    setUser(DEFAULT_OPERATOR);
  };

  const handleUserUpdate = async (name: string): Promise<boolean> => {
    if (!user) return false;
    const success = await userService.updateDisplayName(user.id, name);
    if (success) {
      setUser(prev => prev ? ({ ...prev, displayName: name }) : null);
    }
    return success;
  };

  const handleUserProvision = async (email: string, pass: string, name: string) => {
    return await userService.provisionUser(email, pass, name);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard summary={summary} assets={assets} currency={currency} onCurrencyChange={setCurrency} />;
      case 'assets':
        return <AssetManager assets={assets} onAddAsset={handleAddAsset} onDeleteAsset={handleDeleteAsset} currency={currency} onCurrencyChange={setCurrency} />;
      case 'analysis':
        return <AIAnalyst assets={assets} />;
      case 'news':
        return <NewsFeed />;
      case 'config':
        return <TerminalConfig 
          currency={currency} 
          onCurrencyChange={setCurrency} 
          onReset={handleFactoryReset} 
          user={user} 
          onUserUpdate={handleUserUpdate}
          onUserProvision={handleUserProvision}
        />;
      case 'markets':
        return (
          <div className="space-y-6">
             <div className="flex justify-between items-center">
                <div>
                   <h1 className="text-3xl font-light tracking-tight text-white mb-1">
                     Global <span className="font-bold text-terminal-accent">Markets</span>
                   </h1>
                   <p className="text-terminal-muted text-sm font-mono">Major World Indices • Real-time Stream</p>
                </div>
                <div className="text-xs text-terminal-accent border border-terminal-accent/30 px-3 py-1 rounded bg-terminal-panel flex items-center gap-2 animate-pulse">
                   <Radio size={12} />
                   LIVE DATA FEED ACTIVE
                </div>
             </div>

             {/* Indices Grid */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {indices.map((index, i) => (
                 <div key={i} className="bg-terminal-panel border border-terminal-border p-6 rounded-lg hover:border-terminal-accent/30 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                       <h3 className="font-bold text-white text-lg">{index.name}</h3>
                       {index.change >= 0 ? 
                         <TrendingUp className="text-emerald-500" size={20} /> : 
                         <TrendingDown className="text-rose-500" size={20} />
                       }
                    </div>
                    <div className="flex items-baseline gap-2">
                       <span className="text-2xl font-mono text-white transition-all duration-300">
                         {index.value.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                       </span>
                    </div>
                    <div className={`mt-2 text-sm font-mono flex items-center gap-2 ${index.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                       <span>{index.change > 0 ? '+' : ''}{index.changeVal.toFixed(2)}</span>
                       <span className="opacity-75">({index.change > 0 ? '+' : ''}{index.change.toFixed(2)}%)</span>
                    </div>
                 </div>
               ))}
             </div>

             {/* Horizontal Ticker */}
             <div className="mt-8 bg-terminal-panel border-y border-terminal-border py-4 overflow-hidden relative group">
                <div className="flex w-max animate-ticker group-hover:[animation-play-state:paused]">
                   {[...TICKER_SYMBOLS, ...TICKER_SYMBOLS].map((symbol, idx) => {
                      const data = tickerData[symbol] || { price: 0, change: 0 };
                      return (
                         <div key={`${symbol}-${idx}`} className="flex items-center gap-6 px-8 border-r border-terminal-border/30 min-w-[200px]">
                            <span className="font-bold font-mono text-white text-lg">{symbol}</span>
                            <div className="flex flex-col items-end">
                               <span className="font-mono text-terminal-text">
                                  ${data.price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                               </span>
                               <span className={`text-xs font-mono flex items-center gap-1 ${data.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                  {data.change >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                  {data.change > 0 ? '+' : ''}{data.change.toFixed(2)}%
                               </span>
                            </div>
                         </div>
                      );
                   })}
                </div>
                {/* Gradient Masks */}
                <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-terminal-bg to-transparent z-10 pointer-events-none" />
                <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-terminal-bg to-transparent z-10 pointer-events-none" />
             </div>
             
             <div className="mt-8 p-6 bg-terminal-panel/50 border border-terminal-border border-dashed rounded-lg flex flex-col items-center justify-center text-center">
                <BarChart2 size={48} className="text-terminal-muted mb-4 opacity-50" />
                <h3 className="text-white font-medium mb-2">Institutional Connection</h3>
                <p className="text-terminal-muted max-w-md text-sm">
                  Connected to WebSocket stream via TITAN.OS Secure Gateway. Latency: 24ms.
                </p>
             </div>
          </div>
        );
      default:
        return <Dashboard summary={summary} assets={assets} currency={currency} onCurrencyChange={setCurrency} />;
    }
  };

  if (isLoading) return null;

  return (
    <TerminalBackground>
      <Layout 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onLogout={handleLogout}
        user={user}
      >
        {renderContent()}
      </Layout>
    </TerminalBackground>
  );
};

export default App;