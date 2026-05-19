import { useRef, useState } from 'react'
import VideoPlayer from './components/VideoPlayer'
import CanvasOverlay from './components/CanvasOverlay'

const tools = [
  { id: 'select', label: 'Select (Move & Adjust Perspective)' },
  { id: 'rectangle', label: 'Tactical Area (Rectangle)' },
  { id: 'circle', label: 'Tactical Oval / Circle' },
  { id: 'cylinder', label: 'Tactical Cylinder' }
]

export default function App() {
  const [activeTool, setActiveTool] = useState('select')
  const [shapes, setShapes] = useState([])
  const [videoSize] = useState({ width: 1280, height: 720 })
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false) // Control de estado global de reproducción
  
  const isCurrentlyFrozenRef = useRef(false)
  const playerRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const recordedChunksRef = useRef([])

  // Sincroniza el tiempo y gestiona el congelamiento automático de 7 segundos
  const handleTimeUpdate = (time) => {
    setCurrentTime(time)
    
    const hasShapeInThisFrame = shapes.some(s => Math.abs(s.timestamp - time) < 0.12)
    if (hasShapeInThisFrame && !isCurrentlyFrozenRef.current) {
      const videoElement = document.querySelector('video')
      if (videoElement && !videoElement.paused) {
        isCurrentlyFrozenRef.current = true
        videoElement.pause()
        setIsPlaying(false) // Actualiza la UI al pausarse por congelamiento

        setTimeout(() => {
          isCurrentlyFrozenRef.current = false
          // Solo reanuda si el usuario no ha navegado a otra parte manualmente
          if (videoElement) {
            videoElement.play().catch(() => {})
            setIsPlaying(true)
          }
        }, 7000)
      }
    }
  }

  // Controles de reproducción manuales
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
    if (playerRef.current?.seekTo) {
      playerRef.current.seekTo(targetTime)
    }
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
        a.download = 'analisis_hd_1280x720.webm'
        a.click()
        URL.revokeObjectURL(url)
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
      
      const videoElement = document.querySelector('video')
      videoElement?.play().catch(() => {})
      setIsPlaying(true)
    }
  }

  // Extrae los segundos únicos donde existen dibujos para pintar las marcas de la timeline
  const analysisTimestamps = Array.from(new Set(shapes.map(s => Math.floor(s.timestamp))))

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-900 text-slate-100 antialiased selection:bg-sky-500/30">
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
              {isRecording ? 'Stop & Export HD' : 'Export Video (1280x720)'}
            </button>
            <button type="button" className="rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-sky-400 transition-colors" onClick={handleLoadVideo}>
              Load Match Video
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full mx-auto max-w-[1600px] grid gap-6 p-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-xl flex flex-col justify-between h-fit gap-6">
          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Analysis Toolset</div>
            <div className="grid gap-2.5">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => setActiveTool(tool.id)}
                  className={`rounded-xl px-4 py-3 text-left text-sm font-semibold transition-all duration-200 ${
                    activeTool === tool.id ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20 scale-[1.02]' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {tool.label}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-xs text-slate-400 space-y-2.5">
            <p className="font-bold text-slate-200 uppercase tracking-wider text-[10px]">Studio Guide:</p>
            <p>1. Pause the video and draw lines or rectangles on tactical points.</p>
            <p>2. See the <span className="text-sky-400 font-semibold">cyan marks</span> appearing on the timeline structure below.</p>
          </div>
        </aside>

        <section className="flex flex-col gap-5 h-full w-full min-w-0">
          {/* El lienzo Workspace HD */}
          <div className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-xl flex items-center justify-center">
            <div className="relative w-full aspect-[1280/720] max-h-[75vh] overflow-hidden rounded-xl bg-black border border-slate-900">
              <VideoPlayer 
                ref={playerRef} 
                width={videoSize.width} 
                height={videoSize.height} 
                onTimeUpdate={handleTimeUpdate}
                onDurationChange={setDuration}
                onPlayStateChange={setIsPlaying}
              />
              <CanvasOverlay
                videoWidth={videoSize.width}
                videoHeight={videoSize.height}
                activeTool={activeTool}
                shapes={shapes}
                setShapes={setShapes}
                currentTime={currentTime}
              />
            </div>
          </div>

          {/* NUEVO PANEL DE CONTROL UNIFICADO: BOTONERA COMPLETA + TIMELINE CON MARCAS */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-xl space-y-4">
            
            {/* Contenedor relativo para la Barra de tiempo y sus marcas tácticas */}
            <div className="space-y-1">
              <div className="relative w-full flex items-center h-6">
                
                {/* Capa de marcas de tiempo absolutas basadas en tus dibujos de análisis */}
                {duration > 0 && analysisTimestamps.map((ts) => {
                  const percentage = (ts / duration) * 100
                  return (
                    <div 
                      key={`mark-${ts}`}
                      className="absolute top-0 bottom-0 w-[4px] bg-sky-400 shadow-[0_0_8px_#38bdf8] z-10 rounded-full pointer-events-none"
                      style={{ left: `${percentage}%` }}
                      title={`Analysis Stop: ${formatTime(ts)}`}
                    />
                  )
                })}

                {/* Input Slider de la Timeline */}
                <input 
                  id="seek" 
                  type="range" 
                  min="0" 
                  max={duration || 100} 
                  step="0.01" 
                  value={currentTime} 
                  onChange={handleSeekChange} 
                  className="w-full h-2 appearance-none rounded-full bg-slate-800 accent-sky-500 cursor-pointer relative z-20" 
                />
              </div>
            </div>

            {/* Barra de Botones Inferior integrada en la Timeline */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
              <div className="flex items-center gap-2.5">
                <button 
                  type="button" 
                  onClick={() => skipTime(-5)} 
                  className="rounded-xl bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  ⏮ -5s
                </button>
                
                <button 
                  type="button" 
                  onClick={togglePlayPause} 
                  className={`rounded-xl px-6 py-2 text-xs font-bold text-white shadow-md transition-all duration-200 ${
                    isPlaying ? 'bg-amber-600 hover:bg-amber-500' : 'bg-sky-500 hover:bg-sky-400'
                  }`}
                >
                  {isPlaying ? '⏸ PAUSE' : '▶ PLAY'}
                </button>

                <button 
                  type="button" 
                  onClick={() => skipTime(5)} 
                  className="rounded-xl bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  +5s ⏭
                </button>
              </div>

              {/* Display de Reloj Digital */}
              <div className="text-sm font-mono font-bold text-sky-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 w-fit">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

          </div>
        </section>
      </main>
    </div>
  )
}