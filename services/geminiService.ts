import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

const getAIClient = () => {
  if (!ai && process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
};

export const getGameCommentary = async (fen: string, lastMove: string, history: string[]): Promise<string> => {
  const client = getAIClient();
  if (!client) return "Gemini API Key missing. Add it to enable commentary.";

  try {
    const prompt = `
      You are a witty, sarcastic, yet insightful Chess Grandmaster commentator.
      Current Board FEN: ${fen}
      Last Move: ${lastMove}
      Game History: ${history.slice(-5).join(', ')}...

      Provide a very short (max 2 sentences) commentary on the current situation. 
      Focus on who is winning or if a blunder was made. Be expressive but concise.
      Do not explain rules. Just react to the move.
    `;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Analyzing position...";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The Grandmaster is silent (Network Error).";
  }
};

export const getHint = async (fen: string, turn: string): Promise<string> => {
    const client = getAIClient();
    if (!client) return "Gemini API Key missing.";
  
    try {
      const prompt = `
        You are a Chess Coach. 
        FEN: ${fen}
        Turn: ${turn === 'w' ? 'White' : 'Black'}
        
        Suggest 1 good strategic idea or move for the current player. Keep it under 30 words.
      `;
  
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
  
      return response.text || "Think about controlling the center.";
    } catch (error) {
      return "Focus on your piece development.";
    }
  };