import { useRef, useState } from 'react'
import VideoPlayer from './components/VideoPlayer'
import CanvasOverlay from './components/CanvasOverlay'

const tools = [
  { id: 'select', label: 'Select (Interact)' },
  { id: 'rectangle', label: 'Rectangle' },
  { id: 'circle', label: 'Circle' },
  { id: 'cylinder', label: 'Tactical Cylinder' }
]

export default function App() {
  const [activeTool, setActiveTool] = useState('select')
  const [shapes, setShapes] = useState([])
  const [videoSize] = useState({ width: 640, height: 480 })
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  
  const playerRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const recordedChunksRef = useRef([])

  const handleShapeCreate = (shapeData) => {
    setShapes((current) => [
      ...current,
      {
        id: `shape-${current.length + 1}`,
        tool: activeTool,
        ...shapeData
      }
    ])
  }

  const handleLoadVideo = () => {
    playerRef.current?.openFilePicker()
  }

  const formatTime = (timeInSeconds) => {
    const mins = Math.floor(timeInSeconds / 60).toString().padStart(2, '0')
    const secs = Math.floor(timeInSeconds % 60).toString().padStart(2, '0')
    return `${mins}:${secs}`
  }

  const handleSeekChange = (e) => {
    const targetTime = parseFloat(e.target.value)
    playerRef.current?.seekTo?.(targetTime)
  }

  const skipTime = (amount) => {
    if (playerRef.current?.seekTo) {
      const nextTime = Math.max(0, Math.min(duration, currentTime + amount))
      playerRef.current.seekTo(nextTime)
    }
  }

  // --- SISTEMA DE EXPORTACIÓN DE VIDEO ---
  const handleToggleRecord = () => {
    if (isRecording) {
      // Detener grabación
      mediaRecorderRef.current?.stop()
      setIsRecording(false)
    } else {
      // Iniciar grabación del espacio de trabajo combinando video + dibujos
      recordedChunksRef.current = []
      
      // Buscamos el elemento canvas del DOM para extraer su stream de video
      const canvas = document.querySelector('canvas')
      if (!canvas) return alert('No se encontró el lienzo de dibujo.')

      // Capturamos el stream a 30 FPS
      const stream = canvas.captureStream(30)
      
      // Intentamos capturar el audio del video original si existe para no perderlo
      const videoElement = document.querySelector('video')
      if (videoElement && videoElement.captureStream) {
        const videoStream = videoElement.captureStream()
        const audioTracks = videoStream.getAudioTracks()
        if (audioTracks.length > 0) {
          stream.addTrack(audioTracks[0])
        }
      }

      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' })
      
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        
        // Crear un enlace invisible para descargar el archivo modificado automáticamente
        const a = document.createElement('a')
        a.href = url
        a.download = 'analisis_tactico.webm'
        a.click()
        URL.revokeObjectURL(url)
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
      
      // Forzamos al video a reproducirse al empezar a grabar
      videoElement?.play().catch(() => {})
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Football Video Analysis</p>
            <h1 className="text-2xl font-semibold">Video Drawing Studio</h1>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              className={`rounded-full px-4 py-2 text-sm font-semibold text-white shadow transition ${
                isRecording ? 'bg-red-600 hover:bg-red-500 animate-pulse' : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
              onClick={handleToggleRecord}
            >
              {isRecording ? 'Stop & Download Analysis' : 'Start Export Recording'}
            </button>
            <button
              type="button"
              className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-400"
              onClick={handleLoadVideo}
            >
              Load Video
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1280px] gap-6 px-4 py-6 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 text-xs uppercase tracking-[0.3em] text-slate-400">Drawing Toolbar</div>
          <div className="grid gap-3">
            {tools.map((tool) => (
              <button
                key={tool.id}
                type="button"
                onClick={() => setActiveTool(tool.id)}
                className={`rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                  activeTool === tool.id
                    ? 'bg-slate-950 text-white shadow'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {tool.label}
              </button>
            ))}
          </div>
        </aside>

        <section className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="relative mx-auto overflow-hidden rounded-[32px] border border-slate-200 bg-black" style={{ width: videoSize.width, height: videoSize.height }}>
              <div role="region" aria-label="Video workspace" className="relative h-full w-full">
                <VideoPlayer 
                  ref={playerRef} 
                  width={videoSize.width} 
                  height={videoSize.height} 
                  onTimeUpdate={setCurrentTime}
                  onDurationChange={setDuration}
                  isRecording={isRecording} // Pasamos la bandera al reproductor
                />
                <CanvasOverlay
                  videoWidth={videoSize.width}
                  videoHeight={videoSize.height}
                  activeTool={activeTool}
                  shapes={shapes}
                  setShapes={setShapes} // Pasamos la función mutadora para limpiar el tiempo
                  onShapeCreate={handleShapeCreate}
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => skipTime(-5)} className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Skip -5s</button>
                <button type="button" onClick={() => skipTime(5)} className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Skip +5s</button>
              </div>
              <div className="flex-1">
                <input id="seek" type="range" min="0" max={duration || 100} value={currentTime} onChange={handleSeekChange} className="h-2 w-full appearance-none rounded-full bg-slate-200 accent-sky-500 cursor-pointer" />
              </div>
              <div className="text-sm font-medium text-slate-700 min-w-[90px] text-right">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}