import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import App from './App'

describe('App layout', () => {
  it('renders the top bar with the app title', () => {
    render(<App />)
    expect(screen.getByText(/Football Video Analysis/i)).toBeInTheDocument()
  })

  it('renders the main video workspace', () => {
    render(<App />)
    expect(screen.getByRole('region', { name: /video workspace/i })).toBeInTheDocument()
  })

  it('renders the drawing toolbar buttons', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /select/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /rectangle/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /circle/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /arrow/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cylinder/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /text/i })).toBeInTheDocument()
  })

  it('renders the playback controls at the bottom', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /skip back/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /skip forward/i })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: /seek time/i })).toBeInTheDocument()
  })
})
