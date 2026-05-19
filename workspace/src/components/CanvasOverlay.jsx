import { useRef, useEffect, useState } from 'react'

export default function CanvasOverlay({ videoWidth, videoHeight, activeTool, shapes, setShapes, currentTime, videoPaused }) {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [selectedShapeId, setSelectedShapeId] = useState(null)
  const [startCoords, setStartCoords] = useState(null)
  const [currentDrawing, setCurrentDrawing] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // Renderizado continuo del Canvas (Fondo de video + Figuras de este segundo específico)
  useEffect(() => {
    let animationFrameId
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = videoWidth
    canvas.height = videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const videoElement = document.querySelector('video')

    const drawLoop = () => {
      ctx.clearRect(0, 0, videoWidth, videoHeight)

      if (videoElement && videoElement.readyState >= 2) {
        ctx.drawImage(videoElement, 0, 0, videoWidth, videoHeight)
      }

      // Solo filtramos y mostramos las figuras que pertenecen al segundo actual del video
      // Tolerancia de 0.1s para asegurar el renderizado estable en el cuadro congelado
      const currentShapes = shapes.filter(s => Math.abs(s.timestamp - currentTime) < 0.15)
      const allShapesToDraw = [...currentShapes]
      
      if (currentDrawing) {
        allShapesToDraw.push(currentDrawing)
      }

      allShapesToDraw.forEach(shape => {
        ctx.beginPath()
        const isSelected = shape.id === selectedShapeId && activeTool === 'select'
        
        // Estilos visuales
        ctx.strokeStyle = isSelected ? '#38bdf8' : '#f43f5e' // Azul si está seleccionado, rosa si no
        ctx.lineWidth = isSelected ? 4 : 3
        ctx.fillStyle = isSelected ? 'rgba(56, 189, 248, 0.25)' : 'rgba(244, 63, 94, 0.2)'

        if (shape.tool === 'rectangle') {
          ctx.rect(shape.startX, shape.startY, shape.endX - shape.startX, shape.endY - shape.startY)
          ctx.fill()
          ctx.stroke()
          if (isSelected) drawResizeHandles(ctx, shape.endX, shape.endY)

        } else if (shape.tool === 'circle') {
          // Óvalo ajustable con perspectiva propia
          const radiusX = Math.abs(shape.endX - shape.startX) || 1
          const radiusY = shape.radiusY || radiusX * 0.4 // Mantiene la perspectiva guardada
          
          ctx.ellipse(shape.startX, shape.startY, radiusX, radiusY, 0, 0, 2 * Math.PI)
          ctx.fill()
          ctx.stroke()
          if (isSelected) {
            // Puntos de control para estirar el ancho (X) y la perspectiva (Y)
            drawResizeHandles(ctx, shape.startX + radiusX, shape.startY) // Control de ancho
            drawResizeHandles(ctx, shape.startX, shape.startY + radiusY) // Control de perspectiva/achatamiento
          }

        } else if (shape.tool === 'cylinder') {
          const radiusX = Math.abs(shape.endX - shape.startX) || 1
          const radiusY = shape.radiusY || radiusX * 0.4
          
          const gradient = ctx.createLinearGradient(shape.startX, 0, shape.startX, shape.startY)
          gradient.addColorStop(0, 'rgba(244, 63, 94, 0.02)')
          gradient.addColorStop(1, isSelected ? 'rgba(56, 189, 248, 0.45)' : 'rgba(244, 63, 94, 0.40)')
          ctx.fillStyle = gradient

          ctx.moveTo(shape.startX - radiusX, 0)
          ctx.lineTo(shape.startX + radiusX, 0)
          ctx.lineTo(shape.startX + radiusX, shape.startY)
          ctx.ellipse(shape.startX, shape.startY, radiusX, radiusY, 0, 0, Math.PI, false)
          ctx.lineTo(shape.startX - radiusX, 0)
          ctx.fill()

          ctx.beginPath()
          ctx.strokeStyle = isSelected ? '#38bdf8' : 'rgba(244, 63, 94, 0.85)'
          ctx.lineWidth = isSelected ? 3.5 : 2.5
          ctx.ellipse(shape.startX, shape.startY, radiusX, radiusY, 0, 0, 2 * Math.PI)
          ctx.stroke()
          
          if (isSelected) {
            drawResizeHandles(ctx, shape.startX + radiusX, shape.startY)
            drawResizeHandles(ctx, shape.startX, shape.startY + radiusY)
          }
        }
      })

      animationFrameId = requestAnimationFrame(drawLoop)
    }

    drawLoop()
    return () => cancelAnimationFrame(animationFrameId)
  }, [videoWidth, videoHeight, shapes, currentDrawing, currentTime, selectedShapeId, activeTool])

  const drawResizeHandles = (ctx, x, y) => {
    ctx.save()
    ctx.fillStyle = '#ffffff'
    ctx.strokeStyle = '#0284c7'
    ctx.lineWidth = 2
    ctx.fillRect(x - 5, y - 5, 10, 10)
    ctx.strokeRect(x - 5, y - 5, 10, 10)
    ctx.restore()
  }

  // Comprobar si se hizo clic cerca de una figura para seleccionarla o moverla
  const findShapeAtCoords = (x, y) => {
    const activeShapes = shapes.filter(s => Math.abs(s.timestamp - currentTime) < 0.15)
    // Buscamos de atrás hacia adelante (últimas creadas primero)
    for (let i = activeShapes.length - 1; i >= 0; i--) {
      const shape = activeShapes[i]
      const radiusX = Math.abs(shape.endX - shape.startX)
      const radiusY = shape.radiusY || radiusX * 0.4

      // Verificación si es click en el nodo de redimensión de perspectiva (abajo del óvalo)
      const distToPerspHandle = Math.sqrt(Math.pow(x - shape.startX, 2) + Math.pow(y - (shape.startY + radiusY), 2))
      if (distToPerspHandle < 10) return { shape, type: 'resize-y' }

      // Verificación si es click en el nodo de tamaño horizontal (derecha del óvalo)
      const distToWidthHandle = Math.sqrt(Math.pow(x - (shape.startX + radiusX), 2) + Math.pow(y - shape.startY, 2))
      if (distToWidthHandle < 10) return { shape, type: 'resize-x' }

      // Verificación si es click dentro o muy cerca de la base de la figura para desplazarla
      const dx = (x - shape.startX) / radiusX
      const dy = (y - shape.startY) / radiusY
      if ((dx * dx + dy * dy) <= 1.2) {
        return { shape, type: 'move' }
      }
    }
    return null
  }

  // Gestión de Eventos del Mouse globales de Window
  useEffect(() => {
    if (!isDrawing && !isMoving && !isResizing) return

    const handleGlobalMouseMove = (e) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      if (isDrawing && startCoords) {
        const radiusX = Math.abs(x - startCoords.x)
        setCurrentDrawing({
          tool: activeTool,
          startX: startCoords.x,
          startY: startCoords.y,
          endX: x,
          endY: y,
          radiusY: radiusX * 0.4, // Perspectiva por defecto del 40%
          timestamp: currentTime
        })
      } 
      else if (isMoving && selectedShapeId) {
        setShapes(prev => prev.map(s => {
          if (s.id !== selectedShapeId) return s
          const width = s.endX - s.startX
          const height = s.endY - s.startY
          const newStartX = x - dragOffset.x
          const newStartY = y - dragOffset.y
          return {
            ...s,
            startX: newStartX,
            startY: newStartY,
            endX: newStartX + width,
            endY: newStartY + height
          }
        }))
      } 
      else if (isResizing && selectedShapeId) {
        setShapes(prev => prev.map(s => {
          if (s.id !== selectedShapeId) return s
          if (isResizing === 'resize-x') {
            return { ...s, endX: x }
          } else if (isResizing === 'resize-y') {
            const currentRadiusX = Math.abs(s.endX - s.startX)
            const newRadiusY = Math.abs(y - s.startY)
            return { ...s, radiusY: newRadiusY }
          }
          return s
        }))
      }
    }

    const handleGlobalMouseUp = () => {
      if (isDrawing && currentDrawing) {
        setShapes(prev => [...prev, { ...currentDrawing, id: `shape-${Date.now()}` }])
      }
      setIsDrawing(false)
      setIsMoving(false)
      setIsResizing(false)
      setCurrentDrawing(null)
    }

    window.addEventListener('mousemove', handleGlobalMouseMove)
    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove)
      window.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [isDrawing, isMoving, isResizing, startCoords, activeTool, selectedShapeId, dragOffset, currentDrawing, currentTime, setShapes])

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Forzar pausa en el video nativo si se intenta dibujar algo nuevo
    if (activeTool !== 'select') {
      const videoElement = document.querySelector('video')
      if (videoElement && !videoElement.paused) {
        videoElement.pause()
      }
      setIsDrawing(true)
      setStartCoords({ x, y })
      setSelectedShapeId(null)
      return
    }

    // Modo Selección / Edición / Desplazamiento
    const hit = findShapeAtCoords(x, y)
    if (hit) {
      setSelectedShapeId(hit.shape.id)
      if (hit.type === 'move') {
        setIsMoving(true)
        setDragOffset({ x: x - hit.shape.startX, y: y - hit.shape.startY })
      } else {
        setIsResizing(hit.type)
      }
    } else {
      setSelectedShapeId(null)
    }
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full shadow-inner"
      style={{
        cursor: activeTool === 'select' ? 'default' : 'crosshair',
        pointerEvents: 'auto', // Siempre activo para poder interactuar en modo select o pausar
      }}
      onMouseDown={handleMouseDown}
    />
  )
}