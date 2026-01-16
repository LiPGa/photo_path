
import { DailyPrompt, Goal, PhotoEntry } from './types';

// AI 分析时的思考状态
export const AI_THINKING_STATES = [
  { main: "正在凝视这张照片...", sub: "试图理解画面的第一印象" },
  { main: "嗯，让我仔细看看构图", sub: "分析视觉元素的排布" },
  { main: "光影很有意思...", sub: "解读明暗关系与氛围" },
  { main: "我在思考这张照片想说什么", sub: "探索叙事与情感表达" },
  { main: "正在组织我的想法", sub: "整合技术分析与感性认知" },
  { main: "快好了，正在斟酌措辞", sub: "确保反馈诚实且有建设性" },
];

// EXIF 字段显示标签
export const EXIF_LABELS: Record<string, string> = {
  camera: 'CAMERA',
  aperture: 'APERTURE',
  shutterSpeed: 'SHUTTER',
  iso: 'ISO',
  focalLength: 'FOCAL',
};

// 文件和使用限制
export const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
export const DAILY_LIMIT = 5;
export const STORAGE_KEY = 'photopath_daily_usage';
export const CACHE_KEY = 'photopath_image_cache';

export const PHOTO_TIPS = [
  "尝试‘三分法’构图，将主体放在画面的黄金分割点上。",
  "清晨和傍晚的‘黄金时刻’光线最柔和，最适合人像拍摄。",
  "注意画面的‘负空间’，适当的留白能让主体更突出。",
  "使用引导线（如道路、围栏）将读者的视线引向主体。",
  "改变拍摄角度，尝试低角度俯拍或高角度仰拍来寻找新视角。",
  "在构图中寻找自然边框（如窗户、树枝）来增加画面深度。",
  "注意背景中的杂物，简洁的背景通常比复杂的背景更高级。",
  "尝试使用手动对焦，在光线复杂的环境下能获得更好的效果。",
  "影子的力量：有时阴影比光亮部分更能传达情绪。",
  "决定性瞬间：等待那个眼神、那个动作、那个光影交汇的瞬间。"
];

export const INITIAL_ENTRIES: PhotoEntry[] = [
  {
    id: 'SEQ_229041',
    imageUrl: 'https://picsum.photos/seed/p1/800/1000',
    date: '2024.03.15',
    location: 'STATION_ALPHA',
    notes: '日落时分的街头随手拍。',
    params: { camera: 'Leica Q2', aperture: 'f/2.8', iso: '200' },
    scores: {
      composition: 6.5,
      light: 7.0,
      content: 5.5,
      completeness: 6.0,
      overall: 6.2
    },
    analysis: {
      diagnosis: "照片成功捕捉到了日落时分温润的光影氛围，色调和谐，给人以宁静的视觉感受。\n但构图上缺乏明确的力量感，背景中杂乱的线条分散了主体的吸引力，属于一张带有美感但缺乏深度的生活记录。",
      improvement: "建议通过改变视角来压缩背景杂物，使主体更加纯粹，或利用长焦拉近距离。",
      storyNote: "斜阳拉长的影子里藏着城市疲惫的温柔。",
      moodNote: "暖色调营造了舒适但略显平淡的情绪。",
      overallSuggestion: "不要止步于记录，尝试在画面中寻找更冲突的视觉元素。",
      suggestedTitles: ["落日余温", "都市碎片", "归途"],
      suggestedTags: ["#纪实", "#光影"],
      instagramCaption: "Golden hour whispers in the urban silence.",
      instagramHashtags: ["#streetphotography", "#leicaq2", "#goldenhour", "#cinematic"]
    }
  }
];

export const INITIAL_GOALS: Goal[] = [
  { id: 'g1', title: '完成 30 张街头人像', current: 12, target: 30, category: 'Skills' }
];

export const DAILY_PROMPTS: DailyPrompt[] = [
  { id: 'p1', title: '负空间', description: '寻找一个主体并用大量留白包围它。', technique: '构图' }
];
