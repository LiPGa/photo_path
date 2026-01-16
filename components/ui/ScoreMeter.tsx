import React from 'react';

interface ScoreMeterProps {
  score: number | undefined;
  label: string;
  color?: string;
  small?: boolean;
}

export const ScoreMeter: React.FC<ScoreMeterProps> = ({
  score,
  label,
  color = "#fff",
  small = false
}) => (
  <div className={`space-y-2 w-full ${small ? 'opacity-80' : ''}`}>
    <div className="flex justify-between items-end mono text-xs tracking-widest font-bold">
      <span className="text-zinc-600 uppercase">{label}</span>
      <span className="text-sm font-black" style={{ color }}>
        {score !== undefined ? score.toFixed(1) : '--'}
      </span>
    </div>
    <div className="pixel-meter-bar">
      <div
        className="pixel-meter-fill"
        style={{ width: `${(score ?? 0) * 10}%`, backgroundColor: color }}
      />
    </div>
  </div>
);
