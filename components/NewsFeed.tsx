import React, { useState } from 'react';
import { Newspaper, Clock, ExternalLink, AlertCircle, Tag, TrendingUp, TrendingDown, Volume2, StopCircle, Loader2, X } from 'lucide-react';
import { generateSpeechWithGemini } from '../services/geminiService';
import { playAudioContent } from '../services/audioService';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

export const NewsFeed: React.FC = () => {
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [activeSource, setActiveSource] = useState<AudioBufferSourceNode | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const mockNews = [
    {
      id: 1,
      title: "Fed Signals Potential Rate Cuts as Inflation Cools to 2.4%",
      source: "Bloomberg Markets",
      time: "25 min ago",
      tag: "Macro",
      sentiment: "positive",
      summary: "Federal Reserve officials expressed growing confidence that inflation is moving sustainably toward their 2% target, opening the door for policy easing later this year."
    },
    {
      id: 2,
      title: "NVIDIA (NVDA) Rallies on New AI Chip Architecture Announcement",
      source: "Reuters Technology",
      time: "1h ago",
      tag: "Equities",
      sentiment: "positive",
      summary: "Major semiconductor firms saw stock prices surge following the reveal of next-generation processing units designed specifically for large language model inference.",
      relatedSymbol: 'NVDA'
    },
    {
      id: 6,
      title: "Tesla (TSLA) Shares Dip Following Quarterly Delivery Miss",
      source: "CNBC",
      time: "1h 30m ago",
      tag: "Equities",
      sentiment: "negative",
      summary: "The EV manufacturer reported delivery numbers slightly below analyst expectations, citing supply chain disruptions in key logistical corridors.",
      relatedSymbol: 'TSLA'
    },
    {
      id: 7,
      title: "Apple (AAPL) Unveils Vision Pro Enterprise Edition",
      source: "The Verge",
      time: "2h ago",
      tag: "Equities",
      sentiment: "positive",
      summary: "Apple has announced a new enterprise-focused version of its spatial computer, targeting engineering and medical professionals.",
      relatedSymbol: 'AAPL'
    },
    {
      id: 3,
      title: "Oil Prices Stabilize Amidst Ongoing Geopolitical Tensions in Middle East",
      source: "Financial Times",
      time: "3h ago",
      tag: "Commodities",
      sentiment: "neutral",
      summary: "Brent crude hovers around $82/barrel as markets weigh supply disruption risks against softening global demand forecasts for Q3."
    },
    {
      id: 4,
      title: "Bitcoin (BTC) Breaks $65k Resistance Level",
      source: "CoinDesk",
      time: "5h ago",
      tag: "Crypto",
      sentiment: "positive",
      summary: "The new MiCA implementation guidelines clarify custody requirements for institutional digital asset service providers operating within the eurozone.",
      relatedSymbol: 'BTC'
    },
    {
      id: 5,
      title: "Yen Volatility Spikes as BoJ Hints at Yield Curve Control Adjustments",
      source: "Nikkei Asia",
      time: "6h ago",
      tag: "Forex",
      sentiment: "negative",
      summary: "The Japanese Yen fluctuated wildly against the dollar after Governor Ueda suggested that current monetary stimulus might be reviewed at the upcoming policy meeting."
    }
  ];

  const filteredNews = activeFilter 
    ? mockNews.filter(news => news.tag === activeFilter) 
    : mockNews;

  // Helper to generate deterministic-looking random chart data
  const getChartData = (symbol: string, sentiment: string) => {
    const data = [];
    let value = 100;
    const trend = sentiment === 'positive' ? 0.2 : sentiment === 'negative' ? -0.2 : 0;
    const volatility = 0.05;

    for (let i = 0; i < 20; i++) {
        const change = (Math.random() - 0.5 + trend) * volatility * value;
        value += change;
        data.push({ i, value });
    }
    return data;
  };

  const handleListen = async (id: number, text: string) => {
    // Stop existing audio
    if (activeSource) {
      try {
        activeSource.stop();
      } catch (e) {
        // Ignore error if already stopped
      }
      setActiveSource(null);
    }

    // If clicking the currently playing item, just stop it (toggle behavior)
    if (playingId === id) {
      setPlayingId(null);
      return;
    }

    setLoadingId(id);
    try {
      const audioData = await generateSpeechWithGemini(text);
      const source = await playAudioContent(audioData);
      
      source.onended = () => {
        setPlayingId(null);
        setActiveSource(null);
      };

      setActiveSource(source);
      setPlayingId(id);
    } catch (error) {
      console.error("Audio playback failed:", error);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-white mb-1">
            Market <span className="font-bold text-terminal-accent">News</span>
          </h1>
          <p className="text-terminal-muted text-sm font-mono">Real-time financial headlines and developments</p>
        </div>
        <div className="flex items-center gap-3">
            {activeFilter && (
                <button 
                  onClick={() => setActiveFilter(null)}
                  className="text-xs bg-terminal-accent/10 text-terminal-accent px-3 py-1 rounded border border-terminal-accent/30 flex items-center gap-2 hover:bg-terminal-accent/20 transition-colors"
                >
                   <X size={12} /> Clear Filter: {activeFilter}
                </button>
            )}
            <div className="text-xs text-terminal-muted border border-terminal-border px-3 py-1 rounded bg-terminal-panel flex items-center gap-2">
               <AlertCircle size={12} />
               Live Feed Integration Required
            </div>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredNews.map((news) => {
          const isPlaying = playingId === news.id;
          const isLoading = loadingId === news.id;
          const chartData = news.relatedSymbol ? getChartData(news.relatedSymbol, news.sentiment) : null;
          const color = news.sentiment === 'positive' ? '#10b981' : news.sentiment === 'negative' ? '#f43f5e' : '#a1a1aa';

          return (
            <div key={news.id} className="bg-terminal-panel border border-terminal-border rounded-lg p-6 hover:border-terminal-accent/30 transition-all group relative overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div className="space-y-2 flex-1 relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setActiveFilter(activeFilter === news.tag ? null : news.tag);
                        }}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-opacity hover:opacity-80 cursor-pointer ${
                        news.tag === 'Macro' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        news.tag === 'Equities' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                        news.tag === 'Crypto' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                        'bg-terminal-border text-terminal-muted border-terminal-border'
                      }`}>
                        {news.tag.toUpperCase()}
                      </button>
                      {news.relatedSymbol && (
                         <span className="text-[10px] font-mono font-bold text-terminal-text bg-terminal-border/50 px-1.5 py-0.5 rounded">
                           {news.relatedSymbol}
                         </span>
                      )}
                      <span className="text-xs text-terminal-muted flex items-center gap-1">
                        <Clock size={12} /> {news.time}
                      </span>
                    </div>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleListen(news.id, `${news.title}. ${news.summary}`);
                      }}
                      disabled={loadingId !== null && !isLoading}
                      className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                        isPlaying 
                          ? 'bg-terminal-accent text-black border-terminal-accent shadow-[0_0_10px_rgba(0,220,130,0.3)]' 
                          : 'bg-terminal-bg border-terminal-border text-terminal-muted hover:text-white hover:border-terminal-muted'
                      } ${loadingId !== null && !isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isLoading ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : isPlaying ? (
                        <StopCircle size={12} />
                      ) : (
                        <Volume2 size={12} />
                      )}
                      {isLoading ? 'Loading...' : isPlaying ? 'Stop' : 'Listen'}
                    </button>
                  </div>
                  
                  <h3 className="text-lg font-bold text-white group-hover:text-terminal-accent transition-colors">
                    {news.title}
                  </h3>
                  
                  <p className="text-terminal-muted text-sm leading-relaxed max-w-3xl">
                    {news.summary}
                  </p>

                  <div className="pt-2 flex items-center gap-2 text-xs text-terminal-muted">
                    <span className="font-bold text-terminal-text">{news.source}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer">
                      Read full story <ExternalLink size={10} />
                    </span>
                  </div>
                </div>

                {/* Right Side: Chart or Sentiment */}
                <div className="flex flex-col items-end justify-center pl-4 md:border-l border-terminal-border min-w-[140px]">
                   <div className="flex items-center gap-2 mb-2">
                       <span className={`text-xs font-mono font-medium ${
                           news.sentiment === 'positive' ? 'text-emerald-500' : 
                           news.sentiment === 'negative' ? 'text-rose-500' : 'text-terminal-muted'
                       }`}>
                           {news.sentiment.toUpperCase()}
                       </span>
                       <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                         news.sentiment === 'positive' ? 'bg-emerald-500/10 text-emerald-500' :
                         news.sentiment === 'negative' ? 'bg-rose-500/10 text-rose-500' :
                         'bg-gray-500/10 text-gray-500'
                       }`}>
                         {news.sentiment === 'positive' ? <TrendingUp size={14} /> : 
                          news.sentiment === 'negative' ? <TrendingDown size={14} /> : 
                          <TrendingUp size={14} className="rotate-90" />}
                       </div>
                   </div>

                   {chartData && (
                     <div className="h-16 w-36 min-w-0">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                             <AreaChart data={chartData}>
                                 <defs>
                                    <linearGradient id={`grad-${news.id}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor={color} stopOpacity={0}/>
                                    </linearGradient>
                                 </defs>
                                 <Area 
                                    type="monotone" 
                                    dataKey="value" 
                                    stroke={color} 
                                    fill={`url(#grad-${news.id})`} 
                                    strokeWidth={2}
                                    isAnimationActive={true}
                                 />
                             </AreaChart>
                         </ResponsiveContainer>
                     </div>
                   )}
                </div>
              </div>
            </div>
          );
        })}
        {filteredNews.length === 0 && (
            <div className="text-center py-12 bg-terminal-panel border border-dashed border-terminal-border rounded-lg">
                <p className="text-terminal-muted text-sm">No news items found for tag: {activeFilter}</p>
                <button 
                  onClick={() => setActiveFilter(null)}
                  className="mt-2 text-terminal-accent hover:underline text-xs"
                >
                  Clear filters
                </button>
            </div>
        )}
      </div>

      <div className="flex items-center justify-center p-8 border border-dashed border-terminal-border rounded-lg bg-terminal-panel/30">
        <div className="text-center max-w-md">
          <Newspaper size={48} className="mx-auto text-terminal-muted mb-4 opacity-50" />
          <h3 className="text-white font-medium mb-2">Connect News API</h3>
          <p className="text-terminal-muted text-sm mb-4">
            To receive live updates from Bloomberg, Reuters, and other premium financial data sources, configure your API credentials in the terminal settings.
          </p>
          <button className="px-4 py-2 bg-terminal-border hover:bg-terminal-border/80 text-white rounded text-sm transition-colors">
            Configure Data Streams
          </button>
        </div>
      </div>
    </div>
  );
};