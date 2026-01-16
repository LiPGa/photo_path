import React, { useState, useRef } from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import exifr from 'exifr';
import { PhotoEntry, NavTab } from '../../types';
import { MAX_FILE_SIZE } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { useDailyUsage } from '../../hooks/useDailyUsage';
import { useImageCache } from '../../hooks/useImageCache';
import { usePhotoAnalysis } from '../../hooks/usePhotoAnalysis';
import { savePhotoEntry } from '../../services/dataService';
import { uploadImage } from '../../services/cloudinaryService';
import { UploadArea } from './UploadArea';
import { AnalyzingOverlay } from './AnalyzingOverlay';
import { TechnicalPanel } from './TechnicalPanel';
import { ResultPanel } from './ResultPanel';
import { ShareCardModal } from '../ShareCardModal';

interface ExifData {
  camera: string;
  aperture: string;
  shutterSpeed: string;
  iso: string;
  focalLength: string;
  captureDate: string | null;
}

interface EvaluationViewProps {
  entries: PhotoEntry[];
  setEntries: React.Dispatch<React.SetStateAction<PhotoEntry[]>>;
  onNavigateToArchives: () => void;
  onShowAuthModal: () => void;
}

export const EvaluationView: React.FC<EvaluationViewProps> = ({
  entries,
  setEntries,
  onNavigateToArchives,
  onShowAuthModal,
}) => {
  const { user } = useAuth();
  const { remainingUses, incrementUsage, dailyLimit } = useDailyUsage(user?.id);
  const { duplicateWarning, checkImage, saveToCache, clearWarning } = useImageCache();
  const {
    isAnalyzing,
    currentResult,
    error,
    thinkingState,
    thinkingIndex,
    currentTip,
    startAnalysis,
    clearResult,
    clearError,
  } = usePhotoAnalysis();

  const [currentUpload, setCurrentUpload] = useState<string | null>(null); // Cloudinary URL or base64
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // 本地预览 URL
  const [currentExif, setCurrentExif] = useState<ExifData | null>(null);
  const [userNote, setUserNote] = useState('');
  const [selectedTitle, setSelectedTitle] = useState('');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const currentFileRef = useRef<File | null>(null);

  const isLimitReached = remainingUses <= 0;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setUploadError('文件过大 (上限 15MB)');
      return;
    }

    setUploadError(null);
    currentFileRef.current = file;

    // Set default EXIF values
    setCurrentExif({
      camera: 'Unknown',
      aperture: '--',
      shutterSpeed: '--',
      iso: '--',
      focalLength: '--',
      captureDate: null,
    });

    // 创建本地预览 URL（不用 base64，更快）
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    clearResult();

    // 同时开始上传到 Cloudinary
    setIsUploading(true);
    try {
      const result = await uploadImage(file);
      setCurrentUpload(result.url); // 存 Cloudinary URL
      checkImage(result.url);
    } catch (err) {
      console.error('Cloudinary upload failed:', err);
      // 降级：使用 base64
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        setCurrentUpload(base64);
        checkImage(base64);
      };
      reader.readAsDataURL(file);
      setUploadError('云存储上传失败，使用本地模式');
    } finally {
      setIsUploading(false);
    }

    // Extract EXIF data
    try {
      const exifData = await exifr.parse(file);
      if (exifData) {
        let captureDate = null;
        if (exifData.DateTimeOriginal) {
          captureDate = new Date(exifData.DateTimeOriginal).toISOString();
        } else if (exifData.CreateDate) {
          captureDate = new Date(exifData.CreateDate).toISOString();
        }

        setCurrentExif({
          camera: exifData.Model || exifData.Make || 'Unknown',
          aperture: exifData.FNumber ? `f/${exifData.FNumber}` : '--',
          shutterSpeed: exifData.ExposureTime
            ? exifData.ExposureTime < 1
              ? `1/${Math.round(1 / exifData.ExposureTime)}s`
              : `${exifData.ExposureTime}s`
            : '--',
          iso: exifData.ISO ? `ISO ${exifData.ISO}` : '--',
          focalLength: exifData.FocalLength ? `${Math.round(exifData.FocalLength)}mm` : '--',
          captureDate,
        });
      }
    } catch (e) {
      console.warn('EXIF extraction failed:', e);
    }
  };

  const handleStartAnalysis = async () => {
    if (!currentUpload || isLimitReached) return;

    const result = await startAnalysis(currentUpload, currentExif || {}, userNote);
    if (result) {
      if (result.analysis.suggestedTitles?.length) {
        setSelectedTitle(result.analysis.suggestedTitles[0]);
      }
      if (result.analysis.suggestedTags?.length) {
        setActiveTags(result.analysis.suggestedTags);
      }
      saveToCache(result.analysis.suggestedTitles?.[0] || 'Untitled');
      incrementUsage();
    }
  };

  const handleCopyInstagram = () => {
    if (!currentResult?.analysis) return;
    const caption = currentResult.analysis.instagramCaption || '';
    const hashtags = currentResult.analysis.instagramHashtags
      ?.map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))
      .join(' ') || '';
    const text = `${caption}\n\n${hashtags}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveRecord = async () => {
    if (!currentUpload || !currentResult || isSaving) return;

    setIsSaving(true);

    const photoDate = currentExif?.captureDate
      ? new Date(currentExif.captureDate).toLocaleDateString('zh-CN').replace(/\//g, '.')
      : new Date().toLocaleDateString('zh-CN').replace(/\//g, '.');

    const newEntry: PhotoEntry = {
      id: `SEQ_${Date.now().toString().slice(-6)}`,
      title: selectedTitle || 'UNTITLED',
      imageUrl: currentUpload,
      date: photoDate,
      location: 'STATION_ALPHA',
      notes: userNote || 'No creator notes.',
      tags: activeTags,
      params: {
        camera: currentExif?.camera,
        aperture: currentExif?.aperture,
        iso: currentExif?.iso,
        shutterSpeed: currentExif?.shutterSpeed,
      },
      scores: currentResult.scores,
      analysis: currentResult.analysis,
    };

    try {
      if (user) {
        const savedEntry = await savePhotoEntry(newEntry, user.id);
        if (savedEntry) {
          setEntries([savedEntry, ...entries]);
        } else {
          setEntries([newEntry, ...entries]);
          console.warn('保存到云端失败，已保存到本地');
        }
      } else {
        setEntries([newEntry, ...entries]);
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Reset state
      setCurrentUpload(null);
      clearResult();
      setCurrentExif(null);
      setUserNote('');
      setSelectedTitle('');
      setActiveTags([]);
      onNavigateToArchives();
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearUpload = () => {
    // 清理 Object URL 避免内存泄漏
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setCurrentUpload(null);
    setPreviewUrl(null);
    clearResult();
    setCurrentExif(null);
    clearError();
    setUploadError(null);
    currentFileRef.current = null;
  };

  // 显示用的图片 URL（优先用本地预览，更快）
  const displayUrl = previewUrl || currentUpload;

  return (
    <div className="flex flex-col lg:flex-row min-h-screen relative">
      {/* Left Area: Display & Technical */}
      <div className={`flex flex-col bg-[#050505] transition-all duration-1000 ease-in-out ${currentResult ? 'lg:flex-grow-0 lg:w-[50%]' : 'flex-grow'}`}>
        <div className="flex-grow flex flex-col items-center justify-center p-6 sm:p-10 relative overflow-hidden min-h-[50vh]">
          {/* Error Alert */}
          {(error || uploadError) && (
            <div className="absolute top-10 z-30 flex items-center gap-2 bg-[#D40000] text-white px-4 py-2 rounded-sm mono text-[10px] animate-in slide-in-from-top-4">
              <AlertCircle size={14} /> {error || uploadError}
              <button onClick={() => { clearError(); setUploadError(null); }} className="ml-4 hover:opacity-50">
                <X size={12} />
              </button>
            </div>
          )}

          {/* Duplicate Warning */}
          {duplicateWarning && !currentResult && (
            <div className="absolute top-10 z-30 flex items-center gap-3 bg-amber-600 text-white px-4 py-3 rounded-sm text-sm animate-in slide-in-from-top-4">
              <AlertCircle size={16} />
              <div>
                <span className="font-medium">这张照片之前分析过</span>
                <span className="text-white/70 ml-2">
                  「{duplicateWarning.title}」{duplicateWarning.date}
                </span>
              </div>
              <button onClick={clearWarning} className="ml-2 hover:opacity-50">
                <X size={14} />
              </button>
            </div>
          )}

          {displayUrl ? (
            <div className={`relative max-w-full flex flex-col items-center transition-all duration-1000 ${currentResult ? 'scale-[0.92] lg:-translate-x-6 opacity-100' : 'scale-100'}`}>
              <div className="relative group">
                {(isAnalyzing || isUploading) && (
                  <AnalyzingOverlay
                    thinkingState={isUploading ? { main: '正在上传图片...', sub: '上传到云存储中' } : thinkingState}
                    thinkingIndex={isUploading ? 0 : thinkingIndex}
                    currentTip={currentTip}
                  />
                )}
                <img
                  src={displayUrl}
                  className="max-w-full max-h-[50vh] sm:max-h-[60vh] object-contain shadow-[0_40px_100px_rgba(0,0,0,0.9)] border border-white/10 p-1 bg-zinc-900"
                  alt="Preview"
                />
                {!isAnalyzing && !isUploading && (
                  <button
                    onClick={handleClearUpload}
                    className="absolute -top-4 -right-4 bg-white text-black p-2 hover:bg-[#D40000] hover:text-white transition-all shadow-2xl z-30 rounded-sm"
                  >
                    <X size={16} />
                  </button>
                )}
                {/* 上传状态指示 */}
                {isUploading && (
                  <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/80 px-3 py-1.5 rounded-full">
                    <Loader2 size={14} className="animate-spin text-[#D40000]" />
                    <span className="text-xs text-zinc-400">上传中...</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <UploadArea onFileSelect={handleFileUpload} />
          )}
        </div>

        {/* Technical Panel */}
        <TechnicalPanel
          currentExif={currentExif}
          currentUpload={currentUpload}
          currentResult={currentResult}
          copied={copied}
          onCopyInstagram={handleCopyInstagram}
        />
      </div>

      {/* Right Panel: Analysis Result */}
      <ResultPanel
        currentResult={currentResult}
        currentUpload={currentUpload}
        isAnalyzing={isAnalyzing}
        isLimitReached={isLimitReached}
        remainingUses={remainingUses}
        user={user}
        selectedTitle={selectedTitle}
        activeTags={activeTags}
        isSaving={isSaving}
        userNote={userNote}
        onUserNoteChange={setUserNote}
        onStartAnalysis={handleStartAnalysis}
        onSelectTitle={setSelectedTitle}
        onShowShareCard={() => setShowShareCard(true)}
        onSaveRecord={handleSaveRecord}
        onShowAuthModal={onShowAuthModal}
      />

      {/* Share Card Modal */}
      {showShareCard && currentResult && currentUpload && (
        <ShareCardModal
          currentUpload={currentUpload}
          currentResult={currentResult}
          currentExif={currentExif}
          selectedTitle={selectedTitle}
          activeTags={activeTags}
          onClose={() => setShowShareCard(false)}
        />
      )}
    </div>
  );
};
