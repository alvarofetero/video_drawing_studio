// Convierte colores Hexadecimales a formato RGBA transparente compatible con Canvas
export const hexToRgba = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// Configura las líneas punteadas o discontinuas en el contexto
export const applyLineStyle = (ctx, style) => {
  if (style === 'dashed') {
    ctx.setLineDash([12, 8])
  } else if (style === 'dotted') {
    ctx.setLineDash([3, 6])
  } else {
    ctx.setLineDash([])
  }
}

// Genera texturas y patrones visuales repetitivos (Cuadriculado y Listado)
export const getPatternStyle = (ctx, patternType, hexColor, alpha) => {
  const rgba = hexToRgba(hexColor, alpha)
  if (!patternType || patternType === 'none') return rgba

  const patternCanvas = document.createElement('canvas')
  const pCtx = patternCanvas.getContext('2d')
  
  if (patternType === 'grid') {
    patternCanvas.width = 16
    patternCanvas.height = 16
    pCtx.fillStyle = rgba
    pCtx.fillRect(0, 0, 16, 16)
    pCtx.strokeStyle = hexToRgba(hexColor, Math.min(1, alpha + 0.3))
    pCtx.lineWidth = 1
    pCtx.strokeRect(0, 0, 16, 16)
  } 
  else if (patternType === 'stripes') {
    patternCanvas.width = 12
    patternCanvas.height = 12
    pCtx.fillStyle = rgba
    pCtx.fillRect(0, 0, 12, 12)
    pCtx.strokeStyle = hexToRgba(hexColor, Math.min(1, alpha + 0.3))
    pCtx.lineWidth = 2
    pCtx.beginPath()
    pCtx.moveTo(0, 12)
    pCtx.lineTo(12, 0)
    pCtx.stroke()
  }

  return ctx.createPattern(patternCanvas, 'repeat') || rgba
}