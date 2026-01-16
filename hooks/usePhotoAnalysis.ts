import { useState, useEffect } from 'react';
import { DetailedScores, DetailedAnalysis } from '../types';
import { AI_THINKING_STATES, PHOTO_TIPS } from '../constants';
import { analyzePhoto } from '../services/geminiService';

interface AnalysisResult {
  scores: DetailedScores;
  analysis: DetailedAnalysis;
}

export function usePhotoAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [thinkingState, setThinkingState] = useState(AI_THINKING_STATES[0]);
  const [thinkingIndex, setThinkingIndex] = useState(0);
  const [currentTip, setCurrentTip] = useState(PHOTO_TIPS[0]);

  // AI 思考状态动画
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isAnalyzing) {
      setThinkingIndex(0);
      setThinkingState(AI_THINKING_STATES[0]);
      interval = setInterval(() => {
        setThinkingIndex(prev => {
          const next = (prev + 1) % AI_THINKING_STATES.length;
          setThinkingState(AI_THINKING_STATES[next]);
          return next;
        });
        setCurrentTip(PHOTO_TIPS[Math.floor(Math.random() * PHOTO_TIPS.length)]);
      }, 2000); // Faster rotation for better perceived speed
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const startAnalysis = async (
    imageData: string,
    exif: Record<string, any>,
    creatorContext: string
  ): Promise<AnalysisResult | null> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await analyzePhoto(imageData, { exif, creatorContext });
      setCurrentResult(result);
      return result;
    } catch (err: any) {
      console.error(err);
      setError("分析终端响应异常。请重试。");
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearResult = () => {
    setCurrentResult(null);
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  return {
    isAnalyzing,
    currentResult,
    error,
    thinkingState,
    thinkingIndex,
    currentTip,
    startAnalysis,
    clearResult,
    clearError,
  };
}
