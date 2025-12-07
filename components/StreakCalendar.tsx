import React, { useMemo, useState } from 'react';

interface DayData {
  date: string;
  count: number;
}

interface StreakCalendarProps {
  data: DayData[];
  year?: number;
}

export const StreakCalendar: React.FC<StreakCalendarProps> = ({ data, year = new Date().getFullYear() }) => {
  const [hoveredDay, setHoveredDay] = useState<{ date: string; count: number; x: number; y: number } | null>(null);

  // Constants for layout
  const SQUARE_SIZE = 10;
  const SQUARE_GAP = 3;
  const TEXT_HEIGHT = 15;
  const WEEK_WIDTH = SQUARE_SIZE + SQUARE_GAP;
  
  const { weeks, startDate, maxCount } = useMemo(() => {
    const today = new Date();
    const endDate = today;
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 365);
    
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    const dataMap = new Map<string, number>(data.map(d => [d.date, d.count] as [string, number]));
    let max = 0;

    const weeksArray: { date: Date; count: number }[][] = [];
    let currentWeek: { date: Date; count: number }[] = [];
    
    const currentDate = new Date(startDate);

    while (currentDate <= endDate || currentWeek.length > 0) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const count = dataMap.get(dateStr) || 0;
      if (count > max) max = count;

      currentWeek.push({
        date: new Date(currentDate),
        count
      });

      if (currentWeek.length === 7) {
        weeksArray.push(currentWeek);
        currentWeek = [];
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
      if (weeksArray.length > 54) break;
    }
    
    if (currentWeek.length > 0) {
      weeksArray.push(currentWeek);
    }

    return { weeks: weeksArray, startDate, maxCount: max || 1 };
  }, [data]);

  const { currentStreak, longestStreak, totalContributions } = useMemo(() => {
    let current = 0;
    let longest = 0;
    let total = 0;
    
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    total = sortedData.reduce((acc, curr) => acc + curr.count, 0);

    let tempStreak = 0;
    const todayStr = new Date().toISOString().split('T')[0];
    const dataSet = new Set(data.filter(d => d.count > 0).map(d => d.date));

    const d = new Date();
    d.setDate(d.getDate() - 365);
    
    for (let i = 0; i <= 365; i++) {
      const dayStr = d.toISOString().split('T')[0];
      if (dataSet.has(dayStr)) {
        tempStreak++;
      } else {
        if (tempStreak > longest) longest = tempStreak;
        tempStreak = 0;
      }
      d.setDate(d.getDate() + 1);
    }
    if (tempStreak > longest) longest = tempStreak;

    current = 0;
    const checkDate = new Date();
    while (true) {
        const str = checkDate.toISOString().split('T')[0];
        if (dataSet.has(str)) {
            current++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            if (str === todayStr && current === 0) {
                checkDate.setDate(checkDate.getDate() - 1);
                continue;
            }
            break;
        }
    }

    return { currentStreak: current, longestStreak: longest, totalContributions: total };
  }, [data]);


  const getColor = (count: number) => {
    // Stark Minimalist Palette
    if (count === 0) return '#171717'; // neutral-900 (empty)
    const intensity = count / 4; 
    if (intensity < 0.25) return '#262626'; // neutral-800
    if (intensity < 0.5) return '#525252'; // neutral-600
    if (intensity < 0.75) return '#a3a3a3'; // neutral-400
    return '#ffffff'; // white
  };

  return (
    <div className="w-full overflow-hidden">
      <div className="flex items-end justify-between mb-4 px-1">
        <div className="text-xs text-neutral-500 font-mono">
          <span className="text-white font-bold">{totalContributions}</span> hrs recorded
        </div>
        <div className="flex gap-4 text-xs font-mono">
            <div>
                <span className="text-neutral-500 mr-2">CURRENT:</span>
                <span className="text-white">{currentStreak}d</span>
            </div>
            <div>
                <span className="text-neutral-500 mr-2">BEST:</span>
                <span className="text-white">{longestStreak}d</span>
            </div>
        </div>
      </div>

      <div className="overflow-x-auto pb-2 scrollbar-hide">
        <svg 
            width={weeks.length * WEEK_WIDTH} 
            height={(7 * (SQUARE_SIZE + SQUARE_GAP)) + TEXT_HEIGHT} 
            className="min-w-max"
        >
          <g transform={`translate(0, ${TEXT_HEIGHT})`}>
            {weeks.map((week, wIndex) => (
              <g key={wIndex} transform={`translate(${wIndex * WEEK_WIDTH}, 0)`}>
                {week.map((day, dIndex) => (
                  <rect
                    key={`${wIndex}-${dIndex}`}
                    width={SQUARE_SIZE}
                    height={SQUARE_SIZE}
                    x={0}
                    y={dIndex * (SQUARE_SIZE + SQUARE_GAP)}
                    fill={getColor(day.count)}
                    className="transition-colors duration-200"
                    onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredDay({
                            date: day.date.toLocaleDateString(),
                            count: day.count,
                            x: rect.left,
                            y: rect.top
                        });
                    }}
                    onMouseLeave={() => setHoveredDay(null)}
                  />
                ))}
              </g>
            ))}
          </g>
        </svg>
      </div>
      
      {hoveredDay && (
        <div 
            className="fixed z-50 bg-black text-[10px] px-2 py-1 border border-neutral-700 font-mono text-white pointer-events-none transform -translate-x-1/2 -translate-y-full mt-[-8px]"
            style={{ left: hoveredDay.x + SQUARE_SIZE/2, top: hoveredDay.y }}
        >
            <div className="font-bold">{hoveredDay.count}h</div>
            <div className="text-neutral-500">{hoveredDay.date}</div>
        </div>
      )}
    </div>
  );
};