import { useState } from 'react';
import { CACHE_KEY } from '../constants';

interface CacheEntry {
  title: string;
  date: string;
}

// 生成图片指纹 (取base64的一部分作为hash)
const getImageHash = (base64: string): string => {
  const data = base64.split(',')[1] || base64;
  // 取前500个字符 + 中间500个字符 + 长度作为指纹
  const mid = Math.floor(data.length / 2);
  return `${data.slice(0, 500)}${data.slice(mid, mid + 500)}${data.length}`;
};

// 检查图片是否已分析过
const checkImageCache = (hash: string): { exists: boolean; title?: string; date?: string } => {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    if (cache[hash]) {
      return { exists: true, title: cache[hash].title, date: cache[hash].date };
    }
  } catch (e) {}
  return { exists: false };
};

// 保存到缓存
const saveToImageCache = (hash: string, title: string) => {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    cache[hash] = { title, date: new Date().toLocaleDateString('zh-CN') };
    // 只保留最近50条记录
    const keys = Object.keys(cache);
    if (keys.length > 50) {
      delete cache[keys[0]];
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {}
};

export function useImageCache() {
  const [currentImageHash, setCurrentImageHash] = useState<string>('');
  const [duplicateWarning, setDuplicateWarning] = useState<{ title?: string; date?: string } | null>(null);

  const checkImage = (base64: string) => {
    const hash = getImageHash(base64);
    setCurrentImageHash(hash);

    const cached = checkImageCache(hash);
    if (cached.exists) {
      setDuplicateWarning({ title: cached.title, date: cached.date });
      return true;
    }
    setDuplicateWarning(null);
    return false;
  };

  const saveToCache = (title: string) => {
    if (currentImageHash) {
      saveToImageCache(currentImageHash, title);
    }
  };

  const clearWarning = () => {
    setDuplicateWarning(null);
  };

  return {
    currentImageHash,
    duplicateWarning,
    checkImage,
    saveToCache,
    clearWarning,
  };
}
