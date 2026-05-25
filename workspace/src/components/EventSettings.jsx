import React, { useState } from 'react';

export default function EventSettings({ eventTypes, setEventTypes, onClose }) {
  const [label, setLabel] = useState('');
  const [category, setCategory] = useState('fav'); // 'fav' o 'con'
  const [color, setColor] = useState('bg-green-600');

  const addType = () => {
    if (!label) return;
    
    // Crear el nuevo objeto siguiendo la estructura que definimos
    const newEvent = { 
      id: `${label.toLowerCase().replace(/\s/g, '_')}_${category}`,
      label: label, 
      color: color, 
      category: category 
    };
    
    setEventTypes([...eventTypes, newEvent]);
    setLabel('');
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-sm">
        <h2 className="text-lg font-bold mb-4 text-white">Configure Event Types</h2>
        
        {/* Lista actual */}
        <div className="max-h-[200px] overflow-y-auto mb-4 space-y-2">
          {eventTypes.map(ev => (
            <div key={ev.id} className="flex justify-between items-center bg-slate-800 p-2 rounded text-xs text-white">
              <span>{ev.label} ({ev.category})</span>
              <button onClick={() => setEventTypes(eventTypes.filter(e => e.id !== ev.id))} className="text-red-400 font-bold">✕</button>
            </div>
          ))}
        </div>

        {/* Formulario */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <input className="w-full bg-slate-800 p-2 rounded text-sm text-white" placeholder="Event name" value={label} onChange={(e) => setLabel(e.target.value)} />
          
          <select className="w-full bg-slate-800 p-2 rounded text-sm text-white" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="fav">For (Favor)</option>
            <option value="con">Against (Contra)</option>
          </select>

          <div className="flex gap-2">
            {['bg-green-600', 'bg-red-600', 'bg-yellow-500', 'bg-blue-600'].map(c => (
              <button key={c} className={`w-8 h-8 rounded-full ${c} ${color === c ? 'ring-2 ring-white' : ''}`} onClick={() => setColor(c)} />
            ))}
          </div>

          <button onClick={addType} className="w-full bg-sky-600 py-2 rounded text-sm font-bold mt-2 text-white">Add Event Type</button>
          <button onClick={onClose} className="w-full bg-slate-800 py-2 rounded text-sm text-white">Close</button>
        </div>
      </div>
    </div>
  );
}