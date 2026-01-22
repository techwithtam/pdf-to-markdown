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
    
    // Optimized prompt that knows the structure of "Google Doc Tabs" exports
    const commonInstructions = `
      You are a high-speed document splitter. This document is an export of a multi-tab Google Document.
      
      **STRUCTURAL PATTERN TO DETECT:**
      The document uses "Separator Pages" to denote the start of a new tab.
      - A Separator Page usually contains very little text (often just 1-2 lines).
      - It typically contains the tab name or filename, often with suffixes like "(updated)", "(new)", or "(original)".
      - Examples from this document structure: "system-instructions (updated)", "00-navigation-guide (new)", "04-output-template".
      
      **YOUR TASK:**
      1. Scan the document to find these Separator Pages.
      2. Treat everything following a Separator Page (until the next Separator Page) as the content for that tab.
      3. **Filename Generation**: Use the text from the Separator Page. Clean it up:
         - Remove suffixes like "(updated)", "(new)".
         - Replace spaces with dashes or underscores.
         - Ensure it ends in ".md".
      4. **Content Formatting**: Convert the extracted section content into clean Markdown. Preserve headers, lists, and tables.
      
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
      model: 'gemini-3-flash-preview', // Switched to Flash for speed
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
                    description: "The extracted content in Markdown"
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
