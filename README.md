# Doc to Markdown

A web application that splits multi-tab Google Documents into clean, AI-ready Markdown files. Perfect for preparing knowledge bases for ChatGPT, Claude, and other AI tools.

## What It Does

Upload a PDF or DOCX file exported from Google Docs, and the app will:

1. **Detect tab separators** - AI identifies where each section/tab begins and ends
2. **Clean the content** - Removes OCR artifacts, page numbers, and formatting noise
3. **Generate Markdown** - Outputs clean `.md` files with proper heading hierarchy
4. **Download** - Get individual files or download all as a ZIP (in `.md` or `.txt` format)

## Features

- **Two Processing Modes**:
  - **Quick Convert** - Fast local conversion using Turndown (best for DOCX)
  - **AI Enhanced** - Full AI processing for maximum accuracy (best for PDFs)
- **Export Format Options** - Download as Markdown (`.md`) or Plain Text (`.txt`)
- **Google Doc Link Support** - Paste a Google Doc link to download as DOCX directly
- **Cancel Processing** - Stop processing at any time and start over
- **Real-time Progress** - See which tab is being processed with live updates
- **Parallel Processing** - Multiple tabs processed simultaneously for speed

## Live Demo

**[Watch the demo video](https://www.tella.tv/video/doc-greater-markdown-converter-enhv)**

## Tech Stack

- **Frontend**: React 19, TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS
- **AI**: Google Gemini 2.5 Flash
- **File Processing**:
  - Mammoth (DOCX to HTML conversion)
  - Turndown (HTML to Markdown conversion for Quick Convert mode)
  - JSZip (ZIP file generation)
- **Icons**: Lucide React
- **Deployment**: Vercel

## Project Structure

```
pdf-to-markdown/
├── App.tsx                 # Main application component
├── index.tsx               # React entry point
├── types.ts                # TypeScript interfaces and enums
├── components/
│   ├── Header.tsx          # Navigation header with logo
│   ├── FileUpload.tsx      # Drag & drop + Google Doc link support
│   ├── ModeSelector.tsx    # Quick Convert vs AI Enhanced toggle
│   ├── ProcessingStatus.tsx # Step-by-step progress with cancel
│   ├── ResultsView.tsx     # Markdown preview and download (md/txt formats)
│   └── VideoModal.tsx      # Demo video modal
├── services/
│   └── geminiService.ts    # Document processing service
│       ├── detectTabs()           # AI tab detection (fallback for PDFs)
│       ├── detectTabsLocal()      # Local tab detection via anchor tags
│       ├── processTab()           # AI processing per tab
│       ├── processTabsDirect()    # Direct HTML→MD splitting with escape handling
│       └── processDocumentChunked() # Main orchestrator
├── utils/
│   └── fileHelpers.ts      # File conversion and export utilities (md/txt)
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Processing Architecture

The app offers two processing modes to balance speed and accuracy:

### Quick Convert Mode (DOCX only)
Best for clean DOCX files exported from Google Docs.

1. **Local Tab Detection** - Detects tabs via anchor tags from document bookmarks (no AI call)
2. **Direct Conversion** - Uses Turndown to convert HTML to Markdown
3. **Split by Boundaries** - Divides content at detected tab separators
4. **AI Fallback** - If local detection finds ≤1 tab, automatically uses AI detection

**Benefits**: Very fast (~2-5 seconds), no API usage for conversion

### AI Enhanced Mode (PDF + DOCX)
Best for complex documents or PDFs with visual elements.

#### Phase 1: Tab Detection (Optimized)
- **DOCX files**: Uses fast local detection first (instant, no API call)
- **PDFs**: Uses AI detection (required since PDFs can't be parsed locally)
- **Fallback**: If local detection finds ≤1 tab, automatically uses AI detection
- Returns lightweight metadata (tab names, page ranges)

#### Phase 2: Parallel Tab Processing
- Each tab is processed individually with only its content slice (not the full document)
- Tabs are processed in batches of 3 in parallel
- Each tab gets its own API call for AI-powered Markdown conversion
- Includes retry logic with exponential backoff for reliability
- Progress updates shown for each tab

**Benefits**: Maximum accuracy, handles complex layouts and PDFs, optimized for speed

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Google Gemini API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/techwithtam/pdf-to-markdown.git
   cd pdf-to-markdown
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env.local
   ```

4. Add your Gemini API key to `.env.local`:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key | Yes |

Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

## Usage

1. **Get your document**:
   - Export from Google Docs as DOCX (File → Download → Microsoft Word)
   - Or paste a Google Doc link and click "Get DOCX" to download directly
2. **Choose processing mode**:
   - **Quick Convert** for fast local processing (DOCX recommended)
   - **AI Enhanced** for complex documents or PDFs
3. **Upload** the file via drag & drop or file picker
4. **Watch progress** as each tab is detected and processed
5. **Preview** the split Markdown files
6. **Download** individually or as a ZIP:
   - Choose **Markdown (.md)** for formatted text with headings
   - Choose **Plain Text (.txt)** for simple text files

### Processing Times

**Quick Convert Mode (DOCX)**
| Document Size | Approximate Time |
|---------------|------------------|
| Any size | 2-5 seconds |

**AI Enhanced Mode (DOCX with bookmarks)**
| Document Size | Approximate Time |
|---------------|------------------|
| 1-3 tabs | 5-15 seconds |
| 4-8 tabs | 15-30 seconds |
| 9-15 tabs | 30-60 seconds |
| 15+ tabs | 1-2 minutes |

**AI Enhanced Mode (PDF or DOCX without bookmarks)**
| Document Size | Approximate Time |
|---------------|------------------|
| 1-3 tabs | 15-30 seconds |
| 4-8 tabs | 30-60 seconds |
| 9-15 tabs | 1-2 minutes |
| 15+ tabs | 2-4 minutes |

*Quick Convert is recommended for simple DOCX files. AI Enhanced provides better Markdown quality and handles PDFs.*

### Supported File Types

- `.pdf` - PDF documents
- `.docx` - Microsoft Word / Google Docs export

### How Tab Detection Works

Tab detection is optimized for speed by using local detection first, with AI as a fallback.

#### Step 1: Local Detection (Instant)

For DOCX files (both modes), the app first attempts local detection using anchor tags:
- When you add bookmarks in Google Docs (Insert → Bookmark), they export as `<a id="..."></a>` anchors
- The local detector finds paragraphs with anchors: `<p><a id="bookmark-id"></a>Tab Title</p>`
- This is **instant** (no API call needed) and reliable since bookmarks explicitly mark section boundaries
- Supports any title format (plain text, numbers, special characters like `_navigation-guide`)

#### Step 2: AI Fallback (If Needed)

AI detection is only used when:
- Local detection finds ≤1 tab (document may lack bookmarks)
- The file is a PDF (cannot be parsed locally)

When AI detection runs:
- Gemini analyzes the entire document structure
- Looks for "separator pages" - sparse pages that mark section boundaries
- Identifies tab titles regardless of formatting convention

#### Detection Speed Comparison

| File Type | Detection Method | Speed |
|-----------|-----------------|-------|
| DOCX with bookmarks | Local (instant) | ~0.1 seconds |
| DOCX without bookmarks | AI fallback | ~10-30 seconds |
| PDF | AI (required) | ~10-30 seconds |

**Tip**: For fastest processing, add bookmarks in Google Docs before exporting. Each bookmark becomes a tab separator.

#### Content Splitting

Once tabs are detected, the content is split at each separator:
- For DOCX: HTML is sliced at detected boundaries, then each slice is processed separately
- This means each tab only sends its own content to the AI (not the full document)
- The converter handles special characters that may be escaped during HTML→Markdown conversion (e.g., underscores become `\_` in Markdown)

## Development

### Scripts

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

### Building for Production

```bash
npm run build
```

The output will be in the `dist/` directory.

### Build Optimization

The project uses manual chunk splitting to keep bundle sizes under 500 kB for optimal loading performance:

| Chunk | Contents |
|-------|----------|
| `vendor-react` | React, React DOM |
| `vendor-google` | Google Gemini SDK |
| `vendor-docx` | Mammoth, Turndown, JSZip |
| `vendor-icons` | Lucide React icons |
| `index` | Application code |

This configuration is in `vite.config.ts` under `build.rollupOptions.output.manualChunks`. Splitting vendors improves caching since library code changes less frequently than application code.

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add `GEMINI_API_KEY` environment variable
4. Deploy

Or use the Vercel CLI:

```bash
vercel
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Credits

Built by [Cadence](https://www.skool.com/bewarethedefault/about)

Powered by [Google Gemini](https://deepmind.google/technologies/gemini/)
