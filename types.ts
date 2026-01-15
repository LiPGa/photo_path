
export interface DetailedScores {
  composition: number;     // 构图
  light: number;           // 光影
  content: number;         // 内容/叙事
  completeness: number;    // 表达完整度
  overall: number;         // 总体
  tilt?: number;
  sharpness?: number;
}

export interface DetailedAnalysis {
  diagnosis: string;
  improvement: string;
  storyNote: string;
  moodNote: string;
  overallSuggestion: string;
  suggestedTitles?: string[];
  suggestedTags?: string[];
  instagramCaption?: string;
  instagramHashtags?: string[];
}

export interface PhotoEntry {
  id: string;
  title?: string;
  imageUrl: string;
  date: string;
  location: string;
  notes: string;
  tags?: string[];
  params: {
    camera?: string;
    lens?: string;
    aperture?: string;
    shutterSpeed?: string;
    iso?: string;
    focalLength?: string;
  };
  scores: DetailedScores;
  analysis?: DetailedAnalysis;
  tag?: string;
}

export interface Goal {
  id: string;
  title: string;
  current: number;
  target: number;
  category: string;
}

export interface DailyPrompt {
  id: string;
  title: string;
  description: string;
  technique: string;
}

export enum NavTab {
  EVALUATION = 'evaluation',
  PATH = 'path'
}
