
import { GoogleGenAI, Type } from "@google/genai";
import { UserState } from "../types";

// Ensure API key is available
const API_KEY = process.env.API_KEY;

// Create the client
let aiClient: GoogleGenAI | null = null;
if (API_KEY) {
  aiClient = new GoogleGenAI({ apiKey: API_KEY });
}

export const isAiAvailable = () => !!aiClient;

/**
 * ONBOARDING AGENT
 * Analyzes a single open-ended response to determine student persona.
 */
export const evaluateOnboardingAnswer = async (answer: string) => {
  if (!aiClient) return {
    examType: 'JEE Main',
    feedback: "You rely on intuition. We will add rigor.",
    strongAreas: ['General Science'],
    weakAreas: ['Formal Physics']
  };

  const prompt = `
    The student was asked: "Why doesn't a satellite orbiting the Earth fall down?"
    Student Answer: "${answer}"

    Analyze their mental model.
    - If they explain it as "falling around the earth" or matching curvature: JEE Advanced (High Concept).
    - If they mention "centrifugal force balances gravity": JEE Main (Functional but technically imperfect frame).
    - If they say "gravity is zero" or "it's too far": MHT-CET (Foundational gaps).

    Return JSON:
    {
      "examType": "JEE Advanced" | "JEE Main" | "MHT-CET",
      "feedback": "A single, slightly provocative sentence about their thinking style. Max 15 words.",
      "strongAreas": ["Topic 1", "Topic 2"],
      "weakAreas": ["Topic 1", "Topic 2"]
    }
  `;

  try {
    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            examType: { type: Type.STRING },
            feedback: { type: Type.STRING },
            strongAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
            weakAreas: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Onboarding Analysis Error:", error);
    return {
      examType: 'JEE Main',
      feedback: "Analysis failed, but your journey begins now.",
      strongAreas: ['Curiosity'],
      weakAreas: ['Systems']
    };
  }
};

/**
 * AGENT 1: Diagnostic Agent
 * Analyzes initial quiz results to build a user profile.
 */
export const runDiagnosticAnalysis = async (
  results: { questionId: string; correct: boolean; topic: string }[],
  userState: UserState
) => {
  if (!aiClient) return null;

  const prompt = `
    Analyze this student's diagnostic test performance for ${userState.examType}.
    
    Results:
    ${results.map(r => `- Topic: ${r.topic}, Correct: ${r.correct}`).join('\n')}
    
    Target College: ${userState.targetCollege}
    
    Provide a JSON response with:
    1. A list of 3 specific weak areas.
    2. A list of 3 specific strong areas.
    3. A calculated "readiness score" from 0-100.
    4. A brief, motivating 2-sentence summary of their current standing.
  `;

  try {
    const response = await aiClient.models.generateContent({
      model: 'gemini-3-pro-preview', // Use Pro for deeper analysis
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            weakAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
            strongAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
            readinessScore: { type: Type.NUMBER },
            summary: { type: Type.STRING },
          },
          required: ['weakAreas', 'strongAreas', 'readinessScore', 'summary']
        }
      }
    });
    
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Diagnostic Agent Error:", error);
    // Fallback if AI fails
    return {
      weakAreas: ['Mechanics', 'Calculus', 'Organic Chemistry'],
      strongAreas: ['Algebra', 'Physical Chemistry'],
      readinessScore: 45,
      summary: "You have a decent foundation, but we need to work on core physics concepts."
    };
  }
};

/**
 * AGENT 2: Pathfinder Agent
 * Generates daily study plans.
 * Uses Flash-Lite for low-latency/background task.
 */
export const generateDailyPlan = async (userState: UserState) => {
  if (!aiClient) return null;

  const prompt = `
    Create a 1-day study plan for a student preparing for ${userState.examType}.
    Weaknesses: ${userState.weakAreas.join(', ')}.
    Strengths: ${userState.strongAreas.join(', ')}.
    
    Return a JSON object with a 'tasks' array of strings. 
    Keep tasks actionable and specific (e.g., "Solve 15 problems on Rotational Motion").
    Limit to 4 key tasks.
  `;

  try {
    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash', // Corrected model to ensure availability
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tasks: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });
    return JSON.parse(response.text || '{ "tasks": [] }').tasks;
  } catch (error) {
    console.error("Pathfinder Agent Error:", error);
    return ["Review Mechanics formulas", "Practice 20 Calculus problems", "Read NCERT Chemistry Chapter 4"];
  }
};

/**
 * AGENT 3: Tutor Agent
 * Handles chat interactions for learning.
 * Supports: Standard (Pro), Thinking (Pro + Think), Search (Flash + Google), Image (Pro Image)
 */
export interface TutorOptions {
  useThinking?: boolean;
  useSearch?: boolean;
}

export const getTutorResponse = async (
  message: string, 
  history: { role: 'user' | 'model'; text: string }[],
  currentContext?: string,
  options: TutorOptions = {}
) => {
  if (!aiClient) throw new Error("AI not initialized");

  const systemInstruction = `
    You are an expert JEE/MHT-CET tutor. 
    Your goal is to guide the student using the Socratic method.
    Do NOT give direct answers immediately. Ask probing questions to check understanding.
    If the student is stuck, provide a hint.
    Keep responses concise and encouraging.
    Use Markdown for math (e.g., $x^2$) if needed.
    Current Context: ${currentContext || 'General Study'}
  `;

  // Convert history to Gemini format
  const chatHistory = history.map(h => ({
    role: h.role,
    parts: [{ text: h.text }]
  }));

  let model = 'gemini-3-pro-preview';
  const config: any = { systemInstruction };

  if (options.useThinking) {
    model = 'gemini-3-pro-preview';
    config.thinkingConfig = { thinkingBudget: 32768 }; // Max budget for pro
  } else if (options.useSearch) {
    model = 'gemini-2.5-flash'; // Flash is standard for tools/search
    config.tools = [{ googleSearch: {} }];
    // responseMimeType is NOT allowed with search
  } else {
    // Default Chatbot
    model = 'gemini-3-pro-preview';
  }

  // Note: chats.create() keeps history, so we usually don't need to pass it explicitly if we keep the instance.
  // However, since this is a stateless function, we pass history.
  // IMPORTANT: Thinking/Search usually works best with generateContent for single turns or managed history.
  // For simplicity in this demo, we'll use generateContent if special modes are on, or Chat if standard.

  try {
    if (options.useSearch) {
      // Use generateContent for Search to easily parse grounding metadata
      const response = await aiClient.models.generateContent({
        model,
        contents: [...chatHistory.map(h => ({ role: h.role, parts: h.parts })), { role: 'user', parts: [{ text: message }] }],
        config
      });
      
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources = groundingChunks
        .map((chunk: any) => chunk.web ? { title: chunk.web.title, uri: chunk.web.uri } : null)
        .filter(Boolean);

      return { text: response.text, sources };

    } else if (options.useThinking) {
       const response = await aiClient.models.generateContent({
        model,
        contents: [...chatHistory.map(h => ({ role: h.role, parts: h.parts })), { role: 'user', parts: [{ text: message }] }],
        config
      });
      return { text: response.text };

    } else {
      // Standard Chat
      const chat = aiClient.chats.create({
        model,
        config,
        history: chatHistory
      });
      const result = await chat.sendMessage({ message });
      return { text: result.text };
    }
  } catch (e) {
    console.error("Tutor Error:", e);
    return { text: "I'm having trouble connecting right now. Please try again." };
  }
};

/**
 * FEATURE: Image Generation
 * Uses gemini-3-pro-image-preview
 */
export const generateConceptImage = async (prompt: string, size: '1K' | '2K' | '4K' = '1K') => {
  if (!aiClient) return null;

  try {
    const response = await aiClient.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          imageSize: size,
          aspectRatio: "16:9"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image Gen Error:", error);
    return null;
  }
};

/**
 * AGENT 4: Analysis Agent (Mock Test)
 */
export const analyzeMockTest = async (score: number, total: number, timeTaken: number) => {
    if (!aiClient) return "Analysis unavailable.";

    const prompt = `
      Student scored ${score}/${total} in a mock test taking ${Math.round(timeTaken / 60)} minutes.
      Provide a brief 3-sentence analysis of their performance and speed.
      Be direct and constructive.
    `;

    try {
        const response = await aiClient.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        return response.text;
    } catch (e) {
        return "Good effort! Focus on improving accuracy in the next test.";
    }
}

/**
 * FEATURE: Study Material Generator
 * Generates structured markdown content (Summary, Formula Sheet, etc)
 */
export const generateStudyMaterial = async (topic: string, type: 'note' | 'formula_sheet' | 'quiz' | 'summary') => {
  if (!aiClient) return "AI Service Unavailable";

  const prompts = {
    note: `Create comprehensive study notes for "${topic}" for JEE/MHT-CET. Include key definitions, theorems, and 2 solved examples. Use Markdown.`,
    formula_sheet: `Create a concise Formula Sheet for "${topic}". List variables clearly. Group by sub-topic. Use LaTeX for math ($...$).`,
    quiz: `Generate a quick 5-question mini-quiz for "${topic}" with answers at the bottom (hidden).`,
    summary: `Write a high-level conceptual summary of "${topic}" that connects it to real-world applications.`
  };

  const systemInstruction = "You are a top-tier academic content generator. Output clean, well-formatted Markdown. Use bolding for emphasis.";

  try {
    const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompts[type] || prompts['summary'],
        config: { systemInstruction }
    });
    return response.text;
  } catch (e) {
    return "# Error\nCould not generate content. Please try again.";
  }
};
