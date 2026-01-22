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
}

export interface DetectionResult {
  totalPages: number;
  tabs: DetectedTab[];
}

/**
 * Local tab detection for HTML content (no AI needed)
 * Looks for heading patterns that indicate tab separators
 */
export const detectTabsLocal = (htmlContent: string): DetectionResult => {
  // Patterns that indicate a tab separator heading
  // e.g., "00-navigation-guide", "01-foundation-collection", "system-prompt"
  const separatorPatterns = [
    // Numbered patterns: 00-something, 01-something
    /^\d{1,2}[-_.]\s*[\w-]+$/i,
    // Kebab-case patterns: some-thing-here
    /^[a-z][\w]*(?:-[a-z][\w]*)+$/i,
    // Snake_case patterns: some_thing_here
    /^[a-z][\w]*(?:_[a-z][\w]*)+$/i,
  ];

  const isSeparatorTitle = (text: string): boolean => {
    const trimmed = text.trim();
    // Must be relatively short (separator titles are usually concise)
    if (trimmed.length > 100 || trimmed.length < 3) return false;
    // Should not contain multiple sentences
    if (trimmed.includes('. ')) return false;
    // Check against patterns
    return separatorPatterns.some(pattern => pattern.test(trimmed));
  };

  // Parse HTML to find headings
  const headingRegex = /<h([1-3])[^>]*>(.*?)<\/h\1>/gi;
  const strongParagraphRegex = /<p[^>]*>\s*<strong>(.*?)<\/strong>\s*<\/p>/gi;
  // Also look for plain paragraphs that contain only kebab-case names (common in DOCX exports)
  // Matches: <p>system-prompt</p> or <p><a id="..."></a>system-prompt</p>
  const plainParagraphRegex = /<p[^>]*>(?:<a[^>]*><\/a>)?([a-z][\w]*(?:[-_][a-z][\w]*)+)\s*<\/p>/gi;

  interface FoundHeading {
    title: string;
    index: number;
  }

  const foundHeadings: FoundHeading[] = [];

  // Find h1, h2, h3 headings
  let match;
  while ((match = headingRegex.exec(htmlContent)) !== null) {
    const title = match[2].replace(/<[^>]*>/g, '').trim(); // Strip inner HTML tags
    if (isSeparatorTitle(title)) {
      foundHeadings.push({ title, index: match.index });
    }
  }

  // Also check for bold paragraphs that might be separators
  while ((match = strongParagraphRegex.exec(htmlContent)) !== null) {
    const title = match[1].replace(/<[^>]*>/g, '').trim();
    if (isSeparatorTitle(title)) {
      // Avoid duplicates if already found as heading
      const isDuplicate = foundHeadings.some(h =>
        Math.abs(h.index - match!.index) < 100 && h.title === title
      );
      if (!isDuplicate) {
        foundHeadings.push({ title, index: match.index });
      }
    }
  }

  // Check for plain paragraphs with kebab-case/snake_case names (DOCX tab separators)
  while ((match = plainParagraphRegex.exec(htmlContent)) !== null) {
    const title = match[1].trim();
    // Avoid duplicates
    const isDuplicate = foundHeadings.some(h =>
      Math.abs(h.index - match!.index) < 100 && h.title === title
    );
    if (!isDuplicate) {
      foundHeadings.push({ title, index: match.index });
    }
  }

  // Sort by position in document
  foundHeadings.sort((a, b) => a.index - b.index);

  // Convert to DetectedTab format
  const tabs: DetectedTab[] = foundHeadings.map((heading, i) => {
    // Generate filename from title
    const fileName = heading.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '.md';

    return {
      tabNumber: i + 1,
      fileName,
      originalTitle: heading.title,
      startPage: i + 1, // Use index as pseudo-page for HTML
      endPage: i + 1,
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
    Analyze this document and identify all the separate tabs/sections.

    Look for sparse separator pages with titles like "00-navigation-guide" that mark new sections.

    Return ONLY the tab structure - do NOT extract the content yet.
    For each tab, identify:
    - The tab number (starting from 1)
    - The filename (e.g., "00-navigation-guide.md")
    - The original title found on the separator page
    - The start page number
    - The end page number (the page before the next separator, or the last page)
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
    return JSON.parse(text) as DetectionResult;
  } catch (parseError) {
    console.error("Failed to parse tab detection response. Raw text:", text);
    throw new Error("Failed to parse document structure. The document format may not be supported or is too complex.");
  }
};

/**
 * Phase 2: Process a single tab's content
 */
export const processTab = async (
  input: ProcessInput,
  tab: DetectedTab
): Promise<ProcessedTab> => {
  const ai = getAI();

  const prompt = `
    Extract content ONLY from pages ${tab.startPage} to ${tab.endPage} of this document.
    This section is titled "${tab.originalTitle}".

    **CLEAN**: Remove "==Start of OCR==", "==Screenshot==", page numbers, headers/footers, and noise.
    **OUTPUT**: Return clean Markdown with proper H1/H2/H3 hierarchy and valid tables.
    **IMPORTANT**: Only process pages ${tab.startPage}-${tab.endPage}, ignore all other pages.
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

  try {
    const result = JSON.parse(text);
    return {
      fileName: tab.fileName,
      originalTitle: tab.originalTitle,
      markdownContent: result.markdownContent
    };
  } catch (parseError) {
    console.error(`Failed to parse response for tab ${tab.fileName}:`, text.slice(0, 500));
    throw new Error(`Failed to process tab "${tab.originalTitle || tab.fileName}". The content may be too large or complex.`);
  }
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
      return processTab(input, tab);
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
    // Look for the title as a heading (# Title) or standalone line
    const patterns = [
      new RegExp(`^#{1,3}\\s*${escapeRegex(title)}\\s*$`, 'mi'),
      new RegExp(`^\\*\\*${escapeRegex(title)}\\*\\*\\s*$`, 'mi'),
      new RegExp(`^${escapeRegex(title)}\\s*$`, 'mi'),
    ];

    for (const pattern of patterns) {
      const match = fullMarkdown.match(pattern);
      if (match && match.index !== undefined) {
        splitPoints.push({ index: match.index, tab });
        break;
      }
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
    const content = fullMarkdown.slice(startIndex, endIndex).trim();

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

    // Always use AI for tab detection - it's more reliable for arbitrary tab titles
    // Local pattern-based detection is too brittle for real-world documents
    detection = await detectTabs(input);

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
