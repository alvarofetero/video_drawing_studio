import { useRef, useState, useMemo } from 'react'
import VideoPlayer from './components/VideoPlayer'
import CanvasOverlay from './components/CanvasOverlay'
import EventTagger from './components/EventTagger'
import StylePanel from './components/StylePanel'
import initialEventTypes from './config/events.json'
import features from './config/features.json'

const ICONS = {
  select: <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />,
  arrow: <path d="M5 12h14M12 5l7 7-7 7" />,
  line: <path d="M5 19L19 5" />,
  text: <path d="M4 7V4h16v3M9 20h6M12 4v16" />,
  rectangle: <path d="M4 4h16v16H4z" />,
  circle: <circle cx="12" cy="12" r="9" />,
 cylinder: (
  <g>
    <ellipse cx="12" cy="6" rx="9" ry="3" />
    <path d="M3 6v12c0 1.66 4 3 9 3s9-1.34 9-3V6" />
  </g>
)
};

const tools = [
  { id: 'select', label: 'Select', iconKey: 'select' },
  { id: 'arrow', label: 'Arrow', iconKey: 'arrow' },
  { id: 'line', label: 'Line', iconKey: 'line' },
  { id: 'text', label: 'Text', iconKey: 'text' },
  { id: 'rectangle', label: 'Area', iconKey: 'rectangle' },
  { id: 'circle', label: 'Circle', iconKey: 'circle' },
  { id: 'cylinder', label: 'Cylinder', iconKey: 'cylinder' }
];

export default function App() {
  // --- ESTADOS PRINCIPALES ---
  const [activeTool, setActiveTool] = useState('select')
  const [shapes, setShapes] = useState([])
  const [events, setEvents] = useState([])
  const [eventTypes, setEventTypes] = useState(initialEventTypes)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  
  // --- ESTADOS DE ESTILO ---
  const [strokeColor, setStrokeColor] = useState('#f43f5e') 
  const [bgColor, setBgColor] = useState('#000000') 
  const [opacity, setOpacity] = useState(0.3) 
  const [lineStyle, setLineStyle] = useState('solid') 
  const [fillPattern, setFillPattern] = useState('none') 

  const playerRef = useRef(null)

  // --- LÓGICA DE CONTROL ---
  const handleTimeUpdate = (time) => setCurrentTime(time)
  const addEvent = (eventData) => setEvents(prev => [...prev, { ...eventData, timestamp: currentTime }])
  const jumpToTime = (time) => { setCurrentTime(time); playerRef.current?.seekTo?.(time) }
  
  const togglePlayPause = () => {
    const video = document.querySelector('video');
    if (video) {
        video.paused ? video.play() : video.pause();
        setIsPlaying(!video.paused);
    }
  }

  const skipTime = (amount) => {
    const video = document.querySelector('video');
    if (video) video.currentTime += amount;
  }

  const formatTime = (time) => {
    const mins = Math.floor(time / 60).toString().padStart(2, '0')
    const secs = Math.floor(time % 60).toString().padStart(2, '0')
    return `${mins}:${secs}`
  }

  const handleLoadVideo = () => playerRef.current?.openFilePicker()

  // --- MAPA DE COMPONENTES ---
  const COMPONENT_MAP = useMemo(() => ({
    sidebarDrawing: (
      <aside className="rounded-2xl border border-slate-800 bg-slate-950 p-3 shadow-xl h-fit space-y-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mb-2">Analysis Toolset</div>
          <div className="grid gap-1.5">
            {tools.map((tool) => (
              <button 
    key={tool.id} 
    onClick={() => setActiveTool(tool.id)}
    className={`flex items-center gap-3 w-full px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
      activeTool === tool.id ? 'bg-sky-500 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
    }`}
  >
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {ICONS[tool.iconKey]}
    </svg>
    {tool.label}
  </button>
            ))}
          </div>
        </div>
        
        <StylePanel 
          strokeColor={strokeColor} setStrokeColor={setStrokeColor}
          bgColor={bgColor} setBgColor={setBgColor}
          opacity={opacity} setOpacity={setOpacity}
          lineStyle={lineStyle} setLineStyle={setLineStyle}
          fillPattern={fillPattern} setFillPattern={setFillPattern}
        />
      </aside>
    ),
    tagger: (
      <aside className="rounded-2xl border border-slate-800 bg-slate-950 p-3 shadow-xl">
        <EventTagger 
          events={events} eventTypes={eventTypes} setEventTypes={setEventTypes}
          onAddEvent={addEvent} onJumpToTime={jumpToTime} formatTime={formatTime} 
        />
      </aside>
    )
  }), [activeTool, events, eventTypes, strokeColor, bgColor, opacity, lineStyle, fillPattern]);

  // --- RENDERIZADO ---
  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-900 text-slate-100">
      <header className="w-full border-b border-slate-800 bg-slate-950 px-6 py-4 flex justify-between items-center">
        <div>
          <p className="text-[10px] font-bold text-sky-500 uppercase tracking-widest">Studio HD</p>
          <h1 className="text-lg font-bold">Tactical Analysis</h1>
        </div>
        <div className="flex gap-3">
          <button className={`px-4 py-2 rounded-lg text-xs font-bold ${isRecording ? 'bg-red-600' : 'bg-emerald-600'}`} onClick={() => setIsRecording(!isRecording)}>
            {isRecording ? 'STOP RECORDING' : 'EXPORT VIDEO'}
          </button>
          <button className="bg-sky-500 px-4 py-2 rounded-lg text-xs font-bold" onClick={handleLoadVideo}>LOAD VIDEO</button>
        </div>
      </header>

      <main className="flex-1 w-full mx-auto max-w-[1800px] grid gap-3 p-2 lg:grid-cols-[220px_1fr_220px]">
        {features.sidebarDrawing && COMPONENT_MAP.sidebarDrawing}

        <section className="flex flex-col gap-2 min-w-0">
          <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-slate-800">
            <VideoPlayer ref={playerRef} onTimeUpdate={handleTimeUpdate} onDurationChange={setDuration} />
            {features.sidebarDrawing && (
              <CanvasOverlay 
                activeTool={activeTool} shapes={shapes} setShapes={setShapes} currentTime={currentTime}
                strokeColor={strokeColor} bgColor={bgColor} opacity={opacity} 
                lineStyle={lineStyle} fillPattern={fillPattern}
                videoWidth={1280} videoHeight={720}
              />
            )}
          </div>
          
         {/* --- TIMELINE Y CONTROLES --- */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-2 shadow-xl space-y-2">
            <div className="relative w-full h-10 flex flex-col justify-end">
              
              {/* ESCALA VISUAL (Divisiones de tiempo) */}
              <div className="absolute top-0 w-full flex justify-between px-0.5 pointer-events-none">
                {Array.from({ length: 11 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <span className="text-[9px] text-slate-600 font-mono">
                      {formatTime((duration / 10) * i)}
                    </span>
                    <div className="h-2 w-[1px] bg-slate-700 mt-0.5" />
                  </div>
                ))}
              </div>

              {/* TRACK DE REPRODUCCIÓN */}
              <div className="relative w-full h-6 flex items-center">
                {duration > 0 && Array.from(new Set(shapes.map(s => Math.floor(s.timestamp)))).map((ts) => (
                  <div 
                    key={`mark-${ts}`} 
                    className="absolute top-0 bottom-0 w-[4px] bg-sky-400 shadow-[0_0_8px_#38bdf8] z-10 rounded-full pointer-events-none" 
                    style={{ left: `${(ts / duration) * 100}%` }} 
                  />
                ))}
                <input 
                  id="seek" 
                  type="range" 
                  min="0" 
                  max={duration || 100} 
                  step="0.01" 
                  value={currentTime} 
                  onChange={(e) => jumpToTime(parseFloat(e.target.value))} 
                  className="w-full h-2 appearance-none rounded-full bg-slate-800 accent-sky-500 cursor-pointer relative z-20" 
                />
              </div>
            </div>

            {/* Botones de control igual que antes... */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
              <div className="flex items-center gap-2.5">
                <button className="rounded-xl bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800" onClick={() => skipTime(-5)}>⏮ -5s</button>
                <button className="rounded-xl px-6 py-2 text-xs font-bold text-white shadow-md transition-all duration-200 bg-sky-500 hover:bg-sky-400" onClick={togglePlayPause}>
                  {isPlaying ? '⏸ PAUSE' : '▶ PLAY'}
                </button>
                <button className="rounded-xl bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800" onClick={() => skipTime(5)}>+5s ⏭</button>
              </div>
              <div className="text-sm font-mono font-bold text-sky-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 w-fit">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
          </div>
        </section>

        {features.tagger && COMPONENT_MAP.tagger}
      </main>
    </div>
  )
}