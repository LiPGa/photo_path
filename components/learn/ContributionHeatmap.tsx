import React, { useMemo, useState } from 'react';
import { PhotoEntry } from '../../types';

interface ContributionHeatmapProps {
  entries: PhotoEntry[];
}

interface DayData {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const ContributionHeatmap: React.FC<ContributionHeatmapProps> = ({ entries }) => {
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const { weeks, monthLabels, totalContributions, maxStreak, currentStreak } = useMemo(() => {
    // Create a map of dates to photo counts
    const dateCounts: Record<string, number> = {};
    entries.forEach(entry => {
      // Convert "YYYY.MM.DD" to "YYYY-MM-DD"
      const date = entry.date.replace(/\./g, '-');
      dateCounts[date] = (dateCounts[date] || 0) + 1;
    });

    // Get the last 52 weeks (364 days)
    const today = new Date();
    const weeks: DayData[][] = [];
    const monthLabels: { month: string; weekIndex: number }[] = [];

    // Start from 52 weeks ago, aligned to Sunday
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364);
    // Align to start of week (Sunday)
    startDate.setDate(startDate.getDate() - startDate.getDay());

    let currentWeek: DayData[] = [];
    let lastMonth = -1;
    let weekIndex = 0;

    const currentDate = new Date(startDate);
    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const count = dateCounts[dateStr] || 0;

      // Determine level (0-4) based on count
      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (count >= 4) level = 4;
      else if (count >= 3) level = 3;
      else if (count >= 2) level = 2;
      else if (count >= 1) level = 1;

      currentWeek.push({
        date: dateStr,
        count,
        level
      });

      // Track month labels
      const month = currentDate.getMonth();
      if (month !== lastMonth) {
        monthLabels.push({ month: MONTHS[month], weekIndex });
        lastMonth = month;
      }

      // If it's Saturday or the last day, push the week
      if (currentDate.getDay() === 6) {
        weeks.push(currentWeek);
        currentWeek = [];
        weekIndex++;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Push any remaining days
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    // Calculate stats
    let totalContributions = 0;
    let maxStreak = 0;
    let currentStreak = 0;
    let tempStreak = 0;

    // Flatten weeks and iterate backwards for streak calculation
    const allDays = weeks.flat().reverse();
    let streakBroken = false;

    allDays.forEach((day, index) => {
      totalContributions += day.count;

      if (day.count > 0) {
        tempStreak++;
        if (!streakBroken) {
          currentStreak = tempStreak;
        }
        maxStreak = Math.max(maxStreak, tempStreak);
      } else {
        if (index > 0) streakBroken = true;
        tempStreak = 0;
      }
    });

    return { weeks, monthLabels, totalContributions, maxStreak, currentStreak };
  }, [entries]);

  const handleMouseEnter = (day: DayData, e: React.MouseEvent) => {
    setHoveredDay(day);
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
  };

  const handleMouseLeave = () => {
    setHoveredDay(null);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getLevelColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-zinc-800/50';
      case 1: return 'bg-[#D40000]/20';
      case 2: return 'bg-[#D40000]/40';
      case 3: return 'bg-[#D40000]/70';
      case 4: return 'bg-[#D40000] shadow-[0_0_8px_rgba(212,0,0,0.4)]';
      default: return 'bg-zinc-800/50';
    }
  };

  return (
    <div className="bg-zinc-900/50 border border-white/5 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-sm font-medium tracking-wide">SHOOTING ACTIVITY</h3>
        <div className="text-xs text-zinc-500">
          <span className="text-zinc-300">{totalContributions}</span> photos in the last year
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="p-4 sm:p-6 overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Month labels */}
          <div className="flex mb-2 ml-8">
            {monthLabels.map((label, i) => (
              <div
                key={i}
                className="text-[10px] text-zinc-500"
                style={{
                  position: 'relative',
                  left: `${label.weekIndex * 13}px`,
                  marginRight: i < monthLabels.length - 1
                    ? `${(monthLabels[i + 1]?.weekIndex - label.weekIndex - 1) * 13}px`
                    : '0'
                }}
              >
                {label.month}
              </div>
            ))}
          </div>

          {/* Grid with day labels */}
          <div className="flex">
            {/* Day labels */}
            <div className="flex flex-col gap-[3px] mr-2 text-[10px] text-zinc-500">
              {DAYS.map((day, i) => (
                <div key={day} className="h-[11px] flex items-center justify-end pr-1">
                  {i % 2 === 1 ? day.slice(0, 3) : ''}
                </div>
              ))}
            </div>

            {/* Weeks */}
            <div className="flex gap-[3px]">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[3px]">
                  {week.map((day, dayIndex) => (
                    <div
                      key={day.date}
                      className={`w-[11px] h-[11px] rounded-sm ${getLevelColor(day.level)} transition-all cursor-pointer hover:ring-1 hover:ring-white/30`}
                      onMouseEnter={(e) => handleMouseEnter(day, e)}
                      onMouseLeave={handleMouseLeave}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-2 mt-4 text-[10px] text-zinc-500">
            <span>Less</span>
            <div className="flex gap-[3px]">
              {[0, 1, 2, 3, 4].map(level => (
                <div
                  key={level}
                  className={`w-[11px] h-[11px] rounded-sm ${getLevelColor(level)}`}
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 py-4 border-t border-white/5 flex gap-6 text-xs">
        <div>
          <span className="text-zinc-500">Longest streak: </span>
          <span className="text-zinc-300">{maxStreak} days</span>
        </div>
        <div>
          <span className="text-zinc-500">Current streak: </span>
          <span className="text-zinc-300">{currentStreak} days</span>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredDay && (
        <div
          className="fixed z-50 px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg shadow-xl text-xs pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y - 8
          }}
        >
          <div className="text-zinc-300 font-medium">
            {hoveredDay.count} {hoveredDay.count === 1 ? 'photo' : 'photos'}
          </div>
          <div className="text-zinc-500">{formatDate(hoveredDay.date)}</div>
        </div>
      )}
    </div>
  );
};
