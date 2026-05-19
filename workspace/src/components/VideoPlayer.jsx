import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

function VideoPlayer(_, ref) {
  const videoRef = useRef(null)
  const inputRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [videoSrc, setVideoSrc] = useState('')

  useImperativeHandle(ref, () => ({
    openFilePicker: () => {
      inputRef.current?.click()
    }
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

    if (isPlaying) {
      videoRef.current.pause()
      setIsPlaying(false)
    } else {
      videoRef.current.play()
      setIsPlaying(true)
    }
  }

  return (
    <div className="absolute inset-0 flex flex-col justify-between">
      <video
        ref={videoRef}
        width="100%"
        height="100%"
        className="h-full w-full object-cover"
        src={videoSrc}
        aria-label="analysis video"
      />
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="sr-only"
        onChange={handleFileChange}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4">
        <div className="pointer-events-auto inline-flex items-center gap-3 rounded-3xl bg-black/70 px-4 py-3 text-sm text-white shadow-lg backdrop-blur-sm">
          <button
            type="button"
            onClick={handleLoadVideo}
            className="rounded-full bg-white/10 px-3 py-2 hover:bg-white/20"
          >
            Load Video
          </button>
          {videoLoaded && (
            <button
              type="button"
              onClick={handlePlayPause}
              className="rounded-full bg-sky-500 px-3 py-2 font-semibold text-white hover:bg-sky-400"
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default forwardRef(VideoPlayer)
