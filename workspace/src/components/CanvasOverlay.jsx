import { useRef, useEffect, useState } from 'react'
import { applyLineStyle, getPatternStyle } from '../utils/canvasUtils'
import * as renderer from '../utils/canvasRenderers'

export default function CanvasOverlay({ 
  videoWidth, videoHeight, activeTool, shapes, setShapes, currentTime,
  strokeColor, bgColor, opacity, lineStyle, fillPattern 
}) {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [selectedShapeId, setSelectedShapeId] = useState(null)
  const [startCoords, setStartCoords] = useState(null)
  const [currentDrawing, setCurrentDrawing] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // Ciclo unificado de renderizado de Canvas
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
      if (currentDrawing) allShapesToDraw.push(currentDrawing)

      allShapesToDraw.forEach(shape => {
        ctx.beginPath()
        const isSelected = shape.id === selectedShapeId && activeTool === 'select'
        
        ctx.strokeStyle = isSelected ? '#38bdf8' : shape.strokeColor
        ctx.lineWidth = isSelected ? 4 : 3
        ctx.fillStyle = isSelected ? 'rgba(56, 189, 248, 0.25)' : getPatternStyle(ctx, shape.fillPattern, shape.bgColor, shape.opacity)
        
        applyLineStyle(ctx, shape.lineStyle)

        if (shape.tool === 'line' || shape.tool === 'arrow') {
          renderer.drawLineOrArrow(ctx, shape, isSelected)
        } else if (shape.tool === 'text') {
          renderer.drawTextBox(ctx, shape, isSelected)
        } else if (shape.tool === 'rectangle') {
          // RENDERIZADO EN PERSPECTIVA REAL
          ctx.moveTo(shape.x1, shape.y1)
          ctx.lineTo(shape.x2, shape.y2)
          ctx.lineTo(shape.x3, shape.y3)
          ctx.lineTo(shape.x4, shape.y4)
          ctx.closePath()
          ctx.fill()
          ctx.stroke()

          if (isSelected) {
            renderer.drawResizeHandles(ctx, shape.x1, shape.y1) // Top-Left (r-p1)
            renderer.drawResizeHandles(ctx, shape.x2, shape.y2) // Top-Right (r-p2)
            renderer.drawResizeHandles(ctx, shape.x3, shape.y3) // Bottom-Right (r-p3)
            renderer.drawResizeHandles(ctx, shape.x4, shape.y4) // Bottom-Left (r-p4)
          }
        } else if (shape.tool === 'circle') {
          renderer.drawOval(ctx, shape, isSelected)
        } else if (shape.tool === 'cylinder') {
          renderer.drawCylinder(ctx, shape, isSelected, shape.bgColor, shape.opacity)
        }
      })

      ctx.setLineDash([])
      animationFrameId = requestAnimationFrame(drawLoop)
    }

    drawLoop()
    return () => cancelAnimationFrame(animationFrameId)
  }, [videoWidth, videoHeight, shapes, currentDrawing, currentTime, selectedShapeId, activeTool])

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * videoWidth,
      y: ((e.clientY - rect.top) / rect.height) * videoHeight
    }
  }

  // DETECTOR DE COLISIONES
  const findShapeAtCoords = (x, y) => {
    const activeShapes = shapes.filter(s => Math.abs(s.timestamp - currentTime) < 0.15)
    
    for (let i = activeShapes.length - 1; i >= 0; i--) {
      const shape = activeShapes[i]
      const isSelected = shape.id === selectedShapeId

      // 1. RECTÁNGULOS PERSPECTIVOS (Tolerancia de 14px clásica y exacta)
      if (shape.tool === 'rectangle') {
        if (isSelected && Math.sqrt(Math.pow(x - shape.x1, 2) + Math.pow(y - shape.y1, 2)) < 14) return { shape, type: 'r-p1' }
        if (isSelected && Math.sqrt(Math.pow(x - shape.x2, 2) + Math.pow(y - shape.y2, 2)) < 14) return { shape, type: 'r-p2' }
        if (isSelected && Math.sqrt(Math.pow(x - shape.x3, 2) + Math.pow(y - shape.y3, 2)) < 14) return { shape, type: 'r-p3' }
        if (isSelected && Math.sqrt(Math.pow(x - shape.x4, 2) + Math.pow(y - shape.y4, 2)) < 14) return { shape, type: 'r-p4' }
        
        // Centro dinámico para arrastre completo
        const centerX = (shape.x1 + shape.x2 + shape.x3 + shape.x4) / 4
        const centerY = (shape.y1 + shape.y2 + shape.y3 + shape.y4) / 4
        if (Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)) < 40) return { shape, type: 'move' }
      } 
      
      // 2. LÍNEAS Y FLECHAS
      else if (shape.tool === 'line' || shape.tool === 'arrow') {
        const cpX = shape.cpX !== undefined ? shape.cpX : (shape.startX + shape.endX) / 2
        const cpY = shape.cpY !== undefined ? shape.cpY : (shape.startY + shape.endY) / 2

        if (isSelected && Math.sqrt(Math.pow(x - shape.startX, 2) + Math.pow(y - shape.startY, 2)) < 14) return { shape, type: 'p-start' }
        if (isSelected && Math.sqrt(Math.pow(x - shape.endX, 2) + Math.pow(y - shape.endY, 2)) < 14) return { shape, type: 'p-end' }
        if (isSelected && Math.sqrt(Math.pow(x - cpX, 2) + Math.pow(y - cpY, 2)) < 14) return { shape, type: 'p-curve' }
        if (Math.sqrt(Math.pow(x - cpX, 2) + Math.pow(y - cpY, 2)) < 35) return { shape, type: 'move' }
      } 
      
      // 3. TEXTO
      else if (shape.tool === 'text') {
        if (isSelected && Math.sqrt(Math.pow(x - shape.endX, 2) + Math.pow(y - shape.endY, 2)) < 14) return { shape, type: 'resize-text' }
        if (x >= Math.min(shape.startX, shape.endX) && x <= Math.max(shape.startX, shape.endX) && 
            y >= Math.min(shape.startY, shape.endY) && y <= Math.max(shape.startY, shape.endY)) return { shape, type: 'move' }
      } 
      
      // 4. CÍRCULOS Y CILINDROS
      else {
        const radiusX = Math.abs(shape.endX - shape.startX)
        const radiusY = shape.radiusY || radiusX * 0.4
        if (isSelected && Math.sqrt(Math.pow(x - (shape.startX + radiusX), 2) + Math.pow(y - shape.startY, 2)) < 14) return { shape, type: 'resize-x' }
        if (isSelected && Math.sqrt(Math.pow(x - shape.startX, 2) + Math.pow(y - (shape.startY + radiusY), 2)) < 14) return { shape, type: 'resize-y' }
        const dx = (x - shape.startX) / radiusX
        const dy = (y - shape.startY) / radiusY
        if ((dx * dx + dy * dy) <= 1.2) return { shape, type: 'move' }
      }
    }
    return null
  }

  // MANEJADOR PASIVO PARA CURSORES
  const handlePassiveMouseMove = (e) => {
    if (activeTool !== 'select' || isDrawing || isMoving || isResizing) return
    const { x, y } = getCanvasCoords(e)
    const hit = findShapeAtCoords(x, y)
    const canvas = canvasRef.current
    if (!canvas) return

    if (hit) {
      if (hit.type === 'r-p1' || hit.type === 'r-p3') canvas.style.cursor = 'nwse-resize'
      else if (hit.type === 'r-p2' || hit.type === 'r-p4') canvas.style.cursor = 'nesw-resize'
      else if (['p-start', 'p-end', 'p-curve', 'resize-text'].includes(hit.type)) canvas.style.cursor = 'pointer'
      else if (hit.type === 'resize-x') canvas.style.cursor = 'ew-resize'
      else if (hit.type === 'resize-y') canvas.style.cursor = 'ns-resize'
      else if (hit.type === 'move') canvas.style.cursor = 'move'
    } else {
      canvas.style.cursor = 'default'
    }
  }

  // Escuchadores globales de arrastre en la ventana
  useEffect(() => {
    if (!isDrawing && !isMoving && !isResizing) return

    const handleGlobalMouseMove = (e) => {
      const { x, y } = getCanvasCoords(e)

      if (isDrawing && startCoords) {
        if (activeTool === 'rectangle') {
          setCurrentDrawing({
            tool: 'rectangle',
            x1: startCoords.x, y1: startCoords.y,
            x2: x, y2: startCoords.y,
            x3: x, y3: y,
            x4: startCoords.x, y4: y,
            timestamp: currentTime, strokeColor, bgColor, opacity, lineStyle, fillPattern
          })
        } else {
          setCurrentDrawing({
            tool: activeTool, startX: startCoords.x, startY: startCoords.y, endX: x, endY: y,
            timestamp: currentTime, strokeColor, bgColor, opacity, lineStyle, fillPattern,
            ...(activeTool === 'line' || activeTool === 'arrow' ? { cpX: (startCoords.x + x) / 2, cpY: (startCoords.y + y) / 2 } : {}),
            ...(activeTool === 'circle' || activeTool === 'cylinder' ? { radiusY: Math.abs(x - startCoords.x) * 0.4 } : {})
          })
        }
      } 
      else if (isMoving && selectedShapeId) {
        setShapes(prev => prev.map(s => {
          if (s.id !== selectedShapeId) return s

          if (s.tool === 'rectangle') {
            const dx = x - dragOffset.x - s.x1
            const dy = y - dragOffset.y - s.y1
            return {
              ...s,
              x1: s.x1 + dx, y1: s.y1 + dy,
              x2: s.x2 + dx, y2: s.y2 + dy,
              x3: s.x3 + dx, y3: s.y3 + dy,
              x4: s.x4 + dx, y4: s.y4 + dy
            }
          }
          if (s.tool === 'line' || s.tool === 'arrow') {
            const dx = x - dragOffset.x - s.startX, dy = y - dragOffset.y - s.startY
            return {
              ...s, startX: s.startX + dx, startY: s.startY + dy, endX: s.endX + dx, endY: s.endY + dy,
              cpX: (s.cpX !== undefined ? s.cpX : (s.startX + s.endX)/2) + dx,
              cpY: (s.cpY !== undefined ? s.cpY : (s.startY + s.endY)/2) + dy
            }
          }
          const width = s.endX - s.startX, height = s.endY - s.startY
          const nX = x - dragOffset.x, nY = y - dragOffset.y
          return { ...s, startX: nX, startY: nY, endX: nX + width, endY: nY + height }
        }))
      } 
      else if (isResizing && selectedShapeId) {
        setShapes(prev => prev.map(s => {
          if (s.id !== selectedShapeId) return s
          
          if (isResizing === 'r-p1') return { ...s, x1: x, y1: y }
          if (isResizing === 'r-p2') return { ...s, x2: x, y2: y }
          if (isResizing === 'r-p3') return { ...s, x3: x, y3: y }
          if (isResizing === 'r-p4') return { ...s, x4: x, y4: y }
          
          if (isResizing === 'p-start') return { ...s, startX: x, startY: y }
          if (isResizing === 'p-end') return { ...s, endX: x, endY: y }
          if (isResizing === 'p-curve') return { ...s, cpX: x, cpY: y }
          if (isResizing === 'resize-x' || isResizing === 'resize-text') return { ...s, endX: x, endY: (isResizing === 'resize-text' ? y : s.endY) }
          if (isResizing === 'resize-y') return { ...s, radiusY: Math.abs(y - s.startY) }
          return s
        }))
      }
    }

    const handleGlobalMouseUp = () => {
      if (isDrawing && currentDrawing) {
        if (currentDrawing.tool === 'text') {
          const textInput = prompt('Escribe el texto de análisis táctico:')
          if (textInput) setShapes(prev => [...prev, { ...currentDrawing, text: textInput, id: `text-${Date.now()}` }])
        } else {
          // NORMALIZACIÓN DE ESQUINAS: Asegura la coherencia espacial izquierda/derecha
          let shapeToSave = { ...currentDrawing };
          if (shapeToSave.tool === 'rectangle') {
            const minX = Math.min(shapeToSave.x1, shapeToSave.x3);
            const maxX = Math.max(shapeToSave.x1, shapeToSave.x3);
            const minY = Math.min(shapeToSave.y1, shapeToSave.y3);
            const maxY = Math.max(shapeToSave.y1, shapeToSave.y3);

            shapeToSave.x1 = minX; shapeToSave.y1 = minY; // Top-Left real
            shapeToSave.x2 = maxX; shapeToSave.y2 = minY; // Top-Right real
            shapeToSave.x3 = maxX; shapeToSave.y3 = maxY; // Bottom-Right real
            shapeToSave.x4 = minX; shapeToSave.y4 = maxY; // Bottom-Left real
          }
          setShapes(prev => [...prev, { ...shapeToSave, id: `shape-${Date.now()}` }])
        }
      }
      setIsDrawing(false); setIsMoving(false); setIsResizing(false); setCurrentDrawing(null)
    }

    window.addEventListener('mousemove', handleGlobalMouseMove)
    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove)
      window.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [isDrawing, isMoving, isResizing, startCoords, activeTool, selectedShapeId, dragOffset, currentDrawing, currentTime, strokeColor, bgColor, opacity, lineStyle, fillPattern, setShapes])

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
      onMouseMove={handlePassiveMouseMove}
    />
  )
}