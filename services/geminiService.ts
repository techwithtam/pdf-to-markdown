import { GoogleGenAI, Type } from "@google/genai";
import { ProcessingResult } from '../types';

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key is not configured. Please set the GEMINI_API_KEY environment variable.");
  }
  return new GoogleGenAI({ apiKey });
};

interface ProcessInput {
  type: 'pdf' | 'html';
  data: string; // base64 for pdf, raw html string for html
  mimeType: string;
}

export const processDocument = async (input: ProcessInput): Promise<ProcessingResult> => {
  try {
    let contents;
    
    // Optimized prompt for Knowledge Base/AI-ready Markdown
    const commonInstructions = `
      You are an expert Knowledge Base architect and Document Splitter. 
      This document is an export of a multi-tab Google Document, likely containing "Start of OCR" or "Screenshot" markers.

      **STRUCTURAL PATTERN TO DETECT:**
      1. **Tab Separators**: Look for sparse pages containing titles like "00-navigation-guide (new)" or "system-instructions (updated)". These mark the start of a new file.
      2. **Noise Artifacts**: The document contains artifacts like "==Start of OCR for page X==", "==Screenshot for page X==", or "==End of OCR...". You MUST ignore and remove these lines completely.
      
      **YOUR TASK:**
      1. **Split**: Identify the "Tabs" based on the separator pages.
      2. **Filename Generation**: Create a clean filename ending in .md (e.g., "00-navigation-guide.md") from the separator title.
      3. **Knowledge Base Optimization**: 
         - Extract the content for each tab into **high-quality, semantic Markdown**.
         - **Optimize for AI/RAG**: Ensure clear H1/H2/H3 hierarchy. Do not flatten the structure. AI models rely on these headers for context.
         - **Clean**: Remove all page numbers, OCR markers, and visual noise.
         - **Tables**: Ensure tables are formatted as valid Markdown tables.
      
      Return the result strictly as JSON.
    `;

    if (input.type === 'pdf') {
      contents = {
        parts: [
          {
            inlineData: {
              mimeType: input.mimeType,
              data: input.data
            }
          },
          {
            text: commonInstructions
          }
        ]
      };
    } else {
      // HTML from DOCX
      contents = {
        parts: [
          {
            text: `
              Here is the HTML content of a document (converted from DOCX). 
              ${commonInstructions}
              
              **HTML SPECIFIC HINT**: 
              Look for <h1> tags or paragraphs that contain distinct filenames/titles followed by content, similar to the Separator Page pattern described above.

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
      model: 'gemini-3-flash-preview',
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tabs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  fileName: {
                    type: Type.STRING,
                    description: "The cleaned filename, e.g., '01-foundation-collection.md'"
                  },
                  originalTitle: {
                    type: Type.STRING,
                    description: "The raw title found on the separator page"
                  },
                  markdownContent: {
                    type: Type.STRING,
                    description: "The extracted content in AI-optimized Markdown"
                  }
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

    return JSON.parse(text) as ProcessingResult;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
