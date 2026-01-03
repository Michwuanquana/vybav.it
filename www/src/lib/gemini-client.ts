import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  // V devu nebudeme házet chybu hned při importu, aby šlo spustit build/dev bez klíče
  // ale v runtime to bude potřeba.
  console.warn("GEMINI_API_KEY není nastaven");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Používáme nejnovější Gemini 3 Flash (Preview) dostupný k lednu 2026
export const geminiFlash = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview",
  generationConfig: {
    temperature: 0.4,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
  },
});
