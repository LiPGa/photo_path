import React, { useRef, useState, useEffect } from 'react';
import { X, Camera, Lightbulb, Download, ArrowLeft, CheckCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import { DetailedScores, DetailedAnalysis } from '../types';

interface ExifData {
  camera?: string;
  aperture?: string;
  shutterSpeed?: string;
  iso?: string;
  focalLength?: string;
  captureDate?: string | null;
}

interface ShareCardModalProps {
  currentUpload: string;
  currentResult: { scores: DetailedScores; analysis: DetailedAnalysis };
  currentExif: ExifData | null;
  selectedTitle: string;
  activeTags: string[];
  onClose: () => void;
}

// Helper function to download the image
const downloadImage = (imageUrl: string, title: string) => {
  const link = document.createElement('a');
  link.href = imageUrl;
  link.download = `photopath_${title || 'insight'}_${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const ShareCardModal: React.FC<ShareCardModalProps> = ({
  currentUpload,
  currentResult,
  currentExif,
  selectedTitle,
  activeTags,
  onClose,
}) => {
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generationComplete, setGenerationComplete] = useState(false);

  // Clean up the generated image URL when the component unmounts
  useEffect(() => {
    return () => {
      if (generatedImageUrl) {
        URL.revokeObjectURL(generatedImageUrl);
      }
    };
  }, [generatedImageUrl]);

  const generateShareCard = async () => {
    if (!shareCardRef.current || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setGenerationComplete(false);

    // Make the share card visible for rendering if it was hidden
    if(shareCardRef.current) {
        shareCardRef.current.style.display = 'block';
    }


    try {
      // Give the browser a moment to render the element
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: '#000',
        scale: 2, // Higher resolution
        useCORS: true,
        logging: false,
        allowTaint: true,
        imageTimeout: 20000, // Increased timeout
      });

      const imageUrl = canvas.toDataURL('image/png', 0.95);
      setGeneratedImageUrl(imageUrl);
      setGenerationComplete(true);

    } catch (err) {
      console.error('Failed to generate share card:', err);
      setError('生成失败，请刷新或稍后重试。');
    } finally {
      setIsGenerating(false);
       // Hide the original card after rendering to only show the image
      if(shareCardRef.current) {
        shareCardRef.current.style.display = 'none';
    }
    }
  };

  const handleBack = () => {
    setGeneratedImageUrl(null);
    setGenerationComplete(false);
    setError(null);
     if(shareCardRef.current) {
        shareCardRef.current.style.display = 'block';
    }
  };

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const handleSave = () => {
    if (!generatedImageUrl) return;

    if (isMobile) {
      // On mobile, opening in a new tab is the most reliable way for users to save
      const newTab = window.open();
      if (newTab) {
        newTab.document.write(
            `<!DOCTYPE html>
            <html>
            <head>
                <title>保存图片</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { margin: 0; background: #0a0a0a; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                    img { max-width: 100%; height: auto; }
                    p { color: #999; font-family: sans-serif; text-align: center; position: absolute; top: 20px; }
                </style>
            </head>
            <body>
                <p>长按图片保存到相册</p>
                <img src="${generatedImageUrl}" alt="分享图片" />
            </body>
            </html>`
        );
      }
    } else {
      // On desktop, we can trigger a direct download
      downloadImage(generatedImageUrl, selectedTitle);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-auto"
      onClick={onClose}
    >
      <div
        className="relative bg-[#0a0a0a] rounded-lg max-w-sm sm:max-w-md w-full p-4 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-zinc-500 hover:text-white transition-colors z-20"
        >
          <X size={24} />
        </button>

        {/* View after image is generated */}
        {generationComplete && generatedImageUrl ? (
          <div className="text-white text-center">
            <h3 className="text-lg font-bold mb-2 flex items-center justify-center gap-2">
              <CheckCircle size={20} className="text-green-500" />
              生成成功
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              {isMobile ? '长按下方图片即可保存到相册' : '点击下方按钮下载图片'}
            </p>
            <div className="bg-black rounded-lg p-2 my-4">
               <img
                src={generatedImageUrl}
                alt="生成的分享卡片"
                className="w-full h-auto rounded-md"
              />
            </div>
            {!isMobile && (
              <button
                onClick={handleSave}
                className="w-full mt-4 py-3 bg-[#D40000] hover:bg-[#B30000] transition-colors rounded-lg flex items-center justify-center gap-2"
              >
                <Download size={18} />
                <span className="font-medium">下载长图</span>
              </button>
            )}
            <button
              onClick={handleBack}
              className="w-full mt-2 py-2 text-zinc-400 hover:text-white transition-colors"
            >
              <span className="text-sm">返回</span>
            </button>
          </div>
        ) : (
          <>
            {/* Generation Button */}
            <div className={`text-center transition-opacity ${isGenerating ? 'opacity-0' : 'opacity-100'}`}>
                <h3 className="text-lg font-bold mb-1 text-white">分享点评卡片</h3>
                <p className="text-sm text-zinc-400 mb-4">将本次 AI 点评生成为一张可分享的图片。</p>
                <button
                    onClick={generateShareCard}
                    disabled={isGenerating}
                    className="w-full py-3 bg-[#D40000] hover:bg-[#B30000] disabled:bg-zinc-800 disabled:cursor-not-allowed transition-all rounded-lg flex items-center justify-center gap-3 text-white"
                >
                    <Download size={18} />
                    <span className="font-medium">生成长图</span>
                </button>
            </div>

            {/* Loading Indicator */}
            {isGenerating && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a] rounded-lg">
                    <div className="w-6 h-6 border-4 border-[#D40000] border-t-transparent rounded-full animate-spin"></div>
                    <span className="mt-4 text-zinc-300">正在生成中，请稍候...</span>
                </div>
            )}
          </>
        )}

        {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}
      </div>


        {/* Hidden element for rendering */}
        <div className="absolute -left-[9999px] top-0">
             <div
                ref={shareCardRef}
                className="bg-[#0a0a0a] rounded-lg overflow-hidden w-full"
                style={{ fontFamily: "'Inter', 'PingFang SC', sans-serif", width: '400px' }}
                >
          {/* Header */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[#D40000] rounded flex items-center justify-center text-[10px] font-black">
                AP
              </div>
              <span className="text-sm font-medium text-zinc-400">PhotoPath</span>
            </div>
            <span className="text-xs text-zinc-600 mono">Lens Insight</span>
          </div>

          {/* Photo */}
          <div className="px-4 pt-4">
            <img
              src={currentUpload}
              className="w-full aspect-[4/3] object-cover rounded-lg"
              alt=""
              crossOrigin="anonymous"
            />
          </div>

          {/* Title and tags */}
          <div className="px-6 pt-5 pb-4 border-b border-white/5">
            <h3 className="text-xl font-bold text-white mb-2">{selectedTitle || '未命名作品'}</h3>
            <div className="flex flex-wrap gap-2">
              {activeTags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-xs text-zinc-500 bg-zinc-900 px-2 py-1 rounded">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Camera params */}
          {currentExif && (
            <div className="px-6 py-3 border-b border-white/5 flex items-center gap-4 text-xs text-zinc-500">
              <div className="flex items-center gap-1.5">
                <Camera size={14} className="text-zinc-600" />
                <span className="text-zinc-400">{currentExif.camera}</span>
              </div>
              <span>{currentExif.aperture}</span>
              <span>{currentExif.shutterSpeed}</span>
              <span>{currentExif.iso}</span>
            </div>
          )}

          {/* Scores */}
          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: '构图', score: currentResult.scores.composition },
                { label: '光影', score: currentResult.scores.light },
                { label: '叙事', score: currentResult.scores.content },
                { label: '表达', score: currentResult.scores.completeness },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#D40000] rounded-full"
                        style={{ width: `${item.score * 10}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-zinc-300 w-8 text-right">
                      {item.score.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Overall score */}
            <div className="flex items-center justify-between pt-3 border-t border-white/5">
              <span className="text-sm font-medium text-zinc-400">综合评分</span>
              <span className="text-3xl font-black text-[#D40000]">
                {currentResult.scores.overall.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Diagnosis summary */}
          <div className="px-6 pb-5">
            <h4 className="text-sm font-bold text-zinc-300 mb-2">诊断分析</h4>
            <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">
              {currentResult.analysis.diagnosis}
            </p>
          </div>

          {/* Evolution strategy */}
          <div className="mx-6 mb-5 p-4 bg-[#D40000]/10 border border-[#D40000]/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb size={14} className="text-[#D40000]" />
              <span className="text-xs font-bold text-[#D40000]">进化策略</span>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
              {currentResult.analysis.improvement}
            </p>
          </div>

          {/* Story and mood notes */}
          <div className="px-6 pb-5 space-y-3">
            {currentResult.analysis.storyNote && (
              <div>
                <span className="text-xs text-zinc-500">故事感：</span>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {currentResult.analysis.storyNote}
                </p>
              </div>
            )}
            {currentResult.analysis.moodNote && (
              <div>
                <span className="text-xs text-zinc-500">情绪：</span>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {currentResult.analysis.moodNote}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-zinc-900/50 flex items-center justify-between">
            <span className="text-[10px] text-zinc-600 mono">
              AI 摄影点评 · {new Date().toLocaleDateString('zh-CN')}
            </span>
            <span className="text-[10px] text-zinc-600">photopath.app</span>
          </div>
            </div>
        </div>
    </div>
  );
};