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
  // ACTUALIZACIÓN DE RESOLUCIÓN A ALTA DEFINICIÓN (1080x720 HD)
  const [videoSize] = useState({ width: 1080, height: 720 })
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  
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

        setTimeout(() => {
          isCurrentlyFrozenRef.current = false
          videoElement.play().catch(() => {})
        }, 7000)
      }
    }
  }

  const handleSeekChange = (e) => {
    const targetTime = parseFloat(e.target.value)
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

  const handleToggleRecord = () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop()
      setIsRecording(false)
    } else {
      recordedChunksRef.current = []
      const canvas = document.querySelector('canvas')
      if (!canvas) return alert('Workspace canvas not found.')

      // Capturamos el stream nativo de alta definición a 1080x720 de resolución fija
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
        a.download = 'analisis_hd_1080x720.webm'
        a.click()
        URL.revokeObjectURL(url)
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
      
      document.querySelector('video')?.play().catch(() => {})
    }
  }

  return (
    // INTERFAZ DE PANTALLA COMPLETA TOTALMENTE ADAPTATIVA (Flex-col y W-Full)
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
              {isRecording ? 'Stop & Export HD' : 'Export Video (1080x720)'}
            </button>
            <button type="button" className="rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-sky-400 transition-colors" onClick={handleLoadVideo}>
              Load Match Video
            </button>
          </div>
        </div>
      </header>

      {/* DISEÑO ELÁSTICO DE PANTALLA COMPLETA COMPATIBLE CON MONITORES ANCHOS */}
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
            <p className="font-bold text-slate-200 uppercase tracking-wider text-[10px]">Perspective Control:</p>
            <p>Select the <b>Rectangle</b>, click and drag to define an area.</p>
            <p>Switch to <b>Select</b> mode and drag any of its 4 corner nodes to map it to the stadium pitch perspective.</p>
          </div>
        </aside>

        <section className="flex flex-col gap-5 h-full w-full min-w-0">
          {/* CONTENEDOR FLUIDO DEL WORKSPACE CON RELACIÓN DE ASPECTO FIJA HD */}
          <div className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-xl flex items-center justify-center">
            <div className="relative w-full aspect-[1080/720] max-h-[75vh] overflow-hidden rounded-xl bg-black border border-slate-900">
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

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <input id="seek" type="range" min="0" max={duration || 100} step="0.01" value={currentTime} onChange={handleSeekChange} className="h-2 flex-1 appearance-none rounded-full bg-slate-800 accent-sky-500 cursor-pointer" />
              <div className="text-sm font-mono font-bold text-sky-400 min-w-[100px] text-right bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}