import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { Clock, Target, TrendingUp, AlertTriangle, CheckCircle2, Zap, BarChart2 } from 'lucide-react';
import { UserState } from '../types';

interface AnalyticsProps {
  userState: UserState | null;
}

export const Analytics: React.FC<AnalyticsProps> = ({ userState }) => {
  const subjectPerformance = [
    { subject: 'Phys', accuracy: 65, avg: 55 },
    { subject: 'Chem', accuracy: 78, avg: 60 },
    { subject: 'Math', accuracy: 52, avg: 50 },
  ];

  const timeDistribution = [
    { name: 'Concept', value: 40, color: '#ffffff' }, 
    { name: 'Practice', value: 35, color: '#a3a3a3' }, 
    { name: 'Mock', value: 15, color: '#525252' }, 
    { name: 'Revise', value: 10, color: '#262626' }, 
  ];

  const mockTestTrend = [
    { name: 'T1', score: 120 },
    { name: 'T2', score: 135 },
    { name: 'T3', score: 128 },
    { name: 'T4', score: 150 },
    { name: 'T5', score: 165 },
  ];

  const criticalTopics = [
    { topic: 'Rotational Motion', subject: 'Physics', impact: 'High', gap: 'Concept' },
    { topic: 'Integration', subject: 'Math', impact: 'High', gap: 'Speed' },
    { topic: 'Ionic Eq', subject: 'Chem', impact: 'Medium', gap: 'Accuracy' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in pb-20 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-neutral-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3 font-mono tracking-tighter">
            DEEP_ANALYTICS
          </h1>
          <p className="text-neutral-500 mt-1">
            System performance breakdown.
          </p>
        </div>
        <div className="flex gap-0 text-sm border border-neutral-800 p-0.5">
          <button className="px-4 py-1.5 bg-neutral-800 text-white font-medium">Overview</button>
          <button className="px-4 py-1.5 text-neutral-500 hover:text-white transition-colors">History</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard title="Overall Accuracy" value="68%" trend="+4.2%" icon={<Target size={24} />} />
        <KpiCard title="Avg Speed/Q" value="1.8m" sub="Target: 1.5m" icon={<Zap size={24} />} />
        <KpiCard title="Proj. Rank" value="12,450" sub="Top 8%" icon={<TrendingUp size={24} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Subject Breakdown */}
        <div className="bg-black border border-neutral-800 p-6">
          <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest font-mono">Subject Performance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectPerformance} layout="vertical" margin={{ left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} stroke="#525252" tick={{fontSize: 10, fontFamily: 'monospace'}} />
                <YAxis dataKey="subject" type="category" stroke="#525252" width={50} tick={{fontSize: 10, fontFamily: 'monospace'}} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{ backgroundColor: '#000', borderColor: '#333', color: '#fff', fontFamily: 'monospace' }}
                />
                <Bar dataKey="accuracy" fill="#fff" barSize={15} />
                <Bar dataKey="avg" fill="#333" barSize={15} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Time Distribution */}
        <div className="bg-black border border-neutral-800 p-6">
          <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest font-mono">Time Allocation</h3>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={timeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {timeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: '#000', borderColor: '#333', color: '#fff', fontFamily: 'monospace' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 min-w-[120px]">
              {timeDistribution.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-2 h-2" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-neutral-400 font-mono uppercase">{item.name}</span>
                  <span className="text-xs font-mono text-white ml-auto">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Mock Test Trend */}
        <div className="lg:col-span-2 bg-black border border-neutral-800 p-6">
           <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest font-mono">Trajectory</h3>
           <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={mockTestTrend}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                 <XAxis dataKey="name" stroke="#525252" tick={{fontSize: 10, fontFamily: 'monospace'}} />
                 <YAxis stroke="#525252" domain={[0, 200]} tick={{fontSize: 10, fontFamily: 'monospace'}} />
                 <Tooltip 
                    contentStyle={{ backgroundColor: '#000', borderColor: '#333', color: '#fff', fontFamily: 'monospace' }}
                 />
                 <Line type="step" dataKey="score" stroke="#fff" strokeWidth={2} dot={false} />
               </LineChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Critical Focus Areas */}
        <div className="bg-black border border-neutral-800 p-6">
          <div className="flex items-center gap-2 mb-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest font-mono">Critical Focus</h3>
          </div>
          <div className="space-y-3">
            {criticalTopics.map((item, idx) => (
              <div key={idx} className="p-3 border border-neutral-800 hover:border-neutral-600 transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-white text-sm font-mono">{item.topic}</span>
                  <span className="text-[10px] uppercase text-red-500 font-bold">
                    {item.impact}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-neutral-500">
                  <span>{item.subject}</span>
                  <span>{item.gap}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const KpiCard = ({ title, value, sub, trend, icon }: any) => (
    <div className="bg-black p-6 border border-neutral-800 flex flex-col justify-between">
        <div className="flex justify-between items-start mb-4">
            <div className="text-neutral-500">{icon}</div>
            {trend && <div className="text-xs font-mono text-green-500">{trend}</div>}
        </div>
        <div>
            <div className="text-3xl font-bold text-white font-mono tracking-tighter">{value}</div>
            <div className="text-[10px] text-neutral-500 uppercase tracking-widest mt-1 flex justify-between">
                {title} {sub && <span className="text-neutral-600">{sub}</span>}
            </div>
        </div>
    </div>
);