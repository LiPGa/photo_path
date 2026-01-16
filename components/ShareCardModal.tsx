import React, { useRef, useState, useEffect } from 'react';
import { X, Camera, Lightbulb, Download } from 'lucide-react';
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

export const ShareCardModal: React.FC<ShareCardModalProps> = ({
  currentUpload,
  currentResult,
  currentExif,
  selectedTitle,
  activeTags,
  onClose,
}) => {
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  // Clean up image URL when component unmounts or modal closes
  useEffect(() => {
    return () => {
      if (generatedImageUrl) {
        URL.revokeObjectURL(generatedImageUrl);
      }
    };
  }, [generatedImageUrl]);

  const generateShareCard = async () => {
    if (!shareCardRef.current) return;
    setIsGeneratingCard(true);
    setError(null);
    setGeneratedImageUrl(null);

    try {
      // Wait a bit for any animations or layout to settle
      await new Promise(resolve => setTimeout(resolve, 100));

      // Generate canvas with better options for long images
      const canvas = await Promise.race([
        html2canvas(shareCardRef.current, {
          backgroundColor: '#000',
          scale: 2,
          useCORS: true,
          logging: false,
          allowTaint: false,
          removeContainer: false,
          imageTimeout: 15000,
          onclone: (clonedDoc) => {
            // Ensure the cloned element is visible and properly sized
            const clonedElement = clonedDoc.querySelector('[data-share-card]');
            if (clonedElement) {
              (clonedElement as HTMLElement).style.display = 'block';
            }
          },
        }),
        new Promise<HTMLCanvasElement>((_, reject) => 
          setTimeout(() => reject(new Error('生成超时，请重试')), 30000)
        )
      ]);

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Failed to create blob'))), 
          'image/png',
          0.95
        );
      });

      // Create object URL for display and long-press save
      const imageUrl = URL.createObjectURL(blob);
      setGeneratedImageUrl(imageUrl);
      setIsGeneratingCard(false);

      // Auto-trigger share on mobile after a short delay
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        setTimeout(async () => {
          try {
            const file = new File([blob], `photopath_${selectedTitle || 'insight'}_${Date.now()}.png`, { 
              type: 'image/png' 
            });
            const canShareFiles = navigator.canShare && navigator.canShare({ files: [file] });
            
            if (canShareFiles) {
              await navigator.share({
                files: [file],
                title: selectedTitle || 'PhotoPath 点评卡片',
              });
            }
          } catch (shareError) {
            // User cancelled or share failed - that's OK, they can long-press the image
            if ((shareError as Error).name !== 'AbortError') {
              console.log('Share failed, user can long-press image to save');
            }
          }
        }, 500);
      }
    } catch (err) {
      console.error('生成卡片失败:', err);
      setError(err instanceof Error ? err.message : '生成卡片失败，请重试');
      setIsGeneratingCard(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-auto"
      onClick={onClose}
    >
      <div className="relative max-w-sm sm:max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-zinc-400 hover:text-white transition-colors bg-zinc-800 hover:bg-zinc-700 rounded-full p-2"
        >
          <X size={20} />
        </button>

        {/* Card content */}
        <div
          ref={shareCardRef}
          data-share-card
          className="bg-[#0a0a0a] rounded-lg overflow-hidden w-full"
          style={{ fontFamily: "'Inter', 'PingFang SC', sans-serif", maxWidth: '600px', margin: '0 auto' }}
        >
          {/* Header */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-[#D40000] rounded flex items-center justify-center text-[9px] sm:text-[10px] font-black">
                AP
              </div>
              <span className="text-xs sm:text-sm font-medium text-zinc-400">PhotoPath</span>
            </div>
            <span className="text-[10px] sm:text-xs text-zinc-600 mono">Lens Insight</span>
          </div>

          {/* Photo */}
          <div className="px-3 sm:px-4 pt-3 sm:pt-4">
            <img
              src={currentUpload}
              className="w-full aspect-[4/3] object-cover rounded-lg"
              alt=""
              crossOrigin="anonymous"
            />
          </div>

          {/* Title and tags */}
          <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-white/5">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{selectedTitle || '未命名作品'}</h3>
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
            <div className="px-4 sm:px-6 py-2 sm:py-3 border-b border-white/5 flex items-center gap-3 sm:gap-4 text-[11px] sm:text-xs text-zinc-500">
              <div className="flex items-center gap-1.5">
                <Camera size={12} className="text-zinc-600" />
                <span className="text-zinc-400">{currentExif.camera}</span>
              </div>
              <span>{currentExif.aperture}</span>
              <span>{currentExif.shutterSpeed}</span>
              <span>{currentExif.iso}</span>
            </div>
          )}

          {/* Scores */}
          <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-3 sm:space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
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
            <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-white/5">
              <span className="text-xs sm:text-sm font-medium text-zinc-400">综合评分</span>
              <span className="text-2xl sm:text-3xl font-black text-[#D40000]">
                {currentResult.scores.overall.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Diagnosis summary */}
          <div className="px-4 sm:px-6 pb-4 sm:pb-5">
            <h4 className="text-xs sm:text-sm font-bold text-zinc-300 mb-2">诊断分析</h4>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed whitespace-pre-line">
              {currentResult.analysis.diagnosis}
            </p>
          </div>

          {/* Evolution strategy */}
          <div className="mx-4 sm:mx-6 mb-4 sm:mb-5 p-3 sm:p-4 bg-[#D40000]/10 border border-[#D40000]/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb size={12} className="sm:w-[14px] sm:h-[14px] text-[#D40000]" />
              <span className="text-[11px] sm:text-xs font-bold text-[#D40000]">进化策略</span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
              {currentResult.analysis.improvement}
            </p>
          </div>

          {/* Story and mood notes */}
          <div className="px-4 sm:px-6 pb-4 sm:pb-5 space-y-3">
            {currentResult.analysis.storyNote && (
              <div>
                <span className="text-[11px] sm:text-xs text-zinc-500">故事感：</span>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  {currentResult.analysis.storyNote}
                </p>
              </div>
            )}
            {currentResult.analysis.moodNote && (
              <div>
                <span className="text-[11px] sm:text-xs text-zinc-500">情绪：</span>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  {currentResult.analysis.moodNote}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-zinc-900/50 flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] text-zinc-600 mono">
              AI 摄影点评 · {new Date().toLocaleDateString('zh-CN')}
            </span>
            <span className="text-[9px] sm:text-[10px] text-zinc-600">photopath.app</span>
          </div>
        </div>

        {/* Generated image display for long-press save */}
        {generatedImageUrl && (
          <div className="mt-4 space-y-3">
            <div className="bg-zinc-900 rounded-lg p-4">
              <p className="text-xs text-zinc-400 text-center mb-3">
                长按图片保存到相册
              </p>
              <img
                src={generatedImageUrl}
                alt="PhotoPath 点评卡片"
                className="w-full h-auto rounded-lg"
                style={{ 
                  userSelect: 'none', 
                  WebkitUserSelect: 'none',
                  touchAction: 'none',
                  pointerEvents: 'auto'
                }}
              />
            </div>
            <button
              onClick={() => {
                if (generatedImageUrl) {
                  URL.revokeObjectURL(generatedImageUrl);
                }
                setGeneratedImageUrl(null);
                setError(null);
              }}
              className="w-full py-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              重新生成
            </button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-2 text-center text-sm text-red-400">{error}</div>
        )}

        {/* Generate button - only show if image not generated yet */}
        {!generatedImageUrl && (
          <button
            onClick={generateShareCard}
            disabled={isGeneratingCard}
            className="mt-3 sm:mt-4 w-full py-3 sm:py-4 bg-[#D40000] hover:bg-[#B30000] disabled:bg-zinc-800 disabled:opacity-50 transition-all rounded-lg flex items-center justify-center gap-3"
          >
            {isGeneratingCard ? (
              <>
                <span className="text-sm">生成中...</span>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </>
            ) : (
              <>
                <Download size={18} />
                <span className="text-sm font-medium">生成长图</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
