
import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Search, Brain, Loader2, Sparkles, Zap } from 'lucide-react';
import { getTutorResponse, generateConceptImage } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string;
  sources?: { title: string; uri: string }[];
}

interface LearningLabProps {
    initialContext?: { mode?: string, task?: string };
}

export const LearningLab: React.FC<LearningLabProps> = ({ initialContext }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', text: 'Ready to accelerate your learning. Ask me a specific topic or question? \n\nExample: *"Calculate the escape velocity of Earth"* or *"Explain $\\int x^2 dx$"*' }
  ]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'standard' | 'thinking' | 'search' | 'image'>('standard');
  const scrollRef = useRef<HTMLDivElement>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
      if (initialContext?.mode === 'focus' && initialContext.task && !initRef.current) {
          initRef.current = true;
          setMode('thinking');
          handleSend(`I am starting a focused study session. My goal is: **${initialContext.task}**. \n\nPlease outline the key concepts I need to cover, and then ask me a question to test my prerequisites.`);
      }
  }, [initialContext]);

  const handleSend = async (manualText?: string) => {
    const textToSend = manualText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      if (mode === 'image') {
        const imageBase64 = await generateConceptImage(userMsg.text);
        const responseMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: imageBase64 ? 'Here is the generated visualization:' : 'Failed to generate image.',
            image: imageBase64 || undefined
        };
        setMessages(prev => [...prev, responseMsg]);
      } else {
        const history = messages.map(m => ({ role: m.role, text: m.text }));
        const result = await getTutorResponse(userMsg.text, history, undefined, {
            useThinking: mode === 'thinking',
            useSearch: mode === 'search'
        });
        
        const responseMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: result.text || 'No response generated.',
            sources: result.sources
        };
        setMessages(prev => [...prev, responseMsg]);
      }
    } catch (error) {
        console.error(error);
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: 'System error. Please retry.' }]);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-50 dark:bg-black font-sans">
        {/* Header */}
        <div className="border-b border-neutral-200 dark:border-neutral-800 p-4 flex justify-between items-center bg-white dark:bg-black sticky top-0 z-10 backdrop-blur-md bg-opacity-80 dark:bg-opacity-80">
            <div>
                <h1 className="text-lg font-bold font-mono tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-500"/> Learning_Lab
                </h1>
                <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest mt-0.5">Gemini 2.5 Active</p>
            </div>
            {/* Header actions can go here if needed */}
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
            {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[90%] md:max-w-[80%] rounded-2xl p-4 shadow-sm ${
                        msg.role === 'user' 
                        ? 'bg-neutral-900 dark:bg-white text-white dark:text-black rounded-tr-sm' 
                        : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-tl-sm'
                    }`}>
                        {msg.role === 'user' ? (
                            <div className="whitespace-pre-wrap text-sm leading-relaxed font-sans">{msg.text}</div>
                        ) : (
                            <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                                <ReactMarkdown 
                                    remarkPlugins={[remarkMath]} 
                                    rehypePlugins={[rehypeKatex]}
                                    components={{
                                        code({node, inline, className, children, ...props}: any) {
                                            const match = /language-(\w+)/.exec(className || '');
                                            return !inline ? (
                                                <pre className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 my-2 text-xs font-mono overflow-x-auto text-neutral-300">
                                                    <code className={className} {...props}>
                                                        {children}
                                                    </code>
                                                </pre>
                                            ) : (
                                                <code className="bg-neutral-200 dark:bg-neutral-800/50 px-1 py-0.5 rounded text-amber-700 dark:text-amber-200 text-xs font-mono" {...props}>
                                                    {children}
                                                </code>
                                            )
                                        }
                                    }}
                                >
                                    {msg.text}
                                </ReactMarkdown>
                            </div>
                        )}
                        
                        {msg.image && (
                            <div className="mt-3 rounded-lg overflow-hidden border border-neutral-700">
                                <img src={msg.image} alt="Generated Content" className="w-full h-auto" />
                            </div>
                        )}
                        {msg.sources && msg.sources.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-800/50">
                                <div className="text-[10px] uppercase text-neutral-500 mb-2 font-mono flex items-center gap-1">
                                    <Search size={10} /> Sources
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {msg.sources.map((source, idx) => (
                                        <a 
                                            key={idx} 
                                            href={source.uri} 
                                            target="_blank" 
                                            rel="noreferrer" 
                                            className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-[10px] text-blue-500 hover:underline border border-transparent hover:border-blue-500/30 transition-all truncate max-w-[200px]"
                                        >
                                            {source.title}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ))}
            {loading && (
                <div className="flex justify-start animate-pulse">
                    <div className="bg-neutral-100 dark:bg-neutral-900 rounded-2xl p-4 flex items-center gap-2 text-neutral-500 text-sm font-mono rounded-tl-sm border border-neutral-200 dark:border-neutral-800">
                        <Loader2 size={16} className="animate-spin" />
                        {mode === 'thinking' ? 'Reasoning deeply...' : mode === 'image' ? 'Generating pixels...' : 'Processing...'}
                    </div>
                </div>
            )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-black border-t border-neutral-200 dark:border-neutral-800 pb-6">
            <div className="max-w-3xl mx-auto">
                <div className="relative group bg-neutral-100 dark:bg-neutral-900 rounded-3xl border border-transparent focus-within:border-neutral-300 dark:focus-within:border-neutral-700 transition-all">
                    <textarea 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="Ask Gemini..."
                        className="w-full bg-transparent border-none rounded-3xl pl-5 pr-14 py-4 focus:ring-0 resize-none h-auto min-h-[56px] text-sm font-medium placeholder:text-neutral-500 text-neutral-900 dark:text-neutral-100"
                        rows={1}
                    />
                    <button 
                        onClick={() => handleSend()}
                        disabled={!input.trim() || loading}
                        className="absolute right-2 bottom-2 p-2 bg-black dark:bg-white text-white dark:text-black rounded-full disabled:opacity-50 hover:opacity-90 transition-opacity"
                    >
                        <Send size={18} />
                    </button>
                </div>

                {/* Bottom Options */}
                <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide justify-start">
                    <ModeButton 
                        active={mode === 'standard'} 
                        onClick={() => setMode('standard')} 
                        icon={<Zap size={14} className={mode === 'standard' ? "text-yellow-500" : "text-neutral-500 group-hover:text-yellow-500"} />} 
                        label="Fast" 
                    />
                    <ModeButton 
                        active={mode === 'thinking'} 
                        onClick={() => setMode('thinking')} 
                        icon={<Brain size={14} className={mode === 'thinking' ? "text-purple-500" : "text-neutral-500 group-hover:text-purple-500"} />} 
                        label="Deep Think" 
                    />
                    <ModeButton 
                        active={mode === 'search'} 
                        onClick={() => setMode('search')} 
                        icon={<Search size={14} className={mode === 'search' ? "text-blue-500" : "text-neutral-500 group-hover:text-blue-500"} />} 
                        label="Deep Research" 
                    />
                    <ModeButton 
                        active={mode === 'image'} 
                        onClick={() => setMode('image')} 
                        icon={<ImageIcon size={14} className={mode === 'image' ? "text-emerald-500" : "text-neutral-500 group-hover:text-emerald-500"} />} 
                        label="Create Image" 
                    />
                </div>
            </div>
        </div>
    </div>
  );
};

const ModeButton = ({ active, onClick, icon, label }: any) => (
    <button 
        onClick={onClick}
        className={`group flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all border ${
            active 
            ? 'bg-neutral-200 dark:bg-neutral-800 text-black dark:text-white border-neutral-300 dark:border-neutral-700' 
            : 'bg-transparent text-neutral-500 border-transparent hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-neutral-300'
        }`}
    >
        {icon}
        <span>{label}</span>
    </button>
);
