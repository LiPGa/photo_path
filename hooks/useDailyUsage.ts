import { useState, useEffect } from 'react';
import { DAILY_LIMIT, STORAGE_KEY } from '../constants';

interface DailyUsage {
  count: number;
  date: string;
}

export function useDailyUsage() {
  const [dailyUsage, setDailyUsage] = useState<DailyUsage>({ count: 0, date: '' });

  useEffect(() => {
    const today = new Date().toDateString();
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      const data = JSON.parse(stored);
      if (data.date === today) {
        setDailyUsage(data);
      } else {
        // 新的一天，重置计数
        const newUsage = { count: 0, date: today };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newUsage));
        setDailyUsage(newUsage);
      }
    } else {
      const newUsage = { count: 0, date: today };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUsage));
      setDailyUsage(newUsage);
    }
  }, []);

  const incrementUsage = () => {
    const today = new Date().toDateString();
    const newUsage = { count: dailyUsage.count + 1, date: today };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUsage));
    setDailyUsage(newUsage);
  };

  const remainingUses = DAILY_LIMIT - dailyUsage.count;

  return {
    dailyUsage,
    remainingUses,
    incrementUsage,
    dailyLimit: DAILY_LIMIT,
  };
}
