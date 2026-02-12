
import React, { useState, useRef, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import { generateImage } from './services/geminiService';
import { GeneratedImage, GenerationSession, AspectRatio, GenerationSettings, ImageModel, ImageSize } from './types';

const ParticleBackground: React.FC = () => {
  const particles = useMemo(() => Array.from({ length: 25 }).map((_, i) => ({
    id: i,
    size: Math.random() * 2 + 0.5,
    left: `${Math.random() * 100}%`,
    bottom: `${Math.random() * 100}%`,
    duration: `${Math.random() * 15 + 10}s`,
    delay: `${Math.random() * 8}s`,
  })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-20">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle bg-white/40"
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            left: p.left,
            bottom: p.bottom,
            animationDuration: p.duration,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  );
};

const SidebarIcon: React.FC<{ ratio: AspectRatio }> = ({ ratio }) => {
  const baseClasses = "border-2 border-current rounded-[2px] shrink-0";
  switch (ratio) {
    case AspectRatio.SQUARE: return <div className={`${baseClasses} size-4`} />;
    case AspectRatio.PORTRAIT: return <div className={`${baseClasses} w-3 h-4.5`} />;
    case AspectRatio.LANDSCAPE: return <div className={`${baseClasses} w-4.5 h-3`} />;
    case AspectRatio.STORY: return <div className={`${baseClasses} w-2.5 h-5`} />;
    case AspectRatio.CINEMA: return <div className={`${baseClasses} w-5 h-2.5`} />;
    default: return null;
  }
};

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<GenerationSession[]>([]);
  const [settings, setSettings] = useState<GenerationSettings>({
    aspectRatio: AspectRatio.PORTRAIT,
    model: 'gemini-2.5-flash-image',
    imageSize: '1K',
    batchSize: 1
  });
  const [editSource, setEditSource] = useState<GeneratedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [activeDownloadId, setActiveDownloadId] = useState<string | null>(null);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      }
    };
    checkApiKey();
  }, []);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isGenerating) scrollToBottom();
  }, [isGenerating]);

  const handleGenerate = async (e?: React.FormEvent, overridePrompt?: string, overrideSize?: ImageSize) => {
    if (e) e.preventDefault();
    const targetPrompt = overridePrompt || prompt;
    if (!targetPrompt.trim() || isGenerating) return;

    if (settings.model === 'gemini-3-pro-image-preview' && !hasApiKey) {
      setError("High-quality models require a paid API key.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const targetSize = overrideSize || settings.imageSize;
      const generationTasks = Array.from({ length: settings.batchSize }).map(() => 
        generateImage(
          targetPrompt, 
          {
            aspectRatio: settings.aspectRatio,
            model: settings.model,
            imageSize: targetSize
          },
          editSource?.url
        )
      );

      const results = await Promise.all(generationTasks);

      const newImages: GeneratedImage[] = results.map((url, idx) => ({
        id: (Date.now() + idx).toString(),
        url,
        timestamp: Date.now(),
        aspectRatio: settings.aspectRatio,
        model: settings.model,
        size: settings.model === 'gemini-3-pro-image-preview' ? targetSize : undefined
      }));

      const newSession: GenerationSession = {
        id: Date.now().toString(),
        prompt: targetPrompt,
        timestamp: Date.now(),
        images: newImages,
        settings: {
          model: settings.model,
          aspectRatio: settings.aspectRatio,
          size: settings.model === 'gemini-3-pro-image-preview' ? targetSize : undefined
        }
      };

      setHistory(prev => [newSession, ...prev]);
      setPrompt('');
      setEditSource(null);
    } catch (err: any) {
      console.error(err);
      const msg = err.message || '';
      if (msg.includes("Requested entity was not found.")) {
        setError("API Session expired. Re-selecting key...");
        setHasApiKey(false);
        if (window.aistudio) {
          await window.aistudio.openSelectKey();
          setHasApiKey(true);
        }
      } else {
        setError(msg || 'Generation failed.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = (url: string, id: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `nano-banana-${id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setActiveDownloadId(null);
  };

  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden selection:bg-purple-500/30">
      <Navbar />
      <ParticleBackground />
      
      <div className="flex flex-1 pt-16 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[280px] bg-black border-r border-white/5 p-6 flex flex-col gap-8 z-20">
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Aspect Ratio</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(AspectRatio).map(([name, value]) => (
                <button
                  key={name}
                  onClick={() => setSettings({...settings, aspectRatio: value as AspectRatio})}
                  className={`flex items-center gap-3 px-3 py-4 rounded-xl border transition-all ${
                    settings.aspectRatio === value 
                      ? 'border-purple-600 bg-purple-600/10 text-purple-400' 
                      : 'border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20'
                  }`}
                >
                  <SidebarIcon ratio={value as AspectRatio} />
                  <span className="text-xs font-semibold capitalize">{name.toLowerCase()}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Model Config</h3>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white/60">Flash Engine</span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-green-500/20 text-green-400 rounded-md border border-green-500/30">READY</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white/60">Safety Filter</span>
                <span className="text-xs font-semibold text-white/30">Standard</span>
              </div>
              <div className="pt-2 border-t border-white/5 space-y-3">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Model Select</label>
                <select 
                  value={settings.model}
                  onChange={(e) => setSettings({...settings, model: e.target.value as ImageModel})}
                  className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs outline-none focus:border-purple-500 transition-colors"
                >
                  <option value="gemini-2.5-flash-image">Flash 2.5</option>
                  <option value="gemini-3-pro-image-preview">Pro 3 Preview</option>
                </select>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 relative flex flex-col overflow-y-auto hide-scrollbar bg-[#050505]">
          <div className="flex-1 flex flex-col p-8 max-w-5xl mx-auto w-full pb-48">
            {history.length === 0 && !isGenerating ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 opacity-60">
                <div className="size-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                  </svg>
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold tracking-tight">No generations yet</h2>
                  <p className="text-sm text-white/40 max-w-xs mx-auto">Start your creative journey by entering a prompt below.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-16">
                {history.map((session) => (
                  <div key={session.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-4 mb-6">
                       <div className="h-px flex-1 bg-white/5"></div>
                       <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.4em]">Prompt: {session.prompt}</span>
                       <div className="h-px flex-1 bg-white/5"></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {session.images.map((img) => (
                        <div key={img.id} className="group glass-card overflow-hidden hover:border-purple-500/30 transition-all duration-500 shadow-2xl relative aspect-square">
                          <img src={img.url} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt={session.prompt} />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3">
                            <button 
                              onClick={() => downloadImage(img.url, img.id)}
                              className="size-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {isGenerating && (
              <div className="py-12 flex flex-col items-center justify-center space-y-4">
                 <div className="size-12 border-t-2 border-purple-500 rounded-full animate-spin"></div>
                 <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">Synthesizing Neural Lattice</p>
              </div>
            )}
            <div ref={bottomRef} className="h-4" />
          </div>

          {/* Floating Prompt Bar */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6">
            <div className="relative group">
              {/* Outer Glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-[32px] blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="relative antigravity-blur bg-black/80 border border-white/10 rounded-[28px] p-2 flex items-center gap-2 shadow-2xl">
                <form onSubmit={handleGenerate} className="flex-1 flex items-center">
                  <input 
                    autoFocus
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe what you want to create... (e.g., 'A futuristic city')"
                    className="w-full bg-transparent border-none focus:ring-0 text-white placeholder:text-white/20 px-6 py-4 text-sm font-medium tracking-wide"
                  />
                  <button 
                    type="submit" 
                    disabled={!prompt.trim() || isGenerating} 
                    className={`size-12 rounded-2xl flex items-center justify-center transition-all ${
                      !prompt.trim() || isGenerating 
                        ? 'bg-white/5 text-white/10' 
                        : 'bg-white text-black hover:scale-105 active:scale-95 shadow-xl'
                    }`}
                  >
                    {isGenerating ? (
                      <div className="size-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    )}
                  </button>
                </form>
              </div>
            </div>
            <div className="mt-4 text-center">
              <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.4em]">Optimized for Nano Banana v1.2</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
