let nextShapeId = 1

export function rotateShape(shape, deltaDegrees) {
  return {
    ...shape,
    rotation: (shape.rotation ?? 0) + deltaDegrees
  }
}

export function moveShape(shape, dx, dy) {
  return {
    ...shape,
    x: (shape.x ?? 0) + dx,
    y: (shape.y ?? 0) + dy
  }
}

export function scaleShape(shape, scaleX, scaleY) {
  const scaledShape = { ...shape }

  if (shape.type === 'rectangle' || shape.type === 'arrow') {
    scaledShape.width = (shape.width ?? 0) * scaleX
    scaledShape.height = (shape.height ?? 0) * scaleY
  } else if (shape.type === 'circle') {
    const radius = shape.radius ?? 0
    scaledShape.radius = radius * scaleX
  } else if (shape.type === 'cylinder') {
    scaledShape.topRadius = (shape.topRadius ?? 0) * scaleX
    scaledShape.bottomRadius = (shape.bottomRadius ?? 0) * scaleX
    scaledShape.height = (shape.height ?? 0) * scaleY
  }

  return scaledShape
}

export function selectShape(shape, isSelected) {
  return {
    ...shape,
    selected: isSelected
  }
}

export function createCylinderShape({
  topRadius,
  bottomRadius,
  height,
  x = 0,
  y = 0,
  rotation = 0,
  id
}) {
  return {
    id: id ?? `cylinder-${nextShapeId++}`,
    type: 'cylinder',
    topRadius,
    bottomRadius,
    height,
    x,
    y,
    rotation
  }
}
