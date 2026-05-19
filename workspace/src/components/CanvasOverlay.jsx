import { useRef, useEffect, useState } from 'react'

export default function CanvasOverlay({ 
  videoWidth, videoHeight, activeTool, shapes, setShapes, currentTime,
  strokeColor, bgColor, opacity 
}) {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [selectedShapeId, setSelectedShapeId] = useState(null)
  const [startCoords, setStartCoords] = useState(null)
  const [currentDrawing, setCurrentDrawing] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // Utilidad para inyectar opacidad configurable a un color hexadecimal (#HEX)
  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

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

      const currentShapes = shapes.filter(s => Math.abs(s.timestamp - currentTime) < 0.15)
      const allShapesToDraw = [...currentShapes]
      
      if (currentDrawing) {
        allShapesToDraw.push(currentDrawing)
      }

      allShapesToDraw.forEach(shape => {
        ctx.beginPath()
        const isSelected = shape.id === selectedShapeId && activeTool === 'select'
        
        // Aplicación de los colores asignados en la paleta
        ctx.strokeStyle = isSelected ? '#38bdf8' : shape.strokeColor
        ctx.lineWidth = isSelected ? 4 : 3
        ctx.fillStyle = isSelected ? 'rgba(56, 189, 248, 0.25)' : hexToRgba(shape.bgColor, shape.opacity)

        if (shape.tool === 'text') {
          // --- NUEVO RENDERIZADO DEL CUADRO DE TEXTO TÁCTICO ---
          const width = shape.endX - shape.startX
          const height = shape.endY - shape.startY
          
          // Fondo del cuadro de texto
          ctx.fillRect(shape.startX, shape.startY, width, height)
          ctx.strokeRect(shape.startX, shape.startY, width, height)

          // Estilo de la tipografía
          ctx.fillStyle = isSelected ? '#38bdf8' : shape.strokeColor
          ctx.font = `bold ${Math.max(12, Math.abs(height) * 0.4)}px sans-serif`
          ctx.textBaseline = 'middle'
          ctx.textAlign = 'center'
          
          // Centramos el texto en medio de la caja elástica
          ctx.fillText(shape.text || '', shape.startX + width / 2, shape.startY + height / 2, Math.abs(width) - 10)
          
          if (isSelected) {
            drawResizeHandles(ctx, shape.endX, shape.endY)
          }

        } else if (shape.tool === 'rectangle') {
          ctx.moveTo(shape.x1, shape.y1)
          ctx.lineTo(shape.x2, shape.y2)
          ctx.lineTo(shape.x3, shape.y3)
          ctx.lineTo(shape.x4, shape.y4)
          ctx.closePath()
          ctx.fill()
          ctx.stroke()

          if (isSelected) {
            drawResizeHandles(ctx, shape.x1, shape.y1)
            drawResizeHandles(ctx, shape.x2, shape.y2)
            drawResizeHandles(ctx, shape.x3, shape.y3)
            drawResizeHandles(ctx, shape.x4, shape.y4)
          }

        } else if (shape.tool === 'circle') {
          const radiusX = Math.abs(shape.endX - shape.startX) || 1
          const radiusY = shape.radiusY || radiusX * 0.4
          ctx.ellipse(shape.startX, shape.startY, radiusX, radiusY, 0, 0, 2 * Math.PI)
          ctx.fill()
          ctx.stroke()
          
          if (isSelected) {
            drawResizeHandles(ctx, shape.startX + radiusX, shape.startY)
            drawResizeHandles(ctx, shape.startX, shape.startY + radiusY)
          }

        } else if (shape.tool === 'cylinder') {
          const radiusX = Math.abs(shape.endX - shape.startX) || 1
          const radiusY = shape.radiusY || radiusX * 0.4
          
          const gradient = ctx.createLinearGradient(shape.startX, 0, shape.startX, shape.startY)
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0.01)')
          gradient.addColorStop(1, isSelected ? 'rgba(56, 189, 248, 0.45)' : hexToRgba(shape.bgColor, shape.opacity))
          ctx.fillStyle = gradient

          ctx.moveTo(shape.startX - radiusX, 0)
          ctx.lineTo(shape.startX + radiusX, 0)
          ctx.lineTo(shape.startX + radiusX, shape.startY)
          ctx.ellipse(shape.startX, shape.startY, radiusX, radiusY, 0, 0, Math.PI, false)
          ctx.lineTo(shape.startX - radiusX, 0)
          ctx.fill()

          ctx.beginPath()
          ctx.strokeStyle = isSelected ? '#38bdf8' : shape.strokeColor
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
    ctx.fillRect(x - 6, y - 6, 12, 12)
    ctx.strokeRect(x - 6, y - 6, 12, 12)
    ctx.restore()
  }

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * videoWidth,
      y: ((e.clientY - rect.top) / rect.height) * videoHeight
    }
  }

  const findShapeAtCoords = (x, y) => {
    const activeShapes = shapes.filter(s => Math.abs(s.timestamp - currentTime) < 0.15)
    
    for (let i = activeShapes.length - 1; i >= 0; i--) {
      const shape = activeShapes[i]

      if (shape.tool === 'rectangle') {
        if (Math.sqrt(Math.pow(x - shape.x1, 2) + Math.pow(y - shape.y1, 2)) < 12) return { shape, type: 'r-p1' }
        if (Math.sqrt(Math.pow(x - shape.x2, 2) + Math.pow(y - shape.y2, 2)) < 12) return { shape, type: 'r-p2' }
        if (Math.sqrt(Math.pow(x - shape.x3, 2) + Math.pow(y - shape.y3, 2)) < 12) return { shape, type: 'r-p3' }
        if (Math.sqrt(Math.pow(x - shape.x4, 2) + Math.pow(y - shape.y4, 2)) < 12) return { shape, type: 'r-p4' }

        const centerX = (shape.x1 + shape.x2 + shape.x3 + shape.x4) / 4
        const centerY = (shape.y1 + shape.y2 + shape.y3 + shape.y4) / 4
        if (Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)) < 40) return { shape, type: 'move' }
      } 
      else if (shape.tool === 'text') {
        // Detección de arrastre en la esquina inferior derecha para la caja de texto
        if (Math.sqrt(Math.pow(x - shape.endX, 2) + Math.pow(y - shape.endY, 2)) < 12) return { shape, type: 'resize-text' }
        
        // Evaluar clic dentro del cuerpo de la caja de texto
        if (x >= Math.min(shape.startX, shape.endX) && x <= Math.max(shape.startX, shape.endX) &&
            y >= Math.min(shape.startY, shape.endY) && y <= Math.max(shape.startY, shape.endY)) {
          return { shape, type: 'move' }
        }
      }
      else {
        const radiusX = Math.abs(shape.endX - shape.startX)
        const radiusY = shape.radiusY || radiusX * 0.4
        if (Math.sqrt(Math.pow(x - shape.startX, 2) + Math.pow(y - (shape.startY + radiusY), 2)) < 12) return { shape, type: 'resize-y' }
        if (Math.sqrt(Math.pow(x - (shape.startX + radiusX), 2) + Math.pow(y - shape.startY, 2)) < 12) return { shape, type: 'resize-x' }
        const dx = (x - shape.startX) / radiusX
        const dy = (y - shape.startY) / radiusY
        if ((dx * dx + dy * dy) <= 1.2) return { shape, type: 'move' }
      }
    }
    return null
  }

  useEffect(() => {
    if (!isDrawing && !isMoving && !isResizing) return

    const handleGlobalMouseMove = (e) => {
      const { x, y } = getCanvasCoords(e)

      if (isDrawing && startCoords) {
        if (activeTool === 'rectangle') {
          setCurrentDrawing({
            tool: 'rectangle', x1: startCoords.x, y1: startCoords.y, x2: x, y2: startCoords.y, x3: x, y3: y, x4: startCoords.x, y4: y,
            timestamp: currentTime, strokeColor, bgColor, opacity
          })
        } else {
          const radiusX = Math.abs(x - startCoords.x)
          setCurrentDrawing({
            tool: activeTool, startX: startCoords.x, startY: startCoords.y, endX: x, endY: y, radiusY: radiusX * 0.4,
            timestamp: currentTime, strokeColor, bgColor, opacity
          })
        }
      } 
      else if (isMoving && selectedShapeId) {
        setShapes(prev => prev.map(s => {
          if (s.id !== selectedShapeId) return s
          if (s.tool === 'rectangle') {
            const dx = x - dragOffset.x - s.x1, dy = y - dragOffset.y - s.y1
            return { ...s, x1: s.x1 + dx, y1: s.y1 + dy, x2: s.x2 + dx, y2: s.y2 + dy, x3: s.x3 + dx, y3: s.y3 + dy, x4: s.x4 + dx, y4: s.y4 + dy }
          } else {
            const width = s.endX - s.startX, height = s.endY - s.startY
            const nX = x - dragOffset.x, nY = y - dragOffset.y
            return { ...s, startX: nX, startY: nY, endX: nX + width, endY: nY + height }
          }
        }))
      } 
      else if (isResizing && selectedShapeId) {
        setShapes(prev => prev.map(s => {
          if (s.id !== selectedShapeId) return s
          if (isResizing === 'r-p1') return { ...s, x1: x, y1: y }
          if (isResizing === 'r-p2') return { ...s, x2: x, y2: y }
          if (isResizing === 'r-p3') return { ...s, x3: x, y3: y }
          if (isResizing === 'r-p4') return { ...s, x4: x, y4: y }
          if (isResizing === 'resize-x' || isResizing === 'resize-text') return { ...s, endX: x, endY: (isResizing === 'resize-text' ? y : s.endY) }
          if (isResizing === 'resize-y') return { ...s, radiusY: Math.abs(y - s.startY) }
          return s
        }))
      }
    }

    const handleGlobalMouseUp = () => {
      if (isDrawing && currentDrawing) {
        if (currentDrawing.tool === 'text') {
          // Si es un cuadro de texto, abrimos el prompt para definir la anotación táctica
          const textInput = prompt('Escribe el texto de análisis táctico:')
          if (textInput) {
            setShapes(prev => [...prev, { ...currentDrawing, text: textInput, id: `text-${Date.now()}` }])
          }
        } else {
          setShapes(prev => [...prev, { ...currentDrawing, id: `shape-${Date.now()}` }])
        }
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
  }, [isDrawing, isMoving, isResizing, startCoords, activeTool, selectedShapeId, dragOffset, currentDrawing, currentTime, strokeColor, bgColor, opacity, setShapes])

  const handleMouseDown = (e) => {
    const { x, y } = getCanvasCoords(e)

    if (activeTool !== 'select') {
      const videoElement = document.querySelector('video')
      if (videoElement && !videoElement.paused) videoElement.pause()
      setIsDrawing(true)
      setStartCoords({ x, y })
      setSelectedShapeId(null)
      return
    }

    const hit = findShapeAtCoords(x, y)
    if (hit) {
      setSelectedShapeId(hit.shape.id)
      if (hit.type === 'move') {
        setIsMoving(true)
        setDragOffset({
          x: x - (hit.shape.tool === 'rectangle' ? hit.shape.x1 : hit.shape.startX),
          y: y - (hit.shape.tool === 'rectangle' ? hit.shape.y1 : hit.shape.startY)
        })
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
      className="absolute top-0 left-0 w-full h-full object-contain"
      style={{ cursor: activeTool === 'select' ? 'default' : 'crosshair' }}
      onMouseDown={handleMouseDown}
    />
  )
}