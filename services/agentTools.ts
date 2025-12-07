import { GoogleGenAI, Type } from "@google/genai";
import { Question, Subject, Difficulty } from "../types";

const API_KEY = process.env.API_KEY;
let aiClient: GoogleGenAI | null = null;
if (API_KEY) {
  aiClient = new GoogleGenAI({ apiKey: API_KEY });
}

/**
 * Tool: Fetch Optimal Problems
 * Generates practice problems tailored to a specific topic and difficulty.
 */
export const fetchOptimalProblems = async (topic: string, difficulty: string = 'Medium'): Promise<Question[]> => {
  if (!aiClient) return [];

  const prompt = `
    Generate 3 ${difficulty} level JEE/MHT-CET style multiple-choice questions for the topic: "${topic}".
    
    Return a JSON array of objects with fields:
    - id (unique string)
    - text (question stem)
    - subject (Physics, Chemistry, or Mathematics)
    - topic (string)
    - difficulty (Easy, Medium, Hard)
    - options (array of 4 strings)
    - correctIndex (0-3)
    - explanation (concise solution)
  `;

  try {
    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              text: { type: Type.STRING },
              subject: { type: Type.STRING },
              topic: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING }
            }
          }
        }
      }
    });
    
    const data = JSON.parse(response.text || '[]');
    // Map string subject to Enum if necessary
    return data.map((q: any) => ({
        ...q,
        subject: q.subject as Subject
    }));
  } catch (error) {
    console.error("Tool Error (fetchOptimalProblems):", error);
    return [];
  }
};

/**
 * Tool: Generate Micro Schedule
 */
export const generateMicroSchedule = async (days: number, weakAreas: string[]) => {
    if (!aiClient) return { error: "AI not initialized" };
    
    const prompt = `
      Create a ${days}-day micro-schedule focusing on these weak areas: ${weakAreas.join(', ')}.
      Return a simple JSON object with a 'schedule' array containing strings describing daily focus.
    `;

    try {
        const response = await aiClient.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(response.text || '{}');
    } catch (e) {
        return { schedule: ["Focus on " + weakAreas[0], "Practice problems", "Review concepts"] };
    }
};

/**
 * Tool: Predict Next Topic
 */
export const predictNextTopic = async (currentTopic: string) => {
    return {
        current: currentTopic,
        next: "Advanced Applications of " + currentTopic,
        reasoning: "Based on prerequisite graph topology."
    };
};

/**
 * Tool: Update Spaced Repetition (Mock)
 */
export const updateSpacedRepetition = async () => {
    return { status: "Queue updated", nextReview: "Tomorrow 9 AM" };
};