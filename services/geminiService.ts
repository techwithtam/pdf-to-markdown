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
    
    // Simplified prompt for faster processing
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
      model: 'gemini-3-flash',
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
