import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

function VideoPlayer({ onTimeUpdate, onDurationChange, isRecording }, ref) {
  const videoRef = useRef(null)
  const inputRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [videoSrc, setVideoSrc] = useState('')

  useImperativeHandle(ref, () => ({
    openFilePicker: () => {
      inputRef.current?.click()
    },
    seekTo: (seconds) => {
      if (videoRef.current) {
        videoRef.current.currentTime = seconds
      }
    },
    // Exponemos la referencia del elemento de video nativo para que el Canvas pueda leer sus fotogramas
    getVideoElement: () => videoRef.current
  }))

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const url = typeof URL?.createObjectURL === 'function' ? URL.createObjectURL(file) : ''
    setVideoSrc(url)
    setVideoLoaded(true)
    setIsPlaying(false)
  }

  const handleLoadVideo = () => {
    inputRef.current?.click()
  }

  const handlePlayPause = () => {
    if (!videoRef.current) return
    if (videoRef.current.paused) {
      videoRef.current.play().catch((err) => console.error(err))
    } else {
      videoRef.current.pause()
    }
  }

  return (
    <div className="absolute inset-0 flex flex-col justify-between">
      <video
        ref={videoRef}
        width="100%"
        height="100%"
        // Mantenemos el video visible pero le bajamos la prioridad de capa para que el Canvas se fusione arriba
        className="h-full w-full object-cover"
        src={videoSrc}
        aria-label="analysis video"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onTimeUpdate={() => onTimeUpdate?.(videoRef.current?.currentTime || 0)}
        onDurationChange={() => onDurationChange?.(videoRef.current?.duration || 0)}
      />
      <input ref={inputRef} type="file" accept="video/*" className="sr-only" onChange={handleFileChange} />
      
      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4 z-20">
        <div className="pointer-events-auto inline-flex items-center gap-3 rounded-3xl bg-black/70 px-4 py-3 text-sm text-white shadow-lg backdrop-blur-sm">
          <button type="button" onClick={handleLoadVideo} className="rounded-full bg-white/10 px-3 py-2 hover:bg-white/20">
            Load Video
          </button>
          {videoLoaded && (
            <button type="button" onClick={handlePlayPause} className="rounded-full bg-sky-500 px-3 py-2 font-semibold text-white hover:bg-sky-400">
              {isPlaying ? 'Pause' : 'Play'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default forwardRef(VideoPlayer)