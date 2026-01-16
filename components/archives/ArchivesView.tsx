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
      <div className="space-y-24">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-12 pt-12">
          <div className="space-y-6">
            <h2 className="text-5xl sm:text-7xl font-light tracking-tight text-zinc-100 leading-none">
              Archives
            </h2>
            <p className="text-sm text-zinc-500 tracking-widest font-medium uppercase pl-1">
              Timeline Collection
            </p>
          </div>
          <div className="text-left sm:text-right w-full sm:w-auto">
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2 font-medium">
              Average Score
            </p>
            <p className="text-6xl font-extralight text-zinc-200 tracking-tight leading-none">
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
