import React, { useState, useEffect } from 'react';

interface HistogramProps {
  imageUrl: string;
  className?: string;
}

export const Histogram: React.FC<HistogramProps> = ({ imageUrl, className }) => {
  const [data, setData] = useState<number[]>([]);

  useEffect(() => {
    // Guard against empty URLs to prevent browser warning
    if (!imageUrl) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const size = 128;
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, 0, 0, size, size);

      const imageData = ctx.getImageData(0, 0, size, size).data;
      const bins = new Array(256).fill(0);

      for (let i = 0; i < imageData.length; i += 4) {
        const brightness = Math.round(
          0.299 * imageData[i] + 0.587 * imageData[i + 1] + 0.114 * imageData[i + 2]
        );
        bins[brightness]++;
      }

      const max = Math.max(...bins);
      setData(bins.map(v => (v / (max || 1)) * 100));
    };
  }, [imageUrl]);

  return (
    <div className={`h-16 bg-white/5 border border-white/10 flex items-end gap-[1px] relative overflow-hidden ${className}`}>
      {data.map((h, i) => (
        <div
          key={i}
          className="bg-white/20 flex-grow"
          style={{ height: `${h}%`, minWidth: '1px' }}
        />
      ))}
      <div className="absolute top-1 left-2 mono text-[10px] text-zinc-700 font-bold uppercase tracking-widest pointer-events-none">
        LUMINANCE_ANALYSIS
      </div>
    </div>
  );
};
