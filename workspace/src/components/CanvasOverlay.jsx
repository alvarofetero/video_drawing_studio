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
          renderer.drawRectangle(ctx, shape, isSelected)
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

  // DETECTOR DE COLISIONES PRECISO (CORREGIDO DE CORRUPCIONES)
  const findShapeAtCoords = (x, y) => {
    const activeShapes = shapes.filter(s => Math.abs(s.timestamp - currentTime) < 0.15)
    
    for (let i = activeShapes.length - 1; i >= 0; i--) {
      const shape = activeShapes[i]
      const isSelected = shape.id === selectedShapeId

      // 1. COLISIONES EN LÍNEAS Y FLECHAS
      if (shape.tool === 'line' || shape.tool === 'arrow') {
        const cpX = shape.cpX !== undefined ? shape.cpX : (shape.startX + shape.endX) / 2
        const cpY = shape.cpY !== undefined ? shape.cpY : (shape.startY + shape.endY) / 2

        if (isSelected && Math.sqrt(Math.pow(x - shape.startX, 2) + Math.pow(y - shape.startY, 2)) < 14) return { shape, type: 'p-start' }
        if (isSelected && Math.sqrt(Math.pow(x - shape.endX, 2) + Math.pow(y - shape.endY, 2)) < 14) return { shape, type: 'p-end' }
        if (isSelected && Math.sqrt(Math.pow(x - cpX, 2) + Math.pow(y - cpY, 2)) < 14) return { shape, type: 'p-curve' }
        if (Math.sqrt(Math.pow(x - cpX, 2) + Math.pow(y - cpY, 2)) < 35) return { shape, type: 'move' }
      } 
      
      // 2. COLISIONES EN RECTÁNGULOS (Sincronizado con nombres cardinales r-tl, r-tr, etc.)
      else if (shape.tool === 'rectangle') {
        if (isSelected && Math.sqrt(Math.pow(x - shape.startX, 2) + Math.pow(y - shape.startY, 2)) < 14) return { shape, type: 'r-tl' }
        if (isSelected && Math.sqrt(Math.pow(x - shape.endX, 2) + Math.pow(y - shape.startY, 2)) < 14) return { shape, type: 'r-tr' }
        if (isSelected && Math.sqrt(Math.pow(x - shape.endX, 2) + Math.pow(y - shape.endY, 2)) < 14) return { shape, type: 'r-br' }
        if (isSelected && Math.sqrt(Math.pow(x - shape.startX, 2) + Math.pow(y - shape.endY, 2)) < 14) return { shape, type: 'r-bl' }
        
        const centerX = (shape.startX + shape.endX) / 2
        const centerY = (shape.startY + shape.endY) / 2
        if (Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)) < 40) return { shape, type: 'move' }
      } 
      
      // 3. COLISIONES EN TEXTO
      else if (shape.tool === 'text') {
        if (isSelected && Math.sqrt(Math.pow(x - shape.endX, 2) + Math.pow(y - shape.endY, 2)) < 14) return { shape, type: 'resize-text' }
        if (x >= Math.min(shape.startX, shape.endX) && x <= Math.max(shape.startX, shape.endX) && 
            y >= Math.min(shape.startY, shape.endY) && y <= Math.max(shape.startY, shape.endY)) return { shape, type: 'move' }
      } 
      
      // 4. COLISIONES EN CÍRCULOS Y CILINDROS
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

  // MANEJADOR PASIVO PARA CAMBIAR LOS CURSORES DINÁMICAMENTE AL PASAR EL RATÓN
  const handlePassiveMouseMove = (e) => {
    if (activeTool !== 'select' || isDrawing || isMoving || isResizing) return
    const { x, y } = getCanvasCoords(e)
    const hit = findShapeAtCoords(x, y)
    const canvas = canvasRef.current
    if (!canvas) return

    if (hit) {
      // Cursores específicos según la esquina o tensor apuntado
      if (hit.type === 'r-tl' || hit.type === 'r-br') canvas.style.cursor = 'nwse-resize'
      else if (hit.type === 'r-tr' || hit.type === 'r-bl') canvas.style.cursor = 'nesw-resize'
      else if (hit.type === 'p-start' || hit.type === 'p-end' || hit.type === 'p-curve' || hit.type === 'resize-text') canvas.style.cursor = 'pointer'
      else if (hit.type === 'resize-x') canvas.style.cursor = 'ew-resize'
      else if (hit.type === 'resize-y') canvas.style.cursor = 'ns-resize'
      else if (hit.type === 'move') canvas.style.cursor = 'move'
    } else {
      canvas.style.cursor = 'default'
    }
  }

  // Escuchadores globales de arrastre en la ventana (Window)
  useEffect(() => {
    if (!isDrawing && !isMoving && !isResizing) return

    const handleGlobalMouseMove = (e) => {
      const { x, y } = getCanvasCoords(e)

      if (isDrawing && startCoords) {
        setCurrentDrawing({
          tool: activeTool, startX: startCoords.x, startY: startCoords.y, endX: x, endY: y,
          timestamp: currentTime, strokeColor, bgColor, opacity, lineStyle, fillPattern,
          ...(activeTool === 'line' || activeTool === 'arrow' ? { cpX: (startCoords.x + x) / 2, cpY: (startCoords.y + y) / 2 } : {}),
          ...(activeTool === 'circle' || activeTool === 'cylinder' ? { radiusY: Math.abs(x - startCoords.x) * 0.4 } : {})
        })
      } 
      else if (isMoving && selectedShapeId) {
        setShapes(prev => prev.map(s => {
          if (s.id !== selectedShapeId) return s
          const width = s.endX - s.startX, height = s.endY - s.startY
          const nX = x - dragOffset.x, nY = y - dragOffset.y

          if (s.tool === 'line' || s.tool === 'arrow') {
            const dx = x - dragOffset.x - s.startX, dy = y - dragOffset.y - s.startY
            return {
              ...s, startX: s.startX + dx, startY: s.startY + dy, endX: s.endX + dx, endY: s.endY + dy,
              cpX: (s.cpX !== undefined ? s.cpX : (s.startX + s.endX)/2) + dx,
              cpY: (s.cpY !== undefined ? s.cpY : (s.startY + s.endY)/2) + dy
            }
          }
          return { ...s, startX: nX, startY: nY, endX: nX + width, endY: nY + height }
        }))
      } 
      else if (isResizing && selectedShapeId) {
        setShapes(prev => prev.map(s => {
          if (s.id !== selectedShapeId) return s
          
          // GESTIÓN DE REDIMENSIÓN TOTAL DE RECTÁNGULOS EN LAS 4 ESQUINAS
          if (isResizing === 'r-tl') return { ...s, startX: x, startY: y }
          if (isResizing === 'r-tr') return { ...s, endX: x, startY: y }
          if (isResizing === 'r-br') return { ...s, endX: x, endY: y }
          if (isResizing === 'r-bl') return { ...s, startX: x, endY: y }
          
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
          setShapes(prev => [...prev, { ...currentDrawing, id: `shape-${Date.now()}` }])
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
      className="absolute top-0 left-0 w-full h-full object-contain" 
      style={{ cursor: activeTool === 'select' ? 'default' : 'crosshair' }} 
      onMouseDown={handleMouseDown}
      onMouseMove={handlePassiveMouseMove}
    />
  )
}