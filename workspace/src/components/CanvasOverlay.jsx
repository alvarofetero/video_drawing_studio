import { useRef, useEffect, useState } from 'react'

export default function CanvasOverlay({ videoWidth, videoHeight, onShapeCreate }) {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [startCoords, setStartCoords] = useState(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      canvas.width = videoWidth
      canvas.height = videoHeight
    }
  }, [videoWidth, videoHeight])

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setIsDrawing(true)
    setStartCoords({ x, y })
  }

  const handleMouseUp = (e) => {
    if (!isDrawing || !startCoords) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const endX = e.clientX - rect.left
    const endY = e.clientY - rect.top

    const shapeData = {
      startX: startCoords.x,
      startY: startCoords.y,
      endX,
      endY,
      width: Math.abs(endX - startCoords.x),
      height: Math.abs(endY - startCoords.y)
    }

    if (onShapeCreate) {
      onShapeCreate(shapeData)
    }

    setIsDrawing(false)
    setStartCoords(null)
  }

  return (
    <canvas
      ref={canvasRef}
      width={videoWidth}
      height={videoHeight}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        cursor: 'crosshair'
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    />
  )
}
