import React, { useState } from 'react';
import { UserState } from '../types';
import { evaluateOnboardingAnswer } from '../services/geminiService';
import { ArrowRight, Loader2 } from 'lucide-react';

interface OnboardingProps {
  onComplete: (state: Partial<UserState>) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  // Start directly at challenge
  const [step, setStep] = useState<'challenge' | 'analyzing' | 'verdict'>('challenge');
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    setStep('analyzing');
    
    // Call AI
    const analysis = await evaluateOnboardingAnswer(answer);
    setResult(analysis);
    setFeedback(analysis.feedback);
    
    // Simulate reading time for effect
    setTimeout(() => {
      setStep('verdict');
    }, 1500);
  };

  const handleFinish = () => {
    onComplete({
      name: 'Student', 
      examType: result.examType,
      diagnosticCompleted: true,
      weakAreas: result.weakAreas || [],
      strongAreas: result.strongAreas || [],
      streak: 0,
      studyHours: 0,
      topicsMastered: 0,
    });
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 font-mono selection:bg-white selection:text-black">
      
      {/* Challenge Step */}
      {step === 'challenge' && (
        <div className="w-full max-w-3xl animate-fade-in">
          <div className="mb-16">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 leading-tight">
              Prove you understand <span className="text-gray-500">Gravity</span>.
            </h1>
            <p className="text-xl text-gray-400 max-w-xl">
               Why doesn't a satellite orbiting the Earth fall down? 
               <span className="block mt-2 text-sm text-gray-600">Don't use formulas. Use intuition.</span>
            </p>
          </div>
          
          <div className="relative group">
            <textarea
              autoFocus
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your reasoning here..."
              className="w-full bg-transparent border-l-2 border-gray-800 focus:border-white pl-6 text-xl md:text-2xl py-2 focus:outline-none transition-colors resize-none h-40 placeholder:text-gray-800 leading-relaxed"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <div className="mt-8 flex justify-end">
              <button 
                onClick={handleSubmit}
                disabled={!answer.trim()}
                className="opacity-50 hover:opacity-100 disabled:opacity-0 transition-all text-white flex items-center gap-3 text-lg font-medium"
              >
                TEST MY KNOWLEDGE <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analyzing Step */}
      {step === 'analyzing' && (
        <div className="flex flex-col items-center justify-center animate-pulse">
           <Loader2 size={48} className="animate-spin text-gray-800 mb-8" />
           <div className="text-2xl font-light tracking-widest text-gray-500 uppercase">Calibrating...</div>
        </div>
      )}

      {/* Verdict Step */}
      {step === 'verdict' && (
        <div className="w-full max-w-2xl animate-fade-in">
          <div className="mb-16 border-l-4 border-white pl-8 py-2">
            <div className="text-sm text-gray-500 uppercase tracking-widest mb-4">Analysis Complete</div>
            <h2 className="text-3xl md:text-5xl font-bold leading-tight">{feedback}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
            <div>
               <div className="h-px w-full bg-gray-900 mb-4" />
               <div className="text-sm text-gray-500 mb-1">Recommended Track</div>
               <div className="text-2xl font-bold">{result?.examType}</div>
            </div>
             <div>
               <div className="h-px w-full bg-gray-900 mb-4" />
               <div className="text-sm text-gray-500 mb-1">Focus Area</div>
               <div className="text-2xl font-bold">{result?.examType === 'JEE Advanced' ? 'First Principles' : 'Speed & Accuracy'}</div>
            </div>
          </div>

          <button 
            onClick={handleFinish}
            className="group w-full py-6 bg-white text-black font-bold text-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-3"
          >
            Access Dashboard
            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}
    </div>
  );
};