import React from 'react';
import { HeatmapCell } from '@/types';

interface Props {
  data: HeatmapCell[];
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function intensityColor(count: number): string {
  if (count === 0) return '#f3f4f6';
  if (count <= 2) return '#bbf7d0';
  if (count <= 5) return '#4ade80';
  return '#16a34a';
}

export const ConsistencyHeatmap: React.FC<Props> = ({ data }) => {
  // Pad to full 4-week grid starting from Sunday
  const cells = [...data];
  while (cells.length < 28) {
    cells.unshift({ date: '', count: 0, dayOfWeek: 0 });
  }

  // Group into weeks (columns of 7)
  const weeks: HeatmapCell[][] = [];
  for (let i = 0; i < 4; i++) {
    weeks.push(cells.slice(i * 7, i * 7 + 7));
  }

  const activeDays = data.filter(d => d.count > 0).length;
  const totalEvents = data.reduce((s, d) => s + d.count, 0);

  return (
    <div>
      <div className="flex items-start space-x-1">
        {/* Day labels column */}
        <div className="flex flex-col space-y-1 mr-1 pt-0">
          {DAY_LABELS.map((d, i) => (
            <div key={i} className="w-3 h-3 flex items-center justify-center text-[9px] text-gray-400 font-medium">
              {i % 2 === 0 ? d : ''}
            </div>
          ))}
        </div>
        {/* Heatmap grid */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col space-y-1">
            {week.map((cell, di) => (
              <div
                key={di}
                title={cell.date ? `${cell.date}: ${cell.count} events` : ''}
                className="w-3 h-3 rounded-sm cursor-default"
                style={{ backgroundColor: intensityColor(cell.count) }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-gray-400">{activeDays} active days · {totalEvents} total events</span>
        <div className="flex items-center space-x-1">
          <span className="text-[10px] text-gray-400">Less</span>
          {[0, 2, 4, 6].map(n => (
            <div key={n} className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: intensityColor(n) }} />
          ))}
          <span className="text-[10px] text-gray-400">More</span>
        </div>
      </div>
    </div>
  );
};
