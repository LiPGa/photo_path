import React from 'react';
import { Cpu, Instagram, Copy, Check } from 'lucide-react';
import { Histogram } from '../ui/Histogram';
import { EXIF_LABELS } from '../../constants';
import { DetailedAnalysis } from '../../types';

interface ExifData {
  camera?: string;
  aperture?: string;
  shutterSpeed?: string;
  iso?: string;
  focalLength?: string;
  captureDate?: string | null;
}

interface TechnicalPanelProps {
  currentExif: ExifData | null;
  currentUpload: string | null;
  currentResult: { analysis: DetailedAnalysis } | null;
  copied: boolean;
  onCopyInstagram: () => void;
}

export const TechnicalPanel: React.FC<TechnicalPanelProps> = ({
  currentExif,
  currentUpload,
  currentResult,
  copied,
  onCopyInstagram,
}) => (
  <div className={`border-t border-white/10 bg-black/60 backdrop-blur-md transition-all duration-700 ${currentResult ? 'opacity-100' : 'opacity-80'}`}>
    <div className="p-8 sm:p-10 lg:p-12 grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
      {/* EXIF Section */}
      <div className="md:col-span-5 space-y-8">
        <header className="flex items-center gap-3 mono text-xs text-[#D40000] font-bold tracking-widest uppercase">
          <Cpu size={14} /> EXIF_METADATA
        </header>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          {currentExif ? (
            Object.entries(currentExif)
              .filter(([key]) => key !== 'captureDate')
              .map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <span className="mono text-[10px] text-zinc-700 uppercase block tracking-wider font-bold">
                    {EXIF_LABELS[key] || key}
                  </span>
                  <span className="mono text-sm text-zinc-300 font-bold truncate block">
                    {value as string}
                  </span>
                </div>
              ))
          ) : (
            <div className="col-span-2 mono text-xs text-zinc-900 italic uppercase">
              Awaiting_Data...
            </div>
          )}
        </div>
        {currentUpload && (
          <div className="pt-4 border-t border-white/5">
            <Histogram imageUrl={currentUpload} className="w-full" />
          </div>
        )}
      </div>

      {/* Instagram Section */}
      <div className="md:col-span-7 md:border-l border-white/5 md:pl-10 space-y-8">
        {currentResult && (
          <div className="p-8 bg-zinc-900/30 border border-white/5 rounded-sm space-y-6 animate-in fade-in duration-1000 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-3 text-zinc-600 mono text-xs font-bold uppercase tracking-widest">
                <Instagram size={16} /> Instagram_Kit
              </div>
              <button
                onClick={onCopyInstagram}
                className="text-zinc-600 hover:text-white transition-all flex items-center gap-2 mono text-xs"
              >
                {copied ? 'DONE' : 'COPY'}{' '}
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-zinc-300 italic font-light leading-relaxed">
                "{currentResult.analysis?.instagramCaption || ''}"
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {currentResult.analysis?.instagramHashtags?.map((tag) => (
                  <span key={tag} className="text-xs text-[#D40000] mono font-medium">
                    {tag.startsWith('#') ? tag : `#${tag}`}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);
