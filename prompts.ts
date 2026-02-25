/**
 * AI prompts — edit natural language here to change model behavior without touching service logic.
 */

export const PROMPTS = {
  /**
   * Phase 1: Detect tab boundaries from a document.
   * Used for both PDF (inline data) and HTML input.
   */
  tabDetection: `
    Analyze this document and identify ALL the separate tabs/sections that should be split into individual files.

    **How to identify tab separators:**
    - Look for SHORT standalone lines/paragraphs that act as SECTION DIVIDERS
    - These are typically 1-5 words, sitting alone, followed by the section's content
    - They can be ANY format: "Overview", "Chapter 1", "system-prompt", "_navigation-guide", "00-intro", "Getting Started"
    - In HTML: often <p>Title Here</p> or <p><a id="..."></a>Title Here</p>
    - They are NOT part of the content - they DIVIDE the document into logical sections
    - Each divider marks where a new file should begin

    **CRITICAL: Scan the ENTIRE document. Every standalone short title = 1 tab.**

    Return ONLY the tab structure - do NOT extract content.
    For each tab:
    - tabNumber: Sequential (1, 2, 3...)
    - fileName: Convert to kebab-case.md (e.g., "Getting Started" -> "getting-started.md")
    - originalTitle: Exact title text found
    - startPage: Position in document order (1, 2, 3...)
    - endPage: Position before next tab (or end)
  `,

  /**
   * Phase 2a: Convert a sliced HTML section to clean Markdown.
   * Used in AI Enhanced mode for DOCX files where the HTML is pre-sliced.
   */
  tabProcessingHtml: (title: string) => `
    Convert this HTML content to clean Markdown.
    This section is titled "${title}".

    **CLEAN**: Remove any noise, artifacts, or redundant whitespace.
    **OUTPUT**: Return clean Markdown with proper H1/H2/H3 hierarchy and valid tables.
    **DO NOT include the tab/section title "${title}" at the beginning** - it's already used as the filename.
  `,

  /**
   * Phase 2b: Extract a page range from a PDF and convert to clean Markdown.
   * Used in AI Enhanced mode for PDF files.
   */
  tabProcessingPdf: (title: string, startPage: number, endPage: number) => `
    Extract content ONLY from pages ${startPage} to ${endPage} of this document.
    This section is titled "${title}".

    **CLEAN**: Remove "==Start of OCR==", "==Screenshot==", page numbers, headers/footers, and noise.
    **OUTPUT**: Return clean Markdown with proper H1/H2/H3 hierarchy and valid tables.
    **IMPORTANT**: Only process pages ${startPage}-${endPage}, ignore all other pages.
    **DO NOT include the tab/section title "${title}" at the beginning** - it's already used as the filename.
  `,

  /**
   * Legacy single-pass prompt for small documents (processDocument).
   */
  legacySinglePass: `
    Split this multi-tab document into separate files.

    **DETECT**: Sparse separator pages with titles like "00-navigation-guide" mark new tabs.
    **CLEAN**: Remove "==Start of OCR==", "==Screenshot==", page numbers, and noise.
    **OUTPUT**: For each tab, return clean Markdown with proper H1/H2/H3 hierarchy and valid tables.
    **FILENAME**: Generate .md filename from separator title (e.g., "00-navigation-guide.md").
  `,

  /**
   * Legacy single-pass HTML hint appended for DOCX files.
   */
  legacySinglePassHtmlHint: `
    **HTML SPECIFIC HINT**:
    Look for <h1> tags or paragraphs that contain distinct filenames/titles followed by content.
  `,
} as const;
