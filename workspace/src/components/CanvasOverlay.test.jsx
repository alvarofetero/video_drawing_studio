import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CanvasOverlay from './CanvasOverlay'

describe('CanvasOverlay Component', () => {
  describe('Test 1: Canvas Overlay Perfect Alignment', () => {
    it('should render a canvas element', () => {
      render(
        <div>
          <video width="640" height="480" data-testid="video" />
          <CanvasOverlay videoWidth={640} videoHeight={480} />
        </div>
      )
      const canvas = document.querySelector('canvas')
      expect(canvas).toBeInTheDocument()
    })

    it('should have identical width and height as video element', () => {
      const videoWidth = 640
      const videoHeight = 480
      
      render(
        <div>
          <video width={videoWidth} height={videoHeight} data-testid="video" />
          <CanvasOverlay videoWidth={videoWidth} videoHeight={videoHeight} />
        </div>
      )
      
      const canvas = document.querySelector('canvas')
      expect(canvas.width).toBe(videoWidth)
      expect(canvas.height).toBe(videoHeight)
    })

    it('should overlay the video element with position absolute and top/left 0', () => {
      render(
        <div>
          <video width="640" height="480" data-testid="video" />
          <CanvasOverlay videoWidth={640} videoHeight={480} />
        </div>
      )
      
      const canvas = document.querySelector('canvas')
      const styles = window.getComputedStyle(canvas)
      expect(styles.position).toBe('absolute')
      expect(styles.top).toBe('0px')
      expect(styles.left).toBe('0px')
    })
  })

  describe('Test 2: Mouse Event Coordinate Tracking', () => {
    it('should track mouse-down and mouse-up events and create shape tracking object', async () => {
      const user = userEvent.setup()
      const onShapeCreate = vi.fn()
      
      render(
        <div style={{ position: 'relative' }}>
          <video width="640" height="480" data-testid="video" />
          <CanvasOverlay 
            videoWidth={640} 
            videoHeight={480}
            onShapeCreate={onShapeCreate}
          />
        </div>
      )
      
      const canvas = document.querySelector('canvas')
      
      // Simulate mouse-down at (10, 10)
      await user.pointer({ keys: '[MouseLeft>]', target: canvas, coords: { x: 10, y: 10 } })
      
      // Simulate mouse-up at (50, 50)
      await user.pointer({ keys: '[/MouseLeft]', target: canvas, coords: { x: 50, y: 50 } })
      
      // Verify shape tracking object was created
      expect(onShapeCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          startX: 10,
          startY: 10,
          endX: 50,
          endY: 50,
          width: 40,
          height: 40
        })
      )
    })

    it('should store shape bounds in application state', async () => {
      const user = userEvent.setup()
      const onShapeCreate = vi.fn()
      
      render(
        <div style={{ position: 'relative' }}>
          <video width="640" height="480" data-testid="video" />
          <CanvasOverlay 
            videoWidth={640} 
            videoHeight={480}
            onShapeCreate={onShapeCreate}
          />
        </div>
      )
      
      const canvas = document.querySelector('canvas')
      
      // Simulate mouse-down at (100, 100)
      await user.pointer({ keys: '[MouseLeft>]', target: canvas, coords: { x: 100, y: 100 } })
      
      // Simulate mouse-up at (200, 150)
      await user.pointer({ keys: '[/MouseLeft]', target: canvas, coords: { x: 200, y: 150 } })
      
      // Verify shape bounds are correctly calculated
      expect(onShapeCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          startX: 100,
          startY: 100,
          endX: 200,
          endY: 150,
          width: 100,
          height: 50
        })
      )
    })
  })
})
