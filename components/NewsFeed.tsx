import React, { useEffect, useState } from 'react';
import { realtimeGateway } from '../services/realtimeService';
import { researchMarketWithGemini } from '../services/geminiService';
import { Radio, Newspaper, ExternalLink, BrainCircuit, Loader2 } from 'lucide-react';

interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  datetime: number;
}

export const NewsFeed: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  useEffect(() => {
    // Connect to stream
    realtimeGateway.connect();
    const unsubscribe = realtimeGateway.subscribe((data) => {
      if (data.type === 'news') { // Adjust based on your API response structure
        const newItem: NewsItem = {
          id: data.id,
          headline: data.headline,
          summary: data.summary,
          source: data.source,
          url: data.url,
          datetime: data.datetime * 1000
        };
        setNews(prev => [newItem, ...prev].slice(0, 50)); // Keep last 50
      }
    });
    return () => unsubscribe();
  }, []);

  const handleInstantAnalysis = async (item: NewsItem) => {
    setAnalyzingId(item.id);
    // Directly trigger Titan Intelligence on this specific news item
    try {
        await researchMarketWithGemini(`Analyze the market impact of this news: "${item.headline}". Source: ${item.source}`);
        // You would likely want to navigate to the AI tab or show a modal here
        window.alert("Analysis complete. Check AI Intelligence tab.");
    } catch (e) {
        console.error("Analysis failed", e);
        window.alert("Analysis failed. See console for details.");
    } finally {
        setAnalyzingId(null);
    }
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
         <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded text-xs font-bold animate-pulse">
            <Radio size={14} /> LIVE
         </div>
      </div>

      <div className="grid gap-4">
        {news.map(item => (
          <div key={item.id} className="bg-terminal-panel border border-terminal-border p-4 rounded hover:border-terminal-accent/30 transition-all group">
            <div className="flex justify-between items-start mb-2">
               <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono bg-terminal-muted/20 text-terminal-muted px-2 py-0.5 rounded">
                    {new Date(item.datetime).toLocaleTimeString()}
                  </span>
                  <span className="text-[10px] font-bold text-terminal-accent uppercase tracking-wider">
                    {item.source}
                  </span>
               </div>
               <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleInstantAnalysis(item)}
                    className="p-1.5 hover:bg-terminal-accent/20 text-terminal-accent rounded"
                    title="Analyze with Gemini"
                  >
                    {analyzingId === item.id ? <Loader2 size={16} className="animate-spin"/> : <BrainCircuit size={16} />}
                  </button>
                  <a href={item.url} target="_blank" rel="noreferrer" className="p-1.5 hover:bg-terminal-border text-terminal-muted hover:text-white rounded">
                    <ExternalLink size={16} />
                  </a>
               </div>
            </div>
            <h3 className="text-white font-medium mb-1">{item.headline}</h3>
            <p className="text-sm text-terminal-muted line-clamp-2">{item.summary}</p>
          </div>
        ))}
        {news.length === 0 && (
           <div className="text-center py-12 text-terminal-muted border-2 border-dashed border-terminal-border rounded">
              <Newspaper size={48} className="mx-auto mb-4 opacity-50" />
              <p>Waiting for incoming transmission...</p>
           </div>
        )}
      </div>
    </div>
  );
};