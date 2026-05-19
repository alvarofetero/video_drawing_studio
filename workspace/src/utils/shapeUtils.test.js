import { describe, it, expect } from 'vitest'
import { rotateShape, createCylinderShape, moveShape, scaleShape, selectShape } from './shapeUtils'

describe('Shape Manipulation & Perspective', () => {
  describe('Test 1: Rotate Function Updates Shape Rotation Property', () => {
    it('should update the rotation property of a selected shape', () => {
      const shape = {
        id: 'shape1',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        rotation: 0
      }

      const rotatedShape = rotateShape(shape, 45)

      expect(rotatedShape.rotation).toBe(45)
    })

    it('should update rotation by incremental degrees', () => {
      const shape = {
        id: 'shape2',
        type: 'circle',
        x: 200,
        y: 200,
        radius: 30,
        rotation: 30
      }

      const rotatedShape = rotateShape(shape, 15)

      expect(rotatedShape.rotation).toBe(45)
    })

    it('should handle full rotation (360 degrees)', () => {
      const shape = {
        id: 'shape3',
        type: 'rectangle',
        x: 50,
        y: 50,
        width: 100,
        height: 100,
        rotation: 0
      }

      const rotatedShape = rotateShape(shape, 360)

      expect(rotatedShape.rotation).toBe(360)
    })

    it('should return a new shape object without mutating original', () => {
      const shape = {
        id: 'shape4',
        type: 'arrow',
        x: 0,
        y: 0,
        rotation: 0
      }

      const rotatedShape = rotateShape(shape, 90)

      expect(rotatedShape).not.toBe(shape)
      expect(shape.rotation).toBe(0)
      expect(rotatedShape.rotation).toBe(90)
    })
  })

  describe('Test 3: Move Shape Function', () => {
    it('should move a shape by the given delta values', () => {
      const shape = { id: 'shape5', type: 'rectangle', x: 10, y: 20 }
      const movedShape = moveShape(shape, 15, -5)

      expect(movedShape.x).toBe(25)
      expect(movedShape.y).toBe(15)
      expect(movedShape).not.toBe(shape)
      expect(shape.x).toBe(10)
      expect(shape.y).toBe(20)
    })
  })

  describe('Test 4: Scale Shape Function', () => {
    it('should scale rectangle width and height independently', () => {
      const shape = { id: 'shape6', type: 'rectangle', width: 100, height: 50 }
      const scaledShape = scaleShape(shape, 0.5, 2)

      expect(scaledShape.width).toBe(50)
      expect(scaledShape.height).toBe(100)
      expect(scaledShape).not.toBe(shape)
    })

    it('should scale circle radius uniformly', () => {
      const shape = { id: 'shape7', type: 'circle', radius: 20 }
      const scaledShape = scaleShape(shape, 1.5, 1.5)

      expect(scaledShape.radius).toBe(30)
      expect(scaledShape).not.toBe(shape)
    })

    it('should scale cylinder radii and height separately', () => {
      const shape = { id: 'shape8', type: 'cylinder', topRadius: 10, bottomRadius: 15, height: 40 }
      const scaledShape = scaleShape(shape, 2, 0.5)

      expect(scaledShape.topRadius).toBe(20)
      expect(scaledShape.bottomRadius).toBe(30)
      expect(scaledShape.height).toBe(20)
    })
  })

  describe('Test 5: Select Shape Function', () => {
    it('should mark a shape as selected without mutating original', () => {
      const shape = { id: 'shape9', type: 'rectangle', selected: false }
      const selectedShape = selectShape(shape, true)

      expect(selectedShape.selected).toBe(true)
      expect(shape.selected).toBe(false)
    })

    it('should deselect a shape when passed false', () => {
      const shape = { id: 'shape10', type: 'rectangle', selected: true }
      const deselectedShape = selectShape(shape, false)

      expect(deselectedShape.selected).toBe(false)
    })
  })

  describe('Test 2: Cylinder Shape Data Model', () => {
    it('should create a cylinder shape with distinct topRadius, bottomRadius, and height', () => {
      const cylinder = createCylinderShape({
        topRadius: 20,
        bottomRadius: 30,
        height: 50
      })

      expect(cylinder.topRadius).toBe(20)
      expect(cylinder.bottomRadius).toBe(30)
      expect(cylinder.height).toBe(50)
    })

    it('should include type property identifying shape as cylinder', () => {
      const cylinder = createCylinderShape({
        topRadius: 15,
        bottomRadius: 25,
        height: 60
      })

      expect(cylinder.type).toBe('cylinder')
    })

    it('should initialize with position and rotation properties', () => {
      const cylinder = createCylinderShape({
        topRadius: 10,
        bottomRadius: 20,
        height: 40,
        x: 100,
        y: 150,
        rotation: 45
      })

      expect(cylinder.x).toBe(100)
      expect(cylinder.y).toBe(150)
      expect(cylinder.rotation).toBe(45)
    })

    it('should generate unique id for each cylinder', () => {
      const cylinder1 = createCylinderShape({
        topRadius: 10,
        bottomRadius: 15,
        height: 30
      })

      const cylinder2 = createCylinderShape({
        topRadius: 10,
        bottomRadius: 15,
        height: 30
      })

      expect(cylinder1.id).toBeDefined()
      expect(cylinder2.id).toBeDefined()
      expect(cylinder1.id).not.toBe(cylinder2.id)
    })

    it('should have all required cylinder properties', () => {
      const cylinder = createCylinderShape({
        topRadius: 18,
        bottomRadius: 28,
        height: 55
      })

      expect(cylinder).toHaveProperty('id')
      expect(cylinder).toHaveProperty('type')
      expect(cylinder).toHaveProperty('topRadius')
      expect(cylinder).toHaveProperty('bottomRadius')
      expect(cylinder).toHaveProperty('height')
      expect(cylinder).toHaveProperty('x')
      expect(cylinder).toHaveProperty('y')
      expect(cylinder).toHaveProperty('rotation')
    })
  })
})
