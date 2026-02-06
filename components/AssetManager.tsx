import React, { useState, useEffect } from 'react';
import { Asset, AssetType, CurrencyCode } from '../types';
import { convertValue, formatValue, SUPPORTED_CURRENCIES } from '../services/currencyService';
import { researchMarketWithGemini } from '../services/geminiService';
import { Plus, Trash2, Search, Filter, ChevronDown, Building2, Bitcoin, Gem, Banknote, Briefcase, Landmark, Layers, X, TrendingUp, TrendingDown, Activity, Sparkles, Loader2, ExternalLink, Globe } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from 'recharts';

interface AssetManagerProps {
  assets: Asset[];
  onAddAsset: (asset: Omit<Asset, 'id' | 'lastUpdated'>) => void;
  onDeleteAsset: (id: string) => void;
  currency: CurrencyCode;
  onCurrencyChange: (code: CurrencyCode) => void;
}

const CustomChartTooltip = ({ active, payload, label, currency }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-terminal-panel border border-terminal-border p-3 rounded shadow-[0_0_15px_rgba(0,0,0,0.5)] backdrop-blur-md bg-opacity-95 min-w-[150px] animate-in fade-in zoom-in-95 duration-100 z-50">
        <p className="text-terminal-muted text--[10px] font-mono mb-1.5 uppercase tracking-wider border-b border-terminal-border pb-1">
          {new Date(label).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
        </p>
        <div className="flex items-center justify-between gap-4">
           <span className="text-[10px] text-terminal-accent font-mono uppercase">Value</span>
           <span className="text-white font-mono font-bold text-sm">
             {formatValue(payload[0].value, currency)}
           </span>
        </div>
      </div>
    );
  }
  return null;
};

export const AssetManager: React.FC<AssetManagerProps> = ({ assets, onAddAsset, onDeleteAsset, currency, onCurrencyChange }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Detail View State
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [assetAnalysis, setAssetAnalysis] = useState<{text: string, sources: any[]} | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // New Asset Form State
  const [newAsset, setNewAsset] = useState({
    symbol: '',
    name: '',
    type: AssetType.STOCK,
    quantity: 0,
    avgPrice: 0,
    currentPrice: 0,
    currency: 'USD',
    change24h: 0
  });

  // Reset analysis when selecting a new asset
  useEffect(() => {
    setAssetAnalysis(null);
    setIsAnalyzing(false);
  }, [selectedAsset]);

  const getAssetTypeStyling = (type: AssetType) => {
    switch (type) {
      case AssetType.STOCK: 
        return { icon: <Building2 size={14} />, color: 'text-blue-400', borderColor: 'border-blue-400/20', bg: 'bg-blue-400/5', label: 'Equities' };
      case AssetType.CRYPTO: 
        return { icon: <Bitcoin size={14} />, color: 'text-orange-400', borderColor: 'border-orange-400/20', bg: 'bg-orange-400/5', label: 'Crypto' };
      case AssetType.COMMODITY: 
        return { icon: <Gem size={14} />, color: 'text-amber-400', borderColor: 'border-amber-400/20', bg: 'bg-amber-400/5', label: 'Commodity' };
      case AssetType.CURRENCY: 
        return { icon: <Banknote size={14} />, color: 'text-emerald-400', borderColor: 'border-emerald-400/20', bg: 'bg-emerald-400/5', label: 'Forex' };
      case AssetType.PRIVATE: 
        return { icon: <Briefcase size={14} />, color: 'text-purple-400', borderColor: 'border-purple-400/20', bg: 'bg-purple-400/5', label: 'Private Eq' };
      case AssetType.REAL_ESTATE: 
        return { icon: <Landmark size={14} />, color: 'text-rose-400', borderColor: 'border-rose-400/20', bg: 'bg-rose-400/5', label: 'Real Estate' };
      default: 
        return { icon: <Layers size={14} />, color: 'text-terminal-muted', borderColor: 'border-terminal-border', bg: 'bg-terminal-bg', label: type };
    }
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          asset.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || asset.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewAsset({
      symbol: '',
      name: '',
      type: AssetType.STOCK,
      quantity: 0,
      avgPrice: 0,
      currentPrice: 0,
      currency: 'USD',
      change24h: 0
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddAsset(newAsset);
    handleCloseModal();
  };

  const handleRunAnalysis = async () => {
    if (!selectedAsset) return;
    setIsAnalyzing(true);
    try {
        const result = await researchMarketWithGemini(`Provide a concise financial analysis, recent news headlines, and short-term outlook for ${selectedAsset.name} (${selectedAsset.symbol}). Format as an executive summary.`);
        setAssetAnalysis({ text: result.text, sources: result.groundingChunks });
    } catch (e) {
        console.error(e);
        setAssetAnalysis({ text: "Unable to retrieve analysis at this time. Please check connectivity.", sources: [] });
    } finally {
        setIsAnalyzing(false);
    }
  };

  // Generate deterministic mock chart data for the detail view
  const getMockChartData = () => {
    if (!selectedAsset) return [];
    const data = [];
    const volatility = selectedAsset.type === AssetType.CRYPTO ? 0.08 : 0.03;
    let price = selectedAsset.currentPrice;
    
    // Generate 30 points backwards from today
    for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        data.push({ 
            date: date.toISOString(), 
            price 
        });

        // Random walk backwards to generate history
        const change = (Math.random() - 0.5) * volatility * price;
        price -= change;
    }
    return data.reverse();
  };

  const mockChartData = selectedAsset ? getMockChartData() : [];
  const typeStyle = selectedAsset ? getAssetTypeStyling(selectedAsset.type) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-white mb-1">
            Asset <span className="font-bold text-terminal-accent">Manager</span>
          </h1>
          <p className="text-terminal-muted text-sm font-mono">Manage your positions and holdings</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-terminal-accent text-black px-4 py-2 rounded font-medium text-sm flex items-center gap-2 hover:bg-emerald-400 transition-colors shadow-[0_0_15px_rgba(0,220,130,0.2)]"
        >
          <Plus size={18} /> Add Position
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-terminal-panel border border-terminal-border p-4 rounded-lg flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-terminal-muted" size={18} />
          <input 
            type="text" 
            placeholder="Search by symbol or name..."
            className="w-full bg-terminal-bg border border-terminal-border rounded pl-10 pr-10 py-2 text-sm text-white focus:outline-none focus:border-terminal-accent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-terminal-muted hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-terminal-muted" />
            <select 
              className="bg-terminal-bg border border-terminal-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-terminal-accent"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="ALL">All Assets</option>
              {Object.values(AssetType).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="h-6 w-px bg-terminal-border hidden md:block"></div>

          <div className="relative group">
              <select 
                value={currency}
                onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
                className="appearance-none bg-terminal-bg border border-terminal-border text-white px-3 py-2 pr-8 rounded font-mono text-sm focus:outline-none focus:border-terminal-accent cursor-pointer min-w-[100px]"
              >
                {Object.keys(SUPPORTED_CURRENCIES).map((code) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-terminal-muted pointer-events-none" />
           </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-terminal-panel border border-terminal-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-terminal-bg text-terminal-muted font-mono text-xs uppercase border-b border-terminal-border">
              <tr>
                <th className="px-6 py-4 font-medium">Symbol / Name</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium text-right">Qty</th>
                <th className="px-6 py-4 font-medium text-right">Avg Price</th>
                <th className="px-6 py-4 font-medium text-right">Current Price</th>
                <th className="px-6 py-4 font-medium text-right">Value</th>
                <th className="px-6 py-4 font-medium text-right">PnL</th>
                <th className="px-6 py-4 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-terminal-border">
              {filteredAssets.map(asset => {
                const valueRaw = asset.quantity * asset.currentPrice;
                const costRaw = asset.quantity * asset.avgPrice;
                const pnlRaw = valueRaw - costRaw;
                const pnlPercent = (pnlRaw / costRaw) * 100;
                const typeStyle = getAssetTypeStyling(asset.type);

                return (
                  <tr 
                    key={asset.id} 
                    onClick={() => setSelectedAsset(asset)}
                    className="hover:bg-terminal-bg/50 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-terminal-border flex items-center justify-center text-xs font-bold text-terminal-muted">
                          {asset.image_url ? (
                            <img src={asset.image_url} alt={asset.symbol} className="w-5 h-5 object-contain" />
                          ) : (
                            asset.symbol.substring(0, 1)
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-white font-mono">{asset.symbol}</div>
                          <div className="text-xs text-terminal-muted flex items-center gap-2">
                             {asset.name}
                             {asset.sector && <span className="text-[9px] px-1.5 py-0.5 bg-terminal-border/50 rounded text-terminal-muted/80">{asset.sector}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-medium border ${typeStyle.borderColor} ${typeStyle.bg} ${typeStyle.color} uppercase flex items-center gap-1.5 w-fit shadow-sm`}>
                        {typeStyle.icon}
                        {typeStyle.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-terminal-text">{asset.quantity.toLocaleString()}</td>
                    
                    {/* Avg Price with Tooltip showing converted value */}
                    <td className="px-6 py-4 text-right font-mono text-terminal-muted group/avg relative whitespace-nowrap">
                      <span 
                        title={formatValue(convertValue(asset.avgPrice, currency), currency)}
                        className="border-b border-dotted border-terminal-muted/50 cursor-help"
                      >
                        {formatValue(convertValue(asset.avgPrice, currency), currency)}
                      </span>
                    </td>

                    {/* Current Price with Tooltip showing converted value */}
                    <td className="px-6 py-4 text-right font-mono text-white group/curr relative whitespace-nowrap">
                      <div className="flex flex-col items-end">
                        <span 
                          title={formatValue(convertValue(asset.currentPrice, currency), currency)}
                          className="border-b border-dotted border-terminal-muted/50 cursor-help"
                        >
                          {formatValue(convertValue(asset.currentPrice, currency), currency)}
                        </span>
                        <span className={`text-[10px] ${asset.change24h >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {asset.change24h > 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right font-mono font-medium text-white whitespace-nowrap">{formatValue(convertValue(valueRaw, currency), currency)}</td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                       <div className={`font-mono text-xs ${pnlRaw >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                         {pnlRaw > 0 ? '+' : ''}{formatValue(convertValue(pnlRaw, currency), currency)}
                       </div>
                       <div className={`font-mono text-[10px] ${pnlPercent >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                         {pnlPercent.toFixed(2)}%
                       </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteAsset(asset.id);
                        }}
                        className="p-2 text-terminal-muted hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                        title="Delete Asset"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredAssets.length === 0 && (
                 <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-terminal-muted">
                    No assets found matching your criteria.
                  </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedAsset && typeStyle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-terminal-panel border border-terminal-border rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
             
             {/* Modal Header */}
             <div className="sticky top-0 z-20 bg-terminal-panel/95 backdrop-blur border-b border-terminal-border p-6 flex justify-between items-start">
                <div>
                   <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold text-white font-mono">{selectedAsset.symbol}</h2>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${typeStyle.borderColor} ${typeStyle.bg} ${typeStyle.color}`}>
                         {typeStyle.label}
                      </span>
                   </div>
                   <p className="text-terminal-muted text-sm">{selectedAsset.name}</p>
                </div>
                <button 
                  onClick={() => setSelectedAsset(null)}
                  className="p-2 hover:bg-terminal-border rounded text-terminal-muted hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
             </div>

             <div className="p-6 space-y-8">
                {/* Key Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   <div className="bg-terminal-bg border border-terminal-border rounded p-4">
                      <p className="text-xs text-terminal-muted font-mono uppercase mb-1">Current Price</p>
                      <div className="text-xl font-mono text-white">
                         {formatValue(convertValue(selectedAsset.currentPrice, currency), currency)}
                      </div>
                      <div className={`text-xs mt-1 ${selectedAsset.change24h >= 0 ? 'text-emerald-500' : 'text-rose-500'} flex items-center gap-1`}>
                         {selectedAsset.change24h >= 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                         {selectedAsset.change24h.toFixed(2)}% (24h)
                      </div>
                   </div>
                   <div className="bg-terminal-bg border border-terminal-border rounded p-4">
                      <p className="text-xs text-terminal-muted font-mono uppercase mb-1">Total Value</p>
                      <div className="text-xl font-mono text-white">
                         {formatValue(convertValue(selectedAsset.quantity * selectedAsset.currentPrice, currency), currency)}
                      </div>
                   </div>
                   <div className="bg-terminal-bg border border-terminal-border rounded p-4">
                      <p className="text-xs text-terminal-muted font-mono uppercase mb-1">Holdings</p>
                      <div className="text-xl font-mono text-white">
                         {selectedAsset.quantity.toLocaleString()} <span className="text-xs text-terminal-muted">Units</span>
                      </div>
                   </div>
                   <div className="bg-terminal-bg border border-terminal-border rounded p-4">
                      <p className="text-xs text-terminal-muted font-mono uppercase mb-1">Total Return</p>
                      <div className={`text-xl font-mono ${(selectedAsset.currentPrice - selectedAsset.avgPrice) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                         {((selectedAsset.currentPrice - selectedAsset.avgPrice) / selectedAsset.avgPrice * 100).toFixed(2)}%
                      </div>
                   </div>
                </div>

                {/* Performance Chart */}
                <div className="border border-terminal-border rounded-lg p-6 bg-terminal-bg/30">
                   <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                      <Activity size={16} className="text-terminal-accent" />
                      Performance History (30 Days)
                   </h3>
                   <div style={{ width: '100%', height: 250, position: 'relative' }}>
                      <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={mockChartData}>
                            <defs>
                               <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#00dc82" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#00dc82" stopOpacity={0}/>
                               </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                            <XAxis 
                                dataKey="date" 
                                hide 
                            />
                            <YAxis 
                               stroke="#52525b" 
                               tick={{fill: '#71717a', fontSize: 10}} 
                               tickLine={false} 
                               axisLine={false}
                               domain={['auto', 'auto']}
                               tickFormatter={(val) => `${SUPPORTED_CURRENCIES[currency].symbol}${val.toFixed(0)}`}
                            />
                            <RechartsTooltip
                               content={<CustomChartTooltip currency={currency} />}
                               cursor={{ stroke: '#52525b', strokeWidth: 1, strokeDasharray: '4 4' }}
                            />
                            <Area 
                               type="monotone" 
                               dataKey="price" 
                               stroke="#00dc82" 
                               strokeWidth={2} 
                               fillOpacity={1} 
                               fill="url(#colorPrice)" 
                               activeDot={{ r: 4, strokeWidth: 0, fill: '#fff' }}
                            />
                         </AreaChart>
                      </ResponsiveContainer>
                   </div>
                </div>

                {/* AI Research Section */}
                <div className="border border-terminal-border rounded-lg p-6 bg-terminal-panel relative overflow-hidden">
                   <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-white flex items-center gap-2">
                         <Sparkles size={16} className="text-purple-400" />
                         AI Market Research
                      </h3>
                      {!assetAnalysis && !isAnalyzing && (
                        <button 
                           onClick={handleRunAnalysis}
                           className="text-xs bg-terminal-accent/10 text-terminal-accent px-3 py-1.5 rounded border border-terminal-accent/20 hover:bg-terminal-accent hover:text-black transition-colors"
                        >
                           Generate Report
                        </button>
                      )}
                   </div>

                   {isAnalyzing && (
                      <div className="flex flex-col items-center justify-center py-8">
                         <Loader2 className="animate-spin text-terminal-accent mb-2" size={24} />
                         <p className="text-xs text-terminal-muted font-mono">ANALYZING MARKET DATA...</p>
                      </div>
                   )}

                   {assetAnalysis && (
                      <div className="animate-in slide-in-from-bottom-2">
                         <div className="prose prose-invert prose-sm max-w-none text-terminal-text bg-terminal-bg/50 p-4 rounded border border-terminal-border/50">
                            <p className="whitespace-pre-wrap leading-relaxed">{assetAnalysis.text}</p>
                         </div>
                         
                         {assetAnalysis.sources && assetAnalysis.sources.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-terminal-border/50">
                               <h4 className="text-[10px] font-mono text-terminal-muted uppercase mb-2">Sources</h4>
                               <div className="flex flex-wrap gap-2">
                                  {assetAnalysis.sources.map((chunk, idx) => (
                                     chunk.web?.uri ? (
                                        <a 
                                           key={idx} 
                                           href={chunk.web.uri} 
                                           target="_blank" 
                                           rel="noreferrer"
                                           className="flex items-center gap-1.5 text-[10px] bg-terminal-bg border border-terminal-border rounded px-2 py-1 text-terminal-muted hover:text-terminal-accent hover:border-terminal-accent transition-colors"
                                        >
                                           <Globe size={10} />
                                           {chunk.web.title || "Source Link"} <ExternalLink size={8} />
                                        </a>
                                     ) : null
                                  ))}
                               </div>
                            </div>
                         )}

                         <div className="mt-4 flex justify-end">
                            <button 
                               onClick={handleRunAnalysis} 
                               className="text-xs text-terminal-muted hover:text-white flex items-center gap-1"
                            >
                               <Sparkles size={12} /> Refresh Analysis
                            </button>
                         </div>
                      </div>
                   )}

                   {!assetAnalysis && !isAnalyzing && (
                      <div className="text-center py-8 text-terminal-muted text-sm border-2 border-dashed border-terminal-border rounded">
                         <Globe className="mx-auto mb-2 opacity-50" size={24} />
                         <p>Access real-time market intelligence and news for {selectedAsset.name}.</p>
                      </div>
                   )}
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={handleCloseModal}
        >
          <div 
            className="bg-terminal-panel border border-terminal-border rounded-lg w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-terminal-border flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Add New Position</h2>
              <button onClick={handleCloseModal} className="text-terminal-muted hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-terminal-muted mb-1">Symbol</label>
                  <input required type="text" className="w-full bg-terminal-bg border border-terminal-border rounded px-3 py-2 text-white focus:border-terminal-accent outline-none" 
                    value={newAsset.symbol} onChange={e => setNewAsset({...newAsset, symbol: e.target.value.toUpperCase()})} />
                </div>
                <div>
                   <label className="block text-xs font-mono text-terminal-muted mb-1">Type</label>
                   <select className="w-full bg-terminal-bg border border-terminal-border rounded px-3 py-2 text-white focus:border-terminal-accent outline-none"
                     value={newAsset.type} onChange={e => setNewAsset({...newAsset, type: e.target.value as AssetType})}>
                     {Object.values(AssetType).map(t => <option key={t} value={t}>{t}</option>)}
                   </select>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-mono text-terminal-muted mb-1">Asset Name</label>
                <input required type="text" className="w-full bg-terminal-bg border border-terminal-border rounded px-3 py-2 text-white focus:border-terminal-accent outline-none" 
                  value={newAsset.name} onChange={e => setNewAsset({...newAsset, name: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-xs font-mono text-terminal-muted mb-1">Quantity</label>
                  <input required type="number" step="any" className="w-full bg-terminal-bg border border-terminal-border rounded px-3 py-2 text-white focus:border-terminal-accent outline-none" 
                    value={newAsset.quantity || ''} onChange={e => setNewAsset({...newAsset, quantity: parseFloat(e.target.value)})} />
                </div>
                <div>
                   <label className="block text-xs font-mono text-terminal-muted mb-1">Currency</label>
                   <input disabled type="text" className="w-full bg-terminal-bg border border-terminal-border rounded px-3 py-2 text-terminal-muted focus:border-terminal-accent outline-none cursor-not-allowed" 
                    value="USD" />
                    <p className="text-[10px] text-terminal-muted mt-1">Base currency for inputs is USD</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-xs font-mono text-terminal-muted mb-1">Avg Buy Price</label>
                  <input required type="number" step="any" className="w-full bg-terminal-bg border border-terminal-border rounded px-3 py-2 text-white focus:border-terminal-accent outline-none" 
                    value={newAsset.avgPrice || ''} onChange={e => setNewAsset({...newAsset, avgPrice: parseFloat(e.target.value)})} />
                </div>
                <div>
                   <label className="block text-xs font-mono text-terminal-muted mb-1">Current Price</label>
                   <input required type="number" step="any" className="w-full bg-terminal-bg border border-terminal-border rounded px-3 py-2 text-white focus:border-terminal-accent outline-none" 
                    value={newAsset.currentPrice || ''} onChange={e => setNewAsset({...newAsset, currentPrice: parseFloat(e.target.value)})} />
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full bg-terminal-accent text-black font-bold py-3 rounded hover:bg-emerald-400 transition-colors">
                  Confirm Position
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};