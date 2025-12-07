
import React, { useEffect, useState, useMemo } from 'react';
import { UserState, Subject, SubscriptionTier, TopicMastery } from '../types';
import { generateDailyPlan } from '../services/geminiService';
import { db } from '../services/db';
import { calculateDecay } from '../services/analyticsService';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { BookOpen, Target, Clock, Trophy, Zap, AlertCircle, ArrowRight, Brain, Flame, Activity, Lock, Wrench } from 'lucide-react';
import { StreakCalendar } from './StreakCalendar';
import { TopicRadar } from './TopicRadar';
import { AgentThinkingPanel } from './AgentThinkingPanel';
import { runAgentLoop } from '../services/AgentOrchestrator';

interface DashboardProps {
  userState: UserState;
  onNavigate: (view: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ userState, onNavigate }) => {
  const [dailyPlan, setDailyPlan] = useState<string[]>(userState.dailyPlan || []);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [masteryData, setMasteryData] = useState<TopicMastery[]>([]);
  const [loadingDb, setLoadingDb] = useState(true);

  // Load Persisted Data on Mount
  useEffect(() => {
    const loadData = async () => {
        try {
            // 1. Get Mastery Data
            const storedMastery = await db.getAllMastery();
            if (storedMastery.length > 0) {
                // Apply decay calculation in real-time for visualization
                const decayed = storedMastery.map(calculateDecay);
                setMasteryData(decayed);
            } else {
                // Fallback mock data if empty DB (fresh user)
                 const mockMastery = [
                    { topicId: '1', name: 'Mechanics', subject: Subject.PHYSICS, masteryScore: 65, lastReviewed: Date.now(), confidenceDecayRate: 0.1, nextReviewDue: 0, totalQuestionsSolved: 0, successRate: 0 },
                    { topicId: '2', name: 'Calculus', subject: Subject.MATH, masteryScore: 80, lastReviewed: Date.now(), confidenceDecayRate: 0.1, nextReviewDue: 0, totalQuestionsSolved: 0, successRate: 0 },
                    { topicId: '3', name: 'Organic', subject: Subject.CHEMISTRY, masteryScore: 30, lastReviewed: Date.now() - 86400000 * 5, confidenceDecayRate: 0.3, nextReviewDue: 0, totalQuestionsSolved: 0, successRate: 0 },
                 ];
                 setMasteryData(mockMastery);
            }

            // 2. Generate Plan if needed
            if (dailyPlan.length === 0) {
                setLoadingPlan(true);
                generateDailyPlan(userState).then(plan => {
                    setDailyPlan(plan);
                    setLoadingPlan(false);
                });
            }
        } catch (e) {
            console.error("Failed to load dashboard data", e);
        } finally {
            setLoadingDb(false);
        }
    };
    loadData();
  }, []); 

  const handleSyncAgent = () => {
    runAgentLoop("Update my daily plan based on recent activity and confidence decay.");
  };
  
  const handleFixWeakness = (topicName: string) => {
    runAgentLoop(`Fetch optimal practice problems for my weak topic: ${topicName}`);
  };

  const performanceData = [
    { day: 'Mon', score: 65 },
    { day: 'Tue', score: 70 },
    { day: 'Wed', score: 68 },
    { day: 'Thu', score: 75 },
    { day: 'Fri', score: 82 },
    { day: 'Sat', score: 78 },
    { day: 'Sun', score: 85 },
  ];

  // Generate Mock Streak Data (in a real app, this would come from db.getSessions())
  const streakData = useMemo(() => {
    const data = [];
    const today = new Date();
    for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const isRecent = i < 30;
        const randomVal = Math.random();
        let hours = 0;
        if (isRecent) {
             hours = randomVal > 0.2 ? Math.floor(Math.random() * 5) + 1 : 0;
        } else {
             hours = randomVal > 0.4 ? Math.floor(Math.random() * 6) : 0;
        }
        data.push({
            date: d.toISOString().split('T')[0],
            count: hours
        });
    }
    return data;
  }, []);

  // Filter weak areas based on Mastery Data
  const weakAreas = masteryData
    .filter(m => m.masteryScore < 50)
    .sort((a,b) => a.masteryScore - b.masteryScore)
    .slice(0, 3);

  // Radar Data Formatter
  const radarData = masteryData.map(m => ({
      name: m.name.substring(0, 4),
      subject: m.subject,
      mastery: m.masteryScore
  }));

  const isFreeTier = userState.subscriptionTier === SubscriptionTier.FREE;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in pb-20 font-sans">
      
      {/* Agent Thinking Panel (Layer 2) */}
      <AgentThinkingPanel />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-neutral-800 pb-6">
        <div>
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-2 tracking-tighter font-mono">
            Dashboard
          </h1>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isFreeTier ? 'bg-neutral-800 text-neutral-400' : 'bg-gradient-to-r from-amber-400 to-orange-500 text-black'}`}>
                {userState.subscriptionTier} PLAN
            </span>
            <p className="text-neutral-500 dark:text-neutral-400 max-w-lg text-sm">
                System Active. Memory synced.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <button 
            onClick={handleSyncAgent}
            className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-black font-mono text-xs font-bold uppercase tracking-wider hover:opacity-80 transition-opacity"
          >
             Sync_Agent
          </button>
          <div className="h-10 w-px bg-neutral-200 dark:bg-neutral-800" />
          <div className="text-right">
            <div className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono mb-1">Countdown</div>
            <div className="text-3xl font-bold text-neutral-900 dark:text-white leading-none font-mono">142</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          icon={<Activity size={20} />} 
          label="Mastery" 
          value={loadingDb ? "..." : Math.round(masteryData.reduce((acc, c) => acc + c.masteryScore, 0) / (masteryData.length || 1)) + "%"} 
        />
        <StatCard 
          icon={<Flame size={20} />} 
          label="Streak" 
          value={`${userState.streak}d`} 
        />
        <StatCard 
          icon={<Clock size={20} />} 
          label="Hours" 
          value={`${userState.studyHours}h`} 
        />
        <StatCard 
          icon={<Trophy size={20} />} 
          label="Rank Prob" 
          value={isFreeTier ? "LOCKED" : "85%"} 
          trend={isFreeTier ? undefined : "+2.4%"}
          locked={isFreeTier}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content - Left (2 cols) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Daily AI Plan */}
          <div className="bg-white dark:bg-transparent rounded-none border-l-2 border-neutral-200 dark:border-neutral-800 pl-6 py-2">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-neutral-100 dark:bg-neutral-900 rounded text-neutral-900 dark:text-white">
                   <Brain size={18} />
                </div>
                <div>
                    <h2 className="font-bold text-neutral-900 dark:text-white text-lg tracking-tight">Daily Directive</h2>
                    <p className="text-xs text-neutral-500 font-mono">AI-Generated Protocol</p>
                </div>
              </div>
              {loadingPlan && <span className="text-xs text-emerald-500 animate-pulse font-mono">COMPUTING...</span>}
            </div>
            
            <div className="space-y-4">
                {dailyPlan.map((task, idx) => (
                  <div key={idx} className="group flex items-center gap-4 p-4 bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all cursor-pointer">
                    <div className="w-6 h-6 rounded-full border border-neutral-400 dark:border-neutral-600 flex items-center justify-center text-xs font-mono text-neutral-500 group-hover:bg-white group-hover:text-black transition-colors">
                        {idx + 1}
                    </div>
                    <span className="text-neutral-700 dark:text-neutral-300 font-medium text-sm flex-1">{task}</span>
                    <ArrowRight size={16} className="text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
            </div>
              
            <button onClick={() => onNavigate('LEARNING')} className="mt-6 w-full py-4 bg-neutral-900 dark:bg-white text-white dark:text-black font-bold tracking-wide hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm uppercase">
                Initiate Focus Mode <ArrowRight size={16} />
            </button>
          </div>

          {/* Performance Chart */}
          <div className="bg-white dark:bg-black rounded border border-neutral-200 dark:border-neutral-800 p-6 relative overflow-hidden">
            {isFreeTier && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-6">
                    <Lock className="text-amber-500 mb-2" size={32} />
                    <h3 className="text-white font-bold text-lg">Deep Performance Analytics</h3>
                    <p className="text-neutral-400 text-sm mb-4">Unlock historical trend analysis with PRO.</p>
                    <button className="px-4 py-2 bg-amber-500 text-black font-bold text-xs uppercase rounded hover:bg-amber-400">Upgrade</button>
                </div>
            )}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white font-mono">Performance Index</h2>
                <div className="text-xs font-mono text-neutral-500">LAST 7 DAYS</div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fff" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#fff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                  <XAxis dataKey="day" stroke="#525252" tick={{fontSize: 10, fontFamily: 'monospace'}} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#525252" tick={{fontSize: 10, fontFamily: 'monospace'}} tickLine={false} axisLine={false} dx={-10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000', borderColor: '#333', color: '#fff', borderRadius: '0px', fontFamily: 'monospace' }}
                    itemStyle={{ color: '#fff' }}
                    cursor={{ stroke: '#666', strokeWidth: 1 }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#fff" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
           {/* GitHub Style Streak Calendar */}
          <div className="bg-white dark:bg-black rounded border border-neutral-200 dark:border-neutral-800 p-6">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-6 flex items-center gap-2 font-mono">
                Consistency_Map
            </h2>
            <StreakCalendar data={streakData} />
          </div>

        </div>

        {/* Right Sidebar */}
        <div className="space-y-8">
            
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
              <QuickAction 
                icon={<BookOpen size={18} />} 
                label="Mock Test" 
                onClick={() => onNavigate('MOCK_TEST')} 
              />
              <QuickAction 
                icon={<Brain size={18} />} 
                label="AI Tutor" 
                onClick={() => onNavigate('LEARNING')} 
              />
              <QuickAction 
                icon={<AlertCircle size={18} />} 
                label="Doubts" 
                onClick={() => {}} 
              />
              <QuickAction 
                icon={<Target size={18} />} 
                label="Goals" 
                onClick={() => {}} 
              />
            </div>
          
          {/* Weak Areas */}
          <div className="bg-neutral-50 dark:bg-neutral-900/20 p-6 border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-widest font-mono">Critical Gaps</h2>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            </div>
            <div className="space-y-5">
              {weakAreas.length > 0 ? weakAreas.map((area, idx) => (
                <div key={idx} className="group">
                  <div className="flex justify-between text-sm mb-2 items-center">
                    <span className="font-medium text-neutral-700 dark:text-neutral-300 group-hover:text-white transition-colors">{area.name}</span>
                    <button 
                        onClick={() => handleFixWeakness(area.name)}
                        className="text-[10px] text-red-500 font-mono border border-red-500/30 px-2 py-0.5 hover:bg-red-500 hover:text-white transition-colors flex items-center gap-1"
                    >
                        <Wrench size={10} /> FIX
                    </button>
                  </div>
                  <div className="h-1 w-full bg-neutral-200 dark:bg-neutral-800">
                    <div className="h-full bg-red-600 w-[30%]" />
                  </div>
                </div>
              )) : (
                 <div className="text-xs text-neutral-500 font-mono">No critical data yet.</div>
              )}
              <button 
                onClick={() => onNavigate('ANALYTICS')}
                className="w-full mt-6 text-xs font-mono text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center justify-start gap-2 transition-colors"
              >
                [ VIEW_DEEP_ANALYTICS ]
              </button>
            </div>
          </div>

          {/* Topic Radar */}
          <div className="bg-white dark:bg-black rounded border border-neutral-200 dark:border-neutral-800 p-6 min-h-[300px] flex flex-col">
             <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white font-mono">Topic Mastery</h2>
              <span className="text-[10px] text-neutral-500 font-mono">LIVE</span>
            </div>
            <div className="flex-1 -ml-4">
               {radarData.length > 0 && <TopicRadar data={radarData} />}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// --- Helper Components ---

const StatCard: React.FC<{ icon: React.ReactNode, label: string, value: string, trend?: string, locked?: boolean }> = ({ 
  icon, label, value, trend, locked 
}) => {
  return (
    <div className={`bg-neutral-50 dark:bg-neutral-900/30 p-4 border border-neutral-200 dark:border-neutral-800 flex flex-col justify-between h-32 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors ${locked ? 'opacity-70' : ''}`}>
      <div className="flex justify-between items-start">
         <div className="text-neutral-400">{icon}</div>
         {trend && <div className="text-[10px] font-mono text-emerald-500">{trend}</div>}
         {locked && <Lock size={12} className="text-amber-500" />}
      </div>
      <div>
        <div className="text-3xl font-bold text-neutral-900 dark:text-white tracking-tighter mb-1 font-mono">{value}</div>
        <div className="text-xs text-neutral-500 uppercase tracking-widest font-medium">{label}</div>
      </div>
    </div>
  );
};

const QuickAction: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void }> = ({ 
    icon, label, onClick 
}) => {
    return (
        <button 
            onClick={onClick}
            className="flex items-center gap-3 p-4 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all group w-full text-left"
        >
            <div className="text-neutral-500 group-hover:text-black dark:group-hover:text-white transition-colors">
                {icon}
            </div>
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400 group-hover:text-black dark:group-hover:text-white font-mono">{label}</span>
        </button>
    );
};
