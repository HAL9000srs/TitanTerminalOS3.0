import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase'; // Direct access for realtime
import { getLatestNews } from '../services/newsService';
import { NewsArticle } from '../types';
import { researchMarketWithGemini } from '../services/geminiService';
import { Radio, Newspaper, ExternalLink, BrainCircuit, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const NewsFeed: React.FC = () => {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);

  useEffect(() => {
    // 1. Initial Fetch
    const loadNews = async () => {
      const data = await getLatestNews();
      setNews(data);
    };
    loadNews();

    // 2. Realtime Subscription
    const subscription = supabase
      .channel('news-feed-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'news_articles' }, (payload) => {
        const newArticle = payload.new as NewsArticle;
        setNews(prev => [newArticle, ...prev].slice(0, 50));
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleInstantAnalysis = async (item: NewsArticle) => {
    setAnalyzingId(item.id);
    try {
        await researchMarketWithGemini(`Analyze the market impact of this news: "${item.title}". Source: ${item.source}. AI Sentiment Score: ${item.sentiment_score}`);
        window.alert("Analysis complete. Check AI Intelligence tab.");
    } catch (e) {
        console.error("Analysis failed", e);
    } finally {
        setAnalyzingId(null);
    }
  };

  const getSentimentColor = (score: number) => {
    if (score >= 60) return 'text-emerald-500';
    if (score <= 40) return 'text-rose-500';
    return 'text-amber-500';
  };

  const getSentimentIcon = (score: number) => {
    if (score >= 60) return <TrendingUp size={14} className="text-emerald-500" />;
    if (score <= 40) return <TrendingDown size={14} className="text-rose-500" />;
    return <Minus size={14} className="text-amber-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <div>
           <h1 className="text-3xl font-light tracking-tight text-white mb-1">
             Global <span className="font-bold text-terminal-accent">Newswire</span>
           </h1>
           <p className="text-terminal-muted text-sm font-mono">Real-time Institutional Feed</p>
         </div>
         <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded text-xs font-bold animate-pulse">
            <Radio size={14} /> SIGNAL ACTIVE
         </div>
      </div>

      <div className="grid gap-4">
        {news.map(item => (
          <div key={item.id} className="bg-terminal-panel border border-terminal-border p-4 rounded hover:border-terminal-accent/30 transition-all group">
            <div className="flex justify-between items-start mb-2">
               <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono bg-terminal-muted/20 text-terminal-muted px-2 py-0.5 rounded">
                    {new Date(item.created_at).toLocaleTimeString()}
                  </span>
                  <span className="text-[10px] font-bold text-terminal-accent uppercase tracking-wider">
                    {item.source}
                  </span>
                  {item.sentiment_score !== null && (
                      <div className="flex items-center gap-1 bg-terminal-muted/10 px-2 py-0.5 rounded border border-terminal-muted/20">
                          {getSentimentIcon(item.sentiment_score)}
                          <span className={`text-[10px] font-mono font-bold ${getSentimentColor(item.sentiment_score)}`}>
                            {item.sentiment_score}/100
                          </span>
                      </div>
                  )}
               </div>
               <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleInstantAnalysis(item)}
                    className="p-1.5 hover:bg-terminal-accent/20 text-terminal-accent rounded"
                    title="Analyze with Gemini"
                  >
                    {analyzingId === item.id ? <Loader2 size={16} className="animate-spin"/> : <BrainCircuit size={16} />}
                  </button>
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="p-1.5 hover:bg-terminal-border text-terminal-muted hover:text-white rounded"
                    aria-label={`Read full article: ${item.title}`}
                  >
                    <ExternalLink size={16} />
                  </a>
               </div>
            </div>
            <h3 className="text-white font-medium mb-1">{item.title}</h3>
            <p className="text-sm text-terminal-muted line-clamp-2">{item.summary}</p>
          </div>
        ))}
        {news.length === 0 && (
           <div className="text-center py-12 text-terminal-muted border-2 border-dashed border-terminal-border rounded">
              <Newspaper size={48} className="mx-auto mb-4 opacity-50" />
              <p>Waiting for incoming transmission...</p>
              <p className="text-xs mt-2 opacity-50">Ensure n8n workflow is active</p>
           </div>
        )}
      </div>
    </div>
  );
};