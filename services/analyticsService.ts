import { StudySession, TopicMastery, Subject } from '../types';

/**
 * Calculates new mastery score using simplified SM-2 logic + Exponential Decay
 */
export const calculateDecay = (mastery: TopicMastery): TopicMastery => {
  const now = Date.now();
  const daysSinceReview = (now - mastery.lastReviewed) / (1000 * 60 * 60 * 24);
  
  // Exponential decay formula: N(t) = N0 * e^(-λt)
  // Decay rate increases if user hasn't reviewed in a long time
  const decayFactor = Math.exp(-mastery.confidenceDecayRate * daysSinceReview);
  
  const decayedScore = Math.max(0, Math.floor(mastery.masteryScore * decayFactor));

  return {
    ...mastery,
    masteryScore: decayedScore
  };
};

/**
 * Updates mastery after a session
 */
export const updateMasteryPostSession = (
  currentMastery: TopicMastery, 
  session: StudySession
): TopicMastery => {
  const accuracy = session.questionsAttempted > 0 
    ? (session.questionsCorrect / session.questionsAttempted) 
    : 0;
  
  // Boost score based on accuracy
  let boost = 0;
  if (accuracy > 0.8) boost = 15;
  else if (accuracy > 0.5) boost = 5;
  else boost = -5; // Penalty for poor performance

  // Adjust decay rate: if they did well, they forget slower
  let newDecay = currentMastery.confidenceDecayRate;
  if (accuracy > 0.8) newDecay = Math.max(0.01, newDecay - 0.01);
  if (accuracy < 0.4) newDecay = Math.min(0.5, newDecay + 0.02);

  return {
    ...currentMastery,
    masteryScore: Math.min(100, Math.max(0, currentMastery.masteryScore + boost)),
    lastReviewed: Date.now(),
    confidenceDecayRate: newDecay,
    totalQuestionsSolved: currentMastery.totalQuestionsSolved + session.questionsAttempted,
    successRate: (currentMastery.successRate * currentMastery.totalQuestionsSolved + session.questionsCorrect) / (currentMastery.totalQuestionsSolved + session.questionsAttempted || 1)
  };
};

/**
 * Analyzes sessions to find optimal study time
 * Returns hour of day (0-23) with highest accuracy
 */
export const getOptimalStudyTime = (sessions: StudySession[]): number | null => {
  if (sessions.length < 5) return null; // Not enough data

  const hourStats = new Map<number, { total: number, correct: number }>();

  sessions.forEach(s => {
    const hour = new Date(s.startTime).getHours();
    const curr = hourStats.get(hour) || { total: 0, correct: 0 };
    hourStats.set(hour, {
      total: curr.total + s.questionsAttempted,
      correct: curr.correct + s.questionsCorrect
    });
  });

  let bestHour = -1;
  let maxAccuracy = -1;

  hourStats.forEach((stats, hour) => {
    if (stats.total < 10) return; // Ignore outlier hours
    const acc = stats.correct / stats.total;
    if (acc > maxAccuracy) {
      maxAccuracy = acc;
      bestHour = hour;
    }
  });

  return bestHour;
};

/**
 * Generates a textual summary of student habits for the Agent
 */
export const generateStudentModelSummary = (sessions: StudySession[]): string => {
  const bestHour = getOptimalStudyTime(sessions);
  const totalHours = sessions.reduce((acc, s) => acc + s.durationSeconds, 0) / 3600;
  
  return `
    Student has studied for ${totalHours.toFixed(1)} hours.
    Optimal study window seems to be around ${bestHour ? bestHour + ':00' : 'Unknown'}.
    Based on ${sessions.length} recorded sessions.
  `;
};