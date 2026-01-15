
import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  X, 
  Zap, 
  Activity,
  ChevronRight,
  ArrowLeft,
  Share2,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  MessageSquare,
  Info,
  Camera,
  Layers,
  Crosshair,
  Tag as TagIcon,
  Type as TypeIcon,
  Instagram,
  Copy,
  Check,
  Cpu
} from 'lucide-react';
import EXIF from 'exif-js';
import { NavTab, PhotoEntry, DetailedScores, DetailedAnalysis } from './types';
import { analyzePhoto } from './services/geminiService';
import { INITIAL_ENTRIES, PHOTO_TIPS } from './constants';

const Histogram: React.FC<{ imageUrl: string, className?: string }> = ({ imageUrl, className }) => {
  const [data, setData] = useState<number[]>([]);
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const size = 120; // Increased sample size slightly
      canvas.width = size; canvas.height = size;
      ctx.drawImage(img, 0, 0, size, size);
      const imageData = ctx.getImageData(0, 0, size, size).data;
      const bins = new Array(256).fill(0);
      for (let i = 0; i < imageData.length; i += 4) {
        const brightness = Math.round(0.299 * imageData[i] + 0.587 * imageData[i + 1] + 0.114 * imageData[i + 2]);
        bins[brightness]++;
      }
      const max = Math.max(...bins);
      setData(bins.map(v => (v / max) * 100));
    };
  }, [imageUrl]);

  return (
    <div className={`h-20 bg-white/5 border border-white/10 p-2 flex items-end gap-[1px] relative overflow-hidden ${className}`}>
      {data.map((h, i) => (
        <div key={i} className="bg-white/20 flex-grow" style={{ height: `${h}%`, minWidth: '1px' }}></div>
      ))}
      <div className="absolute top-1 left-2 mono text-[7px] text-zinc-600 font-bold uppercase tracking-widest bg-black/40 px-1">LUX_CHART</div>
    </div>
  );
};

const UploadCoordinates: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none opacity-40">
    <div className="coord-text left-2 top-2">100</div>
    <div className="coord-text left-2 bottom-8">00</div>
    <div className="coord-text left-8 bottom-2">0.0</div>
    <div className="coord-text right-8 bottom-2">1.0</div>
    <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-white/20"></div>
    <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-white/20"></div>
    <div className="absolute bottom-6 left-0 w-8 h-8 border-b border-l border-white/20"></div>
    <div className="absolute bottom-6 right-0 w-8 h-8 border-b border-r border-white/20"></div>
  </div>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>(NavTab.EVALUATION);
  const [entries, setEntries] = useState<PhotoEntry[]>(INITIAL_ENTRIES);
  const [currentUpload, setCurrentUpload] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentTip, setCurrentTip] = useState(PHOTO_TIPS[0]);
  const [currentResult, setCurrentResult] = useState<{scores: DetailedScores, analysis: DetailedAnalysis} | null>(null);
  const [userNote, setUserNote] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<PhotoEntry | null>(null);
  const [currentExif, setCurrentExif] = useState<any>(null);
  const [selectedTitle, setSelectedTitle] = useState('');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isAnalyzing) {
      interval = setInterval(() => {
        setCurrentTip(PHOTO_TIPS[Math.floor(Math.random() * PHOTO_TIPS.length)]);
      }, 7000);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const r = new FileReader();
      r.onload = (ev) => {
        const base64 = ev.target?.result as string;
        setCurrentUpload(base64);
        EXIF.getData(file as any, function(this: any) {
          const allMetaData = EXIF.getAllTags(this);
          setCurrentExif({
            camera: allMetaData.Model || "Unknown Device",
            aperture: allMetaData.FNumber ? `f/${allMetaData.FNumber}` : "N/A",
            shutterSpeed: allMetaData.ExposureTime ? 
              (allMetaData.ExposureTime < 1 ? `1/${Math.round(1/allMetaData.ExposureTime)}s` : `${allMetaData.ExposureTime}s`) : "N/A",
            iso: allMetaData.ISOSpeedRatings ? `ISO ${allMetaData.ISOSpeedRatings}` : "N/A",
            focalLength: allMetaData.FocalLength ? `${allMetaData.FocalLength}mm` : "N/A",
          });
        });
      };
      r.readAsDataURL(file);
    }
  };

  const startAnalysis = async () => {
    if (!currentUpload) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzePhoto(currentUpload, { exif: currentExif });
      setCurrentResult(result);
      if (result.analysis.suggestedTitles?.length) setSelectedTitle(result.analysis.suggestedTitles[0]);
      if (result.analysis.suggestedTags?.length) setActiveTags(result.analysis.suggestedTags);
    } catch (error) {
      alert("AI 诊断服务暂不可用");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyIns = () => {
    if (!currentResult) return;
    const text = `${currentResult.analysis.instagramCaption}\n\n${currentResult.analysis.instagramHashtags?.join(' ')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveRecord = () => {
    if (!currentUpload || !currentResult) return;
    const newEntry: PhotoEntry = {
      id: `SEQ_${Date.now().toString().slice(-6)}`,
      title: selectedTitle || `UNTITLED_ENTRY`,
      imageUrl: currentUpload,
      date: new Date().toLocaleDateString('zh-CN').replace(/\//g, '.'),
      location: "STATION_ALPHA",
      notes: userNote || "未填写备注",
      tags: activeTags,
      params: { 
        camera: currentExif?.camera, 
        aperture: currentExif?.aperture, 
        iso: currentExif?.iso, 
        shutterSpeed: currentExif?.shutterSpeed 
      },
      scores: currentResult.scores,
      analysis: currentResult.analysis
    };
    setEntries([newEntry, ...entries]);
    setCurrentUpload(null);
    setCurrentResult(null);
    setCurrentExif(null);
    setUserNote('');
    setSelectedTitle('');
    setActiveTags([]);
    setActiveTab(NavTab.PATH);
  };

  const ScoreMeter = ({ score, label, color = "#fff", small = false }: { score: number | undefined, label: string, color?: string, small?: boolean }) => (
    <div className={`space-y-2 w-full ${small ? 'opacity-80' : ''}`}>
      <div className="flex justify-between items-end mono text-[11px] tracking-widest font-bold">
        <span className="text-zinc-500 uppercase">{label}</span>
        <span className="text-sm" style={{ color }}>{score ?? '--'}</span>
      </div>
      <div className="pixel-meter-bar"><div className="pixel-meter-fill" style={{ width: `${score ?? 0}%`, backgroundColor: color }}></div></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <nav className="fixed left-0 top-0 h-full w-20 border-r border-white/5 flex flex-col items-center py-10 gap-16 z-50 bg-black mobile-bottom-nav">
        <div className="w-10 h-10 bg-[#D40000] flex items-center justify-center font-black text-xs hidden sm:flex cursor-default">AP</div>
        <div className="flex flex-col sm:gap-10 items-center justify-around w-full sm:w-auto h-full sm:h-auto">
          <button onClick={() => { setSelectedEntry(null); setActiveTab(NavTab.EVALUATION); }} className={`p-4 rounded-full transition-all ${activeTab === NavTab.EVALUATION && !selectedEntry ? 'text-white border border-white/20 bg-white/5' : 'text-zinc-700 hover:text-white'}`}><Zap size={26} strokeWidth={1.5} /></button>
          <button onClick={() => { setSelectedEntry(null); setActiveTab(NavTab.PATH); }} className={`p-4 rounded-full transition-all ${activeTab === NavTab.PATH || selectedEntry ? 'text-white border border-white/20 bg-white/5' : 'text-zinc-700 hover:text-white'}`}><Activity size={26} strokeWidth={1.5} /></button>
        </div>
      </nav>

      <main className="pl-20 min-h-screen flex flex-col main-content">
        {activeTab === NavTab.EVALUATION && !selectedEntry && (
          <div className="flex flex-col lg:flex-row min-h-screen mobile-stack">
            {/* Left/Center Area: Image + Technical Metadata (Balanced) */}
            <div className="flex-grow flex flex-col bg-[#050505] overflow-y-auto">
              <div className="flex-grow flex flex-col items-center justify-center p-6 sm:p-10 relative overflow-hidden min-h-[45vh] lg:min-h-0">
                {currentUpload ? (
                  <div className="relative max-w-full flex flex-col items-center animate-in fade-in duration-500">
                    <div className="relative group">
                      {isAnalyzing && (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 bg-black/80 backdrop-blur-xl rounded-sm">
                          <div className="max-w-md text-center space-y-8 animate-in zoom-in duration-500">
                            <div className="flex flex-col items-center gap-4"><div className="rec-dot"></div><div className="mono text-[#D40000] text-xs font-bold tracking-[0.5em] uppercase">PERCEIVING_PIXELS</div></div>
                            <p className="text-xl font-medium leading-relaxed italic text-white/90 font-serif px-6">"{currentTip}"</p>
                          </div>
                        </div>
                      )}
                      <img src={currentUpload} className="max-w-full max-h-[50vh] sm:max-h-[60vh] object-contain shadow-2xl border border-white/10 p-1 bg-zinc-900" alt="Preview" />
                      {!isAnalyzing && <button onClick={() => {setCurrentUpload(null); setCurrentResult(null); setCurrentExif(null);}} className="absolute -top-4 -right-4 bg-white text-black p-2 hover:bg-[#D40000] hover:text-white transition-all shadow-2xl z-30 rounded-sm"><X size={16}/></button>}
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full max-w-xl aspect-square flex items-center justify-center group">
                    <UploadCoordinates />
                    <label className="flex flex-col items-center gap-10 cursor-pointer text-zinc-700 hover:text-white transition-all z-10 w-full h-full justify-center relative">
                      <div className="absolute top-8 right-10 flex items-center gap-3 mono text-[10px] tracking-widest font-bold"><div className="rec-dot"></div> STANDBY</div>
                      <div className="w-24 h-24 border border-zinc-900 flex items-center justify-center group-hover:border-[#D40000] group-hover:bg-[#D40000]/5 transition-all duration-700 rounded-full bg-zinc-900/10"><Plus size={40} strokeWidth={1} className="group-hover:rotate-90 transition-transform duration-500" /></div>
                      <div className="mono text-xs tracking-[0.6em] font-bold text-center pl-2 uppercase flex items-center">IMPORT_MASTERPIECE <span className="cursor-blink"></span></div>
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                    </label>
                  </div>
                )}
              </div>

              {/* TECHNICAL_METADATA & ARCHIVE (Always under image, taking better space) */}
              <div className="border-t border-white/10 bg-black/60 backdrop-blur-md">
                <div className="p-8 sm:p-10 lg:p-12 grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
                  <div className="md:col-span-5 space-y-8">
                    <header className="flex items-center gap-3 mono text-[11px] text-[#D40000] font-bold tracking-widest uppercase"><Cpu size={14}/> TECHNICAL_METADATA</header>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      {currentExif ? (
                        Object.entries(currentExif).map(([key, value]) => (
                          <div key={key} className="space-y-1">
                            <span className="mono text-[8px] text-zinc-600 uppercase block tracking-wider">{key}</span>
                            <span className="mono text-[12px] text-zinc-300 font-bold truncate block">{value as string}</span>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 mono text-[10px] text-zinc-800 italic uppercase">Awaiting_Telemetry_Input...</div>
                      )}
                    </div>
                    {currentUpload && (
                      <div className="pt-4 border-t border-white/5">
                         <Histogram imageUrl={currentUpload} className="w-full" />
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-7 md:border-l border-white/5 md:pl-10 space-y-8">
                     <div className="space-y-4">
                        <label className="mono text-[10px] text-zinc-500 tracking-widest uppercase font-bold flex items-center gap-2"><div className="w-1.5 h-1.5 bg-[#D40000]"></div> Field_Notes</label>
                        <textarea 
                          value={userNote} 
                          onChange={(e) => setUserNote(e.target.value)} 
                          className="w-full bg-zinc-900/20 border border-white/5 p-5 mono text-sm focus:border-white/20 focus:outline-none min-h-[110px] leading-relaxed transition-colors placeholder:text-zinc-900 rounded-sm" 
                          placeholder="简单记录下此时的想法、地点或是那种稍纵即逝的心境..." 
                        />
                     </div>
                     
                     {currentResult && (
                       <div className="p-6 bg-zinc-900/30 border border-white/5 rounded-sm space-y-4 animate-in fade-in duration-700">
                          <div className="flex items-center justify-between border-b border-white/5 pb-3">
                             <div className="flex items-center gap-3 text-[#D40000] mono text-[10px] font-bold uppercase tracking-widest"><Instagram size={14}/> Instagram_Share_Kit</div>
                             <button onClick={copyIns} className="text-zinc-500 hover:text-white transition-all flex items-center gap-2 mono text-[9px]">
                                {copied ? 'COPIED' : 'COPY_CLIPBOARD'} {copied ? <Check size={12} className="text-green-500"/> : <Copy size={12}/>}
                             </button>
                          </div>
                          <p className="text-sm text-zinc-400 italic leading-relaxed font-light">"{currentResult.analysis.instagramCaption}"</p>
                          <div className="flex flex-wrap gap-2 pt-2">
                             {currentResult.analysis.instagramHashtags?.map(h => (
                               <span key={h} className="text-[10px] mono text-zinc-600 hover:text-zinc-400 cursor-default transition-colors">{h}</span>
                             ))}
                          </div>
                       </div>
                     )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel: Artistic Critique (Focused) */}
            <div className="w-full lg:w-[460px] border-l border-white/10 p-8 sm:p-12 overflow-y-auto space-y-12 bg-black mobile-panel shadow-2xl z-10">
              <header className="space-y-4">
                <div className="flex items-center gap-3"><div className="w-3 h-3 bg-[#D40000]"></div><span className="mono text-xs font-bold tracking-widest text-[#D40000]">ARTISTIC_VERDICT_v5.5</span></div>
                <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Perspective</h2>
              </header>

              {!currentResult ? (
                <div className="space-y-12">
                  <p className="text-zinc-600 text-sm leading-relaxed font-light">系统将通过机器视觉深度分析光影流转、构图张力及情感叙事。诊断过程将对影像进行像素级美学重构。</p>
                  <button 
                    disabled={!currentUpload || isAnalyzing} 
                    onClick={startAnalysis} 
                    className="w-full border border-white/20 py-7 mono text-xs font-bold tracking-[0.5em] hover:bg-white hover:text-black disabled:opacity-5 transition-all uppercase shadow-lg group"
                  >
                    {isAnalyzing ? 'PERCEIVING_ART...' : 'RUN_AUDIT'}
                  </button>
                </div>
              ) : (
                <div className="space-y-12 animate-in slide-in-from-right-4 duration-700">
                  <div className="space-y-5">
                    <div className="flex items-center gap-3 text-[#D40000] mono text-[10px] font-bold uppercase tracking-widest"><TypeIcon size={16}/> Suggested_Titles</div>
                    <div className="flex flex-wrap gap-2">
                      {currentResult.analysis.suggestedTitles?.map(title => (
                        <button 
                          key={title} 
                          onClick={() => setSelectedTitle(title)} 
                          className={`px-4 py-2 border mono text-[10px] rounded-sm transition-all ${selectedTitle === title ? 'bg-[#D40000] border-[#D40000] text-white' : 'border-white/5 text-zinc-600 hover:border-white/20'}`}
                        >
                          {title}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="flex items-center gap-3 text-zinc-700 mono text-[10px] font-bold uppercase tracking-widest"><TagIcon size={16}/> Visual_Audit_Tags</div>
                    <div className="flex flex-wrap gap-2">
                      {currentResult.analysis.suggestedTags?.map(tag => (
                        <span key={tag} className="px-2 py-1 mono text-[9px] bg-zinc-900 border border-white/10 text-zinc-500 rounded-sm uppercase tracking-tighter">{tag}</span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-8 gap-y-10">
                    <ScoreMeter score={currentResult.scores.composition} label="COMPOSITION" color="#D40000" />
                    <ScoreMeter score={currentResult.scores.light} label="LIGHTING" color="#D40000" />
                    <ScoreMeter score={currentResult.scores.content} label="NARRATIVE" color="#D40000" />
                    <ScoreMeter score={currentResult.scores.completeness} label="EXPRESSION" color="#D40000" />
                  </div>
                  
                  <div className="pt-6 border-t border-white/5">
                    <ScoreMeter score={currentResult.scores.overall} label="AESTHETIC_QUOTIENT" color="#fff" />
                  </div>

                  <div className="space-y-12 pt-10 border-t border-white/10">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-[#D40000] mono text-xs font-bold uppercase tracking-widest"><MessageSquare size={18}/> Professional Diagnosis</div>
                      <p className="text-lg text-zinc-200 leading-relaxed font-medium">{currentResult.analysis.diagnosis}</p>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-zinc-500 mono text-xs font-bold uppercase tracking-widest"><ImageIcon size={18}/> Scene Interpretation</div>
                      <p className="text-base text-zinc-400 italic leading-relaxed border-l-2 border-[#D40000] pl-6 bg-white/[0.02] py-4 pr-4 rounded-r-sm">"{currentResult.analysis.storyNote}"</p>
                    </div>
                    <div className="p-8 bg-zinc-900/40 border border-white/5 rounded-sm space-y-4">
                       <span className="mono text-[10px] text-[#D40000] font-bold tracking-widest block uppercase">Evolutionary Strategy</span>
                       <p className="text-sm text-zinc-400 leading-relaxed font-light">{currentResult.analysis.improvement}</p>
                    </div>
                  </div>
                  
                  <button onClick={saveRecord} className="w-full bg-[#D40000] py-6 mono text-xs font-bold tracking-[0.5em] hover:bg-[#B30000] transition-all uppercase shadow-2xl active:scale-[0.98]">COMMIT_TO_JOURNAL</button>
                </div>
              )}
            </div>
          </div>
        )}

        {(activeTab === NavTab.PATH || selectedEntry) && (
          <div className="p-8 sm:p-20 lg:p-24 max-w-7xl animate-in fade-in duration-1000">
            {selectedEntry ? (
              <div className="space-y-16">
                <button onClick={() => setSelectedEntry(null)} className="flex items-center gap-4 mono text-xs text-zinc-600 hover:text-white uppercase tracking-[0.3em] transition-all group"><ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform"/> RETURN_TO_LIST</button>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
                  <div className="lg:col-span-7 space-y-12">
                    <div className="relative"><img src={selectedEntry.imageUrl} className="w-full shadow-2xl border border-white/10 p-1 bg-zinc-900" alt="" /><div className="absolute top-4 left-4 flex flex-wrap gap-2">{selectedEntry.tags?.map(t => <span key={t} className="bg-black/60 backdrop-blur-md text-white mono text-[8px] px-2 py-1 rounded-sm uppercase border border-white/10">{t}</span>)}</div></div>
                    <div className="flex flex-wrap gap-8 mono text-[10px] text-zinc-600 uppercase font-bold border-t border-white/5 pt-10">
                      <div className="flex items-center gap-3 text-zinc-400"><Camera size={16} className="text-[#D40000]"/> {selectedEntry.params.camera}</div>
                      <div>{selectedEntry.params.aperture}</div><div>{selectedEntry.params.shutterSpeed}</div><div>{selectedEntry.params.iso}</div>
                    </div>
                    <Histogram imageUrl={selectedEntry.imageUrl} className="w-full sm:w-96" />
                  </div>
                  <div className="lg:col-span-5 space-y-16">
                    <header className="space-y-5"><div className="mono text-xs text-[#D40000] font-bold tracking-widest uppercase flex items-center gap-3"><div className="w-4 h-[1px] bg-[#D40000]"></div> {selectedEntry.date}</div><h2 className="text-5xl font-black italic uppercase leading-none tracking-tighter">{selectedEntry.title}</h2><div className="mono text-[10px] text-zinc-700 font-bold">{selectedEntry.id}</div></header>
                    <div className="grid grid-cols-2 gap-x-10 gap-y-14"><ScoreMeter score={selectedEntry.scores.composition} label="COMP" color="#D40000" /><ScoreMeter score={selectedEntry.scores.light} label="LGT" color="#D40000" /><ScoreMeter score={selectedEntry.scores.content} label="NARR" color="#D40000" /><ScoreMeter score={selectedEntry.scores.completeness} label="EXPR" color="#D40000" /></div>
                    <div className="p-10 border border-white/5 space-y-12 bg-zinc-900/10 backdrop-blur-sm"><div className="space-y-5"><span className="mono text-xs text-zinc-700 uppercase tracking-widest font-bold block">AI Verdict</span><p className="text-xl text-zinc-200 font-medium leading-relaxed">{selectedEntry.analysis?.diagnosis}</p></div><div className="space-y-5 pt-10 border-t border-white/5"><span className="mono text-xs text-zinc-700 uppercase tracking-widest font-bold block">Creator Notes</span><p className="text-lg text-zinc-400 italic font-light leading-relaxed">"{selectedEntry.notes}"</p></div></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-24">
                <header className="border-b border-white/10 pb-12 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-12">
                  <div className="space-y-6"><h2 className="text-7xl font-black italic tracking-tighter uppercase leading-none">Archives</h2><p className="mono text-xs text-zinc-700 tracking-[0.6em] font-bold uppercase pl-1">Visual_Evolutionary_Data</p></div>
                  <div className="mono text-left sm:text-right w-full sm:w-auto p-4 border-l sm:border-l-0 sm:border-r border-white/10"><p className="text-[10px] text-zinc-800 uppercase tracking-[0.3em] mb-2 font-bold">AVG_AESTHETIC_QUOTIENT</p><p className="text-7xl font-black text-[#D40000] tracking-tighter">{entries.length ? (entries.reduce((a, b) => a + b.scores.overall, 0) / entries.length).toFixed(1) : '0.0'}</p></div>
                </header>
                <div className="space-y-2">
                  {entries.map(entry => (
                    <div key={entry.id} onClick={() => setSelectedEntry(entry)} className="bg-black border-y border-white/5 py-14 flex flex-col sm:flex-row items-start sm:items-center gap-12 hover:bg-[#080808] transition-all group cursor-pointer">
                      <div className="w-full sm:w-56 h-36 bg-zinc-900 border border-white/10 flex-shrink-0 overflow-hidden relative archive-image"><img src={entry.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="" /><div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors duration-500"></div></div>
                      <div className="flex-grow grid grid-cols-1 sm:grid-cols-12 gap-10 items-center w-full">
                        <div className="sm:col-span-6 space-y-3"><span className="mono text-xs font-bold text-zinc-700 uppercase group-hover:text-[#D40000] transition-colors">{entry.title || entry.id} // {entry.date}</span><p className="text-base text-zinc-500 truncate italic font-medium">"{entry.analysis?.diagnosis || entry.notes}"</p></div>
                        <div className="sm:col-span-4 flex gap-10"><ScoreMeter score={entry.scores.composition} label="COMP" small /><ScoreMeter score={entry.scores.content} label="NARR" small /></div>
                        <div className="sm:col-span-2 text-right hidden sm:block"><span className="mono text-5xl font-black italic group-hover:text-white transition-all duration-300">{entry.scores.overall}</span></div>
                      </div>
                      <ChevronRight size={28} className="text-zinc-900 group-hover:text-white transition-all transform group-hover:translate-x-2" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
