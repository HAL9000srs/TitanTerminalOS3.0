import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { AssetManager } from './components/AssetManager';
import { AIAnalyst } from './components/AIAnalyst';
import { NewsFeed } from './components/NewsFeed';
import { TerminalConfig } from './components/TerminalConfig';
import { LoginScreen } from './components/LoginScreen';
import { TerminalBackground } from './components/TerminalBackground';
import { loadAssets, saveAssets, calculateSummary } from './services/storageService';
import { realtimeGateway } from './services/marketStreamService';
import { userService } from './services/userService';
import { supabase } from './services/supabase';
import { Asset, INITIAL_ASSETS, CurrencyCode, UserProfile } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [wsConnected, setWsConnected] = useState(false);

  // Check for existing session on mount + listen for auth changes
  useEffect(() => {
    // Restore session on load
    userService.getSession().then(session => {
      setUser(session);
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });

    // Listen for auth state changes (login/logout/token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN') {
        const session = await userService.getSession();
        setUser(session);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
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

           });
        }
     });

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

  const handleLogout = async () => {
    await userService.logout();
    setUser(null);
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

      default:
        return <Dashboard summary={summary} assets={assets} currency={currency} onCurrencyChange={setCurrency} />;
    }
  };

  if (isLoading) return null;

  // Auth gate: show login screen if no authenticated user
  if (!user) {
    return (
      <TerminalBackground>
        <LoginScreen onLogin={setUser} />
      </TerminalBackground>
    );
  }

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
