# Doc to Markdown

A web application that splits multi-tab Google Documents into clean, AI-ready Markdown files. Perfect for preparing knowledge bases for ChatGPT, Claude, and other AI tools.

## What It Does

Upload a PDF or DOCX file exported from Google Docs, and the app will:

1. **Detect tab separators** - AI identifies where each section/tab begins and ends
2. **Clean the content** - Removes OCR artifacts, page numbers, and formatting noise
3. **Generate Markdown** - Outputs clean `.md` files with proper heading hierarchy
4. **Download** - Get individual files or download all as a ZIP

## Live Demo

**[Watch the demo video](https://www.tella.tv/video/doc-greater-markdown-converter-enhv)**

## Tech Stack

- **Frontend**: React 19, TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS
- **AI**: Google Gemini 2.5 Flash
- **File Processing**:
  - Mammoth (DOCX to HTML conversion)
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
│   ├── FileUpload.tsx      # Drag & drop file upload zone
│   ├── ProcessingStatus.tsx # Step-by-step progress indicator
│   ├── ResultsView.tsx     # Markdown preview and download
│   └── VideoModal.tsx      # Demo video modal
├── services/
│   └── geminiService.ts    # Google Gemini API integration
│       ├── detectTabs()           # Phase 1: Identify tab boundaries
│       ├── processTab()           # Phase 2: Process single tab
│       └── processDocumentChunked() # Main orchestrator
├── utils/
│   └── fileHelpers.ts      # File conversion utilities
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Processing Architecture

The app uses a **two-phase chunked processing** approach for reliable handling of large documents:

### Phase 1: Tab Detection
- Gemini analyzes the document structure
- Identifies all separator pages and tab boundaries
- Returns lightweight metadata (tab names, page ranges)
- Fast response (~5-10 seconds)

### Phase 2: Parallel Tab Processing
- Each tab is processed individually
- Tabs are processed in batches of 3 in parallel
- Each tab gets its own API call with focused page range
- Progress updates shown for each tab

### Benefits
- **No token limits**: Each tab stays within output limits
- **Faster processing**: Parallel execution
- **Better accuracy**: Focused processing per section
- **Real-time progress**: Users see which tab is being processed

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

1. **Export your Google Doc** as PDF or DOCX
2. **Upload** the file via drag & drop or file picker
3. **Watch progress** as each tab is detected and processed
4. **Preview** the split Markdown files
5. **Download** individually or as a ZIP

### Processing Times

| Document Size | Approximate Time |
|---------------|------------------|
| 1-3 tabs | 15-30 seconds |
| 4-8 tabs | 30-60 seconds |
| 9-15 tabs | 1-2 minutes |
| 15+ tabs | 2-4 minutes |

*DOCX files process faster than PDFs (text vs. visual parsing)*

### Supported File Types

- `.pdf` - PDF documents
- `.docx` - Microsoft Word / Google Docs export

### How Tab Detection Works

The AI looks for "separator pages" - sparse pages with titles like:
- `00-navigation-guide`
- `01-foundation-collection`
- `02-getting-started`

Each separator marks the beginning of a new tab/section.

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
| `vendor-docx` | Mammoth, JSZip |
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
