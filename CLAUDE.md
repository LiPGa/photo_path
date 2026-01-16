# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server on http://localhost:3000
npm run build        # Build for production
npm run preview      # Preview production build
```

## Environment Setup

Set environment variables in `.env.local`:

```bash
# Gemini API Key (必需)
GEMINI_API_KEY=your_api_key_here

# Mock 模式 - 本地测试时跳过 API 调用，返回模拟数据 (可选)
VITE_MOCK_API=true

# Supabase (可选 - 用于用户认证和数据持久化)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**本地开发时**建议开启 `VITE_MOCK_API=true` 节省 API 配额。部署时设为 `false` 或删除。

## Architecture

This is a React 19 + TypeScript photography progress tracking app ("PhotoPath") built with Vite. It uses the Gemini AI API for photo analysis and critique.

### Core Flow

1. **Photo Upload** (`App.tsx`): Users upload photos via file input. EXIF metadata is extracted using `exifr` library.

2. **AI Analysis** (`services/geminiService.ts`): Photos are sent to Gemini API (`gemini-3-flash-preview` model) for aesthetic evaluation. The service returns:
   - Scores (composition, light, content, completeness, overall) on a **10-point scale** (e.g., 6.5, 7.2)
   - Analysis (diagnosis, improvement suggestions, story interpretation)
   - Social media content (Instagram caption and hashtags)
   - Suggested titles and tags

3. **Data Persistence**:
   - Guest users: Photos stored in React state (lost on refresh)
   - Logged-in users: Photos synced to Supabase (`photo_entries` table)

### Project Structure

```
├── App.tsx                      # Main app (~80 lines, routing + top-level state)
├── constants.tsx                # All constants and config
├── types.ts                     # TypeScript type definitions
├── components/
│   ├── ui/                      # Reusable UI components
│   │   ├── ScoreMeter.tsx       # Score progress bar
│   │   └── Histogram.tsx        # Image luminance histogram
│   ├── layout/                  # Layout components
│   │   ├── Sidebar.tsx          # Side/bottom navigation
│   │   └── UserStatusBar.tsx    # Top-right user status
│   ├── evaluation/              # Evaluation page components
│   │   ├── EvaluationView.tsx   # Main evaluation container
│   │   ├── UploadArea.tsx       # Image upload zone
│   │   ├── AnalyzingOverlay.tsx # AI analyzing animation
│   │   ├── TechnicalPanel.tsx   # EXIF + creator notes panel
│   │   └── ResultPanel.tsx      # Analysis result display
│   ├── archives/                # Archives page components
│   │   ├── ArchivesView.tsx     # Main archives container
│   │   ├── TimelineList.tsx     # Timeline photo list
│   │   └── PhotoDetail.tsx      # Single photo detail view
│   ├── AuthModal.tsx            # Login/signup modal
│   └── ShareCardModal.tsx       # Share card generator modal
├── hooks/
│   ├── useDailyUsage.ts         # Daily usage limit logic
│   ├── useImageCache.ts         # Duplicate image detection
│   └── usePhotoAnalysis.ts      # Photo analysis state
├── contexts/
│   └── AuthContext.tsx          # Supabase auth context
└── services/
    ├── geminiService.ts         # AI photo analysis
    ├── supabase.ts              # Supabase client
    └── dataService.ts           # Database CRUD operations
```

### Services

- `services/geminiService.ts`: AI photo analysis with mock mode support
- `services/supabase.ts`: Supabase client and database type definitions
- `services/dataService.ts`: CRUD operations for `photo_entries`, `usage_stats`, `user_settings` tables

### Authentication

- `contexts/AuthContext.tsx`: Provides `useAuth()` hook with Supabase auth (email/password + Google OAuth)
- `components/AuthModal.tsx`: Login/signup modal UI

### Key Types (`types.ts`)

- `PhotoEntry`: Complete photo record with metadata, scores, and analysis
- `DetailedScores`: Numeric ratings (0-10) for composition, light, content, completeness, overall
- `DetailedAnalysis`: AI-generated text feedback including diagnosis, improvement, story notes
- `NavTab`: Navigation states (EVALUATION, PATH)

### UI Structure

- Two main views controlled by `NavTab`: Evaluation (photo upload/analysis) and Path (archives/timeline)
- Left sidebar navigation with Zap (evaluation) and Activity (archives) icons
- Responsive design with mobile bottom navigation
- Styling: Tailwind CSS via CDN, IBM Plex Mono for monospace elements, dark theme with Leica red (#D40000) accent

### Scoring Philosophy

The AI uses a strict 10-point grading system:
- 4.0–6.0: Typical casual/snapshot photos
- 7.0+: Requires clear compositional intent
- 8.5+: Reserved for strong visual impact and mature expression
