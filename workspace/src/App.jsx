import { useRef, useState } from 'react'
import VideoPlayer from './components/VideoPlayer'
import CanvasOverlay from './components/CanvasOverlay'
import EventTagger from './components/EventTagger'
import initialEventTypes from './config/events.json'

const tools = [
  { id: 'select', label: 'Select (Move, Curve & Adjust)' },
  { id: 'arrow', label: 'Tactical Arrow (Curved)' },
  { id: 'line', label: 'Tactical Line' },
  { id: 'text', label: 'Tactical Text Box' },
  { id: 'rectangle', label: 'Tactical Area (Rectangle)' },
  { id: 'circle', label: 'Tactical Oval / Circle' },
  { id: 'cylinder', label: 'Tactical Cylinder' }
]

export default function App() {
  const [activeTool, setActiveTool] = useState('select')
  const [shapes, setShapes] = useState([])
  const [events, setEvents] = useState([])
  const [eventTypes, setEventTypes] = useState(initialEventTypes)

  const [videoSize] = useState({ width: 1280, height: 720 })
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  
  const [strokeColor, setStrokeColor] = useState('#f43f5e') 
  const [bgColor, setBgColor] = useState('#000000')         
  const [opacity, setOpacity] = useState(0.3)                

  const [lineStyle, setLineStyle] = useState('solid') 
  const [fillPattern, setFillPattern] = useState('none') 

  const isCurrentlyFrozenRef = useRef(false)
  const playerRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const recordedChunksRef = useRef([])

  const handleTimeUpdate = (time) => {
    setCurrentTime(time)
    const hasShapeInThisFrame = shapes.some(s => Math.abs(s.timestamp - time) < 0.12)
    if (hasShapeInThisFrame && !isCurrentlyFrozenRef.current) {
      const videoElement = document.querySelector('video')
      if (videoElement && !videoElement.paused) {
        isCurrentlyFrozenRef.current = true
        videoElement.pause()
        setIsPlaying(false)

        setTimeout(() => {
          isCurrentlyFrozenRef.current = false
          if (videoElement) {
            videoElement.play().catch(() => {})
            setIsPlaying(true)
          }
        }, 7000)
      }
    }
  }

  const togglePlayPause = () => {
    const videoElement = document.querySelector('video')
    if (!videoElement) return
    if (videoElement.paused) {
      videoElement.play().catch((err) => console.error(err))
      setIsPlaying(true)
    } else {
      videoElement.pause()
      setIsPlaying(false)
    }
  }

  const skipTime = (amount) => {
    const videoElement = document.querySelector('video')
    if (!videoElement) return
    isCurrentlyFrozenRef.current = false
    const nextTime = Math.max(0, Math.min(duration, videoElement.currentTime + amount))
    videoElement.currentTime = nextTime
    setCurrentTime(nextTime)
  }

  const handleSeekChange = (e) => {
    const targetTime = parseFloat(e.target.value)
    isCurrentlyFrozenRef.current = false
    playerRef.current?.seekTo?.(targetTime)
    setCurrentTime(targetTime)
  }

  const handleLoadVideo = () => {
    playerRef.current?.openFilePicker()
  }

  const formatTime = (timeInSeconds) => {
    const mins = Math.floor(timeInSeconds / 60).toString().padStart(2, '0')
    const secs = Math.floor(timeInSeconds % 60).toString().padStart(2, '0')
    return `${mins}:${secs}`
  }

  const handleToggleRecord = () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop()
      setIsRecording(false)
    } else {
      recordedChunksRef.current = []
      const canvas = document.querySelector('canvas')
      if (!canvas) return alert('Workspace canvas not found.')

      const stream = canvas.captureStream(30)
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' })
      
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'analisis_tactico_avanzado.webm'
        a.click()
        URL.revokeObjectURL(url)
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
      document.querySelector('video')?.play().catch(() => {})
      setIsPlaying(true)
    }
  }

  const analysisTimestamps = Array.from(new Set(shapes.map(s => Math.floor(s.timestamp))))

  // Gestión de Eventos Tácticos con Contexto Integrado
  const addEvent = (eventData) => {
    const newEvent = { 
      ...eventData, 
      timestamp: currentTime 
    };
    setEvents(prev => [...prev, newEvent]);
  };

  const jumpToTime = (time) => {
    setCurrentTime(time);
    const videoElement = document.querySelector('video');
    if (videoElement) {
      videoElement.currentTime = time;
    }
  };

  // EXPORTADOR AUTOMATIZADO DE CLIP DE VIDEO DE 10 SEGUNDOS
  const exportVideoClip = async (eventItem) => {
    const video = document.querySelector('video');
    const canvas = document.querySelector('canvas');
    if (!video || !canvas) return alert('No se encontró el reproductor de video o el lienzo de dibujo.');

    const startTime = Math.max(0, eventItem.timestamp - 5);
    const endTime = Math.min(duration, eventItem.timestamp + 5);
    
    const wasPlaying = isPlaying;
    video.pause();
    setIsPlaying(false);

    const stream = canvas.captureStream(30); 
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
    const chunks = [];

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clip_${eventItem.type}_${eventItem.team}_${eventItem.zone}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      
      if (wasPlaying) {
        video.play().catch(() => {});
        setIsPlaying(true);
      }
    };

    video.currentTime = startTime;
    
    await new Promise((resolve) => {
      video.onseeked = resolve;
    });

    recorder.start();

    const recordInterval = setInterval(() => {
      if (video.currentTime >= endTime) {
        clearInterval(recordInterval);
        recorder.stop();
      } else {
        video.currentTime += 1 / 30; 
        setCurrentTime(video.currentTime);
      }
    }, 1000 / 30);
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-900 text-slate-100 antialiased">
      <header className="w-full border-b border-slate-800 bg-slate-950 px-6 py-4 shadow-md">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-400">Professional Tactical Suite</p>
            <h1 className="text-2xl font-bold tracking-tight text-white">Video Drawing Studio HD</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className={`rounded-xl px-5 py-2.5 text-sm font-bold shadow transition-all duration-200 ${
                isRecording ? 'bg-red-600 hover:bg-red-500 animate-pulse ring-4 ring-red-950' : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
              onClick={handleToggleRecord}
            >
              {isRecording ? 'Stop & Export HD' : 'Export Video (16:9 HD)'}
            </button>
            <button type="button" className="rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-sky-400 transition-colors" onClick={handleLoadVideo}>
              Load Match Video
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full mx-auto max-w-[1800px] grid gap-3 p-2 lg:grid-cols-[220px_1fr_220px]">
        <aside className="rounded-2xl border border-slate-800 bg-slate-950 p-3 shadow-xl space-y-5 h-fit overflow-y-auto max-h-[85vh]">
          
          {/* SECCIÓN A: HERRAMIENTAS */}
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Analysis Toolset</div>
            <div className="grid gap-1.5">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => setActiveTool(tool.id)}
                  className={`rounded-xl px-4 py-2 text-left text-xs font-semibold transition-all duration-150 ${
                    activeTool === tool.id ? 'bg-sky-500 text-white shadow-lg' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {tool.label}
                </button>
              ))}
            </div>
          </div>

          {/* SECCIÓN B: ESTILOS DE LÍNEA Y CONTORNOS */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Border & Line Style</div>
            
            <div className="flex items-center justify-between gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800">
              <span className="text-xs font-medium text-slate-300">Color:</span>
              <input type="color" value={strokeColor} onChange={(e) => setStrokeColor(e.target.value)} className="w-7 h-7 rounded bg-transparent cursor-pointer border-0"/>
            </div>

            <div className="space-y-1">
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
          </div>

          {/* SECCIÓN C: RELLENOS Y PATRONES GEOMÉTRICOS */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Fill & Area Pattern</div>
            
            <div className="flex items-center justify-between gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800">
              <span className="text-xs font-medium text-slate-300">Fill Color:</span>
              <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-7 h-7 rounded bg-transparent cursor-pointer border-0"/>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-medium text-slate-400">Internal Pattern:</span>
              <select 
                value={fillPattern} 
                onChange={(e) => setFillPattern(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-sky-500"
              >
                <option value="none">Color Liso Completo</option>
                <option value="grid">⚃ Cuadriculado Táctico</option>
                <option value="stripes">▤ Rayado / Listado</option>
              </select>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-medium text-slate-400">
                <span>Opacity:</span>
                <span className="font-mono text-sky-400">{Math.round(opacity * 100)}%</span>
              </div>
              <input type="range" min="0" max="1" step="0.05" value={opacity} onChange={(e) => setOpacity(parseFloat(e.target.value))} className="w-full h-1 bg-slate-800 accent-sky-500 rounded-lg cursor-pointer"/>
            </div>
          </div>
        </aside>

        <section className="flex flex-col gap-2 h-full w-full min-w-0">
          <div className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-xl flex items-center justify-center">
            <div className="relative w-full aspect-video max-h-[75vh] overflow-hidden rounded-xl bg-black border border-slate-800">
              <VideoPlayer ref={playerRef} width={videoSize.width} height={videoSize.height} onTimeUpdate={handleTimeUpdate} onDurationChange={setDuration} onPlayStateChange={setIsPlaying} />
              <CanvasOverlay
                videoWidth={videoSize.width}
                videoHeight={videoSize.height}
                activeTool={activeTool}
                shapes={shapes}
                setShapes={setShapes}
                currentTime={currentTime}
                strokeColor={strokeColor}
                bgColor={bgColor}
                opacity={opacity}
                lineStyle={lineStyle}
                fillPattern={fillPattern}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-xl space-y-3">
            <div className="space-y-1">
              <div className="relative w-full flex items-center h-6">
                {duration > 0 && analysisTimestamps.map((ts) => (
                  <div key={`mark-${ts}`} className="absolute top-0 bottom-0 w-[4px] bg-sky-400 shadow-[0_0_8px_#38bdf8] z-10 rounded-full pointer-events-none" style={{ left: `${(ts / duration) * 100}%` }} />
                ))}
                <input id="seek" type="range" min="0" max={duration || 100} step="0.01" value={currentTime} onChange={handleSeekChange} className="w-full h-2 appearance-none rounded-full bg-slate-800 accent-sky-500 cursor-pointer relative z-20" />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
              <div className="flex items-center gap-2.5">
                <button type="button" onClick={() => skipTime(-5)} className="rounded-xl bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800">⏮ -5s</button>
                <button type="button" onClick={togglePlayPause} className={`rounded-xl px-6 py-2 text-xs font-bold text-white shadow-md transition-all duration-200 ${isPlaying ? 'bg-amber-600 hover:bg-amber-500' : 'bg-sky-500 hover:bg-sky-400'}`}>{isPlaying ? '⏸ PAUSE' : '▶ PLAY'}</button>
                <button type="button" onClick={() => skipTime(5)} className="rounded-xl bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800">+5s ⏭</button>
              </div>
              <div className="text-sm font-mono font-bold text-sky-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 w-fit">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
          </div>
        </section>

        <aside className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
           <EventTagger 
             events={events}
             eventTypes={eventTypes}
             setEventTypes={setEventTypes}
             onAddEvent={addEvent} 
             onJumpToTime={jumpToTime} 
             formatTime={formatTime} 
             onExportClip={exportVideoClip}
           />
        </aside>
      </main>
    </div>
  )
}