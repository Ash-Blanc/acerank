
import React, { useEffect, useState, useRef } from 'react';
import { subscribeToAgent } from '../services/AgentOrchestrator';
import { AgentLog } from '../types';
import { Terminal, Cpu, CheckCircle, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

export const AgentThinkingPanel: React.FC = () => {
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAgent((state) => {
      setLogs(state.logs);
      setIsThinking(state.isThinking);
      setConfidence(state.confidence);
    });
    return unsubscribe;
  }, []);

  // Auto-scroll logic
  useEffect(() => {
      if (logsEndRef.current) {
          logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
  }, [logs, isThinking]);

  return (
    <div className="w-full bg-neutral-950 border-b border-neutral-800 font-mono text-xs md:text-sm">
      <div className="max-w-7xl mx-auto">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-900 bg-neutral-900/50">
           <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 ${isThinking ? 'text-blue-400' : 'text-neutral-500'}`}>
                 <Cpu size={14} className={isThinking ? 'animate-pulse' : ''} />
                 <span className="font-bold tracking-wider uppercase">
                    {isThinking ? 'AGENT_ACTIVE' : 'AGENT_IDLE'}
                 </span>
              </div>
              <div className="h-4 w-px bg-neutral-800" />
              <div className="text-neutral-500">
                 CONFIDENCE: <span className={`${confidence > 80 ? 'text-emerald-500' : 'text-amber-500'}`}>{confidence}%</span>
              </div>
           </div>
           
           {isThinking && <Loader2 size={14} className="animate-spin text-blue-500" />}
        </div>

        {/* Logs Area */}
        {logs.length > 0 && (
          <div className="max-h-64 overflow-y-auto p-4 space-y-3 custom-scrollbar flex flex-col-reverse">
             {/* Note: We display in reverse order (newest at top) or standard depending on preference. 
                 If Orchestrator adds new logs to the START of the array, we map normally. 
                 Assuming logs are [newest, ...oldest] based on AgentOrchestrator implementation.
             */}
             {logs.slice(0, 15).map((log) => (
                <div key={log.id} className="animate-fade-in border-l-2 border-neutral-800 pl-3 py-1">
                   <div className="flex items-center gap-2 mb-1">
                      <StatusIcon step={log.step} />
                      <span className={`uppercase font-bold text-[10px] tracking-widest ${getStepColor(log.step)}`}>
                        {log.step}
                      </span>
                      <span className="text-neutral-600 text-[10px]">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                   </div>
                   <div className={`text-neutral-300 leading-relaxed ${log.step === 'Thought' ? 'italic text-neutral-500' : ''}`}>
                      {log.toolName && (
                        <span className="bg-neutral-900 text-blue-300 px-1 py-0.5 rounded mr-2 font-bold text-[10px]">
                            {log.toolName}
                        </span>
                      )}
                      {log.content}
                   </div>
                </div>
             ))}
             {logs.length === 0 && (
                 <div className="text-neutral-600 italic py-4 text-center">
                    Agent memory initialized. Waiting for task...
                 </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

const StatusIcon = ({ step }: { step: string }) => {
    switch(step) {
        case 'Thought': return <Terminal size={12} className="text-neutral-500" />;
        case 'Action': return <ArrowRight size={12} className="text-blue-500" />;
        case 'Result': return <CheckCircle size={12} className="text-emerald-500" />;
        case 'Error': return <AlertCircle size={12} className="text-red-500" />;
        default: return <div className="w-3 h-3 rounded-full bg-neutral-800" />;
    }
};

const getStepColor = (step: string) => {
    switch(step) {
        case 'Thought': return 'text-neutral-500';
        case 'Action': return 'text-blue-500';
        case 'Result': return 'text-emerald-500';
        case 'Error': return 'text-red-500';
        default: return 'text-neutral-500';
    }
};
