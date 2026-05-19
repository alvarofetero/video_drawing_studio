import { useRef, useEffect, useState } from 'react'

export default function CanvasOverlay({ videoWidth, videoHeight, activeTool, shapes, onShapeCreate }) {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [startCoords, setStartCoords] = useState(null)

  // ... (Todo el inicio del componente CanvasOverlay se mantiene igual)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    canvas.width = videoWidth
    canvas.height = videoHeight
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, videoWidth, videoHeight)

    shapes.forEach(shape => {
      ctx.beginPath()
      
      // Configuraciones de estilo por defecto
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
        // --- LÓGICA DEL CILINDRO ABIERTO ---
        // El radio horizontal será la distancia en X desde donde pulsó hasta donde arrastró
        const radiusX = Math.abs(shape.endX - shape.startX)
        // El radio vertical simula la perspectiva en el césped (un óvalo achatado)
        const radiusY = radiusX * 0.4 
        
        // 1. Dibujamos el óvalo de la base (en los pies del jugador)
        // Usamos ellipse(x, y, radioX, radioY, rotacion, anguloInicio, anguloFinal)
        ctx.ellipse(shape.startX, shape.startY, radiusX, radiusY, 0, 0, 2 * Math.PI)
        ctx.fill()
        ctx.stroke()
        
        // 2. Dibujamos las paredes verticales hacia el TOP de la pantalla (Y = 0)
        ctx.beginPath()
        // Pared izquierda: desde el extremo izquierdo del óvalo hacia el techo
        ctx.moveTo(shape.startX - radiusX, shape.startY)
        ctx.lineTo(shape.startX - radiusX, 0)
        
        // Pared derecha: desde el extremo derecho del óvalo hacia el techo
        ctx.moveTo(shape.startX + radiusX, shape.startY)
        ctx.lineTo(shape.startX + radiusX, 0)
        ctx.stroke()

      } else {
        // Herramientas de líneas (Arrow, etc)
        ctx.moveTo(shape.startX, shape.startY)
        ctx.lineTo(shape.endX, shape.endY)
        ctx.stroke()
      }
    })
  }, [videoWidth, videoHeight, shapes])

// ... (El resto del archivo handleMouseDown, handleMouseUp, etc., se queda exactamente igual)

  const handleMouseDown = (e) => {
    if (activeTool === 'select') return // No dibuja nada en modo selección

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setIsDrawing(true) // Cambiado a true para iniciar el flujo de dibujo correctamente
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

  // Determinamos dinámicamente si el Canvas debe recibir eventos o ignorarlos
  const isSelectMode = activeTool === 'select'

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        cursor: isSelectMode ? 'default' : 'crosshair',
        // CLAVE: Si está en modo select, los clics atraviesan el canvas directo al video
        pointerEvents: isSelectMode ? 'none' : 'auto', 
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    />
  )
}