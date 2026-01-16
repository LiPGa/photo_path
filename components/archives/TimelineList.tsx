import React, { memo, useState, useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { PhotoEntry } from '../../types';
import { getThumbnailUrl, isCloudinaryUrl } from '../../services/cloudinaryService';
import { useThumbnail } from '../../hooks/useThumbnail';

// Skeleton loader for initial timeline loading
const TimelineSkeleton = () => (
  <div className="relative animate-pulse">
    <div className="absolute left-4 sm:left-8 top-0 bottom-0 w-px bg-zinc-800" />
    {[1, 2].map((group) => (
      <div key={group} className="mb-16">
        <div className="flex items-center gap-4 mb-8 pl-4 sm:pl-8">
          <div className="w-3 h-3 bg-zinc-700 rounded-full" />
          <div className="h-5 w-20 bg-zinc-800 rounded" />
        </div>
        <div className="pl-12 sm:pl-20 space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="bg-zinc-900/30 border border-white/5 rounded-lg p-4 flex gap-4">
              <div className="w-20 h-20 sm:w-28 sm:h-28 bg-zinc-800 rounded flex-shrink-0" />
              <div className="flex-grow space-y-3 py-1">
                <div className="h-4 w-32 bg-zinc-800 rounded" />
                <div className="h-3 w-48 bg-zinc-800/50 rounded" />
                <div className="h-6 w-12 bg-zinc-800 rounded mt-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

// 单个条目组件 - 使用 memo 避免不必要的重渲染
const TimelineEntry = memo(({
  entry,
  onSelect,
  isVisible
}: {
  entry: PhotoEntry;
  onSelect: () => void;
  isVisible: boolean;
}) => {
  // 如果是 Cloudinary URL，直接用 URL 变换生成缩略图（零延迟）
  const isCloudinary = isCloudinaryUrl(entry.imageUrl);
  const cloudinaryThumb = isCloudinary ? getThumbnailUrl(entry.imageUrl, 200) : null;

  // 非 Cloudinary URL（如旧的 base64）才用本地生成
  const { thumbnail: localThumb, loading } = useThumbnail(
    entry.id,
    entry.imageUrl,
    isVisible && !isCloudinary
  );

  const thumbnailSrc = cloudinaryThumb || localThumb;

  return (
    <div
      onClick={onSelect}
      className="bg-zinc-900/30 border border-white/5 rounded-lg p-4 flex gap-4 hover:bg-zinc-900/60 hover:border-white/10 transition-all group cursor-pointer active:scale-[0.98] active:bg-zinc-900/80"
    >
      {/* Thumbnail */}
      <div className="w-20 h-20 sm:w-28 sm:h-28 bg-zinc-900 rounded overflow-hidden flex-shrink-0">
        {(!isCloudinary && loading) || !thumbnailSrc ? (
          <div className="w-full h-full bg-zinc-800 animate-pulse" />
        ) : (
          <img
            src={thumbnailSrc}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            alt=""
            loading="lazy"
          />
        )}
      </div>

      {/* Info */}
      <div className="flex-grow min-w-0 flex flex-col justify-between py-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-white truncate">
              {entry.title || 'Untitled'}
            </span>
            <span className="text-xs text-zinc-600 mono flex-shrink-0">
              {entry.date?.split('.')[2] || ''}
            </span>
          </div>
          <p className="text-sm text-zinc-500 truncate">
            {entry.analysis?.diagnosis.split('\n')[0].slice(0, 50) || entry.notes}
          </p>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <span className="text-xs text-zinc-600">{entry.params?.camera}</span>
          <span className="text-2xl font-black text-[#D40000]">
            {entry.scores.overall?.toFixed(1)}
          </span>
        </div>
      </div>

      <ChevronRight
        size={20}
        className="text-zinc-700 group-hover:text-white self-center flex-shrink-0"
      />
    </div>
  );
});

TimelineEntry.displayName = 'TimelineEntry';

// 使用 Intersection Observer 的懒加载容器
const LazyEntry = memo(({
  entry,
  onSelect
}: {
  entry: PhotoEntry;
  onSelect: () => void;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' } // 提前 100px 开始加载
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      <TimelineEntry entry={entry} onSelect={onSelect} isVisible={isVisible} />
    </div>
  );
});

LazyEntry.displayName = 'LazyEntry';

interface TimelineListProps {
  entries: PhotoEntry[];
  onSelectEntry: (entry: PhotoEntry) => void;
  isLoading?: boolean;
}

export const TimelineList: React.FC<TimelineListProps> = ({ entries, onSelectEntry, isLoading }) => {
  // Show skeleton while loading
  if (isLoading) {
    return <TimelineSkeleton />;
  }

  if (entries.length === 0) {
    return (
      <div className="py-20 text-center mono text-zinc-800 text-xs tracking-widest uppercase">
        No_Data_Stored
      </div>
    );
  }

  // Group entries by month
  const groupedEntries: Record<string, PhotoEntry[]> = {};
  entries.forEach((entry) => {
    const dateParts = entry.date?.split('.') || [];
    const monthKey = dateParts.length >= 2 ? `${dateParts[0]}.${dateParts[1]}` : '未知日期';
    if (!groupedEntries[monthKey]) groupedEntries[monthKey] = [];
    groupedEntries[monthKey].push(entry);
  });

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 sm:left-8 top-0 bottom-0 w-px bg-zinc-800" />

      {Object.entries(groupedEntries).map(([month, monthEntries]: [string, PhotoEntry[]]) => (
        <div key={month} className="mb-16">
          {/* Month header */}
          <div className="flex items-center gap-4 mb-8 pl-4 sm:pl-8">
            <div className="w-3 h-3 bg-[#D40000] rounded-full relative z-10 shadow-[0_0_10px_rgba(212,0,0,0.5)]" />
            <span className="mono text-lg font-bold text-zinc-400 tracking-wider">{month}</span>
            <span className="text-xs text-zinc-700">{monthEntries.length} 张</span>
          </div>

          {/* Month entries */}
          <div className="pl-12 sm:pl-20 space-y-4">
            {monthEntries.map((entry) => (
              <LazyEntry
                key={entry.id}
                entry={entry}
                onSelect={() => onSelectEntry(entry)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
