import React from 'react';

const eventTypes = [
  { id: 'corner', label: 'Corner', color: 'bg-yellow-500' },
  { id: 'shot', label: 'Tiro a puerta', color: 'bg-green-500' },
  { id: 'foul', label: 'Falta', color: 'bg-red-500' },
  { id: 'goal', label: 'Gol', color: 'bg-blue-500' }
];

export default function EventTagger({ events, onAddEvent, formatTime }) {
  const eventCounts = events.reduce((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Event Tagger</div>
      
      <div className="grid grid-cols-1 gap-2">
        {eventTypes.map(ev => (
          <button 
            key={ev.id}
            onClick={() => onAddEvent(ev.id)}
            className="flex justify-between items-center bg-slate-900 p-3 rounded-lg hover:bg-slate-800 transition-all border border-slate-800"
          >
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${ev.color}`} />
              <span className="text-sm font-medium">{ev.label}</span>
            </div>
            <span className="font-mono font-bold bg-slate-800 px-2 py-0.5 rounded text-sky-400">
              {eventCounts[ev.id] || 0}
            </span>
          </button>
        ))}
      </div>

      <div className="flex-1 border-t border-slate-800 pt-4 mt-2 overflow-y-auto space-y-2">
        {events.sort((a,b) => b.timestamp - a.timestamp).map(ev => (
          <div key={ev.id} className="text-[11px] flex justify-between bg-slate-900/50 p-2 rounded border border-slate-800">
            <span className="font-semibold text-slate-300">{ev.type.toUpperCase()}</span>
            <span className="font-mono text-sky-400">{formatTime(ev.timestamp)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}