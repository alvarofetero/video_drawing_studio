import { hexToRgba } from './canvasUtils'

// Dibuja los cuadrados blancos de redimensión en las esquinas
export const drawResizeHandles = (ctx, x, y) => {
  ctx.save()
  ctx.setLineDash([]) // Los tensores siempre se pintan con línea sólida
  ctx.fillStyle = '#ffffff'
  ctx.strokeStyle = '#0284c7'
  ctx.lineWidth = 2
  ctx.fillRect(x - 6, y - 6, 12, 12)
  ctx.strokeRect(x - 6, y - 6, 12, 12)
  ctx.restore()
}

// Dibuja el nodo redondo rojo para curvar líneas o flechas
export const drawCurveHandle = (ctx, x, y) => {
  ctx.save()
  ctx.setLineDash([])
  ctx.fillStyle = '#f43f5e'
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(x, y, 7, 0, 2 * Math.PI)
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

// Dibuja la punta de las flechas tácticas calculando su ángulo de incidencia
export const drawArrowHead = (ctx, fromX, fromY, toX, toY) => {
  const angle = Math.atan2(toY - fromY, toX - fromX)
  const headLength = 16
  ctx.save()
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.moveTo(toX, toY)
  ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6))
  ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6))
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

// Renderizador de Líneas y Flechas Curvas (Bézier)
export const drawLineOrArrow = (ctx, shape, isSelected) => {
  ctx.moveTo(shape.startX, shape.startY)
  const cpX = shape.cpX !== undefined ? shape.cpX : (shape.startX + shape.endX) / 2
  const cpY = shape.cpY !== undefined ? shape.cpY : (shape.startY + shape.endY) / 2
  
  ctx.quadraticCurveTo(cpX, cpY, shape.endX, shape.endY)
  ctx.stroke()

  if (shape.tool === 'arrow') {
    drawArrowHead(ctx, cpX, cpY, shape.endX, shape.endY)
  }

  if (isSelected) {
    drawResizeHandles(ctx, shape.startX, shape.startY)
    drawResizeHandles(ctx, shape.endX, shape.endY)
    drawCurveHandle(ctx, cpX, cpY)
  }
}

// Renderizador del Cuadro de Texto elástico
export const drawTextBox = (ctx, shape, isSelected) => {
  const width = shape.endX - shape.startX
  const height = shape.endY - shape.startY
  ctx.fillRect(shape.startX, shape.startY, width, height)
  ctx.strokeRect(shape.startX, shape.startY, width, height)
  
  ctx.fillStyle = isSelected ? '#38bdf8' : shape.strokeColor
  ctx.font = `bold ${Math.max(12, Math.abs(height) * 0.4)}px sans-serif`
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'
  ctx.fillText(shape.text || '', shape.startX + width / 2, shape.startY + height / 2, Math.abs(width) - 10)
  
  if (isSelected) drawResizeHandles(ctx, shape.endX, shape.endY)
}

// Renderizador del Rectángulo Táctico (CORREGIDO A FORMATO UNIFICADO)
export const drawRectangle = (ctx, shape, isSelected) => {
  const w = shape.endX - shape.startX
  const h = shape.endY - shape.startY
  ctx.fillRect(shape.startX, shape.startY, w, h)
  ctx.strokeRect(shape.startX, shape.startY, w, h)

  if (isSelected) {
    drawResizeHandles(ctx, shape.startX, shape.startY) // Superior Izquierda
    drawResizeHandles(ctx, shape.endX, shape.startY)   // Superior Derecha
    drawResizeHandles(ctx, shape.endX, shape.endY)     // Inferior Derecha
    drawResizeHandles(ctx, shape.startX, shape.endY)   // Inferior Izquierda
  }
}

// Renderizador de Óvalos y Círculos
export const drawOval = (ctx, shape, isSelected) => {
  const radiusX = Math.abs(shape.endX - shape.startX) || 1
  const radiusY = shape.radiusY || radiusX * 0.4
  ctx.ellipse(shape.startX, shape.startY, radiusX, radiusY, 0, 0, 2 * Math.PI)
  ctx.fill()
  ctx.stroke()
  
  if (isSelected) {
    drawResizeHandles(ctx, shape.startX + radiusX, shape.startY)
    drawResizeHandles(ctx, shape.startX, shape.startY + radiusY)
  }
}

// Renderizador del Cilindro 3D Translúcido con desvanecimiento superior
export const drawCylinder = (ctx, shape, isSelected, fillBgColor, fillOpacity) => {
  const radiusX = Math.abs(shape.endX - shape.startX) || 1
  const radiusY = shape.radiusY || radiusX * 0.4
  
  const gradient = ctx.createLinearGradient(shape.startX, 0, shape.startX, shape.startY)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.01)')
  gradient.addColorStop(1, isSelected ? 'rgba(56, 189, 248, 0.45)' : hexToRgba(fillBgColor, fillOpacity))
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