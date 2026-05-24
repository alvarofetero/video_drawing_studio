import React, { useState } from 'react';

export default function EventSettings({ eventTypes, setEventTypes, onClose }) {
  const [label, setLabel] = useState('');
  const [polarity, setPolarity] = useState('_fav');
  const [color, setColor] = useState('bg-green-600');

  const addType = () => {
    if (!label) return;
    const newId = `${label.toLowerCase().replace(/\s/g, '_')}${polarity}`;
    setEventTypes([...eventTypes, { id: newId, label: label, color: color }]);
    setLabel('');
  };

  const removeType = (id) => {
    setEventTypes(eventTypes.filter(e => e.id !== id));
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-sm shadow-2xl">
        <h2 className="text-lg font-bold mb-4 text-white">Configure Event Types</h2>
        
        {/* Lista actual con botón borrar */}
        <div className="max-h-[200px] overflow-y-auto mb-4 space-y-2">
          {eventTypes.map(ev => (
            <div key={ev.id} className="flex justify-between items-center bg-slate-800 p-2 rounded text-xs">
              <span>{ev.label}</span>
              <button onClick={() => removeType(ev.id)} className="text-red-400 font-bold">✕</button>
            </div>
          ))}
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-800">
          <input className="w-full bg-slate-800 p-2 rounded text-sm text-white" placeholder="Event name" value={label} onChange={(e) => setLabel(e.target.value)} />
          <select className="w-full bg-slate-800 p-2 rounded text-sm text-white" value={polarity} onChange={(e) => setPolarity(e.target.value)}>
            <option value="_fav">For (Favor)</option>
            <option value="_con">Against (Contra)</option>
          </select>
          <div className="flex gap-2">
            {['bg-green-600', 'bg-red-600', 'bg-yellow-500', 'bg-blue-600'].map(c => (
              <button key={c} className={`w-8 h-8 rounded-full ${c} ${color === c ? 'ring-2 ring-white' : ''}`} onClick={() => setColor(c)} />
            ))}
          </div>
          <button onClick={addType} className="w-full bg-sky-600 py-2 rounded text-sm font-bold mt-2">Add Event Type</button>
          <button onClick={onClose} className="w-full bg-slate-800 py-2 rounded text-sm">Close</button>
        </div>
      </div>
    </div>
  );
}