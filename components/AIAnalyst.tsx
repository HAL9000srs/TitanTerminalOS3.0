import React, { useState, useEffect, useMemo } from 'react';
import { Asset, AIAnalysisResult, PortfolioInsight, AssetType } from '../types';
import { analyzePortfolioWithGemini, researchMarketWithGemini, generateSpeechWithGemini } from '../services/geminiService';
import { playAudioContent } from '../services/audioService';
import { getPortfolioInsights } from '../services/storageService';
import { Sparkles, AlertTriangle, CheckCircle, ShieldCheck, RefreshCw, Volume2, Globe, ArrowRight, Target, TrendingUp, TrendingDown, Zap, PieChart as PieChartIcon, Clipboard, Check, Info, Clock, Layers, Loader2, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis } from 'recharts';

interface AIAnalystProps {
  assets: Asset[];
}

export const AIAnalyst: React.FC<AIAnalystProps> = ({ assets }) => {
  const [activeTab, setActiveTab] = useState<'portfolio' | 'charts' | 'market'>('portfolio');
  
  // Portfolio Analysis State
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIAnalysisResult | null>(null);
  const [analysisTimestamp, setAnalysisTimestamp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Market Research State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<{text: string, groundingChunks: any[]} | null>(null);

  // Saved Insight State (from n8n)
  const [savedInsight, setSavedInsight] = useState<PortfolioInsight | null>(null);

  // Fetch saved insight on mount
  useEffect(() => {
    const fetchSavedInsight = async () => {
      const insights = await getPortfolioInsights(1);
      if (insights.length > 0) {
        setSavedInsight(insights[0]);
      }
    };
    fetchSavedInsight();
  }, []);

  // Chart Colors
  const CHART_COLORS = ['#3b82f6', '#f97316', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

  // Calculate allocation data for pie chart
  const allocationData = useMemo(() => {
    const typeMap = new Map<string, number>();
    assets.forEach(asset => {
      const value = asset.quantity * asset.currentPrice;
      const current = typeMap.get(asset.type) || 0;
      typeMap.set(asset.type, current + value);
    });
    return Array.from(typeMap.entries()).map(([name, value]) => ({ name, value }));
  }, [assets]);

  // Calculate asset performance data for bar chart
  const performanceData = useMemo(() => {
    return assets
      .map(asset => ({
        symbol: asset.symbol,
        pnlPercent: asset.avgPrice > 0 ? ((asset.currentPrice - asset.avgPrice) / asset.avgPrice * 100) : 0,
        change24h: asset.change24h
      }))
      .sort((a, b) => b.pnlPercent - a.pnlPercent)
      .slice(0, 10); // Top 10
  }, [assets]);

  const handleAnalyze = async () => {
    if (assets.length === 0) {
      setError("Portfolio is empty. Add positions to generate analysis.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await analyzePortfolioWithGemini(assets);
      setResult(data);
      setAnalysisTimestamp(new Date().toLocaleTimeString());
    } catch (e) {
      setError("Analysis unavailable. Please check API Key configuration.");
    } finally {
      setLoading(false);
    }
  };

  const handlePlaySummary = async () => {
    if (!result || audioPlaying) return;
    setAudioPlaying(true);
    try {
      const audioData = await generateSpeechWithGemini(result.summary);
      const source = await playAudioContent(audioData);
      source.onended = () => setAudioPlaying(false);
    } catch (e) {
      console.error("Audio playback failed", e);
      setAudioPlaying(false);
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleMarketSearch = async () => {
    if (!searchQuery) return;
    setSearchLoading(true);
    try {
      const data = await researchMarketWithGemini(searchQuery);
      setSearchResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setSearchLoading(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 75) return 'text-rose-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-emerald-500';
  };

  const getRiskLabel = (score: number) => {
    if (score >= 75) return 'HIGH EXPOSURE';
    if (score >= 50) return 'MODERATE RISK';
    return 'CONSERVATIVE';
  };

  const getRecIcon = (text: string) => {
      const lower = text.toLowerCase();
      if (lower.includes('buy') || lower.includes('increase') || lower.includes('add') || lower.includes('invest')) return <TrendingUp size={18} className="text-emerald-500" />;
      if (lower.includes('sell') || lower.includes('reduce') || lower.includes('trim') || lower.includes('hedge')) return <TrendingDown size={18} className="text-rose-500" />;
      return <Target size={18} className="text-terminal-accent" />;
  };

  const getActionBadge = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes('buy') || lower.includes('increase') || lower.includes('add') || lower.includes('invest')) return { label: 'ACCUMULATE', className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
    if (lower.includes('sell') || lower.includes('reduce') || lower.includes('trim')) return { label: 'REDUCE', className: 'bg-rose-500/10 text-rose-500 border-rose-500/20' };
    if (lower.includes('hedge') || lower.includes('protect')) return { label: 'HEDGE', className: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
    return { label: 'STRATEGY', className: 'bg-terminal-accent/10 text-terminal-accent border-terminal-accent/20' };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-white mb-1 flex items-center gap-2">
            Titan <span className="font-bold text-terminal-accent">Intelligence</span>
            <span className="px-2 py-0.5 rounded-full bg-terminal-accent/10 text-terminal-accent text-[10px] font-bold border border-terminal-accent/20">BETA</span>
          </h1>
          <p className="text-terminal-muted text-sm font-mono">Generative AI Portfolio Risk & Market Research Engine</p>
        </div>
        
        <div className="flex bg-terminal-panel rounded p-1 border border-terminal-border">
          <button 
            onClick={() => setActiveTab('portfolio')}
            className={`px-4 py-2 text-sm font-medium rounded transition-colors ${activeTab === 'portfolio' ? 'bg-terminal-bg text-white shadow-sm' : 'text-terminal-muted hover:text-white'}`}
          >
            Portfolio
          </button>
          <button 
             onClick={() => setActiveTab('charts')}
             className={`px-4 py-2 text-sm font-medium rounded transition-colors ${activeTab === 'charts' ? 'bg-terminal-bg text-white shadow-sm' : 'text-terminal-muted hover:text-white'}`}
          >
            Charts
          </button>
          <button 
             onClick={() => setActiveTab('market')}
             className={`px-4 py-2 text-sm font-medium rounded transition-colors ${activeTab === 'market' ? 'bg-terminal-bg text-white shadow-sm' : 'text-terminal-muted hover:text-white'}`}
          >
            Market Research
          </button>
        </div>
      </div>

      {activeTab === 'portfolio' && (
        <>
          {!result && !loading && (
             <div className="flex flex-col items-center justify-center py-20 bg-terminal-panel/30 border border-dashed border-terminal-border rounded-lg">
                <Sparkles size={48} className="text-terminal-muted mb-4 opacity-50" />
                <h3 className="text-xl text-white font-light mb-2">Deep Portfolio Analysis</h3>
                <p className="text-terminal-muted mb-6 text-center max-w-lg">
                  Generate a comprehensive risk assessment, diversification check, and actionable optimization strategy using Gemini 3.
                </p>
                {error && (
                  <div className="mb-4 text-rose-500 bg-rose-500/10 px-4 py-2 rounded border border-rose-500/20 text-sm flex items-center gap-2">
                    <AlertTriangle size={14} />
                    {error}
                  </div>
                )}
                <button 
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="bg-terminal-accent text-black px-6 py-3 rounded font-bold text-sm flex items-center gap-2 hover:bg-emerald-400 transition-colors shadow-[0_0_20px_rgba(0,220,130,0.3)] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} /> Initialize Analysis
                    </>
                  )}
                </button>
             </div>
          )}

          {loading && (
            <div className="h-64 flex flex-col items-center justify-center bg-terminal-panel border border-terminal-border rounded-lg">
              <RefreshCw size={48} className="text-terminal-accent animate-spin mb-4" />
              <p className="text-terminal-text font-mono animate-pulse">PROCESSING MARKET DATA...</p>
              <p className="text-terminal-muted text-xs mt-2">Connecting to Gemini Inference Model</p>
            </div>
          )}

          {result && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
              {/* Main Summary Card */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-terminal-panel border border-terminal-border rounded-lg p-6 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-terminal-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-terminal-accent/10 transition-colors duration-500"></div>
                   
                   <div className="flex justify-between items-start mb-6 relative z-10">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-terminal-accent/10 rounded-lg text-terminal-accent">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Executive Summary</h2>
                            <p className="text-[10px] text-terminal-muted font-mono uppercase tracking-wider flex items-center gap-2">
                               Generated by Titan AI • {analysisTimestamp}
                            </p>
                        </div>
                     </div>
                     <button 
                       onClick={handlePlaySummary}
                       disabled={audioPlaying}
                       className="text-terminal-accent hover:text-emerald-300 p-2 rounded-full border border-terminal-accent/20 hover:bg-terminal-accent/10 transition-all"
                       title="Listen to Report"
                     >
                        <Volume2 size={20} className={audioPlaying ? 'animate-pulse' : ''} />
                     </button>
                   </div>
                   
                   <div className="relative z-10 p-4 bg-terminal-bg/50 rounded-lg border border-terminal-border/50">
                        <p className="text-terminal-text leading-relaxed text-base font-light">
                            {result.summary}
                        </p>
                   </div>
                </div>

                 <div className="bg-terminal-panel border border-terminal-border rounded-lg p-6">
                   <div className="flex items-center gap-2 mb-6">
                        <Zap className="text-amber-400" size={20} />
                        <h2 className="text-xl font-bold text-white">Strategic Actions</h2>
                   </div>
                   
                   <div className="grid gap-4">
                     {result.recommendations.map((rec, idx) => {
                       const badge = getActionBadge(rec);
                       return (
                         <div key={idx} className="group relative overflow-hidden bg-terminal-bg rounded-lg border border-terminal-border hover:border-terminal-accent/50 transition-all duration-300 p-5">
                           {/* Hover Effect Bar */}
                           <div className="absolute left-0 top-0 bottom-0 w-1 bg-terminal-border group-hover:bg-terminal-accent transition-colors"></div>
                           
                           <div className="flex items-start gap-4">
                               <div className="mt-1 font-mono text-xs font-bold text-terminal-muted/50 group-hover:text-terminal-accent transition-colors">
                                 {(idx + 1).toString().padStart(2, '0')}
                               </div>
                               <div className="mt-1 p-2 rounded bg-terminal-panel border border-terminal-border group-hover:border-terminal-accent/30 group-hover:text-white transition-colors">
                                   {getRecIcon(rec)}
                               </div>
                               <div className="flex-1">
                                   <div className="flex items-center justify-between mb-1">
                                      <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${badge.className}`}>
                                            {badge.label}
                                        </span>
                                      </div>
                                      <button 
                                        onClick={() => handleCopy(rec, idx)}
                                        className="text-terminal-muted hover:text-white transition-colors"
                                        title="Copy to clipboard"
                                      >
                                        {copiedIndex === idx ? <Check size={14} className="text-emerald-500" /> : <Clipboard size={14} />}
                                      </button>
                                   </div>
                                   <p className="text-sm text-terminal-muted group-hover:text-terminal-text transition-colors leading-relaxed">
                                       {rec}
                                   </p>
                               </div>
                           </div>
                         </div>
                       );
                     })}
                   </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-terminal-bg rounded border border-terminal-border/50 opacity-60 hover:opacity-100 transition-opacity">
                    <Info size={16} className="text-terminal-muted shrink-0 mt-0.5" />
                    <p className="text-[10px] text-terminal-muted leading-relaxed">
                        Disclaimer: The analysis provided by Titan Intelligence is based on AI-generated inference models and simulated market data. 
                        It does not constitute professional financial advice. Always verify with certified financial advisors before executing high-volume trades.
                    </p>
                </div>
              </div>

              {/* Sidebar Stats */}
              <div className="space-y-6">
                 {/* Risk Score */}
                 <div className="bg-terminal-panel border border-terminal-border rounded-lg p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 pointer-events-none"></div>
                    <div className="flex items-center gap-2 mb-4 relative z-10">
                        <AlertTriangle size={16} className={getRiskColor(result.riskScore)} />
                        <h3 className="text-terminal-muted font-mono text-sm uppercase tracking-widest">Risk Profile</h3>
                    </div>
                    
                    <div className="relative w-48 h-48 flex items-center justify-center mb-4 z-10">
                      <svg className="w-full h-full transform -rotate-90">
                        {/* Background Track with Ticks */}
                        <circle cx="96" cy="96" r="80" stroke="#18181b" strokeWidth="16" fill="none" />
                        <circle cx="96" cy="96" r="80" stroke="#27272a" strokeWidth="1" fill="none" strokeDasharray="4 4" />
                        
                        {/* Progress */}
                        <circle 
                          cx="96" cy="96" r="80" 
                          stroke={result.riskScore > 75 ? '#f43f5e' : result.riskScore > 50 ? '#f59e0b' : '#10b981'} 
                          strokeWidth="12" 
                          fill="none" 
                          strokeDasharray={502} 
                          strokeDashoffset={502 - (502 * result.riskScore) / 100}
                          strokeLinecap="round"
                          className="transition-all duration-1000 ease-out drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className={`text-5xl font-bold font-mono tracking-tighter ${getRiskColor(result.riskScore)} drop-shadow-md`}>{result.riskScore}</span>
                        <span className="text-[10px] text-terminal-muted uppercase mt-1">Score / 100</span>
                      </div>
                    </div>
                    
                    <div className={`px-4 py-1.5 rounded border ${getRiskColor(result.riskScore)} bg-opacity-10 bg-current text-xs font-bold uppercase tracking-wider mb-3 relative z-10`}>
                        {getRiskLabel(result.riskScore)}
                    </div>
                    
                    <div className="text-[10px] text-terminal-muted/60 relative z-10 flex items-center gap-4">
                       <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> &lt;50</span>
                       <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> 50-75</span>
                       <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div> &gt;75</span>
                    </div>
                 </div>

                 {/* Diversification */}
                 <div className="bg-terminal-panel border border-terminal-border rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <PieChart size={16} className="text-terminal-accent" />
                        <h3 className="text-terminal-muted font-mono text-sm uppercase tracking-widest">Diversification</h3>
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-white font-bold text-lg">{result.diversificationStatus}</span>
                      <div className={`p-1 rounded-full ${result.diversificationStatus === 'Excellent' || result.diversificationStatus === 'Over-Diversified' ? 'bg-emerald-500/10 text-emerald-500' : result.diversificationStatus === 'Moderate' ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'}`}>
                         <CheckCircle size={16} />
                      </div>
                    </div>
                    
                    {/* Discrete Scale Meter */}
                    <div className="grid grid-cols-3 gap-1.5 mb-4">
                       <div className={`h-2 rounded-sm transition-all duration-300 ${
                           ['Poor', 'Moderate', 'Excellent', 'Over-Diversified'].includes(result.diversificationStatus) ? 'bg-rose-500' : 'bg-terminal-border'
                       }`}></div>
                       <div className={`h-2 rounded-sm transition-all duration-300 ${
                           ['Moderate', 'Excellent', 'Over-Diversified'].includes(result.diversificationStatus) ? 'bg-amber-500' : 'bg-terminal-border'
                       }`}></div>
                       <div className={`h-2 rounded-sm transition-all duration-300 ${
                           ['Excellent', 'Over-Diversified'].includes(result.diversificationStatus) ? 'bg-emerald-500' : 'bg-terminal-border'
                       }`}></div>
                    </div>
                    
                    <div className="flex justify-between text-[10px] text-terminal-muted font-mono uppercase mb-4">
                        <span className={result.diversificationStatus === 'Poor' ? 'text-rose-500 font-bold' : ''}>Low</span>
                        <span className={result.diversificationStatus === 'Moderate' ? 'text-amber-500 font-bold' : ''}>Med</span>
                        <span className={['Excellent', 'Over-Diversified'].includes(result.diversificationStatus) ? 'text-emerald-500 font-bold' : ''}>High</span>
                    </div>
                    
                    <div className="bg-terminal-bg p-3 rounded border border-terminal-border flex gap-3">
                        <Layers size={16} className="text-terminal-muted shrink-0 mt-0.5" />
                        <p className="text-[10px] text-terminal-muted leading-relaxed">
                           A healthy portfolio should be spread across non-correlated assets to minimize systematic risk.
                        </p>
                    </div>
                 </div>

                 <button onClick={handleAnalyze} className="w-full py-3 border border-terminal-border text-terminal-muted hover:text-white hover:bg-terminal-border/50 rounded transition-colors text-sm flex items-center justify-center gap-2 group">
                   <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                   Recalculate Models
                 </button>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'charts' && (
        <div className="animate-fade-in space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Allocation Pie Chart */}
            <div className="bg-terminal-panel border border-terminal-border rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <PieChartIcon size={18} className="text-terminal-accent" />
                Asset Allocation
              </h3>
              {allocationData.length > 0 ? (
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={allocationData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        innerRadius={50}
                        fill="#8884d8"
                        dataKey="value"
                        strokeWidth={2}
                        stroke="#121214"
                      >
                        {allocationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                        formatter={(value: number) => `$${value.toLocaleString()}`}
                      />
                      <Legend
                        wrapperStyle={{ color: '#a1a1aa', fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-terminal-muted">
                  <PieChartIcon size={48} className="opacity-30 mb-2" />
                  <p className="text-sm">No assets to display</p>
                </div>
              )}
            </div>

            {/* Performance Bar Chart */}
            <div className="bg-terminal-panel border border-terminal-border rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <BarChart3 size={18} className="text-purple-400" />
                Asset Performance (PnL %)
              </h3>
              {performanceData.length > 0 ? (
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceData} layout="vertical">
                      <XAxis type="number" stroke="#52525b" tick={{ fill: '#71717a', fontSize: 10 }} tickFormatter={(v) => `${v.toFixed(0)}%`} />
                      <YAxis dataKey="symbol" type="category" stroke="#52525b" tick={{ fill: '#fff', fontSize: 11 }} width={60} />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                        formatter={(value: number) => `${value.toFixed(2)}%`}
                      />
                      <Bar dataKey="pnlPercent" radius={[0, 4, 4, 0]}>
                        {performanceData.map((entry, index) => (
                          <Cell key={`bar-${index}`} fill={entry.pnlPercent >= 0 ? '#10b981' : '#ef4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-terminal-muted">
                  <BarChart3 size={48} className="opacity-30 mb-2" />
                  <p className="text-sm">No performance data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Saved Insight from n8n */}
          {savedInsight && (
            <div className="bg-terminal-panel border border-terminal-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-400" />
                  Latest Intelligence Brief
                </h3>
                <span className="text-[10px] text-terminal-muted font-mono">
                  {new Date(savedInsight.created_at).toLocaleString()}
                </span>
              </div>
              <div className="bg-terminal-bg/50 p-4 rounded border border-terminal-border/50 mb-4">
                <p className="text-terminal-text leading-relaxed">{savedInsight.summary}</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className={`px-3 py-1 rounded border ${
                  savedInsight.risk_score > 75 ? 'border-rose-500/20 bg-rose-500/10 text-rose-500' :
                  savedInsight.risk_score > 50 ? 'border-amber-500/20 bg-amber-500/10 text-amber-500' :
                  'border-emerald-500/20 bg-emerald-500/10 text-emerald-500'
                }`}>
                  Risk Score: {savedInsight.risk_score}/100
                </div>
                <div className="px-3 py-1 rounded border border-terminal-border bg-terminal-bg text-terminal-muted">
                  {savedInsight.diversification_status}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'market' && (
        <div className="animate-fade-in space-y-6">
           <div className="bg-terminal-panel border border-terminal-border rounded-lg p-6">
             <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
               <Globe className="text-terminal-accent" /> Global Market Grounding
             </h2>
             <p className="text-terminal-muted mb-4">
               Access real-time information using Google Search grounding. Ask about recent market events, stock news, or economic indicators.
             </p>
             <div className="flex gap-2">
               <input 
                 type="text"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)} 
                 placeholder="e.g., 'Latest news on NVIDIA stock' or 'US inflation rate trend'"
                 className="flex-1 bg-terminal-bg border border-terminal-border rounded px-4 py-3 text-white focus:outline-none focus:border-terminal-accent"
                 onKeyDown={(e) => e.key === 'Enter' && handleMarketSearch()}
               />
               <button 
                 onClick={handleMarketSearch}
                 disabled={searchLoading || !searchQuery}
                 className="bg-terminal-accent text-black px-6 rounded font-bold hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
               >
                 {searchLoading ? <RefreshCw className="animate-spin" /> : <ArrowRight />}
               </button>
             </div>
           </div>

           {searchResult && (
             <div className="bg-terminal-panel border border-terminal-border rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4">Research Findings</h3>
                <div className="prose prose-invert prose-sm max-w-none text-terminal-text">
                   <p className="whitespace-pre-wrap">{searchResult.text}</p>
                </div>
                
                {searchResult.groundingChunks && searchResult.groundingChunks.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-terminal-border">
                    <h4 className="text-xs font-mono text-terminal-muted uppercase mb-2">Sources</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {searchResult.groundingChunks.map((chunk, idx) => (
                         chunk.web?.uri ? (
                            <a 
                              key={idx} 
                              href={chunk.web.uri} 
                              target="_blank" 
                              rel="noreferrer"
                              className="flex items-center gap-2 text-xs text-terminal-accent hover:underline truncate p-2 bg-terminal-bg/50 rounded"
                            >
                              <Globe size={12} />
                              {chunk.web.title || chunk.web.uri}
                            </a>
                         ) : null
                      ))}
                    </div>
                  </div>
                )}
             </div>
           )}
        </div>
      )}
    </div>
  );
};