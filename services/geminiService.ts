import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Asset } from '../types';

const API_KEY = process.env.API_KEY || '';

let ai: GoogleGenAI | null = null;
if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
}

export const analyzePortfolioWithGemini = async (assets: Asset[]): Promise<any> => {
  if (!ai) {
    console.warn("No API Key provided for Gemini.");
    throw new Error("Gemini API Key is missing.");
  }

  // Calculate total value for meaningful weighting context
  const totalValue = assets.reduce((sum, asset) => sum + (asset.quantity * asset.currentPrice), 0);

  const assetSummary = assets.map(a => {
    const value = a.quantity * a.currentPrice;
    const weight = totalValue > 0 ? (value / totalValue) * 100 : 0;
    return `- ${a.symbol} (${a.name}): ${a.type}, $${value.toFixed(2)} (${weight.toFixed(1)}% weight), PnL: ${a.change24h}%`;
  }).join('\n');

  const prompt = `
    You are a senior institutional portfolio manager named 'Titan AI'. 
    Analyze the following portfolio positions for a high-net-worth individual.
    
    Portfolio Total Value: $${totalValue.toFixed(2)}
    
    Positions:
    ${assetSummary}

    Provide a structured JSON response with the following fields:
    1. riskScore (number 0-100): 100 is extreme risk. Evaluate based on asset class volatility (Crypto > Tech > Blue Chip > Fixed Income) and concentration.
    2. summary (string): A professional executive summary (max 2 sentences) of the portfolio's health, sector exposure, and performance attribution.
    3. recommendations (array of strings): Exactly 3 specific, actionable, institutional-grade strategies to optimize the portfolio (e.g., "Reduce tech concentration", "Hedge via gold", "Increase fixed income").
    4. diversificationStatus (string): One of: "Poor", "Moderate", "Excellent", "Over-Diversified".

    Analyze deeply.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskScore: { type: Type.NUMBER },
            summary: { type: Type.STRING },
            recommendations: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            diversificationStatus: { type: Type.STRING }
          },
          required: ["riskScore", "summary", "recommendations", "diversificationStatus"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw error;
  }
};

export const editImageWithGemini = async (imageBase64: string, prompt: string): Promise<string> => {
    if (!ai) throw new Error("Gemini API Key is missing.");

    // Remove data URL prefix if present for the API call
    const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: 'image/png', // Assuming PNG or generic image input, API handles it
                            data: cleanBase64
                        }
                    },
                    { text: prompt }
                ]
            }
        });

        // The model returns the image in the response parts
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        throw new Error("No image generated.");
    } catch (error) {
        console.error("Image Editing Failed:", error);
        throw error;
    }
};

export const researchMarketWithGemini = async (query: string): Promise<{text: string, groundingChunks: any[]}> => {
    if (!ai) throw new Error("Gemini API Key is missing.");

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: query,
            config: {
                tools: [{ googleSearch: {} }]
            }
        });

        const text = response.text || "No information available.";
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

        return { text, groundingChunks };
    } catch (error) {
        console.error("Market Research Failed:", error);
        throw error;
    }
};

export const generateSpeechWithGemini = async (text: string): Promise<string> => {
    if (!ai) throw new Error("Gemini API Key is missing.");

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: { parts: [{ text }] },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' }
                    }
                }
            }
        });

        const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!audioData) throw new Error("No audio generated");
        
        return audioData;
    } catch (error) {
        console.error("TTS Failed:", error);
        throw error;
    }
};