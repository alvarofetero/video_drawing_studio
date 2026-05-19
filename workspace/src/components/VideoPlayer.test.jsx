import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VideoPlayer from './VideoPlayer'

describe('VideoPlayer Component', () => {
  describe('Test 1: Video Element and Load Video Button', () => {
    it('should render a video element', () => {
      render(<VideoPlayer />)
      const videoElement = document.querySelector('video')
      expect(videoElement).toBeInTheDocument()
    })

    it('should render a "Load Video" button', () => {
      render(<VideoPlayer />)
      const loadButton = screen.getByRole('button', { name: /load video/i })
      expect(loadButton).toBeInTheDocument()
    })
  })

  describe('Test 2: Play Button State and Behavior', () => {
    it('should change button text from "Play" to "Pause" when clicked', async () => {
      const user = userEvent.setup()
      render(<VideoPlayer />)
      
      const loadButton = screen.getByRole('button', { name: /load video/i })
      expect(loadButton).toBeInTheDocument()
      
      const fileInput = document.querySelector('input[type="file"]')
      const testFile = new File(['test'], 'test.mp4', { type: 'video/mp4' })
      fireEvent.change(fileInput, { target: { files: [testFile] } })
      
      const playButton = await screen.findByRole('button', { name: /play/i })
      expect(playButton).toBeInTheDocument()
      
      await user.click(playButton)
      
      const pauseButton = await screen.findByRole('button', { name: /pause/i })
      expect(pauseButton).toBeInTheDocument()
    })

    it('should trigger video play method when Play button is clicked', async () => {
      const user = userEvent.setup()
      render(<VideoPlayer />)
      
      const fileInput = document.querySelector('input[type="file"]')
      const testFile = new File(['test'], 'test.mp4', { type: 'video/mp4' })
      fireEvent.change(fileInput, { target: { files: [testFile] } })
      
      const videoElement = document.querySelector('video')
      const playSpy = vi.spyOn(videoElement, 'play')
      
      const playButton = await screen.findByRole('button', { name: /play/i })
      await user.click(playButton)
      
      expect(playSpy).toHaveBeenCalled()
    })
  })
})
