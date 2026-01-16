import React from 'react';
import { PhotoEntry } from '../../types';
import { TimelineList } from './TimelineList';
import { PhotoDetail } from './PhotoDetail';

interface ArchivesViewProps {
  entries: PhotoEntry[];
  selectedEntry: PhotoEntry | null;
  onSelectEntry: (entry: PhotoEntry | null) => void;
}

export const ArchivesView: React.FC<ArchivesViewProps> = ({
  entries,
  selectedEntry,
  onSelectEntry,
}) => (
  <div className="p-8 sm:p-20 lg:p-24 max-w-7xl animate-in fade-in duration-1000 mx-auto w-full">
    {selectedEntry ? (
      <PhotoDetail entry={selectedEntry} onBack={() => onSelectEntry(null)} />
    ) : (
      <div className="space-y-16">
        {/* Header */}
        <header className="border-b border-white/10 pb-16 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-16">
          <div className="space-y-8">
            <h2 className="text-7xl sm:text-9xl font-black italic tracking-tighter uppercase leading-none">
              Archives
            </h2>
            <p className="mono text-sm text-zinc-700 tracking-[0.8em] font-bold uppercase pl-2">
              Timeline
            </p>
          </div>
          <div className="mono text-left sm:text-right w-full sm:w-auto p-8 border-l sm:border-l-0 sm:border-r border-white/10">
            <p className="text-xs text-zinc-800 uppercase tracking-[0.4em] mb-4 font-bold">
              AVG_SCORE
            </p>
            <p className="text-7xl sm:text-9xl font-black text-[#D40000] tracking-tighter leading-none">
              {entries.length
                ? (entries.reduce((a, b) => a + (b.scores.overall || 0), 0) / entries.length).toFixed(1)
                : '0.0'}
            </p>
          </div>
        </header>

        {/* Timeline List */}
        <TimelineList entries={entries} onSelectEntry={onSelectEntry} />
      </div>
    )}
  </div>
);
