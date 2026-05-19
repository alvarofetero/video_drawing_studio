import { useRef, useState } from 'react'
import VideoPlayer from './components/VideoPlayer'
import CanvasOverlay from './components/CanvasOverlay'

const tools = [
  { id: 'select', label: 'Select (Interact with Video)' },
  { id: 'rectangle', label: 'Rectangle' },
  { id: 'circle', label: 'Circle' },
  { id: 'arrow', label: 'Arrow' },
  { id: 'cylinder', label: 'Cylinder' },
  { id: 'text', label: 'Text' }
]

export default function App() {
  const [activeTool, setActiveTool] = useState('select')
  const [shapes, setShapes] = useState([])
  const [videoSize] = useState({ width: 640, height: 480 })
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const playerRef = useRef(null)

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

  // Funciones para conectar los controles de la línea de tiempo con el VideoPlayer nativo
  const formatTime = (timeInSeconds) => {
    const mins = Math.floor(timeInSeconds / 60).toString().padStart(2, '0')
    const secs = Math.floor(timeInSeconds % 60).toString().padStart(2, '0')
    return `${mins}:${secs}`
  }

  const handleTimeUpdate = (time) => {
    setCurrentTime(time)
  }

  const handleSeekChange = (e) => {
    const targetTime = parseFloat(e.target.value)
    if (playerRef.current?.seekTo) {
      playerRef.current.seekTo(targetTime)
    }
  }

  const skipTime = (amount) => {
    if (playerRef.current?.seekTo) {
      const nextTime = Math.max(0, Math.min(duration, currentTime + amount))
      playerRef.current.seekTo(nextTime)
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
          <button
            type="button"
            className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-400"
            onClick={handleLoadVideo}
          >
            Load Video
          </button>
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
          <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">Active Tool</p>
            <p className="mt-2 capitalize">{activeTool}</p>
            <p className="mt-4 text-xs text-slate-500">
              {activeTool === 'select' 
                ? 'Click on the video interface controls to play/pause.' 
                : 'Draw on the canvas to create shapes.'}
            </p>
          </div>
        </aside>

        <section className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Workspace</p>
                <h2 className="text-xl font-semibold text-slate-950">Video + Canvas Overlay</h2>
              </div>
              <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-700">
                {shapes.length} shape{shapes.length === 1 ? '' : 's'}
              </div>
            </div>

            <div className="relative mx-auto overflow-hidden rounded-[32px] border border-slate-200 bg-black" style={{ width: videoSize.width, height: videoSize.height }}>
              <div role="region" aria-label="Video workspace" className="relative h-full w-full">
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
                  onShapeCreate={handleShapeCreate}
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Playback</p>
                <h3 className="text-lg font-semibold text-slate-950">Timeline controls</h3>
              </div>
              <div className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="flex flex-wrap gap-3">
                <button 
                  type="button" 
                  onClick={() => skipTime(-5)}
                  className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Skip -5s
                </button>
                <button 
                  type="button" 
                  onClick={() => skipTime(5)}
                  className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Skip +5s
                </button>
              </div>
              <div className="flex-1">
                <label htmlFor="seek" className="sr-only">Seek time</label>
                <input 
                  id="seek" 
                  type="range" 
                  min="0" 
                  max={duration || 100} 
                  value={currentTime}
                  onChange={handleSeekChange}
                  aria-label="Seek time" 
                  className="h-2 w-full appearance-none rounded-full bg-slate-200 accent-sky-500 cursor-pointer" 
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}