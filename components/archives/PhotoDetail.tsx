import React from 'react';
import { ArrowLeft, Camera } from 'lucide-react';
import { PhotoEntry } from '../../types';
import { ScoreMeter } from '../ui/ScoreMeter';
import { Histogram } from '../ui/Histogram';

interface PhotoDetailProps {
  entry: PhotoEntry;
  onBack: () => void;
}

export const PhotoDetail: React.FC<PhotoDetailProps> = ({ entry, onBack }) => (
  <div className="space-y-24">
    <button
      onClick={onBack}
      className="flex items-center gap-3 mono text-sm text-zinc-500 hover:text-white uppercase tracking-[0.2em] transition-all group p-3 -ml-3 rounded-lg active:scale-95 active:bg-white/5"
    >
      <div className="w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center group-hover:border-white/30 transition-colors">
        <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
      </div>
      <span className="hidden sm:inline">BACK_TO_LIST</span>
    </button>

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
      {/* Image Column */}
      <div className="lg:col-span-7 space-y-16">
        <div className="relative">
          <img
            src={entry.imageUrl}
            className="w-full shadow-2xl border border-white/10 p-1 bg-zinc-900"
            alt=""
          />
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            {entry.tags?.map((t) => (
              <span
                key={t}
                className="bg-black/60 backdrop-blur-md text-white mono text-xs px-3 py-1.5 rounded-sm uppercase border border-white/10"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-8 mono text-sm text-[#D40000] uppercase font-bold border-t border-white/5 pt-12">
          <div className="flex items-center gap-3 text-zinc-200">
            <Camera size={22} className="text-[#D40000]" /> {entry.params?.camera}
          </div>
          <div className="text-zinc-500">{entry.params?.aperture}</div>
          <div className="text-zinc-500">{entry.params?.shutterSpeed}</div>
          <div className="text-zinc-500">{entry.params?.iso}</div>
        </div>

        <Histogram imageUrl={entry.imageUrl} className="w-full sm:w-96" />
      </div>

      {/* Info Column */}
      <div className="lg:col-span-5 space-y-20">
        <header className="space-y-8">
          <div className="mono text-sm text-[#D40000] font-bold tracking-widest uppercase flex items-center gap-4">
            <div className="w-8 h-[1px] bg-[#D40000]"></div> {entry.date}
          </div>
          <h2 className="text-8xl font-black italic uppercase leading-none tracking-tighter">
            {entry.title}
          </h2>
          <div className="mono text-xs text-zinc-800 font-bold uppercase tracking-widest">
            {entry.id}
          </div>
        </header>

        <div className="grid grid-cols-2 gap-x-12 gap-y-16">
          <ScoreMeter score={entry.scores.composition} label="构图" color="#D40000" />
          <ScoreMeter score={entry.scores.light} label="光影" color="#D40000" />
          <ScoreMeter score={entry.scores.content} label="叙事" color="#D40000" />
          <ScoreMeter score={entry.scores.completeness} label="表达" color="#D40000" />
        </div>

        <div className="p-12 border border-white/5 space-y-16 bg-zinc-900/10 backdrop-blur-sm shadow-2xl">
          <div className="space-y-10">
            <span className="mono text-xs text-zinc-700 uppercase tracking-widest font-bold block">
              Audit Conclusion
            </span>
            <div className="space-y-6">
              {entry.analysis?.diagnosis.split('\n').map((para, i) => (
                <p
                  key={i}
                  className={`text-2xl text-zinc-50 font-medium leading-snug font-serif ${
                    i > 0 ? 'text-zinc-400 text-xl border-t border-white/5 pt-6' : ''
                  }`}
                >
                  {para}
                </p>
              ))}
            </div>
          </div>
          <div className="space-y-10 pt-10 border-t border-white/5">
            <span className="mono text-xs text-zinc-700 uppercase tracking-widest font-bold block">
              Creator Notes
            </span>
            <p className="text-xl text-zinc-400 italic font-light leading-relaxed">
              "{entry.notes}"
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);
