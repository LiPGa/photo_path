import { useState, useCallback } from 'react';
import { CACHE_KEY } from '../constants';
import { DetailedScores, DetailedAnalysis } from '../types';

export interface CacheEntry {
  title: string;
  date: string;
  scores: DetailedScores;
  analysis: DetailedAnalysis;
  imageUrl: string;
}

interface StoredCache {
  [hash: string]: CacheEntry;
}

// Generate perceptual hash from image pixels (works for URL, base64, or blob URL)
async function generateImageHash(imageSource: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const timeout = setTimeout(() => {
      reject(new Error('Image load timeout'));
    }, 10000);

    img.onload = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        const size = 16; // 16x16 = 256 values, fast & sufficient
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0, size, size);
        const pixels = ctx.getImageData(0, 0, size, size).data;
        // Convert to grayscale and create hash
        let hash = '';
        for (let i = 0; i < pixels.length; i += 4) {
          const gray = Math.floor((pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3);
          hash += (gray >> 4).toString(16); // 4-bit precision per pixel
        }
        resolve(hash);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('Failed to load image for hashing'));
    };

    img.src = imageSource;
  });
}

// Check cache for existing entry
const checkImageCache = (hash: string): CacheEntry | null => {
  try {
    const cache: StoredCache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    if (cache[hash]) {
      return cache[hash];
    }
  } catch (e) {
    console.warn('Failed to read image cache:', e);
  }
  return null;
};

// Save to cache with full result data
const saveToImageCache = (hash: string, entry: CacheEntry) => {
  try {
    const cache: StoredCache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    cache[hash] = entry;
    // Keep only the most recent 30 entries to manage localStorage size
    const keys = Object.keys(cache);
    if (keys.length > 30) {
      // Remove oldest entries (first ones added)
      const keysToRemove = keys.slice(0, keys.length - 30);
      keysToRemove.forEach(key => delete cache[key]);
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn('Failed to save to image cache:', e);
  }
};

export function useImageCache() {
  const [currentImageHash, setCurrentImageHash] = useState<string>('');
  const [duplicateWarning, setDuplicateWarning] = useState<{ title?: string; date?: string } | null>(null);
  const [cachedResult, setCachedResult] = useState<CacheEntry | null>(null);

  // Check if image was previously analyzed (async due to perceptual hashing)
  const checkImage = useCallback(async (imageSource: string): Promise<CacheEntry | null> => {
    try {
      const hash = await generateImageHash(imageSource);
      setCurrentImageHash(hash);

      const cached = checkImageCache(hash);
      if (cached) {
        setDuplicateWarning({ title: cached.title, date: cached.date });
        setCachedResult(cached);
        return cached;
      }
    } catch (err) {
      console.warn('Failed to generate image hash:', err);
      // On hash failure, clear any previous state
      setCurrentImageHash('');
    }
    setDuplicateWarning(null);
    setCachedResult(null);
    return null;
  }, []);

  // Save analysis result to cache
  const saveToCache = useCallback((
    title: string,
    scores: DetailedScores,
    analysis: DetailedAnalysis,
    imageUrl: string
  ) => {
    if (currentImageHash) {
      const entry: CacheEntry = {
        title,
        date: new Date().toLocaleDateString('zh-CN'),
        scores,
        analysis,
        imageUrl,
      };
      saveToImageCache(currentImageHash, entry);
    }
  }, [currentImageHash]);

  const clearWarning = useCallback(() => {
    setDuplicateWarning(null);
  }, []);

  const clearCache = useCallback(() => {
    setCurrentImageHash('');
    setDuplicateWarning(null);
    setCachedResult(null);
  }, []);

  // Get the cached result for the current duplicate
  const getCachedResult = useCallback((): CacheEntry | null => {
    return cachedResult;
  }, [cachedResult]);

  return {
    currentImageHash,
    duplicateWarning,
    cachedResult,
    checkImage,
    saveToCache,
    clearWarning,
    clearCache,
    getCachedResult,
  };
}
