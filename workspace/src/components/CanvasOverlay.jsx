import { useRef, useEffect, useState } from 'react'

export default function CanvasOverlay({ videoWidth, videoHeight, activeTool, shapes, setShapes }) {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [startCoords, setStartCoords] = useState(null)
  const [currentDrawing, setCurrentDrawing] = useState(null) // Para ver el dibujo en tiempo real mientras arrastras

  // 1. Temporizador para desvanecer figuras automáticamente después de 3 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      const ahora = Date.now()
      setShapes((current) => current.filter(shape => ahora - shape.createdAt < 3000))
    }, 100)
    return () => clearInterval(interval)
  }, [setShapes])

  // 2. Bucle unificado de renderizado (Video + Figuras en una sola pasada)
  useEffect(() => {
    let animationFrameId
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = videoWidth
    canvas.height = videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Intentamos buscar el elemento de video del DOM
    const videoElement = document.querySelector('video')

    const drawLoop = () => {
      // Limpiar lienzo
      ctx.clearRect(0, 0, videoWidth, videoHeight)

      // PASO A: Dibujar el fotograma del video de fondo si está listo
      if (videoElement && videoElement.readyState >= 2) {
        ctx.drawImage(videoElement, 0, 0, videoWidth, videoHeight)
      }

      // Reunimos las figuras guardadas y la figura que se está dibujando actualmente en vivo
      const allShapesToDraw = [...shapes]
      if (currentDrawing) {
        allShapesToDraw.push(currentDrawing)
      }

      // PASO B: Dibujar las figuras encima (Evita que el video las tape)
      allShapesToDraw.forEach(shape => {
        ctx.beginPath()
        ctx.strokeStyle = '#f43f5e' 
        ctx.lineWidth = 3
        ctx.fillStyle = 'rgba(244, 63, 94, 0.2)'

        if (shape.tool === 'rectangle') {
          ctx.rect(shape.startX, shape.startY, shape.endX - shape.startX, shape.endY - shape.startY)
          ctx.fill()
          ctx.stroke()

        } else if (shape.tool === 'circle') {
          const radius = Math.sqrt(Math.pow(shape.endX - shape.startX, 2) + Math.pow(shape.endY - shape.startY, 2))
          ctx.arc(shape.startX, shape.startY, radius, 0, 2 * Math.PI)
          ctx.fill()
          ctx.stroke()

        } else if (shape.tool === 'cylinder') {
          const radiusX = Math.abs(shape.endX - shape.startX) || 1
          const radiusY = radiusX * 0.4 
          
          // Gradiente del haz de luz
          const gradient = ctx.createLinearGradient(shape.startX, 0, shape.startX, shape.startY)
          gradient.addColorStop(0, 'rgba(244, 63, 94, 0.02)')
          gradient.addColorStop(1, 'rgba(244, 63, 94, 0.40)')
          ctx.fillStyle = gradient

          // Cuerpo traslúcido completo hacia el techo (Y = 0)
          ctx.moveTo(shape.startX - radiusX, 0)
          ctx.lineTo(shape.startX + radiusX, 0)
          ctx.lineTo(shape.startX + radiusX, shape.startY)
          ctx.ellipse(shape.startX, shape.startY, radiusX, radiusY, 0, 0, Math.PI, false)
          ctx.lineTo(shape.startX - radiusX, 0)
          ctx.fill()

          // Definición del óvalo táctico inferior en el césped (pies)
          ctx.beginPath()
          ctx.strokeStyle = 'rgba(244, 63, 94, 0.85)'
          ctx.lineWidth = 2.5
          ctx.ellipse(shape.startX, shape.startY, radiusX, radiusY, 0, 0, 2 * Math.PI)
          ctx.stroke()
        }
      })

      animationFrameId = requestAnimationFrame(drawLoop)
    }

    // Iniciamos el bucle constante
    drawLoop()

    return () => cancelAnimationFrame(animationFrameId)
  }, [videoWidth, videoHeight, shapes, currentDrawing])


  // 3. Manejadores de interacción del ratón
  const handleMouseDown = (e) => {
    if (activeTool === 'select') return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setIsDrawing(true)
    setStartCoords({ x, y })
  }

  const handleMouseMove = (e) => {
    if (!isDrawing || !startCoords) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Actualizamos la figura temporal para que el usuario vea qué está dibujando en tiempo real
    setCurrentDrawing({
      tool: activeTool,
      startX: startCoords.x,
      startY: startCoords.y,
      endX: x,
      endY: y
    })
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
      createdAt: Date.now()
    }

    if (onShapeCreate) {
      onShapeCreate(shapeData)
    }

    // Resetear estados de dibujo
    setIsDrawing(false)
    setStartCoords(null)
    setCurrentDrawing(null)
  }

  const isSelectMode = activeTool === 'select'

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full"
      style={{
        cursor: isSelectMode ? 'default' : 'crosshair',
        pointerEvents: isSelectMode ? 'none' : 'auto', 
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove} // Agregado para soportar preview interactivo
      onMouseUp={handleMouseUp}
    />
  )
}