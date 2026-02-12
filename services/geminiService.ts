
import { GoogleGenAI } from "@google/genai";

export const generateImage = async (
  prompt: string, 
  settings: { aspectRatio: string; model: string; imageSize: string },
  editImageBase64?: string
): Promise<string> => {
  // CRITICAL: Create a new instance right before the call to ensure latest API key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const parts: any[] = [];
  
  // If editing, add the image part first
  if (editImageBase64) {
    // Extract mime type and base64 data
    const matches = editImageBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.*)$/);
    if (matches && matches.length === 3) {
      parts.push({
        inlineData: {
          mimeType: matches[1],
          data: matches[2]
        }
      });
    }
  }
  
  parts.push({ text: prompt });

  try {
    const response = await ai.models.generateContent({
      model: settings.model,
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: settings.aspectRatio,
          // Only include imageSize for gemini-3-pro-image-preview
          ...(settings.model === 'gemini-3-pro-image-preview' ? { imageSize: settings.imageSize } : {})
        },
        // FIX: Updated to use google_search as per image generation examples in guidelines
        ...(settings.model === 'gemini-3-pro-image-preview' ? { tools: [{ google_search: {} }] } : {})
      },
    });

    // Iterate through all parts to find the image part
    const candidates = response.candidates;
    if (candidates && candidates.length > 0 && candidates[0].content && candidates[0].content.parts) {
      for (const part of candidates[0].content.parts) {
        // Find the image part, do not assume it is the first part.
        if (part.inlineData) {
          const base64EncodeString: string = part.inlineData.data;
          return `data:image/png;base64,${base64EncodeString}`;
        }
      }
    }
    
    throw new Error("No image data found in response. The model might have returned text instead.");
  } catch (error) {
    console.error("Image generation failed:", error);
    throw error;
  }
};
