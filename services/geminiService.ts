import { GoogleGenAI, Type } from "@google/genai";
import TurndownService from 'turndown';
import { ProcessingResult, ProcessedTab, ProcessingMode } from '../types';

// Initialize Turndown for HTML to Markdown conversion
const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
});

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key is not configured. Please set the GEMINI_API_KEY environment variable.");
  }
  return new GoogleGenAI({ apiKey });
};

export interface ProcessInput {
  type: 'pdf' | 'html';
  data: string;
  mimeType: string;
}

export interface DetectedTab {
  tabNumber: number;
  fileName: string;
  originalTitle: string;
  startPage: number;
  endPage: number;
  htmlStartIndex?: number;  // Character position in HTML for slicing
  htmlEndIndex?: number;    // Character position in HTML for slicing
}

export interface DetectionResult {
  totalPages: number;
  tabs: DetectedTab[];
}

/**
 * Local tab detection for HTML content (no AI needed)
 * Looks for short standalone paragraphs that act as section dividers
 */
export const detectTabsLocal = (htmlContent: string): DetectionResult => {

  // Check if text looks like a tab separator (not regular content)
  const isLikelySeparator = (text: string): boolean => {
    const trimmed = text.trim();
    // Must be short (1-50 chars) - tab titles are concise
    if (trimmed.length > 50 || trimmed.length < 2) return false;
    // Should not end with period (not a sentence)
    if (trimmed.endsWith('.')) return false;
    // Should not contain multiple sentences
    if (trimmed.includes('. ')) return false;
    // Should not start with list markers
    if (/^[-*•]\s/.test(trimmed)) return false;
    // Should not be just a number
    if (/^\d+$/.test(trimmed)) return false;
    return true;
  };

  interface FoundHeading {
    title: string;
    index: number;
  }

  const foundHeadings: FoundHeading[] = [];
  let match;

  // Primary method: Find paragraphs with anchor IDs (DOCX bookmarks = section markers)
  // Pattern: <p><a id="..."></a>Title</p>
  const anchorParagraphRegex = /<p[^>]*><a\s+id="[^"]+"><\/a>([^<]+)<\/p>/gi;
  while ((match = anchorParagraphRegex.exec(htmlContent)) !== null) {
    const title = match[1].trim();
    if (isLikelySeparator(title)) {
      foundHeadings.push({ title, index: match.index });
    }
  }
  console.log("Local detection found tabs:", foundHeadings.map(h => h.title));

  // If no anchor-based tabs found, fall back to pattern matching
  if (foundHeadings.length === 0) {
    // Kebab-case/snake_case patterns: system-prompt, user_guide, 00-intro, _nav-guide
    const patternRegex = /<p[^>]*>(?:<a[^>]*><\/a>)?([\d_-]*[a-z][\w]*(?:[-_][\w]+)+)\s*<\/p>/gi;
    while ((match = patternRegex.exec(htmlContent)) !== null) {
      const title = match[1].trim();
      if (isLikelySeparator(title)) {
        foundHeadings.push({ title, index: match.index });
      }
    }
  }

  // Sort by position in document
  foundHeadings.sort((a, b) => a.index - b.index);

  // Convert to DetectedTab format with HTML indices for slicing
  const tabs: DetectedTab[] = foundHeadings.map((heading, i) => {
    // Generate filename from title
    const fileName = heading.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '.md';

    // Calculate HTML end index (start of next tab or end of document)
    const nextHeading = foundHeadings[i + 1];
    const htmlEndIndex = nextHeading ? nextHeading.index : htmlContent.length;

    return {
      tabNumber: i + 1,
      fileName,
      originalTitle: heading.title,
      startPage: i + 1, // Use index as pseudo-page for HTML
      endPage: i + 1,
      htmlStartIndex: heading.index,
      htmlEndIndex,
    };
  });

  return {
    totalPages: tabs.length,
    tabs,
  };
};

// Progress callback type
export type ProgressCallback = (phase: 'detecting' | 'processing', current: number, total: number, tabName?: string) => void;

/**
 * Phase 1: Detect tab boundaries (fast, small response)
 */
export const detectTabs = async (input: ProcessInput): Promise<DetectionResult> => {
  const ai = getAI();

  const prompt = `
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
  `;

  let contents;
  if (input.type === 'pdf') {
    contents = {
      parts: [
        { inlineData: { mimeType: input.mimeType, data: input.data } },
        { text: prompt }
      ]
    };
  } else {
    contents = {
      parts: [{ text: `${prompt}\n\nHTML CONTENT:\n${input.data}` }]
    };
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: contents,
    config: {
      maxOutputTokens: 65536,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          totalPages: {
            type: Type.NUMBER,
            description: "Total number of pages in the document"
          },
          tabs: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                tabNumber: { type: Type.NUMBER },
                fileName: { type: Type.STRING },
                originalTitle: { type: Type.STRING },
                startPage: { type: Type.NUMBER },
                endPage: { type: Type.NUMBER }
              },
              required: ["tabNumber", "fileName", "startPage", "endPage"]
            }
          }
        },
        required: ["totalPages", "tabs"]
      }
    }
  });

  const text = response.text;
  if (!text || text.trim() === '') {
    throw new Error("No response from Gemini during tab detection. The document may be too complex or contain unsupported content.");
  }

  try {
    const result = JSON.parse(text) as DetectionResult;
    console.log("Tab detection result:", JSON.stringify(result, null, 2));
    return result;
  } catch (parseError) {
    console.error("Failed to parse tab detection response. Raw text:", text);
    throw new Error("Failed to parse document structure. The document format may not be supported or is too complex.");
  }
};

/**
 * Phase 2: Process a single tab's content with retry logic
 */
export const processTab = async (
  input: ProcessInput,
  tab: DetectedTab,
  maxRetries: number = 2
): Promise<ProcessedTab> => {
  const ai = getAI();

  // For HTML input, use a simpler prompt since content is already sliced
  const isSlicedHtml = input.type === 'html' && tab.htmlStartIndex !== undefined;

  const prompt = isSlicedHtml
    ? `
      Convert this HTML content to clean Markdown.
      This section is titled "${tab.originalTitle}".

      **CLEAN**: Remove any noise, artifacts, or redundant whitespace.
      **OUTPUT**: Return clean Markdown with proper H1/H2/H3 hierarchy and valid tables.
      **DO NOT include the tab/section title "${tab.originalTitle}" at the beginning** - it's already used as the filename.
    `
    : `
      Extract content ONLY from pages ${tab.startPage} to ${tab.endPage} of this document.
      This section is titled "${tab.originalTitle}".

      **CLEAN**: Remove "==Start of OCR==", "==Screenshot==", page numbers, headers/footers, and noise.
      **OUTPUT**: Return clean Markdown with proper H1/H2/H3 hierarchy and valid tables.
      **IMPORTANT**: Only process pages ${tab.startPage}-${tab.endPage}, ignore all other pages.
      **DO NOT include the tab/section title "${tab.originalTitle}" at the beginning** - it's already used as the filename.
    `;

  let contents;
  if (input.type === 'pdf') {
    contents = {
      parts: [
        { inlineData: { mimeType: input.mimeType, data: input.data } },
        { text: prompt }
      ]
    };
  } else {
    contents = {
      parts: [{ text: `${prompt}\n\nHTML CONTENT:\n${input.data}` }]
    };
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
          maxOutputTokens: 32768,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              markdownContent: {
                type: Type.STRING,
                description: "The extracted content in clean Markdown format"
              }
            },
            required: ["markdownContent"]
          }
        }
      });

      const text = response.text;
      if (!text || text.trim() === '') {
        throw new Error(`No response from Gemini for tab: ${tab.fileName}. The content may be too complex.`);
      }

      const result = JSON.parse(text);
      return {
        fileName: tab.fileName,
        originalTitle: tab.originalTitle,
        markdownContent: result.markdownContent
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`Attempt ${attempt + 1}/${maxRetries + 1} failed for tab ${tab.fileName}:`, lastError.message);

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
  }

  console.error(`All retries exhausted for tab ${tab.fileName}`);
  throw new Error(`Failed to process tab "${tab.originalTitle || tab.fileName}". The content may be too large or complex.`);
};

/**
 * Process multiple tabs in parallel batches (AI Enhanced mode)
 */
const processTabsInBatches = async (
  input: ProcessInput,
  tabs: DetectedTab[],
  onProgress: ProgressCallback,
  batchSize: number = 3
): Promise<ProcessedTab[]> => {
  const results: ProcessedTab[] = [];

  for (let i = 0; i < tabs.length; i += batchSize) {
    const batch = tabs.slice(i, i + batchSize);

    // Process batch in parallel
    const batchPromises = batch.map(async (tab, batchIndex) => {
      const globalIndex = i + batchIndex;
      onProgress('processing', globalIndex + 1, tabs.length, tab.originalTitle || tab.fileName);

      // For HTML input with HTML indices, slice the content for this tab only
      // This dramatically reduces the payload size and avoids API limits
      let tabInput = input;
      if (input.type === 'html' && tab.htmlStartIndex !== undefined && tab.htmlEndIndex !== undefined) {
        const slicedHtml = input.data.slice(tab.htmlStartIndex, tab.htmlEndIndex);
        tabInput = { ...input, data: slicedHtml };
      }

      return processTab(tabInput, tab);
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  return results;
};

/**
 * Direct HTML to Markdown conversion (Quick Convert mode)
 * Converts HTML to Markdown and splits by detected tab boundaries
 */
const processTabsDirect = (
  htmlContent: string,
  tabs: DetectedTab[],
  onProgress: ProgressCallback
): ProcessedTab[] => {
  // Convert full HTML to Markdown
  const fullMarkdown = turndown.turndown(htmlContent);

  // If only one tab, return the full content
  if (tabs.length === 1) {
    onProgress('processing', 1, 1, tabs[0].originalTitle || tabs[0].fileName);
    return [{
      fileName: tabs[0].fileName,
      originalTitle: tabs[0].originalTitle,
      markdownContent: fullMarkdown.trim()
    }];
  }

  // Split by tab separator titles
  const results: ProcessedTab[] = [];

  // Build regex patterns for each tab title to find split points
  const splitPoints: { index: number; tab: DetectedTab }[] = [];

  for (const tab of tabs) {
    const title = tab.originalTitle || tab.fileName.replace('.md', '');
    const escapedTitle = escapeRegex(title);
    // Turndown escapes underscores with backslash: _nav -> \_nav
    // So also search for version with \\_ instead of _
    const escapedTitleWithBackslash = escapeRegex(title.replace(/_/g, '\\_'));

    // Look for the title as a heading (# Title) or standalone line
    const patterns = [
      new RegExp(`^#{1,3}\\s*${escapedTitle}\\s*$`, 'mi'),
      new RegExp(`^\\*\\*${escapedTitle}\\*\\*\\s*$`, 'mi'),
      new RegExp(`^${escapedTitle}\\s*$`, 'mi'),
      // Turndown escapes underscores with backslash
      new RegExp(`^${escapedTitleWithBackslash}\\s*$`, 'mi'),
    ];

    let found = false;
    for (const pattern of patterns) {
      const match = fullMarkdown.match(pattern);
      if (match && match.index !== undefined) {
        splitPoints.push({ index: match.index, tab });
        found = true;
        break;
      }
    }
    if (!found) {
      console.log(`Could not find split point for tab: "${title}"`);
    }
  }

  // Sort by position in document
  splitPoints.sort((a, b) => a.index - b.index);

  // If we couldn't find split points, return full content as single tab
  if (splitPoints.length === 0) {
    onProgress('processing', 1, 1, tabs[0].originalTitle || tabs[0].fileName);
    return [{
      fileName: tabs[0].fileName,
      originalTitle: tabs[0].originalTitle,
      markdownContent: fullMarkdown.trim()
    }];
  }

  // Extract content between split points
  for (let i = 0; i < splitPoints.length; i++) {
    const current = splitPoints[i];
    const next = splitPoints[i + 1];

    onProgress('processing', i + 1, splitPoints.length, current.tab.originalTitle || current.tab.fileName);

    const startIndex = current.index;
    const endIndex = next ? next.index : fullMarkdown.length;
    let content = fullMarkdown.slice(startIndex, endIndex).trim();

    // Remove the tab title from the beginning of the content
    // It appears as a standalone line at the start
    const title = current.tab.originalTitle || current.tab.fileName.replace('.md', '');
    const titlePatterns = [
      new RegExp(`^#{1,3}\\s*${escapeRegex(title)}\\s*[\\r\\n]*`, 'i'),
      new RegExp(`^\\*\\*${escapeRegex(title)}\\*\\*\\s*[\\r\\n]*`, 'i'),
      new RegExp(`^${escapeRegex(title)}\\s*[\\r\\n]*`, 'i'),
    ];
    for (const pattern of titlePatterns) {
      if (pattern.test(content)) {
        content = content.replace(pattern, '').trim();
        break;
      }
    }

    results.push({
      fileName: current.tab.fileName,
      originalTitle: current.tab.originalTitle,
      markdownContent: content
    });
  }

  return results;
};

/**
 * Escape special regex characters in a string
 */
const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Find HTML boundaries for tabs detected by AI (which don't have HTML indices)
 * This allows us to slice HTML content even when AI detection was used
 */
const findHtmlBoundaries = (htmlContent: string, tabs: DetectedTab[]): DetectedTab[] => {
  // If tabs already have HTML indices, return as-is
  if (tabs.every(tab => tab.htmlStartIndex !== undefined)) {
    return tabs;
  }

  interface BoundaryMatch {
    tab: DetectedTab;
    index: number;
  }

  const matches: BoundaryMatch[] = [];

  for (const tab of tabs) {
    const title = tab.originalTitle || tab.fileName.replace('.md', '');
    const escapedTitle = escapeRegex(title);

    // Try multiple patterns to find the tab in HTML
    const patterns = [
      // Paragraph with anchor: <p><a id="..."></a>Title</p>
      new RegExp(`<p[^>]*><a\\s+id="[^"]+"><\\/a>\\s*${escapedTitle}\\s*<\\/p>`, 'i'),
      // Simple paragraph: <p>Title</p>
      new RegExp(`<p[^>]*>\\s*${escapedTitle}\\s*<\\/p>`, 'i'),
      // Heading: <h1>Title</h1>
      new RegExp(`<h[1-6][^>]*>\\s*${escapedTitle}\\s*<\\/h[1-6]>`, 'i'),
    ];

    for (const pattern of patterns) {
      const match = htmlContent.match(pattern);
      if (match && match.index !== undefined) {
        matches.push({ tab, index: match.index });
        break;
      }
    }
  }

  // Sort by position in document
  matches.sort((a, b) => a.index - b.index);

  // Assign HTML boundaries based on sorted order
  return tabs.map(tab => {
    const matchIndex = matches.findIndex(m => m.tab === tab);
    if (matchIndex === -1) {
      return tab; // No match found, keep original
    }

    const currentMatch = matches[matchIndex];
    const nextMatch = matches[matchIndex + 1];

    return {
      ...tab,
      htmlStartIndex: currentMatch.index,
      htmlEndIndex: nextMatch ? nextMatch.index : htmlContent.length,
    };
  });
};

/**
 * Main entry point: Process document with chunked approach
 * @param mode - QUICK for direct conversion, AI_ENHANCED for full AI processing
 */
export const processDocumentChunked = async (
  input: ProcessInput,
  onProgress: ProgressCallback,
  mode: ProcessingMode = ProcessingMode.AI_ENHANCED
): Promise<ProcessingResult> => {
  try {
    // Phase 1: Detect tabs
    onProgress('detecting', 0, 0);

    let detection: DetectionResult;

    if (input.type === 'html') {
      // For HTML (DOCX): Always try fast local detection first
      // This finds tabs via anchor tags from document bookmarks - instant!
      detection = detectTabsLocal(input.data);
      console.log(`Local detection found ${detection.tabs.length} tabs`);

      // Fallback to AI only if local detection finds 0 or 1 tab (likely missed some)
      if (detection.tabs.length <= 1) {
        console.log('Local detection insufficient, falling back to AI...');
        detection = await detectTabs(input);
        // For AI-detected tabs, find HTML boundaries for slicing
        detection.tabs = findHtmlBoundaries(input.data, detection.tabs);
      }
    } else {
      // PDF: Must use AI for tab detection (can't parse PDF locally)
      detection = await detectTabs(input);
    }

    if (!detection.tabs || detection.tabs.length === 0) {
      throw new Error("No tabs detected in the document. Make sure your document has separator pages.");
    }

    // Phase 2: Process each tab
    let processedTabs: ProcessedTab[];

    if (mode === ProcessingMode.QUICK && input.type === 'html') {
      // Quick Convert: Direct HTML to Markdown (no AI for content)
      processedTabs = processTabsDirect(input.data, detection.tabs, onProgress);
    } else {
      // AI Enhanced: Full AI processing for each tab
      processedTabs = await processTabsInBatches(
        input,
        detection.tabs,
        onProgress,
        3 // Process 3 tabs in parallel
      );
    }

    return { tabs: processedTabs };

  } catch (error) {
    console.error("Processing Error:", error);
    throw error;
  }
};

/**
 * Legacy single-pass processing (kept for small documents)
 */
export const processDocument = async (input: ProcessInput): Promise<ProcessingResult> => {
  try {
    let contents;

    const commonInstructions = `
      Split this multi-tab document into separate files.

      **DETECT**: Sparse separator pages with titles like "00-navigation-guide" mark new tabs.
      **CLEAN**: Remove "==Start of OCR==", "==Screenshot==", page numbers, and noise.
      **OUTPUT**: For each tab, return clean Markdown with proper H1/H2/H3 hierarchy and valid tables.
      **FILENAME**: Generate .md filename from separator title (e.g., "00-navigation-guide.md").
    `;

    if (input.type === 'pdf') {
      contents = {
        parts: [
          { inlineData: { mimeType: input.mimeType, data: input.data } },
          { text: commonInstructions }
        ]
      };
    } else {
      contents = {
        parts: [
          {
            text: `
              Here is the HTML content of a document (converted from DOCX).
              ${commonInstructions}

              **HTML SPECIFIC HINT**:
              Look for <h1> tags or paragraphs that contain distinct filenames/titles followed by content.

              HTML CONTENT START:
              ${input.data}
              HTML CONTENT END
            `
          }
        ]
      };
    }

    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        maxOutputTokens: 65536,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tabs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  fileName: { type: Type.STRING },
                  originalTitle: { type: Type.STRING },
                  markdownContent: { type: Type.STRING }
                },
                required: ["fileName", "markdownContent"]
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from Gemini");
    }

    try {
      return JSON.parse(text) as ProcessingResult;
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", text.slice(-500));
      throw new Error("The document is too large. Try uploading a smaller PDF or splitting it into parts.");
    }

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
