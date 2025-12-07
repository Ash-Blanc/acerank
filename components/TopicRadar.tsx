import React from 'react';
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  Tooltip,
  Legend
} from 'recharts';
import { Subject } from '../types';

interface TopicData {
  name: string;
  subject: Subject;
  mastery: number;
}

interface TopicRadarProps {
  data: TopicData[];
}

export const TopicRadar: React.FC<TopicRadarProps> = ({ data }) => {
  // Filter or limit data if too many topics exist to keep chart readable
  // For a radar chart, 6-8 points is usually ideal, but up to 12 is manageable.
  const displayData = data.slice(0, 8);

  return (
    <div className="w-full h-full min-h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={displayData}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis 
            dataKey="name" 
            tick={{ fill: '#94a3b8', fontSize: 11 }} 
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 100]} 
            tick={false} 
            axisLine={false} 
          />
          <Radar
            name="Mastery"
            dataKey="mastery"
            stroke="#0ea5e9"
            strokeWidth={2}
            fill="#0ea5e9"
            fillOpacity={0.3}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1e293b', 
              borderColor: '#334155', 
              color: '#f8fafc',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            itemStyle={{ color: '#0ea5e9' }}
            cursor={{ stroke: '#94a3b8', strokeWidth: 1 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};