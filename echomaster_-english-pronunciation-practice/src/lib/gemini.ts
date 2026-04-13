import { GoogleGenAI, Type } from "@google/genai";
import { Sentence } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateSentences(topic: string): Promise<Sentence[]> {
  const prompt = `Generate 5 English sentences for the topic "${topic}". 
  The sentences should range from simple to difficult (Beginner, Intermediate, Advanced, Expert, Master).
  Each sentence should be a practical, real-world phrase.
  Provide the response in JSON format with the following structure:
  {
    "sentences": [
      {
        "text": "The English sentence",
        "difficulty": "Beginner",
        "translation": "Traditional Chinese translation"
      },
      ...
    ]
  }`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentences: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  difficulty: { type: Type.STRING, enum: ["Beginner", "Intermediate", "Advanced", "Expert", "Master"] },
                  translation: { type: Type.STRING }
                },
                required: ["text", "difficulty", "translation"]
              }
            }
          },
          required: ["sentences"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    return data.sentences || [];
  } catch (error) {
    console.error("Error generating sentences:", error);
    throw error;
  }
}
