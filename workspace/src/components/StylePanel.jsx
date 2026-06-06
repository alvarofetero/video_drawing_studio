export default function StylePanel({ 
  strokeColor, setStrokeColor, 
  bgColor, setBgColor, 
  opacity, setOpacity, 
  lineStyle, setLineStyle, 
  fillPattern, setFillPattern 
}) {
  return (
    <div className="pt-3 border-t border-slate-800 space-y-3">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Style & Pattern</div>
      
      <div id="lineStyle" className="space-y-1">
              <span className="text-[11px] font-medium text-slate-400">Stroke Type:</span>
              <select 
                value={lineStyle} 
                onChange={(e) => setLineStyle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-sky-500"
              >
                <option value="solid">━━━━ Sólida (Solid)</option>
                <option value="dashed">---- Discontinua (Dashed)</option>
                <option value="dotted">•••• Punteada (Dotted)</option>
              </select>
      </div>


      <div id="strokeColor" className="space-y-2">
        <label className="text-[10px] text-slate-400">Stroke Color</label>
        <input type="color" value={strokeColor} onChange={(e) => setStrokeColor(e.target.value)} className="w-full h-8 rounded cursor-pointer bg-transparent" />
      </div>

      <div id="bgColor" className="space-y-2">
        <label className="text-[10px] text-slate-400">Fill Color</label>
        <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-full h-8 rounded cursor-pointer bg-transparent" />
      </div>

      <div id="fillPatterns" className="space-y-1">
        <label className="text-[10px] text-slate-400">Pattern</label>
        <select value={fillPattern} onChange={(e) => setFillPattern(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white">
          <option value="none">Color Liso</option>
          <option value="grid">⚃ Cuadriculado</option>
          <option value="stripes">▤ Rayado</option>
        </select>
      </div>

      <div id="opacity" className="space-y-1">
        <label className="text-[10px] text-slate-400">Opacity: {Math.round(opacity * 100)}%</label>
        <input type="range" min="0" max="1" step="0.05" value={opacity} onChange={(e) => setOpacity(parseFloat(e.target.value))} className="w-full h-1 accent-sky-500" />
      </div>
    </div>
  );
}