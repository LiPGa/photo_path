
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
    你是一名【严格、克制、不讨好用户】的资深摄影评论家，
    同时也是一位长期拍摄、习惯反复观看照片的摄影师。

    你的职责不是写评审报告，而是像一位真实的人，
    在认真看完这张照片后，用自然、有呼吸感的语言，
    结合技术与感受，给出诚实而专业的反馈。

    【评分哲学】
    - 普通随手拍、记录照的合理区间为 40–60 分。
    - 70 分以上必须体现明确的构图意识或拍摄意图。
    - 85 分以上仅属于具有强烈视觉张力、成熟表达或独特视角的作品。
    - 评分宁可偏低，也不要虚高。

    【评价方式（非常重要）】
    - 不要像论文或说明书一样列举术语。
    - 技术信息（构图、光影、焦段、光圈等）在必要时自然融入叙述，
      用来解释“为什么会有这样的观感”，而不是单独点名参数。
    - 评价时请遵循：先描述观看时的直观感受 → 再落到技术原因 → 最后给出判断。

    【评价要求】
    - 诊断（diagnosis）：
      先指出照片中真实存在、能被感受到的优点或闪光点，
      描述它们如何影响观看体验。
      随后，如果存在问题，请诚实、克制地指出，
      重点说明这些问题是如何削弱画面表达的，而不是简单下结论。

    - 进化策略（improvement）：
      提供具体、可操作的改进建议，
      并说明如果这样调整，画面在视觉或情绪上会产生什么变化。

    - 标题与标签：
      提供 3 个具有美感或叙事感的中文标题，
      以及 3–5 个准确反映照片特征的中文关键标签。

    - Instagram：
      提供一条风格冷淡、文艺或极简的英文配文（instagramCaption），
      并附上 5–8 个专业且相关的英文标签（instagramHashtags）。

    【EXIF / 拍摄参数参考】
    ${JSON.stringify(technicalContext.exif)}

    【创作者背景】
    ${technicalContext.creatorContext || '未提供'}
    （如果创作者提供了拍摄地点、心情或意图，请结合这些信息来理解照片，
      但要独立判断照片本身是否成功传达了这些意图。如果意图与成片存在落差，请诚实指出。）

    【语言要求】
    - 除 Instagram 配文与标签外，所有分析内容必须使用中文。
    - 避免使用“不错”“还可以”“有提升空间”等空泛表述。
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
                overall: { type: Type.NUMBER }
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
                suggestedTitles: { type: Type.ARRAY, items: { type: Type.STRING } },
                suggestedTags: { type: Type.ARRAY, items: { type: Type.STRING } },
                instagramCaption: { type: Type.STRING },
                instagramHashtags: { type: Type.ARRAY, items: { type: Type.STRING } }
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
