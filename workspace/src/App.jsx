import { useRef, useState, useEffect } from 'react'
import VideoPlayer from './components/VideoPlayer'
import CanvasOverlay from './components/CanvasOverlay'

const tools = [
  { id: 'select', label: 'Select (Move & Shape Perspective)' },
  { id: 'circle', label: 'Tactical Oval / Circle' },
  { id: 'cylinder', label: 'Tactical Cylinder' },
  { id: 'rectangle', label: 'Rectangle' }
]

export default function App() {
  const [activeTool, setActiveTool] = useState('select')
  const [shapes, setShapes] = useState([])
  const [videoSize] = useState({ width: 640, height: 480 })
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  
  // Estados para gestionar la congelación de 7 segundos
  const [frozenTimestamps, setFrozenTimestamps] = useState(new Set())
  const isCurrentlyFrozenRef = useRef(false)
  const playerRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const recordedChunksRef = useRef([])

  // Cada vez que cambia el segundo del video en reproducción normal, validamos si hay marcas
  const handleTimeUpdate = (time) => {
    setCurrentTime(time)
    
    // Validamos si hay alguna figura creada en este segundo exacto
    const hasShapeInThisFrame = shapes.some(s => Math.abs(s.timestamp - time) < 0.12)
    
    // Si hay una figura, y este segundo no ha sido congelado todavía en esta pasada...
    if (hasShapeInThisFrame && !frozenTimestamps.has(Math.floor(time)) && !isCurrentlyFrozenRef.current) {
      const videoElement = document.querySelector('video')
      if (videoElement && !videoElement.paused) {
        isCurrentlyFrozenRef.current = true
        videoElement.pause() // Detiene la marcha nativa del video
        
        // Registramos el segundo para no volver a congelar infinitamente en bucle
        setFrozenTimestamps(prev => {
          const next = new Set(prev)
          next.add(Math.floor(time))
          return next
        })

        // Temporizador de 7 segundos exactos en pantalla
        setTimeout(() => {
          isCurrentlyFrozenRef.current = false
          // Si no empezamos a grabar otra cosa o el usuario cambió de opinión, reanuda
          videoElement.play().catch(() => {})
        }, 7000)
      }
    }
  }

  // Al mover la barra de tiempo manual, limpiamos los bloqueos de congelamiento pasados
  const handleSeekChange = (e) => {
    const targetTime = parseFloat(e.target.value)
    setFrozenTimestamps(new Set()) // Resetea memoria para que vuelva a congelar al pasar por ahí
    isCurrentlyFrozenRef.current = false
    playerRef.current?.seekTo?.(targetTime)
  }

  const handleLoadVideo = () => {
    playerRef.current?.openFilePicker()
  }

  const formatTime = (timeInSeconds) => {
    const mins = Math.floor(timeInSeconds / 60).toString().padStart(2, '0')
    const secs = Math.floor(timeInSeconds % 60).toString().padStart(2, '0')
    return `${mins}:${secs}`
  }

  // --- EXPORTACIÓN DE VIDEO INTEGRANDO LOS 7s DE CONGELACIÓN ---
  const handleToggleRecord = () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop()
      setIsRecording(false)
    } else {
      recordedChunksRef.current = []
      setFrozenTimestamps(new Set()) // Permitir congelar todo en la grabación final limpia
      const canvas = document.querySelector('canvas')
      if (!canvas) return alert('No canvas workspace found.')

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
        a.download = 'analisis_estudio_tactico.webm'
        a.click()
        URL.revokeObjectURL(url)
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
      
      const videoElement = document.querySelector('video')
      videoElement?.play().catch(() => {})
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Tactical Video Analysis</p>
            <h1 className="text-2xl font-semibold">Video Drawing Studio Pro</h1>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              className={`rounded-full px-4 py-2 text-sm font-semibold text-white shadow transition ${
                isRecording ? 'bg-red-600 hover:bg-red-500 animate-pulse' : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
              onClick={handleToggleRecord}
            >
              {isRecording ? 'Stop & Save Video' : 'Export Video with 7s Freezes'}
            </button>
            <button type="button" className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-400" onClick={handleLoadVideo}>
              Load Video
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1280px] gap-6 px-4 py-6 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 text-xs uppercase tracking-[0.3em] text-slate-400">Studio Tools</div>
          <div className="grid gap-3">
            {tools.map((tool) => (
              <button
                key={tool.id}
                type="button"
                onClick={() => setActiveTool(tool.id)}
                className={`rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                  activeTool === tool.id ? 'bg-slate-950 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {tool.label}
              </button>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-500 space-y-2">
            <p className="font-semibold text-slate-700">Studio Guide:</p>
            <p>1. Pause the video and pick any shape tool to draw.</p>
            <p>2. Use <b>Select</b> mode to drag drawings or adjust oval perspective via handles.</p>
            <p>3. Hit Play: the final video will freeze for 7 seconds automatically on your analysis frame!</p>
          </div>
        </aside>

        <section className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="relative mx-auto overflow-hidden rounded-[32px] border border-slate-200 bg-black" style={{ width: videoSize.width, height: videoSize.height }}>
              <div className="relative h-full w-full">
                <VideoPlayer 
                  ref={playerRef} 
                  width={videoSize.width} 
                  height={videoSize.height} 
                  onTimeUpdate={handleTimeUpdate}
                  onDurationChange={setDuration}
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
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <input id="seek" type="range" min="0" max={duration || 100} step="0.01" value={currentTime} onChange={handleSeekChange} className="h-2 flex-1 appearance-none rounded-full bg-slate-200 accent-sky-500 cursor-pointer" />
              <div className="text-sm font-semibold text-slate-700 min-w-[90px] text-right">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}