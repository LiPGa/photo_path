
import { DailyPrompt, Goal, PhotoEntry } from './types';

export const PHOTO_TIPS = [
  "摄影是光影的艺术，尝试寻找更有戏剧性的侧光。",
  "构图是减法的艺术，画面越简洁，主体越突出。",
  "打破常规：尝试极低或极高视角，发现被忽略的美。",
  "引导线能有效增加画面的深度感和空间感。",
  "黄金分割不是法律，有时候中心构图也能产生力量感。",
  "注意背景细节，不要让杂乱的电线或杂物破坏画面。",
  "好的照片能讲故事，拍摄前先问问自己：我想表达什么？",
  "善用对比：明暗、冷暖、刚柔，对比是视觉冲击力的来源。",
  "在阴天拍摄，光线更柔和，适合人像与细腻纹理。",
  "后期不是为了改变事实，而是为了还原你眼中的瞬间。"
];

export const INITIAL_ENTRIES: PhotoEntry[] = [
  {
    id: 'SEQ_229041',
    imageUrl: 'https://picsum.photos/seed/p1/800/1000',
    date: '2024.03.15',
    location: '上海·外滩',
    notes: '日落时分的扫街，尝试捕捉光线穿透建筑的瞬间。',
    params: { camera: 'Leica Q2', aperture: 'f/2.8', iso: '200' },
    scores: {
      composition: 85,
      light: 90,
      content: 75,
      completeness: 80,
      overall: 83
    },
    analysis: {
      diagnosis: "明暗对比出色，成功捕捉到了极具氛围感的边缘光。",
      improvement: "建议通过稍微右移构图，避开左侧边缘的杂乱人群。",
      storyNote: "画面传达了一种都市归属感与孤独感并存的情绪。",
      moodNote: "暖调光影渲染了怀旧而温暖的氛围。",
      overallSuggestion: "非常出色的习作，建议在同一地点尝试不同的快门速度。"
    }
  }
];

export const INITIAL_GOALS: Goal[] = [
  { id: 'g1', title: '完成 30 张街头人像', current: 12, target: 30, category: 'Skills' }
];

export const DAILY_PROMPTS: DailyPrompt[] = [
  { id: 'p1', title: '负空间', description: '寻找一个主体并用大量留白包围它。', technique: '构图' }
];
