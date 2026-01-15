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

Set `GEMINI_API_KEY` in `.env.local` for the Gemini AI photo analysis feature:

```
GEMINI_API_KEY=your_api_key_here
```

## Architecture

This is a React 19 + TypeScript photography progress tracking app ("PhotoPath") built with Vite. It uses the Gemini AI API for photo analysis and critique.

### Core Flow

1. **Photo Upload** (`App.tsx`): Users upload photos via file input. EXIF metadata is extracted using `exif-js` library.

2. **AI Analysis** (`services/geminiService.ts`): Photos are sent to Gemini API (`gemini-3-flash-preview` model) for aesthetic evaluation. The service returns:
   - Scores (composition, light, content, completeness, overall)
   - Analysis (diagnosis, improvement suggestions, story interpretation)
   - Social media content (Instagram caption and hashtags)
   - Suggested titles and tags

3. **Archive Storage**: Analyzed photos are stored in React state as `PhotoEntry[]` and displayed in the Archives view.

### Key Types (`types.ts`)

- `PhotoEntry`: Complete photo record with metadata, scores, and analysis
- `DetailedScores`: Numeric ratings (0-100) for composition, light, content, completeness, overall
- `DetailedAnalysis`: AI-generated text feedback including diagnosis, improvement, story notes
- `NavTab`: Navigation states (EVALUATION, PATH)

### UI Structure

- Two main views controlled by `NavTab`: Evaluation (photo upload/analysis) and Path (archives)
- Left sidebar navigation with Zap (evaluation) and Activity (archives) icons
- Responsive design with mobile bottom navigation
- Styling: Tailwind CSS via CDN, IBM Plex Mono for monospace elements, dark theme with Leica red (#D40000) accent

### State Management

All state is managed via React `useState` hooks in the main `App` component. No external state library.
