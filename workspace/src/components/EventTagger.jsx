import React, { useMemo, useState } from 'react';

// ==========================================
// SUB-COMPONENTE: HISTORIAL DE EVENTOS
// ==========================================
const EventHistory = ({ events, formatTime }) => {
  // Ordena los eventos del más reciente al más antiguo
  const sortedEvents = useMemo(() => {
    if (!Array.isArray(events)) return [];
    return [...events].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [events]);

  return (
    <ul className="flex-1 border-t border-slate-800 pt-4 mt-2 overflow-y-auto space-y-2">
      {sortedEvents.map((ev, index) => {
        // Extracción limpia y segura del tipo del evento
        let typeDisplay = 'EVENTO';
        if (ev && typeof ev === 'object') {
          if (typeof ev.type === 'string') {
            typeDisplay = ev.type;
          } else if (ev.type && typeof ev.type === 'object' && ev.type.id) {
            typeDisplay = ev.type.id;
          } else if (ev.id && typeof ev.id === 'string') {
            typeDisplay = ev.id;
          }
        } else if (typeof ev === 'string') {
          typeDisplay = ev;
        }

        // Extracción limpia y segura de los metadatos tácticos
        const teamDisplay = ev?.team ? String(ev.team).toUpperCase() : 'N/A';
        const zoneDisplay = ev?.zone ? String(ev.zone).toUpperCase() : 'N/A';
        const timestamp = ev?.timestamp || Date.now();

        return (
          <li key={ev?.id || index} className="text-[11px] flex justify-between bg-slate-900/50 p-2 rounded border border-slate-800">
            <div className="flex flex-col">
              {/* Nombre del evento (SHOOT, GOAL, FOUL...) */}
              <span className="font-semibold text-slate-300">
                {String(typeDisplay).toUpperCase()}
              </span>
              {/* Datos tácticos requeridos: OWN/RIVAL y ZONA */}
              <span className="text-[9px] text-sky-600">
                {teamDisplay} • {zoneDisplay}
              </span>
            </div>
            <span className="font-mono text-sky-400 self-center">
              {formatTime ? formatTime(timestamp) : new Date(timestamp).toLocaleTimeString()}
            </span>
          </li>
        );
      })}
    </ul>
  );
};

// ==========================================
// COMPONENTE PRINCIPAL: EVENT TAGGER
// ==========================================
export default function EventTagger({ events = [], onAddEvent, eventTypes = [], formatTime }) {
  const [selectedTeam, setSelectedTeam] = useState('own'); 
  const [selectedZone, setSelectedZone] = useState('zone3'); 
  
  // Cálculo del contador por cada tipo de evento de manera segura
  const eventCounts = useMemo(() => {
    if (!Array.isArray(events)) return {};
    return events.reduce((acc, e) => {
      if (!e) return acc;
      // Normaliza la lectura del tipo de evento tanto si es string como objeto
      const typeKey = typeof e.type === 'string' ? e.type : (e.type?.id || e.id || '');
      if (typeKey) {
        acc[typeKey] = (acc[typeKey] || 0) + 1;
      }
      return acc;
    }, {});
  }, [events]);

  // Exportación del reporte en formato JSON descargable
  const exportEventReport = () => {
    const report = eventTypes.map(ev => ({
      label: ev.label,
      category: ev.category,
      count: eventCounts[ev.id] || 0
    }));
    
    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte_eventos_${new Date().toLocaleDateString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="flex flex-col h-full gap-4">
      <header className="flex justify-between items-center">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Event Tagger</span>
        <button onClick={exportEventReport} className="text-[10px] bg-slate-800 text-sky-400 px-2 py-1 rounded hover:bg-slate-700">
          Exportar Reporte
        </button>
      </header>

      {/* Selector de Equipo - Mantiene tu diseño exacto */}
      <section className="flex gap-4 p-2 bg-slate-950 rounded-lg border border-slate-800">
        <div className="flex gap-1">
          {['own', 'rival'].map(team => (
            <button 
              key={team} 
              type="button"
              onClick={() => setSelectedTeam(team)} 
              className={`px-3 py-1 text-xs rounded transition-colors ${selectedTeam === team ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400'}`}
            >
              {team.toUpperCase()}
            </button>
          ))}
        </div>
      </section>

      {/* Selector de Zona - Mantiene tu diseño exacto */}
      <section className="flex gap-4 p-2 bg-slate-950 rounded-lg border border-slate-800"> 
        <div className="flex gap-1">
          {[1, 2, 3].map(zone => (
            <button 
              key={zone} 
              type="button"
              onClick={() => setSelectedZone(`zone${zone}`)} 
              className={`px-3 py-1 text-xs rounded transition-colors ${selectedZone === `zone${zone}` ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400'}`}
            >
              Z{zone}
            </button>
          ))}
        </div>
      </section>

      {/* Rejilla de botones para los tipos de evento */}
      <nav className="grid grid-cols-1 gap-2">
        {eventTypes.map(ev => (
          <button 
            key={ev.id}
            type="button"
            onClick={() => onAddEvent({
              id: String(Date.now() + Math.random()), // Genera ID único plano
              type: ev.id,
              team: selectedTeam,
              zone: selectedZone,
              timestamp: Date.now()
            })}
            className="flex justify-between items-center bg-slate-900 p-3 rounded-lg hover:bg-slate-800 transition-all border border-slate-800"
          >
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${ev.color}`} />
              <span className="text-sm font-medium text-slate-200">{ev.label}</span>
            </div>
            <span className="font-mono font-bold bg-slate-800 px-2 py-0.5 rounded text-sky-400">
              {eventCounts[ev.id] || 0}
            </span>
          </button>
        ))}
      </nav>

      {/* Renderizado de la lista del historial */}
      <EventHistory events={events} formatTime={formatTime} />
    </section>
  );
}