import React, { useState, useRef } from 'react';
import { editImageWithGemini } from '../services/geminiService';
import { Upload, Wand2, Image as ImageIcon, Loader2, Download } from 'lucide-react';

export const ImageStudio: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResultImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!image || !prompt) return;

    setIsProcessing(true);
    try {
      const result = await editImageWithGemini(image, prompt);
      setResultImage(result);
    } catch (error) {
      console.error("Generation failed", error);
      alert("Failed to edit image. Check console.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-white mb-1">
            Visual <span className="font-bold text-terminal-accent">Studio</span>
          </h1>
          <p className="text-terminal-muted text-sm font-mono">AI-powered asset visualization and manipulation</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-4">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg h-80 flex flex-col items-center justify-center cursor-pointer transition-colors ${
              image ? 'border-terminal-accent/50 bg-terminal-panel' : 'border-terminal-border hover:border-terminal-muted hover:bg-terminal-panel/50'
            }`}
          >
            {image ? (
              <img src={image} alt="Source" className="h-full w-full object-contain p-2" />
            ) : (
              <div className="text-center p-6">
                <Upload size={48} className="mx-auto text-terminal-muted mb-4" />
                <p className="text-terminal-text font-medium">Click to upload source image</p>
                <p className="text-terminal-muted text-xs mt-2">Supports PNG, JPG (Max 5MB)</p>
              </div>
            )}
            <input 
              ref={fileInputRef} 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileChange} 
            />
          </div>

          <div className="bg-terminal-panel border border-terminal-border rounded-lg p-4">
            <label className="block text-xs font-mono text-terminal-muted uppercase mb-2">Editor Prompt</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., 'Add a retro filter' or 'Make it cyberpunk style'"
                className="flex-1 bg-terminal-bg border border-terminal-border rounded px-4 py-2 text-white focus:outline-none focus:border-terminal-accent"
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              />
              <button 
                onClick={handleGenerate}
                disabled={!image || !prompt || isProcessing}
                className={`px-6 py-2 rounded font-bold text-sm flex items-center gap-2 transition-colors ${
                  !image || !prompt || isProcessing
                    ? 'bg-terminal-border text-terminal-muted cursor-not-allowed'
                    : 'bg-terminal-accent text-black hover:bg-emerald-400'
                }`}
              >
                {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
                Generate
              </button>
            </div>
          </div>
        </div>

        {/* Output Section */}
        <div className="border-2 border-terminal-border rounded-lg h-80 lg:h-auto flex flex-col items-center justify-center bg-terminal-bg relative overflow-hidden">
           {isProcessing && (
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                <Loader2 size={48} className="text-terminal-accent animate-spin mb-4" />
                <p className="text-terminal-accent font-mono animate-pulse">PROCESSING PIXELS...</p>
             </div>
           )}
           
           {resultImage ? (
             <div className="relative w-full h-full group">
               <img src={resultImage} alt="Generated" className="w-full h-full object-contain" />
               <a 
                 href={resultImage} 
                 download="titan-generated.png"
                 className="absolute top-4 right-4 bg-black/80 text-white p-2 rounded hover:bg-terminal-accent hover:text-black transition-colors opacity-0 group-hover:opacity-100"
               >
                 <Download size={20} />
               </a>
             </div>
           ) : (
             <div className="text-center p-6 opacity-50">
               <ImageIcon size={48} className="mx-auto text-terminal-muted mb-4" />
               <p className="text-terminal-muted font-mono text-sm">Waiting for generation...</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};