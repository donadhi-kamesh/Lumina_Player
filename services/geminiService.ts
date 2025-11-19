import { GoogleGenAI } from "@google/genai";

const GEMINI_MODEL = 'gemini-2.5-flash';

/**
 * Analyzes a base64 image frame using Gemini Flash.
 * @param base64Image The base64 encoded string of the image (without prefix).
 * @param prompt The user's question or prompt about the image.
 * @param mimeType The mime type of the image (default image/jpeg).
 */
export const analyzeFrame = async (
  base64Image: string,
  prompt: string,
  mimeType: string = 'image/jpeg'
): Promise<string> => {
  try {
    if (!process.env.API_KEY) {
      throw new Error("API Key is missing. Please set the API_KEY environment variable.");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: {
        parts: [
          {
            text: prompt,
          },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image,
            },
          },
        ],
      },
      config: {
        systemInstruction: "You are an intelligent video assistant. Analyze the provided video frame and answer the user's question concisely and accurately. If the user asks for a summary, describe the visual content, any visible text, and the general mood.",
        temperature: 0.4,
      }
    });

    return response.text || "I couldn't generate a response for this frame.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to analyze the frame. Please try again.");
  }
};
