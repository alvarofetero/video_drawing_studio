import React, { useMemo } from 'react';
import eventTypes from '../config/events.json'; // Importa el JSON
import EventSettings from './EventSettings'; // Tu componente de modal

// const eventTypes = [
//   { id: 'corner', label: 'Corner', color: 'bg-yellow-500' },
//   { id: 'shot', label: 'Tiro a puerta', color: 'bg-green-500' },
//   { id: 'foul', label: 'Falta', color: 'bg-red-500' },
//   { id: 'goal', label: 'Gol', color: 'bg-blue-500' }
// ];

// Sub-componente para la lista (hace el código mucho más legible)
const EventHistory = ({ events, formatTime }) => {
  // Optimizamos el sorteo para que no se ejecute en cada render innecesario
  const sortedEvents = useMemo(() => 
    [...events].sort((a, b) => b.timestamp - a.timestamp), 
    [events]
  );

  return (
    <ul className="flex-1 border-t border-slate-800 pt-4 mt-2 overflow-y-auto space-y-2">
      {sortedEvents.map(ev => (
        <li key={ev.id} className="text-[11px] flex justify-between bg-slate-900/50 p-2 rounded border border-slate-800">
          <span className="font-semibold text-slate-300">{ev.type.toUpperCase()}</span>
          <span className="font-mono text-sky-400">{formatTime(ev.timestamp)}</span>
        </li>
      ))}
    </ul>
  );
};



// export default function EventTagger({ events, onAddEvent, formatTime }) {
export default function EventTagger({ events, onAddEvent, eventTypes, setEventTypes, formatTime, ...props }) {
  
  const eventCounts = events.reduce((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <section className="flex flex-col h-full gap-4">
      <header className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Event Tagger</header>
      
      {/* Action section (buttons)*/}
      <nav className="grid grid-cols-1 gap-2">
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
      </nav>

      {/* Sección de historial */}
      <EventHistory events={events} formatTime={formatTime} />
    </section>
  );
}