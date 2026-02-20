'use client';

import { useEffect, useState } from 'react';

interface DataPoint {
  day: number;
  date: string;
  plays: number;
}

interface ChartData {
  launchDate: string;
  points: DataPoint[];
}

export default function RiftleDailyPlaysChart() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ChartData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/riftle/daily-plays', {
          cache: 'no-store',
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch daily plays data');
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError('No data available');
        }
      } catch (err) {
        console.error('Error fetching daily plays:', err);
        setError('Failed to load chart');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading chart...</div>
      </div>
    );
  }

  if (error || !data || data.points.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">
          {error || 'No data available yet'}
        </div>
      </div>
    );
  }

  // Chart dimensions - wider for better visibility
  const width = 700;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 50, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Get max values
  const maxDay = Math.max(...data.points.map(p => p.day));
  const maxPlays = Math.max(...data.points.map(p => p.plays), 1);

  // Scale functions
  const scaleX = (day: number) => padding.left + (day / maxDay) * chartWidth;
  const scaleY = (plays: number) => padding.top + chartHeight - (plays / maxPlays) * chartHeight;

  // Generate Y axis ticks (skip 0)
  const getYTicks = (max: number): number[] => {
    if (max <= 5) return [1, 2, 3, 4, 5].filter(v => v <= max);
    if (max <= 10) return [2, 4, 6, 8, 10].filter(v => v <= max);
    if (max <= 20) return [5, 10, 15, 20].filter(v => v <= max);
    if (max <= 50) return [10, 20, 30, 40, 50].filter(v => v <= max);
    if (max <= 100) return [25, 50, 75, 100].filter(v => v <= max);
    const step = Math.ceil(max / 5 / 10) * 10;
    return Array.from({ length: 6 }, (_, i) => i * step).filter(v => v > 0 && v <= max);
  };

  // Generate X axis ticks (skip 0, show more ticks for better readability)
  const getXTicks = (maxDay: number): number[] => {
    if (maxDay <= 7) return Array.from({ length: maxDay + 1 }, (_, i) => i).filter(i => i > 0);
    if (maxDay <= 14) return Array.from({ length: maxDay + 1 }, (_, i) => i).filter(i => i > 0 && i % 2 === 0);
    if (maxDay <= 30) return Array.from({ length: maxDay + 1 }, (_, i) => i).filter(i => i > 0 && i % 5 === 0);
    return Array.from({ length: maxDay + 1 }, (_, i) => i).filter(i => i > 0 && i % 10 === 0);
  };

  const yTicks = getYTicks(maxPlays);
  const xTicks = getXTicks(maxDay);

  // Generate polyline points
  const polylinePoints = data.points
    .map(p => `${scaleX(p.day)},${scaleY(p.plays)}`)
    .join(' ');

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
        Daily Players Over Time
      </h3>
      <svg
        width={width}
        height={height}
        className="bg-white dark:bg-gray-800 rounded"
      >
        {/* Y axis label */}
        <text
          x={15}
          y={height / 2}
          textAnchor="middle"
          transform={`rotate(-90, 15, ${height / 2})`}
          className="text-base font-semibold fill-gray-700 dark:fill-gray-300"
        >
          Daily Players
        </text>

        {/* Y axis grid lines and ticks */}
        {yTicks.map(tick => (
          <g key={`y-${tick}`}>
            <line
              x1={padding.left}
              y1={scaleY(tick)}
              x2={width - padding.right}
              y2={scaleY(tick)}
              stroke="currentColor"
              strokeWidth="1"
              className="text-gray-300 dark:text-gray-600"
              strokeDasharray="2,2"
            />
            <text
              x={padding.left - 8}
              y={scaleY(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              className="text-base fill-gray-600 dark:fill-gray-400"
            >
              {tick}
            </text>
          </g>
        ))}

        {/* X axis ticks */}
        {xTicks.map(tick => {
          return (
            <text
              key={`x-${tick}`}
              x={scaleX(tick)}
              y={height - 25}
              textAnchor="middle"
              className="text-base fill-gray-600 dark:fill-gray-400"
            >
              {tick}
            </text>
          );
        })}

        {/* X axis label */}
        <text
          x={width / 2}
          y={height - 5}
          textAnchor="middle"
          className="text-base font-semibold fill-gray-700 dark:fill-gray-300"
        >
          Days Since Launch
        </text>

        {/* Line chart */}
        <polyline
          points={polylinePoints}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-blue-600 dark:text-blue-400"
        />

        {/* Data points */}
        {data.points.map((point, idx) => (
          <circle
            key={idx}
            cx={scaleX(point.day)}
            cy={scaleY(point.plays)}
            r="3"
            className="fill-blue-600 dark:fill-blue-400"
          />
        ))}
      </svg>
    </div>
  );
}

// Made with Bob
