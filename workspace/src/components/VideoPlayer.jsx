import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

function VideoPlayer({ onTimeUpdate, onDurationChange, onPlayStateChange }, ref) {
  const videoRef = useRef(null)
  const inputRef = useRef(null)
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
    }
  }))

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setVideoSrc(typeof URL?.createObjectURL === 'function' ? URL.createObjectURL(file) : '')
    setVideoLoaded(true)
    if (onPlayStateChange) onPlayStateChange(false)
  }

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none">
      <video
        ref={videoRef}
        width="100%"
        height="100%"
        className="h-full w-full object-cover opacity-0"
        src={videoSrc}
        onPlay={() => onPlayStateChange?.(true)}
        onPause={() => onPlayStateChange?.(false)}
        onEnded={() => onPlayStateChange?.(false)}
        onTimeUpdate={() => onTimeUpdate?.(videoRef.current?.currentTime || 0)}
        onDurationChange={() => onDurationChange?.(videoRef.current?.duration || 0)}
      />
      <input ref={inputRef} type="file" accept="video/*" className="sr-only" onChange={handleFileChange} />
      
      {!videoLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 text-slate-400 text-sm font-medium">
          No video loaded. Click "Load Match Video" above.
        </div>
      )}
    </div>
  )
}

export default forwardRef(VideoPlayer)