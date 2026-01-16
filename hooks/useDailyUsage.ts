import { useState, useEffect } from 'react';
import { GUEST_DAILY_LIMIT, USER_DAILY_LIMIT, STORAGE_KEY, USER_STORAGE_KEY } from '../constants';

interface DailyUsage {
  count: number;
  date: string;
}

export function useDailyUsage(userId?: string) {
  const [dailyUsage, setDailyUsage] = useState<DailyUsage>({ count: 0, date: '' });

  // 根据是否登录选择不同的存储键和限制
  const storageKey = userId ? `${USER_STORAGE_KEY}_${userId}` : STORAGE_KEY;
  const dailyLimit = userId ? USER_DAILY_LIMIT : GUEST_DAILY_LIMIT;

  useEffect(() => {
    const today = new Date().toDateString();
    const stored = localStorage.getItem(storageKey);

    if (stored) {
      const data = JSON.parse(stored);
      if (data.date === today) {
        setDailyUsage(data);
      } else {
        // 新的一天，重置计数
        const newUsage = { count: 0, date: today };
        localStorage.setItem(storageKey, JSON.stringify(newUsage));
        setDailyUsage(newUsage);
      }
    } else {
      const newUsage = { count: 0, date: today };
      localStorage.setItem(storageKey, JSON.stringify(newUsage));
      setDailyUsage(newUsage);
    }
  }, [storageKey]);

  const incrementUsage = () => {
    const today = new Date().toDateString();
    const newUsage = { count: dailyUsage.count + 1, date: today };
    localStorage.setItem(storageKey, JSON.stringify(newUsage));
    setDailyUsage(newUsage);
  };

  const remainingUses = dailyLimit - dailyUsage.count;

  return {
    dailyUsage,
    remainingUses,
    incrementUsage,
    dailyLimit,
  };
}
