import React, { useEffect, useState } from 'react';
import { Asset, PortfolioSummary, CurrencyCode, PortfolioSnapshot } from '../types';
import { convertValue, formatValue, SUPPORTED_CURRENCIES } from '../services/currencyService';
import { getPortfolioHistory } from '../services/storageService';
import { ResponsiveContainer, Tooltip as RechartsTooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Activity, Globe, ChevronDown, AlertCircle } from 'lucide-react';

interface DashboardProps {
  summary: PortfolioSummary;
  assets: Asset[];
  currency: CurrencyCode;
  onCurrencyChange: (code: CurrencyCode) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ summary, assets, currency, onCurrencyChange }) => {
  const [historyData, setHistoryData] = useState<{name: string, value: number}[]>([]);
  
  const getConvertedSummary = () => {
    return {
      totalValue: convertValue(summary.totalValue, currency),
      totalGainLoss: convertValue(summary.totalGainLoss, currency),
    };
  };

  const convertedStats = getConvertedSummary();

  // Calculate dynamic Top Performer
  const topPerformer = assets.length > 0 
    ? assets.reduce((prev, current) => (prev.change24h > current.change24h) ? prev : current, assets[0])
    : null;

  // Fetch Historical Data from n8n-populated table
  useEffect(() => {
    const fetchHistory = async () => {
      if (assets.length === 0) return;

      const snapshots = await getPortfolioHistory(30);
      
      if (snapshots.length > 0) {
        // Transform DB snapshots into Chart Data
        const chartData = snapshots.map(snap => {
          const date = new Date(snap.snapshot_date);
          return {
            name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            value: convertValue(snap.total_value, currency) // Convert historical value to selected currency
          };
        });
        setHistoryData(chartData);
      } else {
        // Fallback: If n8n hasn't run yet, generate a single "today" point
        setHistoryData([
          { 
            name: 'Today', 
            value: convertValue(summary.totalValue, currency) 
          }
        ]);
      }
    };

    fetchHistory();
  }, [assets, currency, summary.totalValue]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-white mb-1">
            Portfolio <span className="font-bold text-terminal-accent">Overview</span>
          </h1>
          <p className="text-terminal-muted text-sm font-mono">LAST UPDATE: {new Date().toLocaleTimeString()} UTC</p>
        </div>
        <div className="flex gap-4 items-center">
           <div className="relative group">
              <select 
                value={currency}
                onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
                className="appearance-none bg-terminal-panel border border-terminal-border text-white px-4 py-1.5 pr-8 rounded font-mono text-sm focus:outline-none focus:border-terminal-accent cursor-pointer hover:border-terminal-muted"
              >
                {Object.keys(SUPPORTED_CURRENCIES).map((code) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-terminal-muted pointer-events-none" />
           </div>

           <span className="px-3 py-1 rounded bg-terminal-accent/10 text-terminal-accent border border-terminal-accent/20 text-xs font-mono flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-terminal-accent animate-pulse"></div>
             SYSTEM ONLINE
           </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Worth */}
        <div className="bg-terminal-panel border border-terminal-border p-5 rounded-lg relative overflow-hidden group hover:border-terminal-accent/50 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign size={48} />
          </div>
          <p className="text-terminal-muted text-xs font-mono uppercase tracking-widest mb-1">Net Worth</p>
          <div className="text-3xl font-mono font-medium text-white tracking-tight">
            {formatValue(convertedStats.totalValue, currency)}
          </div>
          <div className="mt-2 text-xs text-terminal-muted flex items-center gap-1">
            <span className="text-emerald-500 font-mono">
              {assets.length > 0 ? '+2.40%' : '0.00%'}
            </span>
            <span>vs last month</span>
          </div>
        </div>

        {/* Total PnL */}
        <div className="bg-terminal-panel border border-terminal-border p-5 rounded-lg relative overflow-hidden group hover:border-terminal-accent/50 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity size={48} />
          </div>
          <p className="text-terminal-muted text-xs font-mono uppercase tracking-widest mb-1">Total PnL</p>
          <div className={`text-3xl font-mono font-medium tracking-tight ${convertedStats.totalGainLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {convertedStats.totalGainLoss >= 0 ? '+' : ''}{formatValue(convertedStats.totalGainLoss, currency)}
          </div>
          <div className="mt-2 text-xs text-terminal-muted flex items-center gap-1">
             <span className={`font-mono ${convertedStats.totalGainLoss >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
               {summary.totalGainLossPercent.toFixed(2)}%
             </span>
            <span>all time</span>
          </div>
        </div>

        {/* Top Performer - BLANK IF NO ASSETS */}
        <div className="bg-terminal-panel border border-terminal-border p-5 rounded-lg relative overflow-hidden group hover:border-terminal-accent/50 transition-colors">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Globe size={48} />
          </div>
          <p className="text-terminal-muted text-xs font-mono uppercase tracking-widest mb-1">Top Performer</p>
          <div className="text-2xl md:text-3xl font-mono font-medium text-white">
            {topPerformer ? topPerformer.symbol : '—'}
          </div>
          <div className="mt-2 text-xs text-terminal-muted flex items-center gap-1">
            {topPerformer ? (
              <>
                <span className="text-emerald-500 font-mono">+{topPerformer.change24h.toFixed(2)}%</span>
                <span>24h change</span>
              </>
            ) : (
               <span className="text-terminal-muted">No assets active</span>
            )}
          </div>
        </div>

        {/* Risk Score - BLANK IF NO ASSETS */}
        <div className="bg-terminal-panel border border-terminal-border p-5 rounded-lg relative overflow-hidden group hover:border-terminal-accent/50 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp size={48} />
          </div>
          <p className="text-terminal-muted text-xs font-mono uppercase tracking-widest mb-1">Risk Score</p>
          <div className="text-2xl md:text-3xl font-mono font-medium text-amber-400">
             {assets.length > 0 ? '42/100' : '—'}
          </div>
          <div className="mt-2 text-xs text-terminal-muted flex items-center gap-1">
             {assets.length > 0 ? (
               <>
                 <span className="text-terminal-text">Moderate</span>
                 <span>- AI Assessment</span>
               </>
             ) : (
                <span className="text-terminal-muted">Awaiting data</span>
             )}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="bg-terminal-panel border border-terminal-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-white flex items-center gap-2">
              <Activity size={18} className="text-terminal-accent" />
              Portfolio Growth
            </h3>
          </div>
          <div style={{ width: '100%', height: 300, position: 'relative' }}>
             {assets.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" stroke="#52525b" tick={{fill: '#71717a', fontSize: 12}} tickLine={false} axisLine={false} />
                    <YAxis stroke="#52525b" tick={{fill: '#71717a', fontSize: 12}} tickLine={false} axisLine={false} tickFormatter={(val) => `${SUPPORTED_CURRENCIES[currency].symbol}${val < 1000 ? val : (val/1000).toFixed(0) + 'k'}`} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                      itemStyle={{ color: '#00dc82' }}
                      formatter={(value: number) => formatValue(value, currency)}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#00dc82" 
                      strokeWidth={2} 
                      dot={{ fill: '#121214', stroke: '#00dc82', strokeWidth: 2, r: 4 }} 
                      activeDot={{ r: 6, fill: '#00dc82' }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
             ) : (
                <div className="flex flex-col items-center justify-center h-full text-terminal-muted/50 gap-4">
                   <AlertCircle size={48} />
                   <p className="font-mono text-sm">INITIALIZE ASSETS TO GENERATE CHART DATA</p>
                </div>
             )}
          </div>
        </div>
    </div>
  );
};