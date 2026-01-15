
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

export async function analyzePhoto(imageUri: string, technicalContext: any): Promise<any> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let base64Data = imageUri;
  let mimeType = 'image/jpeg';
  if (imageUri.startsWith('data:')) {
    const parts = imageUri.split(',');
    mimeType = parts[0].split(':')[1].split(';')[0];
    base64Data = parts[1];
  }

  const prompt = `
    你是一名具有极高审美品味的专业摄影评论家。请对这张照片进行深度审计。
    
    【核心评分维度（0-100）】：
    1. 构图 (Composition): 考量比例、平衡、线条引导、视角独特性。
    2. 光影 (Light): 考量用光技巧、影调控制、色彩对比与和谐。
    3. 内容/叙事 (Content): 考量画面的故事性、想要传达的信息或意图。
    4. 表达完整度 (Completeness): 考量主题的表达是否完整，后期与拍摄的结合程度。
    5. 总体评分 (Overall): 综合以上维度的最终评价。

    【任务补充】：
    - 请为这张照片提供 3 个具有美感或叙事感的标题 (suggestedTitles)。
    - 请为这张照片提取 3-5 个关键标签 (suggestedTags)，例如：#极简、#纪实等。
    - 请提供一个适合发布在 Instagram 上的简洁文案 (instagramCaption)，风格要冷淡、文艺或极简。
    - 请提供 5-8 个适合 Instagram 的英文/中文标签 (instagramHashtags)。

    【艺术准则】：
    - 不要因为死板的技术标准（如轻微模糊或噪点）降低评分，如果这种表现能增强氛围和故事，请给予正向肯定。
    - 所有分析内容必须使用中文（除 Instagram 标签外）。

    请结合已知环境信息：${JSON.stringify(technicalContext)}，严格按指定 JSON 格式输出。
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Data } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scores: {
              type: Type.OBJECT,
              properties: {
                composition: { type: Type.NUMBER },
                light: { type: Type.NUMBER },
                content: { type: Type.NUMBER },
                completeness: { type: Type.NUMBER },
                overall: { type: Type.NUMBER },
                tilt: { type: Type.NUMBER },
                sharpness: { type: Type.NUMBER }
              },
              required: ["composition", "light", "content", "completeness", "overall"]
            },
            analysis: {
              type: Type.OBJECT,
              properties: {
                diagnosis: { type: Type.STRING },
                improvement: { type: Type.STRING },
                storyNote: { type: Type.STRING },
                moodNote: { type: Type.STRING },
                overallSuggestion: { type: Type.STRING },
                suggestedTitles: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                suggestedTags: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                instagramCaption: { type: Type.STRING },
                instagramHashtags: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ["diagnosis", "improvement", "storyNote", "moodNote", "overallSuggestion", "suggestedTitles", "suggestedTags", "instagramCaption", "instagramHashtags"]
            }
          },
          required: ["scores", "analysis"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI Analysis Error:", error);
    throw error;
  }
}
