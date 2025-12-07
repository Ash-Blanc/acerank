
import { GoogleGenAI, Type } from "@google/genai";
import { AgentLog, UserState, ToolCall, SubscriptionTier } from "../types";
import { generateMicroSchedule, fetchOptimalProblems, updateSpacedRepetition, predictNextTopic } from "./agentTools";
import { db } from "./db";
import { generateStudentModelSummary, calculateDecay } from "./analyticsService";

const API_KEY = process.env.API_KEY;
let aiClient: GoogleGenAI | null = null;
if (API_KEY) {
  aiClient = new GoogleGenAI({ apiKey: API_KEY });
}

interface AgentState {
  logs: AgentLog[];
  isThinking: boolean;
  confidence: number; // 0-100
  currentAction: string | null;
}

let subscribers: ((state: AgentState) => void)[] = [];
let currentState: AgentState = {
  logs: [],
  isThinking: false,
  confidence: 0,
  currentAction: null
};

const notifySubscribers = () => {
  subscribers.forEach(cb => cb(currentState));
};

export const subscribeToAgent = (callback: (state: AgentState) => void) => {
  subscribers.push(callback);
  callback(currentState); // Immediate update
  return () => {
    subscribers = subscribers.filter(cb => cb !== callback);
  };
};

const addLog = (step: AgentLog['step'], content: string, toolName?: string) => {
  const newLog: AgentLog = {
    id: Date.now().toString() + Math.random(),
    timestamp: Date.now(),
    step,
    content,
    toolName,
    confidence: currentState.confidence
  };
  currentState.logs = [newLog, ...currentState.logs];
  notifySubscribers();
  
  // Persist important logs to DB? 
  // db.saveLog(newLog); (Optional implementation)
};

export const runAgentLoop = async (userGoal: string) => {
  if (!aiClient) return;
  
  currentState.isThinking = true;
  currentState.confidence = 50;
  notifySubscribers();

  try {
    // 1. Gather Context from DB
    addLog('Thought', "Accessing Long-term Memory & Student Profile...");
    const user = await db.getUser();
    const sessions = await db.getSessions();
    const mastery = await db.getAllMastery();

    // 2. Apply Decay to Mastery Scores
    const decayedMastery = mastery.map(calculateDecay);
    const weakSpots = decayedMastery
        .filter(m => m.masteryScore < 60)
        .map(m => m.name)
        .join(', ');

    const studentModel = generateStudentModelSummary(sessions);

    addLog('Thought', `Context Loaded. Weak spots: ${weakSpots || 'None'}. Goal: "${userGoal}"`);
    
    // 3. Construct Prompt
    const prompt = `
      You are the AceRank Autonomous Tutor Agent.
      
      User Goal: "${userGoal}"
      User Profile: ${JSON.stringify(user)}
      Student Model: ${studentModel}
      Critical Weaknesses (Decayed): ${weakSpots}
      
      Subscription Tier: ${user?.subscriptionTier || 'FREE'}

      Tools Available:
      - generateMicroSchedule(days, focusTopics)
      - fetchOptimalProblems(topic, difficulty)
      - predictNextTopic(currentTopic)
      - analyzeDeeply(data) [PREMIUM ONLY]

      Decide which tool to call to best serve the User Goal.
      If the user wants practice, use fetchOptimalProblems.
      
      Output JSON: { "thought": "string", "toolCall": { "name": "string", "argsJson": "string (JSON)" } }
      IMPORTANT: 'argsJson' must be a string containing valid JSON for the arguments.
    `;

    // 4. Call LLM
    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { 
        responseMimeType: 'application/json',
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                thought: { type: Type.STRING },
                toolCall: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        argsJson: { type: Type.STRING }
                    }
                }
            }
        } 
      }
    });

    const result = JSON.parse(response.text || '{}');
    
    if (result.thought) {
      addLog('Thought', result.thought);
      currentState.confidence = 75; 
      notifySubscribers();
    }

    // 5. Execute Tool
    if (result.toolCall) {
       addLog('Action', `Executing ${result.toolCall.name}...`, result.toolCall.name);
       
       let args: any = {};
       try {
           args = JSON.parse(result.toolCall.argsJson || '{}');
       } catch (e) {
           console.error("Failed to parse tool args", e);
       }

       // Premium Gate Check
       if (result.toolCall.name === 'analyzeDeeply' && user?.subscriptionTier === SubscriptionTier.FREE) {
           addLog('Error', 'Feature locked. Upgrade to PRO for Deep Analysis.');
           currentState.isThinking = false;
           notifySubscribers();
           return;
       }

       let toolResult;
       // Mock execution mapping
       switch(result.toolCall.name) {
           case 'generateMicroSchedule':
               toolResult = await generateMicroSchedule(args.days || 3, (args.focusTopics || weakSpots || 'General').split(','));
               break;
           case 'fetchOptimalProblems':
               toolResult = await fetchOptimalProblems(args.topic || 'General', args.difficulty || 'Medium');
               break;
           case 'predictNextTopic':
               toolResult = await predictNextTopic(args.currentTopic);
               break;
           default:
               toolResult = "Tool not found or implemented.";
       }

       // 6. Reflection
       const resultStr = typeof toolResult === 'object' ? JSON.stringify(toolResult) : String(toolResult);
       addLog('Result', resultStr.length > 200 ? resultStr.substring(0, 200) + "..." : resultStr);
       currentState.confidence = 95;
    }

  } catch (error) {
    console.error(error);
    addLog('Error', 'Agent loop disrupted.');
  } finally {
    currentState.isThinking = false;
    notifySubscribers();
  }
};
