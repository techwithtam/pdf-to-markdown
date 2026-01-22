import { GoogleGenAI, Type } from "@google/genai";
import { ProcessingResult, ProcessedTab } from '../types';

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
      maxOutputTokens: 4096,
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
  if (!text) {
    throw new Error("No response from Gemini during tab detection");
  }

  return JSON.parse(text) as DetectionResult;
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
  if (!text) {
    throw new Error(`No response from Gemini for tab: ${tab.fileName}`);
  }

  const result = JSON.parse(text);
  return {
    fileName: tab.fileName,
    originalTitle: tab.originalTitle,
    markdownContent: result.markdownContent
  };
};

/**
 * Process multiple tabs in parallel batches
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
 * Main entry point: Process document with chunked approach
 */
export const processDocumentChunked = async (
  input: ProcessInput,
  onProgress: ProgressCallback
): Promise<ProcessingResult> => {
  try {
    // Phase 1: Detect tabs
    onProgress('detecting', 0, 0);
    const detection = await detectTabs(input);

    if (!detection.tabs || detection.tabs.length === 0) {
      throw new Error("No tabs detected in the document. Make sure your document has separator pages.");
    }

    // Phase 2: Process each tab
    const processedTabs = await processTabsInBatches(
      input,
      detection.tabs,
      onProgress,
      3 // Process 3 tabs in parallel
    );

    return { tabs: processedTabs };

  } catch (error) {
    console.error("Gemini API Error:", error);
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
